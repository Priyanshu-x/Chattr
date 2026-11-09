import React, { useState, useEffect, useRef } from 'react';

const GEN_Z_QUOTES = [
  'quack! 🦆',
  'vibing fr fr',
  'sheeeesh 🥶',
  'no cap 💅',
  'chat is this real?',
  'waddle waddle 💨',
  'bro thought he could chat 💀',
  'slay ✨',
  'just passing through 🚶‍♂️',
  'lowkey unbothered 💅'
];

const WalkingDuck = () => {
  const [active, setActive] = useState(false);
  const [direction, setDirection] = useState('ltr'); // 'ltr' (left to right) or 'rtl' (right to left)
  const [progress, setProgress] = useState(-15); // Percentage across screen (-15% to 115%)
  const [bubbleText, setBubbleText] = useState(null);
  const [isHopping, setIsHopping] = useState(false);

  const animationRef = useRef(null);
  const progressRef = useRef(-15);
  const isPausedRef = useRef(false);

  // Spawn duck at random intervals
  useEffect(() => {
    let timeoutId;

    const scheduleNextWalk = () => {
      // Random interval between 18s and 45s
      const delay = Math.floor(Math.random() * (45000 - 18000 + 1)) + 18000;
      timeoutId = setTimeout(() => {
        startWalk();
      }, delay);
    };

    // First appearance after 3 seconds so the user immediately gets to see the duck
    const initialTimer = setTimeout(() => {
      startWalk();
    }, 3000);

    return () => {
      clearTimeout(initialTimer);
      clearTimeout(timeoutId);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const startWalk = () => {
    // Random direction
    const goingRight = Math.random() > 0.5;
    const dir = goingRight ? 'ltr' : 'rtl';
    setDirection(dir);
    setBubbleText(null);
    setIsHopping(false);

    const startPos = goingRight ? -15 : 115;
    progressRef.current = startPos;
    setProgress(startPos);
    setActive(true);
    isPausedRef.current = false;

    let lastTime = performance.now();
    // Speed: approx 9% of screen width per second (takes ~14 seconds to cross)
    const speed = 9;

    const step = (currentTime) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!isPausedRef.current) {
        if (dir === 'ltr') {
          progressRef.current += speed * delta;
          if (progressRef.current > 115) {
            endWalk();
            return;
          }
        } else {
          progressRef.current -= speed * delta;
          if (progressRef.current < -15) {
            endWalk();
            return;
          }
        }
        setProgress(progressRef.current);
      }

      animationRef.current = requestAnimationFrame(step);
    };

    animationRef.current = requestAnimationFrame(step);
  };

  const endWalk = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setActive(false);
    setProgress(-15);
    setBubbleText(null);
    // Schedule next appearance
    const delay = Math.floor(Math.random() * (40000 - 18000 + 1)) + 18000;
    setTimeout(startWalk, delay);
  };

  const handleDuckClick = () => {
    // Show random funny quote and do hop animation
    const randomQuote = GEN_Z_QUOTES[Math.floor(Math.random() * GEN_Z_QUOTES.length)];
    setBubbleText(randomQuote);
    setIsHopping(true);
    isPausedRef.current = true;

    setTimeout(() => {
      setIsHopping(false);
      setBubbleText(null);
      isPausedRef.current = false;
    }, 2400);
  };

  if (!active) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: `${progress}%`,
        bottom: '88px', // Sits playfully right above the message input bar
        zIndex: 35,
        pointerEvents: 'auto',
        cursor: 'pointer',
        transform: `translateX(-50%) ${direction === 'rtl' ? 'scaleX(-1)' : 'scaleX(1)'}`,
        transition: 'transform 0.2s ease',
        userSelect: 'none'
      }}
      onClick={handleDuckClick}
      title="Click me!"
      className="group"
    >
      {/* Speech bubble */}
      {bubbleText && (
        <div
          style={{
            transform: direction === 'rtl' ? 'scaleX(-1)' : 'scaleX(1)',
          }}
          className="absolute -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-black/85 dark:bg-white/90 text-white dark:text-black text-xs font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 dark:border-black/20 animate-bounce pointer-events-none"
        >
          {bubbleText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-black/85 dark:border-t-white/90"></div>
        </div>
      )}

      {/* Walking Duck Sprite */}
      <img
        src="/stickers/duck_walking.webp"
        alt="Walking Duck"
        className={`w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md select-none ${
          isHopping ? 'animate-bounce' : ''
        }`}
        draggable={false}
      />
    </div>
  );
};

export default WalkingDuck;

