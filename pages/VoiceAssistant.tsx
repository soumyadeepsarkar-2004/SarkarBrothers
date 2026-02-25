import React, { useState, useRef, useEffect } from 'react';
import { generateVoiceResponse } from '../services/gemini';
import { useLanguage } from '../contexts/LanguageContext';

interface Message {
    role: 'user' | 'assistant';
    text: string;
    timestamp: Date;
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

const VoiceAssistant: React.FC = () => {
    const { t, language } = useLanguage();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [textInput, setTextInput] = useState('');

    const recognitionRef = useRef<any>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize on mount
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
                text: 'Hello! I\'m your voice assistant. How can I help you find the perfect toy today?',
                timestamp: new Date()
            }]);
        }
    };

    const startRecording = async () => {
        try {
            setError(null);

            // Use Web Speech API for real speech recognition
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

            if (!SpeechRecognition) {
                setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari. You can also type your message below.');
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
                if (!isConnected) {
                    initializeAssistant();
                }
            };

            recognition.onresult = (event: SpeechRecognitionEvent) => {
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

                if (interimTranscript) {
                    setCurrentTranscript(interimTranscript);
                }

                if (finalTranscript) {
                    setCurrentTranscript('');
                    processUserInput(finalTranscript.trim());
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech') {
                    setError('No speech detected. Please try again.');
                } else if (event.error === 'audio-capture') {
                    setError('No microphone found. Please check your microphone settings.');
                } else if (event.error === 'not-allowed') {
                    setError('Microphone access denied. Please allow microphone access in your browser settings.');
                } else {
                    setError(`Speech recognition error: ${event.error}. You can type your message instead.`);
                }
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

        // Add user message
        const userMessage: Message = {
            role: 'user',
            text: text,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Get AI response from Gemini
            const response = await generateVoiceResponse(text, language);

            // Add assistant message
            const assistantMessage: Message = {
                role: 'assistant',
                text: response,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMessage]);

            // Speak the response using Text-to-Speech
            speakText(response);
        } catch (err) {
            console.error('Response error:', err);
            const fallbackMessage: Message = {
                role: 'assistant',
                text: "I'm sorry, I had trouble processing that. Could you try again?",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, fallbackMessage]);
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

    // Text-to-speech
    const speakText = (text: string) => {
        if ('speechSynthesis' in window) {
            // Cancel any ongoing speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = language === 'bn' ? 'bn-IN' : 'en-US';

            window.speechSynthesis.speak(utterance);
        }
    };

    const clearChat = () => {
        window.speechSynthesis?.cancel();
        setMessages([{
            role: 'assistant',
            text: 'Chat cleared. How can I help you?',
            timestamp: new Date()
        }]);
    };

    return (
        <div className="flex-1 flex flex-col h-[calc(100vh-64px)] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="size-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                                <span className="material-symbols-outlined text-2xl">mic</span>
                            </div>
                            {isConnected && (
                                <div className="absolute -bottom-1 -right-1 size-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Voice Assistant</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {isConnected ? 'Connected • Ready to help' : 'Disconnected'}
                            </p>
                        </div>
                    </div>

                    {messages.length > 1 && (
                        <button
                            onClick={clearChat}
                            className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
                        >
                            Clear Chat
                        </button>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
                        >
                            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'assistant'
                                ? 'bg-gradient-to-br from-purple-500 to-blue-500 text-white'
                                : 'bg-gray-700 text-white'
                                }`}>
                                <span className="material-symbols-outlined text-lg">
                                    {msg.role === 'assistant' ? 'smart_toy' : 'person'}
                                </span>
                            </div>

                            <div className="flex flex-col gap-1 max-w-[75%]">
                                <div className={`p-4 rounded-2xl shadow-sm ${msg.role === 'assistant'
                                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none'
                                    : 'bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-tr-none'
                                    }`}>
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                </div>
                                <span className="text-xs text-gray-500 dark:text-gray-400 px-2">
                                    {msg.timestamp instanceof Date ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

            {/* Error Display */}
            {error && (
                <div className="px-4 py-3 bg-red-50 dark:bg-red-900/30 border-t border-red-200 dark:border-red-800">
                    <div className="max-w-4xl mx-auto flex items-center gap-2 text-red-600 dark:text-red-400">
                        <span className="material-symbols-outlined text-lg">error</span>
                        <span className="text-sm font-medium">{error}</span>
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
                                {currentTranscript}
                            </p>
                        </div>
                    )}

                    {/* Record Button */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isLoading}
                            className={`relative size-20 rounded-full flex items-center justify-center transition-all transform hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isRecording
                                ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                : 'bg-gradient-to-br from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                                }`}
                        >
                            <span className="material-symbols-outlined text-4xl text-white">
                                {isRecording ? 'stop' : 'mic'}
                            </span>

                            {isRecording && (
                                <span className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping"></span>
                            )}
                        </button>

                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {isRecording ? 'Recording... Tap to stop' : 'Tap to speak'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {isConnected ? 'Voice assistant is ready' : 'Will connect on first use'}
                            </p>
                        </div>
                    </div>

                    {/* Text Input Fallback */}
                    <form onSubmit={handleTextSubmit} className="mt-4 flex gap-2">
                        <input
                            type="text"
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Or type your message here..."
                            disabled={isLoading}
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
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                            <span className="material-symbols-outlined text-lg">info</span>
                            <p className="text-xs leading-relaxed">
                                <strong>Tip:</strong> Speak clearly and mention what you're looking for.
                                Try saying things like "I need educational toys for a 5-year-old" or "Show me plush toys".
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VoiceAssistant;
