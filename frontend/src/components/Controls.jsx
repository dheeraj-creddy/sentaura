import React from 'react';
import './Controls.css';

const Controls = ({ isRecording, onToggle, onClear, isProcessing }) => {
  return (
    <div className="controls-container">
      <button
        className={`record-button ${isRecording ? 'recording' : ''}`}
        onClick={onToggle}
      >
        <span className="record-icon">
          {isRecording ? '⏹' : '🎤'}
        </span>
        <span className="record-text">
          {isRecording ? 'Stop' : 'Start'}
        </span>
      </button>

      {isRecording && (
        <div className="recording-indicator">
          <span className="pulse"></span>
          <span>Recording...</span>
        </div>
      )}

      {isProcessing && (
        <div className="processing-indicator">
          <span className="spinner"></span>
          <span>Analyzing...</span>
        </div>
      )}

      <button
        className="clear-button"
        onClick={onClear}
        disabled={isRecording}
      >
        Clear
      </button>
    </div>
  );
};

export default Controls;