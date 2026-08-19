import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

export default function AboutGallery({ images, alt }) {
  const allImages = images?.filter(Boolean) || [];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (allImages.length < 2) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % allImages.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [allImages.length]);

  if (allImages.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <Heart className="w-24 h-24 text-primary/20" />
      </div>
    );
  }

  if (allImages.length === 1) {
    return <img src={allImages[0]} alt={alt} className="w-full h-full object-cover" />;
  }

  return (
    <div className="relative w-full h-full">
      {allImages.map((img, i) => (
        <img
          key={i}
          src={img}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
            i === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        />
      ))}
    </div>
  );
}