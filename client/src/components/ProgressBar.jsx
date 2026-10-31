import React from 'react';

const ProgressBar = ({ progress = 0, showLabel = true, height = 8, color = 'primary' }) => {
  const clampedProgress = Math.min(100, Math.max(0, Math.round(progress)));

  return (
    <div className="progress-bar-wrapper">
      <div className="progress-bar-track" style={{ height: `${height}px` }}>
        <div
          className={`progress-bar-fill ${color} ${clampedProgress === 100 ? 'completed' : ''}`}
          style={{ width: `${clampedProgress}%` }}
        ></div>
      </div>
      {showLabel && (
        <span className="progress-bar-label">
          {clampedProgress}%
        </span>
      )}
    </div>
  );
};

export default ProgressBar;
