import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-overlay">
      <img src="/d20.svg" alt="Loading..." className="loading-spinner" />
    </div>
  );
};

export default LoadingSpinner;