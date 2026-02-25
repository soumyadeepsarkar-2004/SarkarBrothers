import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateVoiceResponse } from '../services/gemini';
import { useLanguage } from '../contexts/LanguageContext';
import { useCart } from '../contexts/CartContext';
import { products } from '../data';
import { Link } from 'react-router-dom';
import { formatPrice } from '../utils/formatters';
import { Product } from '../types';

interface Message {
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
    products?: Product[];
}

const VoiceAssistant: React.FC = () => {
    const { t, language } = useLanguage();
    const { addToCart } = useCart();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [textInput, setTextInput] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        initializeAssistant();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const initializeAssistant = () => {
        setIsConnected(true);
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                text: language === 'bn'
                    ? 'হ্যালো! আমি আপনার ভয়েস সহকারী। আজ কিভাবে সেরা খেলনা খুঁজে পেতে সাহায্য করতে পারি? 🎮'
                    : 'Hello! I\'m your ToyWonder voice assistant. Ask me about toys, gifts, or recommendations! 🎮',
                timestamp: new Date()
            }]);
        }
    };

    // Find relevant products from user query
    const findRelevantProducts = useCallback((text: string): Product[] => {
        const lower = text.toLowerCase();
        const keywords = lower.split(/[\s,.!?]+/).filter(w => w.length > 2);

        const scored = products.map(p => {
            let score = 0;
            const name = p.name.toLowerCase();
            const cat = p.category.toLowerCase();
            const desc = p.description?.toLowerCase() || '';

            if (lower.includes(name)) score += 50;
            if (lower.includes(cat)) score += 20;
            keywords.forEach(k => {
                if (name.includes(k)) score += 10;
                if (cat.includes(k)) score += 5;
                if (desc.includes(k)) score += 2;
            });
            if (p.rating >= 4.5) score += 5;
            return { product: p, score };
        });

        return scored
            .filter(s => s.score > 5)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(s => s.product);
    }, []);

    const startRecording = async () => {
        try {
            setError(null);

            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setError('Speech recognition is not supported in this browser. Please use Chrome or Edge. You can also type your message below.');
                return;
            }

            const recognition = new SpeechRecognition();
            recognitionRef.current = recognition;

            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = language === 'bn' ? 'bn-IN' : 'en-US';

            recognition.onstart = () => {
                setIsRecording(true);
                setCurrentTranscript('Listening...');
                if (!isConnected) initializeAssistant();
            };

            recognition.onresult = (event: any) => {
                let interimTranscript = '';
                let finalTranscript = '';

                for (let i = event.resultIndex; i < event.results.length; i++) {
                    const transcript = event.results[i][0].transcript;
                    if (event.results[i].isFinal) {
                        finalTranscript += transcript;
                    } else {
                        interimTranscript += transcript;
                    }
                }

                if (interimTranscript) setCurrentTranscript(interimTranscript);

                if (finalTranscript) {
                    setCurrentTranscript('');
                    processUserInput(finalTranscript.trim());
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                const errorMessages: Record<string, string> = {
                    'no-speech': 'No speech detected. Try again or type your message.',
                    'audio-capture': 'No microphone found. Check your microphone settings.',
                    'not-allowed': 'Microphone access denied. Allow microphone access and try again.',
                };
                setError(errorMessages[event.error] || `Speech error: ${event.error}. You can type below instead.`);
                setIsRecording(false);
                setCurrentTranscript('');
            };

            recognition.onend = () => {
                setIsRecording(false);
                setCurrentTranscript('');
            };

            recognition.start();
        } catch (err) {
            console.error('Speech recognition setup error:', err);
            setError('Could not start speech recognition. You can type your message below.');
            setIsRecording(false);
        }
    };

    const stopRecording = () => {
        if (recognitionRef.current && isRecording) {
            recognitionRef.current.stop();
            setIsRecording(false);
            setCurrentTranscript('');
        }
    };

    const processUserInput = async (text: string) => {
        if (!text.trim()) return;

        const userMessage: Message = {
            role: 'user',
            text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await generateVoiceResponse(text, language);
            // Find relevant products based on both user query and AI response
            const matchedProducts = findRelevantProducts(`${text} ${response}`);

            const assistantMessage: Message = {
                role: 'assistant',
                text: response,
                timestamp: new Date(),
                products: matchedProducts.length > 0 ? matchedProducts : undefined,
            };
            setMessages(prev => [...prev, assistantMessage]);

            speakText(response);
        } catch (err) {
            console.error('Response error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                text: "I'm sorry, I had trouble processing that. Could you try again?",
                timestamp: new Date()
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTextSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (textInput.trim() && !isLoading) {
            processUserInput(textInput.trim());
            setTextInput('');
        }
    };

    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.95;
            utterance.pitch = 1.05;
            utterance.volume = 1;
            utterance.lang = language === 'bn' ? 'bn-IN' : 'en-US';
            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            window.speechSynthesis.speak(utterance);
        }
    };

    const stopSpeaking = () => {
        window.speechSynthesis?.cancel();
        setIsSpeaking(false);
    };

    const clearChat = () => {
        stopSpeaking();
        setMessages([{
            role: 'assistant',
            text: 'Chat cleared. How can I help you?',
            timestamp: new Date()
        }]);
    };

    const quickPrompts = [
        { label: '🎁 Gift ideas', text: 'Suggest a birthday gift for a 6-year-old' },
        { label: '🤖 Robots', text: 'Show me robot toys' },
        { label: '🧸 Plush toys', text: 'What plush toys do you have?' },
        { label: '🎨 Arts & Crafts', text: 'Tell me about art kits for kids' },
    ];

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className={`size-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg ${isSpeaking ? 'animate-pulse' : ''}`}>
                                <span className="material-symbols-outlined text-2xl">{isSpeaking ? 'volume_up' : 'mic'}</span>
                            </div>
                            {isConnected && (
                                <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Voice Assistant</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isSpeaking ? 'Speaking...' : isRecording ? 'Listening...' : isConnected ? 'Connected • Ready to help' : 'Disconnected'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {isSpeaking && (
                            <button onClick={stopSpeaking} className="text-sm font-medium text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-lg">stop_circle</span>
                                Stop
                            </button>
                        )}
                        {messages.length > 1 && (
                            <button onClick={clearChat} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors">
                                Clear Chat
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant'
                                ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                                : 'bg-gray-700 text-white'
                                }`}>
                                <span className="material-symbols-outlined text-lg">
                                    {msg.role === 'assistant' ? 'smart_toy' : 'person'}
                                </span>
                            </div>

                            <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'assistant'
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none'
                                    : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-tr-none'
                                    }`}>
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                </div>

                                {/* Product Cards */}
                                {msg.products && msg.products.length > 0 && (
                                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1 max-w-full">
                                        {msg.products.map(p => (
                                            <Link key={p.id} to={`/product/${p.id}`}
                                                className="flex-shrink-0 w-44 bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group">
                                                <img src={p.image} alt={p.name} className="w-full h-24 object-cover group-hover:scale-105 transition-transform" />
                                                <div className="p-2">
                                                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{p.name}</p>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-xs font-bold text-purple-600">{formatPrice(p.price)}</span>
                                                        <span className="text-[10px] text-yellow-500">★ {p.rating}</span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.preventDefault(); addToCart(p); }}
                                                        className="mt-1.5 w-full text-[10px] py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-semibold hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                                                    >
                                                        Add to Cart
                                                    </button>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                )}

                                <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                                    {msg.timestamp instanceof Date
                                        ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                        : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex gap-3">
                            <div className="size-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shrink-0">
                                <span className="material-symbols-outlined text-lg">smart_toy</span>
                            </div>
                            <div className="bg-white dark:bg-gray-800 rounded-2xl rounded-tl-none p-4 shadow-sm">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Quick Prompts (only show when few messages) */}
            {messages.length <= 2 && !isLoading && (
                <div className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 border-t border-gray-200/50 dark:border-gray-700/50">
                    <div className="max-w-4xl mx-auto">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Try asking:</p>
                        <div className="flex flex-wrap gap-2">
                            {quickPrompts.map((q, i) => (
                                <button
                                    key={i}
                                    onClick={() => processUserInput(q.text)}
                                    className="px-3 py-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors text-gray-700 dark:text-gray-300"
                                >
                                    {q.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/30 border-t border-red-200 dark:border-red-800">
                    <div className="max-w-4xl mx-auto flex items-center gap-2 text-red-600 dark:text-red-400">
                        <span className="material-symbols-outlined text-lg">error</span>
                        <span className="text-sm font-medium">{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-red-400 hover:text-red-600">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Recording Controls & Text Input */}
            <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-6 shadow-lg">
                <div className="max-w-4xl mx-auto">
                    {/* Current Transcript */}
                    {currentTranscript && (
                        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                            <p className="text-sm text-purple-900 dark:text-purple-200 text-center">
                                🎤 {currentTranscript}
                            </p>
                        </div>
                    )}

                    {/* Record Button */}
                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isLoading}
                            className={`relative size-16 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                                }`}
                        >
                            <span className="material-symbols-outlined text-3xl text-white">
                                {isRecording ? 'stop' : 'mic'}
                            </span>

                            {isRecording && (
                                <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping"></span>
                            )}
                        </button>

                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {isRecording ? 'Tap to stop' : 'Tap to speak'}
                        </p>
                    </div>

                    {/* Text Input Fallback */}
                    <form onSubmit={handleTextSubmit} className="mt-4 flex gap-2">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Or type your message here..."
                            disabled={isLoading}
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) handleTextSubmit(e); }}
                            className="flex-1 px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !textInput.trim()}
                            className="px-5 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold text-sm hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1"
                        >
                            <span className="material-symbols-outlined text-lg">send</span>
                        </button>
                    </form>

                    {/* Help Text */}
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                            <span className="material-symbols-outlined text-lg shrink-0">info</span>
                            <p className="text-xs leading-relaxed">
                                <strong>Tip:</strong> Speak clearly and mention what you're looking for.
                                Try "I need educational toys for a 5-year-old" or "Show me plush toys".
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistant;
