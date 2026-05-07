import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, color = '#3498db' }) => {
  return (
    <div className="spinner-container">
      <div
        className="loading-spinner"
        style={{
          width: size,
          height: size,
          borderColor: `${color} transparent transparent transparent`
        }}
      />
    </div>
  );
};

export default LoadingSpinner;
