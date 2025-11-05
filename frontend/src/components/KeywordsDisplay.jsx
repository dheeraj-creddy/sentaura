import React, { useState, useEffect } from 'react';
import './KeywordsDisplay.css';

const KeywordsDisplay = ({ keywords, emotion }) => {
  const [displayedKeywords, setDisplayedKeywords] = useState([]);

  useEffect(() => {
    // Animate keywords in one by one
    if (keywords.length > 0) {
      setDisplayedKeywords([]);
      keywords.forEach((keyword, index) => {
        setTimeout(() => {
          setDisplayedKeywords(prev => {
            if (!prev.includes(keyword)) {
              return [...prev, keyword];
            }
            return prev;
          });
        }, index * 200); // 200ms delay between each keyword
      });
    }
  }, [keywords]);

  const emotionEmojis = {
    joy: '😊',
    happiness: '😃',
    sadness: '😢',
    anger: '😠',
    fear: '😨',
    surprise: '😲',
    disgust: '🤢',
    neutral: '😐',
    excitement: '🤩',
    calm: '😌',
    love: '❤️'
  };

  return (
    <div className="keywords-container">
      <div className="emotion-indicator">
        <span className="emotion-emoji">
          {emotionEmojis[emotion?.toLowerCase()] || '😐'}
        </span>
        <span className="emotion-label">{emotion || 'neutral'}</span>
      </div>

      {displayedKeywords.length > 0 && (
        <div className="keywords-cloud">
          {displayedKeywords.map((keyword, index) => (
            <span
              key={`${keyword}-${index}`}
              className="keyword-tag"
              style={{
                animationDelay: `${index * 0.2}s`,
              }}
            >
              {keyword}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeywordsDisplay;