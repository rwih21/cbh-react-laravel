import React, { useState, useRef, useEffect, useCallback } from 'react';

export default function ProductImageGallery({ images, alt, className, imgClassName, placeholder }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const startTimerRef = useRef(null);
  const slideIntervalRef = useRef(null);

  const clearAll = useCallback(() => {
    if (startTimerRef.current) {
      clearTimeout(startTimerRef.current);
      startTimerRef.current = null;
    }
    if (slideIntervalRef.current) {
      clearInterval(slideIntervalRef.current);
      slideIntervalRef.current = null;
    }
  }, []);

  const handleMouseEnter = useCallback(() => {
    if (!images || images.length < 2) return;
    startTimerRef.current = setTimeout(() => {
      slideIntervalRef.current = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % images.length);
      }, 5000);
    }, 750);
  }, [images]);

  const handleMouseLeave = useCallback(() => {
    clearAll();
    setCurrentIndex(0);
  }, [clearAll]);

  useEffect(() => {
    return () => clearAll();
  }, [clearAll]);

  if (!images || images.length === 0) {
    return placeholder || null;
  }

  return (
    <div
      className={`relative ${className || ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {images.map((img, i) => (
        <img
          key={i}
          src={img}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            imgClassName || ''
          } ${i === currentIndex ? 'opacity-100' : 'opacity-0'}`}
        />
      ))}
    </div>
  );
}