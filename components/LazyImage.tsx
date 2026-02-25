import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
    src: string;
    alt: string;
    className?: string;
    aspectRatio?: string;
    showSkeleton?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    className = '',
    aspectRatio = 'square',
    showSkeleton = true
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsInView(true);
                        observer.disconnect();
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading when image is 50px away from viewport
            }
        );

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    const handleImageLoad = () => {
        setIsLoaded(true);
    };

    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Skeleton Loader */}
            {showSkeleton && !isLoaded && (
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-shimmer bg-[length:200%_100%]">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 text-4xl animate-pulse">image</span>
                    </div>
                </div>
            )}

            {/* Actual Image */}
            <img
                ref={imgRef}
                src={isInView ? src : ''}
                alt={alt}
                className={`${className} transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                onLoad={handleImageLoad}
                loading="lazy"
            />
        </div>
    );
};

export default LazyImage;
