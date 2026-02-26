import React, { useState, useRef } from 'react';
import { generateImageWithPrompt, editImageWithPrompt } from '../services/gemini';

type TabMode = 'generate' | 'edit';
type ImageSize = '1024x1024' | '2048x2048' | '4096x4096';

const ImageGenerator: React.FC = () => {
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
                link.download = `toywonder-${activeTab}-${Date.now()}.png`;
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
        <div className="flex-1 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 min-h-[calc(100vh-64px)]">
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
                        Edit
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Panel - Controls */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {activeTab === 'generate' ? 'Generation Settings' : 'Editing Settings'}
                            </h2>

                            {/* Image Upload for Edit Mode */}
                            {activeTab === 'edit' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Upload Image
                                    </label>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full py-3 px-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300"
                                    >
                                        <span className="material-symbols-outlined">upload</span>
                                        {uploadedImage ? uploadedImage.name : 'Click to upload image'}
                                    </button>

                                    {uploadedImagePreview && (
                                        <div className="mt-4 relative rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700">
                                            <img src={uploadedImagePreview} alt="Uploaded" className="w-full h-48 object-cover" />
                                            <button
                                                onClick={() => {
                                                    setUploadedImage(null);
                                                    setUploadedImagePreview(null);
                                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                                }}
                                                className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                                            >
                                                <span className="material-symbols-outlined text-sm">close</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Image Size Selection (Generate Mode Only) */}
                            {activeTab === 'generate' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        Image Size
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['1024x1024', '2048x2048', '4096x4096'] as ImageSize[]).map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setImageSize(size)}
                                                className={`py-2 px-4 rounded-lg font-medium transition-all ${imageSize === size
                                                        ? 'bg-purple-500 text-white shadow-md'
                                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                                    }`}
                                            >
                                                {size.split('x')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Prompt Input */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {activeTab === 'generate' ? 'Describe what you want to create' : 'Describe how to edit'}
                                </label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder={activeTab === 'generate'
                                        ? 'e.g., A colorful toy robot with LED lights on a white background'
                                        : 'e.g., Change the background to a rainbow, add sparkles'
                                    }
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {prompt.length}/500 characters
                                </p>
                            </div>

                            {/* Example Prompts */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    Example Prompts
                                </label>
                                <div className="space-y-2">
                                    {examplePrompts[activeTab].map((example, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setPrompt(example)}
                                            className="w-full text-left px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/30 border border-gray-200 dark:border-gray-600 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
                                        >
                                            {example}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={activeTab === 'generate' ? handleGenerate : handleEdit}
                                disabled={isLoading || (activeTab === 'edit' && !uploadedImage)}
                                className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined">
                                            {activeTab === 'generate' ? 'auto_awesome' : 'edit'}
                                        </span>
                                        {activeTab === 'generate' ? 'Generate Image' : 'Edit Image'}
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Info Card */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-blue-500 mt-0.5">info</span>
                                <div className="text-sm text-blue-900 dark:text-blue-200">
                                    <p className="font-semibold mb-1">Tips for best results:</p>
                                    <ul className="space-y-1 text-xs list-disc list-inside">
                                        <li>Be specific and descriptive in your prompts</li>
                                        <li>Mention colors, styles, and desired mood</li>
                                        <li>For editing, describe changes clearly</li>
                                        <li>Higher resolutions take longer to generate</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Output */}
                    <div className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 min-h-[500px] flex flex-col">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Output</h2>

                            {/* Status Messages */}
                            {error && (
                                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <span className="material-symbols-outlined">error</span>
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-2 text-green-600 dark:text-green-400">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    <span className="text-sm font-medium">{successMessage}</span>
                                </div>
                            )}

                            {/* Image Display */}
                            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden">
                                {generatedImageUrl ? (
                                    <img
                                        src={generatedImageUrl}
                                        alt="Generated"
                                        className="max-w-full max-h-full object-contain"
                                    />
                                ) : isLoading ? (
                                    <div className="text-center">
                                        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
                                        <p className="text-gray-600 dark:text-gray-400 font-medium">
                                            {activeTab === 'generate' ? 'Generating image...' : 'Editing image...'}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                                            {loadingStage || 'Trying multiple AI providers for best result...'}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">This may take 10-30 seconds</p>
                                    </div>
                                ) : (
                                    <div className="text-center p-8">
                                        <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600 mb-4">image</span>
                                        <p className="text-gray-500 dark:text-gray-400">Your generated image will appear here</p>
                                    </div>
                                )}
                            </div>

                            {/* Download Button */}
                            {generatedImageUrl && (
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={handleDownload}
                                        className="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined">download</span>
                                        Download Image
                                    </button>
                                    <button
                                        onClick={resetForm}
                                        className="px-4 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-colors"
                                    >
                                        <span className="material-symbols-outlined">refresh</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ImageGenerator;
