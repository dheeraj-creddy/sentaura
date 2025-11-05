import React, { useEffect, useRef } from 'react';
import './TranscriptDisplay.css';

const TranscriptDisplay = ({ transcript }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    // Auto-scroll to bottom when new transcript arrives
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [transcript]);

  return (
    <div className="transcript-container" ref={containerRef}>
      <h2 className="transcript-title">Live Transcript</h2>
      <div className="transcript-content">
        {transcript.length === 0 ? (
          <p className="transcript-empty">Start speaking to see your words appear...</p>
        ) : (
          transcript.map((entry, index) => (
            <p
              key={index}
              className={`transcript-line ${entry.isFinal ? 'final' : 'interim'}`}
            >
              {entry.text}
            </p>
          ))
        )}
      </div>
    </div>
  );
};

export default TranscriptDisplay;