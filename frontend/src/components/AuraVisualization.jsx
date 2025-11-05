import React, { useEffect, useRef } from 'react';
import Sketch from 'react-p5';

const AuraVisualization = ({ sentiment, emotion, intensity, valence, keywords }) => {
  const particles = useRef([]);
  const targetSentiment = useRef(0);
  const currentSentiment = useRef(0);
  const targetIntensity = useRef(0);
  const currentIntensity = useRef(0);
  const noiseOffset = useRef(0);
  const colorHue = useRef(200);
  const targetColorHue = useRef(200);

  // Emotion to color mapping
  const emotionColors = {
    joy: 60,        // Yellow
    happiness: 60,
    sadness: 220,   // Blue
    anger: 0,       // Red
    fear: 280,      // Purple
    surprise: 180,  // Cyan
    disgust: 120,   // Green
    neutral: 200,   // Light blue
    excitement: 30, // Orange
    calm: 160,      // Teal
    love: 320       // Pink
  };

  useEffect(() => {
    targetSentiment.current = sentiment;
    targetIntensity.current = intensity;
    targetColorHue.current = emotionColors[emotion?.toLowerCase()] || 200;
  }, [sentiment, emotion, intensity]);

  const setup = (p5, canvasParentRef) => {
    p5.createCanvas(p5.windowWidth, p5.windowHeight).parent(canvasParentRef);
    p5.colorMode(p5.HSB, 360, 100, 100, 100);

    // Initialize particles
    for (let i = 0; i < 450; i++) {
      particles.current.push({
        x: p5.random(p5.width),
        y: p5.random(p5.height),
        z: p5.random(100),
        size: p5.random(2, 8),
        speedX: 0,
        speedY: 0
      });
    }
  };

  const draw = (p5) => {
    // Smooth transitions
    currentSentiment.current = p5.lerp(currentSentiment.current, targetSentiment.current, 0.05);
    currentIntensity.current = p5.lerp(currentIntensity.current, targetIntensity.current, 0.05);
    colorHue.current = p5.lerp(colorHue.current, targetColorHue.current, 0.02);

    // Background based on sentiment
    const bgBrightness = p5.map(currentSentiment.current, -1, 1, 5, 15);
    p5.background(colorHue.current, 30, bgBrightness, 100);

    // Update noise offset for animation
    noiseOffset.current += 0.003 + currentIntensity.current * 0.01;

    // Perlin noise field strength
    const fieldStrength = 0.3 + currentIntensity.current * 2;
    const flowSpeed = 0.5 + currentIntensity.current * 1.5;

    // Draw and update particles
    particles.current.forEach((particle, i) => {
      // Calculate Perlin noise values
      const noiseX = p5.noise(particle.x * 0.003, particle.y * 0.003, noiseOffset.current);
      const noiseY = p5.noise(particle.x * 0.003 + 1000, particle.y * 0.003, noiseOffset.current);

      // Convert noise to angle
      const angle = noiseX * p5.TWO_PI * 2;
      const magnitude = noiseY * fieldStrength;

      // Update velocity
      particle.speedX += p5.cos(angle) * magnitude;
      particle.speedY += p5.sin(angle) * magnitude;

      // Apply damping
      particle.speedX *= 0.95;
      particle.speedY *= 0.95;

      // Update position
      particle.x += particle.speedX * flowSpeed;
      particle.y += particle.speedY * flowSpeed;

      // Wrap around edges
      if (particle.x < 0) particle.x = p5.width;
      if (particle.x > p5.width) particle.x = 0;
      if (particle.y < 0) particle.y = p5.height;
      if (particle.y > p5.height) particle.y = 0;

      // Calculate particle color based on position and sentiment
      const localNoise = p5.noise(particle.x * 0.01, particle.y * 0.01, noiseOffset.current * 0.5);
      const hueVariation = localNoise * 60 - 30;
      const particleHue = (colorHue.current + hueVariation + 360) % 360;

      // Saturation increases with intensity
      const saturation = 50 + currentIntensity.current * 50;

      // Brightness varies with sentiment and noise
      const brightness = p5.map(currentSentiment.current, -1, 1, 40, 90) + localNoise * 20;

      // Size pulsates with intensity
      const pulsate = p5.sin(noiseOffset.current * 2 + i * 0.1) * 0.5 + 0.5;
      const size = particle.size * (1 + currentIntensity.current * pulsate);

      // Draw particle with glow effect
      p5.noStroke();

      // Outer glow
      const alpha = 20 + currentIntensity.current * 30;
      p5.fill(particleHue, saturation, brightness, alpha);
      p5.circle(particle.x, particle.y, size * 3);

      // Inner particle
      p5.fill(particleHue, saturation, brightness, 70 + currentIntensity.current * 30);
      p5.circle(particle.x, particle.y, size);
    });

    // Add after particle loop, before connections:
if (currentIntensity.current > 0.5) {
  // Draw constellation patterns for high intensity
  const clusters = Math.floor(currentIntensity.current * 5);

  for (let c = 0; c < clusters; c++) {
    const cx = p5.random(p5.width);
    const cy = p5.random(p5.height);

    p5.stroke(colorHue.current, 70, 80, 30);
    p5.strokeWeight(1);

    // Draw star burst
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * p5.TWO_PI;
      const len = 50 + p5.sin(noiseOffset.current + i) * 30;
      const x = cx + p5.cos(angle) * len;
      const y = cy + p5.sin(angle) * len;
      p5.line(cx, cy, x, y);
    }
  }
}

    // Draw flowing lines connecting nearby particles
    if (currentIntensity.current > 0.3) {
      p5.stroke(colorHue.current, 60, 60, currentIntensity.current * 15);
      p5.strokeWeight(0.5);

      for (let i = 0; i < particles.current.length; i++) {
        for (let j = i + 1; j < particles.current.length; j++) {
          const p1 = particles.current[i];
          const p2 = particles.current[j];
          const distance = p5.dist(p1.x, p1.y, p2.x, p2.y);

          if (distance < 100) {
            const alpha = p5.map(distance, 0, 100, currentIntensity.current * 20, 0);
            p5.stroke(colorHue.current, 60, 70, alpha);
            p5.line(p1.x, p1.y, p2.x, p2.y);
          }
        }
      }
    }

    // Draw central energy burst for high intensity
    if (currentIntensity.current > 0.6) {
      p5.push();
      p5.translate(p5.width / 2, p5.height / 2);
      p5.noFill();

      for (let i = 0; i < 5; i++) {
        const radius = 100 + i * 50 + p5.sin(noiseOffset.current * 2 + i) * 30;
        const alpha = (currentIntensity.current - 0.6) * 50 * (1 - i / 5);
        p5.stroke(colorHue.current, 70, 80, alpha);
        p5.strokeWeight(2);
        p5.circle(0, 0, radius);
      }
      p5.pop();
    }
  };

  const windowResized = (p5) => {
    p5.resizeCanvas(p5.windowWidth, p5.windowHeight);
  };

  return <Sketch setup={setup} draw={draw} windowResized={windowResized} />;
};

export default AuraVisualization;