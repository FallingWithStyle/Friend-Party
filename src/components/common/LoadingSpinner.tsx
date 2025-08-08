import React from 'react';
import Image from 'next/image';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <Image
        src="/d20.svg"
        alt="Loading..."
        width={64}
        height={64}
        className="loading-spinner"
        priority
      />
    </div>
  );
};

export default LoadingSpinner;