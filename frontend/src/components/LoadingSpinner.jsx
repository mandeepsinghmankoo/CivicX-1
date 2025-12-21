import React from 'react';

function LoadingSpinner({ 
  size = 'medium', 
  text = 'Loading...', 
  fullScreen = false,
  className = '' 
}) {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-12 w-12',
    large: 'h-16 w-16',
    xlarge: 'h-20 w-20'
  };

  const textSizeClasses = {
    small: 'text-sm',
    medium: 'text-base',
    large: 'text-lg',
    xlarge: 'text-xl'
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-4 border-gray-600 border-t-[#045c65] rounded-full animate-spin mb-4`}></div>
      {text && (
        <p className={`text-gray-300 ${textSizeClasses[size]} font-medium`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-gradient-to-tl from-[#0b2a2d] to-[#020d0e] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}

export default LoadingSpinner;
