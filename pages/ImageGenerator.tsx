import React, { useState, useRef } from 'react';
import { generateImageWithPrompt, editImageWithPrompt } from '../services/gemini';
import { useAuth } from '../contexts/AuthContext';
import LoginModal from '../components/LoginModal';

type TabMode = 'generate' | 'edit';
type ImageSize = '1024x1024' | '2048x2048' | '4096x4096';

const IMAGE_SIZE_OPTIONS: { value: ImageSize; label: string }[] = [
    { value: '1024x1024', label: '1K' },
    { value: '2048x2048', label: '2K' },
    { value: '4096x4096', label: '4K' },
];

const ImageGenerator: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<TabMode>('generate');
    const [prompt, setPrompt] = useState('');
    const [imageSize, setImageSize] = useState<ImageSize>('1024x1024');
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [loadingStage, setLoadingStage] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                setError('Please upload a valid image file');
                return;
            }

            if (file.size > 10 * 1024 * 1024) { // 10MB limit
                setError('Image size should be less than 10MB');
                return;
            }

            setUploadedImage(file);
            setError(null);

            // Create preview
            const reader = new FileReader();
            reader.onload = (e) => {
                setUploadedImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        setGeneratedImageUrl(null);
        setLoadingStage('Connecting to AI service...');

        try {
            const imageUrl = await generateImageWithPrompt(prompt, imageSize);
            setGeneratedImageUrl(imageUrl);
            setSuccessMessage('Image generated successfully!');
        } catch (err: any) {
            console.error('Generation error:', err);
            setError(err.message || 'Failed to generate image. Please try again.');
        } finally {
            setIsLoading(false);
            setLoadingStage('');
        }
    };

    const handleEdit = async () => {
        if (!uploadedImage) {
            setError('Please upload an image first');
            return;
        }

        if (!prompt.trim()) {
            setError('Please enter editing instructions');
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage(null);
        setGeneratedImageUrl(null);
        setLoadingStage('Processing your image...');

        try {
            const imageUrl = await editImageWithPrompt(uploadedImage, prompt);
            setGeneratedImageUrl(imageUrl);
            setSuccessMessage('Image edited successfully!');
        } catch (err: any) {
            console.error('Editing error:', err);
            setError(err.message || 'Failed to edit image. Please try again.');
        } finally {
            setIsLoading(false);
            setLoadingStage('');
        }
    };

    const handleDownload = async () => {
        if (generatedImageUrl) {
            // For base64 data URIs, direct download works
            if (generatedImageUrl.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = generatedImageUrl;
                link.download = `sarkarbrothers-${activeTab}-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // For external URLs, open in new tab (can't force download cross-origin)
                window.open(generatedImageUrl, '_blank');
            }
        }
    };

    const resetForm = () => {
        setPrompt('');
        setUploadedImage(null);
        setUploadedImagePreview(null);
        setGeneratedImageUrl(null);
        setError(null);
        setSuccessMessage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const examplePrompts = {
        generate: [
            'A cute teddy bear in a toyshop',
            'Colorful building blocks arranged in a castle',
            'A futuristic robot toy with LED lights',
            'Wooden train set on a playmat'
        ],
        edit: [
            'Change the background to a rainbow',
            'Add sparkles and glitter effects',
            'Make the colors more vibrant',
            'Add a birthday party theme'
        ]
    };

    return (
        <div className="flex-1 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-[calc(100vh-64px)] relative overflow-hidden">
            {!isAuthenticated && (
                <div className="absolute inset-0 bg-white/70 dark:bg-[#1a1a1a]/85 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
                    <div className="max-w-md bg-white dark:bg-[#1a170d] p-8 rounded-3xl border border-[#e6e3db]/80 dark:border-[#332f20]/80 shadow-2xl space-y-5">
                        <div className="size-16 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-500 text-white flex items-center justify-center mx-auto shadow-lg animate-pulse">
                            <span className="material-symbols-outlined text-4xl">lock</span>
                        </div>
                        <h3 className="text-xl font-bold text-[#181611] dark:text-white">Unlock AI Image Generator</h3>
                        <p className="text-sm text-[#8a8060] dark:text-gray-400">
                            Log in or create a free account to generate high-resolution toy designs, edit custom banners, and download custom wallpapers.
                        </p>
                        <button
                            onClick={() => setIsLoginModalOpen(true)}
                            className="bg-primary hover:bg-[#e5b31f] text-[#181611] font-bold px-6 py-2.5 rounded-xl shadow-lg transition-all active:scale-95 transform flex items-center gap-2 mx-auto"
                        >
                            <span className="material-symbols-outlined text-lg">login</span>
                            Log In / Sign Up
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center size-16 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 text-white mb-4 shadow-lg">
                        <span className="material-symbols-outlined text-3xl">image</span>
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">AI Image Generator</h1>
                    <p className="text-gray-600 dark:text-gray-300">Create and edit images with AI-powered tools</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 p-2 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => { setActiveTab('generate'); resetForm(); }}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${activeTab === 'generate'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg mr-2 align-middle">auto_awesome</span>
                        Generate
                    </button>
                    <button
                        onClick={() => { setActiveTab('edit'); resetForm(); }}
                        className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${activeTab === 'edit'
                            ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <span className="material-symbols-outlined text-lg mr-2 align-middle">edit</span>
                        Edit Image
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Controls Panel */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        {activeTab === 'generate' ? (
                            /* Generate Form */
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Prompt</label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Describe the image you want to generate in detail..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-950 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm resize-none"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Resolution</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {IMAGE_SIZE_OPTIONS.map((opt) => (
                                            <button
                                                key={opt.value}
                                                onClick={() => setImageSize(opt.value)}
                                                className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${imageSize === opt.value
                                                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-300'
                                                    }`}
                                                disabled={isLoading}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={isLoading || !prompt.trim()}
                                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">auto_awesome</span>
                                                Generate Image
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Edit Form */
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Source Image</label>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                        className="hidden"
                                        disabled={isLoading}
                                    />
                                    {uploadedImagePreview ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-video bg-gray-50 dark:bg-gray-900">
                                            <img
                                                src={uploadedImagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-4 py-2 bg-white text-gray-800 text-xs font-semibold rounded-lg shadow-md hover:bg-gray-50 transition-colors"
                                                    disabled={isLoading}
                                                >
                                                    Change
                                                </button>
                                                <button
                                                    onClick={() => { setUploadedImage(null); setUploadedImagePreview(null); }}
                                                    className="px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg shadow-md hover:bg-red-700 transition-colors"
                                                    disabled={isLoading}
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full aspect-video border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-400 transition-colors flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900/50"
                                            disabled={isLoading}
                                        >
                                            <span className="material-symbols-outlined text-4xl text-gray-400 dark:text-gray-600 mb-2">upload_file</span>
                                            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">Upload source image</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-600 mt-1">PNG, JPG, or WEBP up to 10MB</span>
                                        </button>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Editing Instructions</label>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="E.g. Change the toy's color to blue, add birthday decorations..."
                                        rows={4}
                                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-950 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all text-sm resize-none"
                                        disabled={isLoading}
                                    />
                                </div>

                                <div>
                                    <button
                                        onClick={handleEdit}
                                        disabled={isLoading || !uploadedImage || !prompt.trim()}
                                        className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 text-white font-bold rounded-xl shadow-lg hover:brightness-110 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined">brush</span>
                                                Apply Edits
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Example Prompts helper */}
                        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider block mb-3">Try these prompts</span>
                            <div className="flex flex-wrap gap-2">
                                {examplePrompts[activeTab].map((ex, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPrompt(ex)}
                                        className="px-3.5 py-1.5 bg-gray-50 dark:bg-gray-900/60 hover:bg-gray-100 dark:hover:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-300 transition-colors"
                                        disabled={isLoading}
                                    >
                                        {ex}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Result Panel */}
                    <div className="flex flex-col bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                        <div className="flex-1 flex flex-col">
                            {/* Error notification */}
                            {error && (
                                <div className="mb-4 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-200/50 dark:border-red-900/30 flex items-center gap-2">
                                    <span className="material-symbols-outlined">error</span>
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            )}

                            {/* Success notification */}
                            {successMessage && (
                                <div className="mb-4 bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 p-4 rounded-xl border border-green-200/50 dark:border-green-900/30 flex items-center gap-2">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    <span className="text-sm font-medium">{successMessage}</span>
                                </div>
                            )}
                            
                            {/* Generated Content Placeholder */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-900/50">
                                {generatedImageUrl ? (
                                    <div className="space-y-4 w-full">
                                        <img src={generatedImageUrl} alt="Result" className="rounded-lg shadow-lg max-w-full h-auto mx-auto" />
                                        <button onClick={handleDownload} className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors">Download</button>
                                    </div>
                                ) : isLoading ? (
                                    <div className="space-y-4">
                                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">{loadingStage || 'Generating...'}</p>
                                    </div>
                                ) : (
                                    <div className="text-gray-400 dark:text-gray-600">
                                        <span className="material-symbols-outlined text-5xl mb-2">image</span>
                                        <p>Your result will appear here</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Login Prompt Modal */}
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </div>
    );
};

export default ImageGenerator;
