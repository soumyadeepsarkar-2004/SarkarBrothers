

import React, { useState, useRef, useEffect } from 'react';
import { generateGiftSuggestions, ChatMessage } from '../services/gemini';
import { products } from '../data';
import { useCart } from '../contexts/CartContext';
import { useLanguage } from '../contexts/LanguageContext';
import { formatPrice } from '../utils/formatters';
import { Product } from '../types';
import { Link } from 'react-router-dom';

interface Message {
    role: 'bot' | 'user';
    text: string;
    type?: 'text' | 'products';
    products?: Product[];
    feedback?: 'up' | 'down';
}

const MAX_CHARS = 500;

const AiAssistant: React.FC = () => {
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const { addToCart } = useCart();
    const { t, language } = useLanguage();

    const [messages, setMessages] = useState<Message[]>([
        { role: 'bot', text: t('ai.intro') }
    ]);
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike'>>({});
    const [lastRecommendedProducts, setLastRecommendedProducts] = useState<Product[]>([]);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<string | null>(null);

    // Dynamic suggested prompts based on language
    const suggestedPrompts = [
        t('ai.suggested.gift'),
        t('ai.suggested.edu'),
        t('ai.suggested.rc'),
        t('ai.suggested.plush'),
        t('ai.suggested.art')
    ];

    // Load chat history & feedback from localStorage on mount
    useEffect(() => {
        try {
            const saved = localStorage.getItem('chatHistory');
            if (saved) {
                setMessages(JSON.parse(saved));
            }
            const savedFeedback = localStorage.getItem('product-feedback');
            if (savedFeedback) {
                setFeedback(JSON.parse(savedFeedback));
            }
            // Initialize recommendations with popular items
            setRecommendations(products.slice(0, 5).sort((a, b) => b.reviews - a.reviews));
        } catch (e) {
            console.error("Failed to load chat history", e);
        }
    }, []);

    // Reset intro message when language changes if history is empty or only intro
    useEffect(() => {
        if (messages.length === 1 && messages[0].role === 'bot') {
            setMessages([{ role: 'bot', text: t('ai.intro') }]);
        }
    }, [language]);

    // Save chat history to localStorage whenever messages change
    useEffect(() => {
        try {
            localStorage.setItem('chatHistory', JSON.stringify(messages));
        } catch (e) {
            console.error("Failed to save chat history", e);
        }
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleProductFeedback = (productId: string, newFeedback: 'like' | 'dislike') => {
        setFeedback(prev => {
            const updatedFeedback = { ...prev };
            if (updatedFeedback[productId] === newFeedback) {
                delete updatedFeedback[productId]; // Toggle off
            } else {
                updatedFeedback[productId] = newFeedback;
            }
            localStorage.setItem('product-feedback', JSON.stringify(updatedFeedback));
            return updatedFeedback;
        });
    };

    const findRelevantProducts = (responseText: string): { topMatches: Product[], related: Product[] } => {
        const normalizedText = responseText.toLowerCase();

        // Extract potential keywords (simple stop word removal)
        const keywords = normalizedText.split(/[\s,.]+/).filter(w => w.length > 3 && !['gift', 'toys', 'looking', 'want', 'recommend', 'need', 'please'].includes(w));

        const scoredProducts = products.map(p => {
            let score = 0;
            const pName = p.name.toLowerCase();
            const pCat = p.category.toLowerCase();
            const pDesc = p.description?.toLowerCase() || "";

            // 1. Direct Mention (Highest weight)
            if (normalizedText.includes(pName)) score += 50;

            // 2. Category Match
            if (normalizedText.includes(pCat)) score += 20;

            // 3. Keyword Overlap
            keywords.forEach(k => {
                if (pName.includes(k)) score += 10;
                if (pCat.includes(k)) score += 5;
                if (pDesc.includes(k)) score += 2;
            });

            // 4. Product Quality Factors (NEW: Consider ratings and stock)
            // High rating boost (4.5+ stars get bonus)
            if (p.rating >= 4.5) score += 15;
            else if (p.rating >= 4.0) score += 10;
            else if (p.rating >= 3.5) score += 5;

            // Review count indicates popularity
            score += (p.reviews || 0) * 0.05;

            // Stock availability (NEW: Prioritize in-stock items)
            if (p.stock && p.stock > 10) score += 10; // Good stock
            else if (p.stock && p.stock > 0) score += 5; // Low stock
            else if (!p.stock || p.stock === 0) score *= 0.3; // Out of stock - heavily penalize

            // 5. Personalization from Feedback
            if (feedback[p.id] === 'like') score *= 1.5;
            if (feedback[p.id] === 'dislike') score *= 0.5;

            return { product: p, score };
        });

        const sorted = scoredProducts.sort((a, b) => b.score - a.score);

        // Filter out items with very low relevance score unless purely popularity based
        const relevant = sorted.filter(item => item.score > 5).map(item => item.product);

        // If no relevant matches found, return top-rated in-stock items
        if (relevant.length === 0) {
            const topRated = products
                .filter(p => p.stock > 0)
                .sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews))
                .slice(0, 5);
            return { topMatches: [], related: topRated };
        }

        return {
            topMatches: relevant.slice(0, 4), // Top 4 for chat
            related: relevant.slice(4, 9) // Next 5 for recommendation bar
        };
    };

    const handleSend = async (text: string = input) => {
        if (!text.trim() || loading) return;

        const userMessage = text;
        setInput('');
        setError(null);
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setLoading(true);

        try {
            // Build conversation history from previous messages (text-only messages)
            const chatHistory: ChatMessage[] = messages
                .filter(m => m.type !== 'products' && m.text)
                .map(m => ({ role: m.role === 'user' ? 'user' as const : 'model' as const, text: m.text }));

            // Call Gemini Service with history and current language
            const botResponse = await generateGiftSuggestions(userMessage, chatHistory, language);

            const { topMatches, related } = findRelevantProducts(botResponse + ' ' + userMessage);

            // Store last recommended products for carousel updates
            setLastRecommendedProducts(topMatches);

            // Update recommendations carousel based on AI's last recommendation (IMPROVED)
            if (topMatches.length > 0) {
                // Get products from same category as top match
                const primaryCategory = topMatches[0].category;
                const similarByCategory = products.filter(p =>
                    p.category === primaryCategory &&
                    !topMatches.some(tp => tp.id === p.id) &&
                    p.stock > 0 // Only show in-stock items
                ).sort((a, b) => (b.rating * b.reviews) - (a.rating * a.reviews))
                    .slice(0, 5);

                setRecommendations(similarByCategory.length > 0 ? similarByCategory : related);
            } else if (related.length > 0) {
                setRecommendations(related);
            }

            setMessages(prev => [
                ...prev,
                { role: 'bot', text: botResponse },
                { role: 'bot', text: topMatches.length > 0 ? t('ai.matches') : '', type: 'products', products: topMatches.length > 0 ? topMatches : products.slice(0, 3) }
            ]);
        } catch (err) {
            console.error("Assistant Error:", err);
            setError(t('ai.error'));
            setMessages(prev => [...prev, { role: 'bot', text: t('ai.error') }]);
        } finally {
            setLoading(false);
        }
    };

    const handleFeedback = (index: number, type: 'up' | 'down') => {
        setMessages(prev => prev.map((msg, i) => {
            if (i === index) return { ...msg, feedback: type };
            return msg;
        }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        if (text.length <= MAX_CHARS) {
            setInput(text);
        }
    };

    const QuickViewModal = () => {
        if (!quickViewProduct) return null;
        return (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setQuickViewProduct(null)}>
                <div className="bg-white dark:bg-[#1a170d] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-[fadeIn_0.2s_ease-out]" onClick={e => e.stopPropagation()}>
                    <div className="flex flex-col md:flex-row">
                        <div className="w-full md:w-1/2 aspect-square bg-gray-100 dark:bg-[#252525] relative">
                            <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="w-full md:w-1/2 p-5 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{quickViewProduct.category}</p>
                                    <h3 className="text-xl font-bold text-[#181611] dark:text-white leading-tight">{quickViewProduct.name}</h3>
                                </div>
                                <button onClick={() => setQuickViewProduct(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>

                            <div className="flex items-baseline gap-2">
                                <span className="text-xl font-bold text-[#181611] dark:text-white">{formatPrice(quickViewProduct.price)}</span>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-3">
                                {quickViewProduct.description || "A wonderful toy perfect for sparking imagination and joy. High quality materials and safe for kids."}
                            </p>

                            <div className="mt-auto flex flex-col gap-2">
                                <button
                                    onClick={() => { addToCart(quickViewProduct); setQuickViewProduct(null); }}
                                    className="w-full bg-primary hover:bg-yellow-400 text-[#181611] font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                >
                                    <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                                    {t('product.add_to_cart')}
                                </button>
                                <Link
                                    to={`/product/${quickViewProduct.id}`}
                                    className="w-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#252525] text-[#181611] dark:text-white font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center text-sm"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 flex flex-col relative bg-[#fff] dark:bg-[#151515] h-[calc(100vh-64px)]">
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#f0eee9] dark:border-[#333] bg-white dark:bg-[#1a1a1a] shrink-0 z-10">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="size-10 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
                            <span className="material-symbols-outlined">smart_toy</span>
                        </div>
                        <div className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full border-2 border-white dark:border-[#1a1a1a]"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-[#181611] dark:text-white text-sm">GiftBot Assistant</h3>
                        <p className="text-xs text-[#8a8060] dark:text-gray-400">Online • Replies instantly</p>
                    </div>
                </div>
                {messages.length > 1 && (
                    <button
                        onClick={() => {
                            setMessages([{ role: 'bot', text: t('ai.intro') }]);
                            localStorage.removeItem('chatHistory');
                            setRecommendations(products.slice(0, 5));
                        }}
                        className="text-xs text-[#8a8060] hover:text-red-500 transition-colors"
                    >
                        Clear Chat
                    </button>
                )}
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[radial-gradient(#f4c02511_1px,transparent_1px)] [background-size:20px_20px] pb-40">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
                        <div className={`size-8 rounded-full flex items-center justify-center shrink-0 mt-2 ${msg.role === 'bot' ? 'bg-primary/20 text-primary' : 'bg-[#181611] text-white'}`}>
                            <span className="material-symbols-outlined text-sm">{msg.role === 'bot' ? 'smart_toy' : 'person'}</span>
                        </div>

                        {msg.type === 'products' ? (
                            <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x max-w-[85%] no-scrollbar">
                                {(msg.products || products.slice(0, 3)).map(p => (
                                    <div key={p.id} className="snap-center shrink-0 w-60 bg-white dark:bg-[#252525] rounded-xl border border-[#e6e0d4] dark:border-[#444] shadow-sm overflow-hidden flex flex-col relative group/card">
                                        <div className="h-32 bg-gray-100 relative overflow-hidden shrink-0">
                                            <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                                            <div className="absolute top-2 right-2 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold text-[#181611] dark:text-white">{formatPrice(p.price)}</div>
                                            {/* Quick View Button Overlay */}
                                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={() => setQuickViewProduct(p)}
                                                    className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg transform translate-y-2 group-hover/card:translate-y-0 transition-all flex items-center gap-1"
                                                >
                                                    <span className="material-symbols-outlined text-[14px]">visibility</span>
                                                    Quick View
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-3 flex flex-col flex-1">
                                            <h4 className="font-bold text-[#181611] dark:text-white text-sm line-clamp-1 mb-2">{p.name}</h4>
                                            <div className="mt-auto flex gap-2">
                                                <button
                                                    onClick={() => addToCart(p)}
                                                    className="flex-1 bg-primary hover:bg-[#e5b31f] text-[#181611] text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1 active:scale-95 transform"
                                                >
                                                    <span className="material-symbols-outlined text-[16px]">add_shopping_cart</span>
                                                    {t('common.add')}
                                                </button>
                                                <div className="flex gap-1">
                                                    <button onClick={() => handleProductFeedback(p.id, 'like')} className={`p-1.5 rounded-lg transition-colors ${feedback[p.id] === 'like' ? 'bg-green-100 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200'}`}>
                                                        <span className="material-symbols-outlined text-[16px]">thumb_up</span>
                                                    </button>
                                                    <button onClick={() => handleProductFeedback(p.id, 'dislike')} className={`p-1.5 rounded-lg transition-colors ${feedback[p.id] === 'dislike' ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200'}`}>
                                                        <span className="material-symbols-outlined text-[16px]">thumb_down</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 max-w-[80%]">
                                <div className={`padding-4 p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'bot'
                                        ? 'bg-[#f5f3f0] dark:bg-[#2a2a2a] text-[#181611] dark:text-white rounded-bl-none'
                                        : 'bg-primary text-[#181611] rounded-br-none font-medium'
                                    }`}>
                                    {msg.text}
                                </div>
                                {/* Feedback Buttons */}
                                {msg.role === 'bot' && (
                                    <div className="flex gap-2 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => handleFeedback(idx, 'up')}
                                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${msg.feedback === 'up' ? 'text-green-500' : 'text-gray-400'}`}
                                        >
                                            <span className="material-symbols-outlined text-[16px] fill-current" style={msg.feedback === 'up' ? { fontVariationSettings: "'FILL' 1" } : {}}>thumb_up</span>
                                        </button>
                                        <button
                                            onClick={() => handleFeedback(idx, 'down')}
                                            className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${msg.feedback === 'down' ? 'text-red-500' : 'text-gray-400'}`}
                                        >
                                            <span className="material-symbols-outlined text-[16px] fill-current" style={msg.feedback === 'down' ? { fontVariationSettings: "'FILL' 1" } : {}}>thumb_down</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {/* Suggested Prompts (only if empty) */}
                {messages.length === 1 && (
                    <div className="pl-11 grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                        {suggestedPrompts.map((prompt, i) => (
                            <button
                                key={i}
                                onClick={() => handleSend(prompt)}
                                disabled={loading}
                                className="text-left px-4 py-2 bg-white dark:bg-[#252525] border border-[#e6e0d4] dark:border-[#444] rounded-lg text-sm text-[#181611] dark:text-white hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>
                )}

                {loading && (
                    <div className="flex gap-3">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-2">
                            <span className="material-symbols-outlined text-sm">smart_toy</span>
                        </div>
                        <div className="bg-[#f5f3f0] dark:bg-[#2a2a2a] rounded-2xl rounded-bl-none p-4 shadow-sm flex gap-1 items-center h-10">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                    </div>
                )}
                {error && (
                    <div className="flex justify-center">
                        <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs px-4 py-2 rounded-full">
                            {error}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area + Recommendations */}
            <div className="bg-white dark:bg-[#1a1a1a] border-t border-[#f0eee9] dark:border-[#333] relative z-20">

                {/* Recommendations Carousel */}
                {recommendations.length > 0 && (
                    <div className="pt-3 pb-3 px-4 overflow-x-auto no-scrollbar flex gap-3 border-b border-[#f0eee9] dark:border-[#333]/50">
                        <div className="flex items-center gap-1 shrink-0 pr-2">
                            <span className="text-[10px] font-bold text-[#8a8060] uppercase tracking-wide">{t('ai.you_might_like')}</span>
                        </div>
                        {recommendations.map(p => (
                            <div key={p.id}
                                className="snap-center shrink-0 w-36 bg-white dark:bg-[#2a2a2a] rounded-xl border border-[#e6e0d4] dark:border-[#444] transition-colors shadow-sm overflow-hidden"
                            >
                                <div className="h-24 bg-gray-100 dark:bg-[#333] cursor-pointer" onClick={() => setQuickViewProduct(p)}>
                                    <img src={p.image} className="size-full object-cover" alt={p.name} />
                                </div>
                                <div className="p-2">
                                    <span className="text-xs font-bold text-[#181611] dark:text-white truncate block">{p.name}</span>
                                    <div className="flex items-center justify-between mt-1">
                                        <span className="text-[10px] font-bold text-primary">{formatPrice(p.price)}</span>
                                        <button onClick={() => addToCart(p)} className="bg-primary/10 hover:bg-primary text-primary hover:text-black size-6 rounded-md flex items-center justify-center transition-colors">
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-4">
                    <div className={`relative flex flex-col bg-[#f8f8f5] dark:bg-[#252525] rounded-xl border ${loading ? 'opacity-70 cursor-not-allowed' : ''} border-[#e6e0d4] dark:border-[#444] focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20 transition-all`}>
                        <div className="flex items-end gap-2 p-2">
                            <textarea
                                value={input}
                                onChange={handleInputChange}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend(input))}
                                className="w-full bg-transparent border-0 focus:ring-0 text-sm text-[#181611] dark:text-white placeholder-[#8a8060] resize-none py-2.5 max-h-32 disabled:cursor-not-allowed"
                                placeholder={t('ai.input_placeholder')}
                                rows={1}
                                disabled={loading}
                            />
                            <button
                                onClick={() => handleSend(input)}
                                disabled={loading || !input.trim()}
                                className="p-2 bg-primary text-[#181611] rounded-lg hover:brightness-110 shadow-sm transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-[22px] rotate-[-45deg] translate-x-0.5 translate-y-[-1px]">send</span>
                            </button>
                        </div>
                        <div className="px-3 pb-1.5 flex justify-end">
                            <span className={`text-[10px] font-medium ${input.length >= MAX_CHARS ? 'text-red-500' : 'text-[#8a8060]/60'}`}>
                                {input.length}/{MAX_CHARS}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick View Modal */}
            <QuickViewModal />
        </div>
    );
};

export default AiAssistant;