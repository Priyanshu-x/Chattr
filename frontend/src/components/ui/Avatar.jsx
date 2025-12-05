// frontend/src/components/ui/Avatar.jsx
import React from 'react';

const Avatar = ({ src, alt, size = 'md', className = '' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <img
      src={src}
      alt={alt}
      className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
      onError={(e) => {
        console.error('Avatar failed to load:', src, e);
        e.target.onerror = null; // Prevent infinite loop if fallback also fails
        e.target.src = '/public/image-removebg-preview.png'; // Fallback image
      }}
    />
  );
};

export default Avatar;

