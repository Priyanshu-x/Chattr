import React, { useEffect, useRef } from 'react';
import { useSnow } from '../../context/SnowContext';
import { useTheme } from '../../context/ThemeContext';

const SnowOverlay = () => {
    const { isSnowing } = useSnow();
    const { isDark } = useTheme();
    const canvasRef = useRef(null);
    const requestRef = useRef(null);
    const snowflakes = useRef([]);

    // Animation Logic
    const createSnowflakes = (width, height) => {
        const count = Math.floor((width * height) / 4000); // Increased density
        const newFlakes = [];
        for (let i = 0; i < count; i++) {
            newFlakes.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 0.5, // Smaller snowflakes (0.5 to 2.5px)
                speed: Math.random() * 2 + 0.5,
                wind: Math.random() * 1 + 0.5, // Wind blowing from left to right (0.5 to 1.5)
                opacity: Math.random() * 0.5 + 0.3
            });
        }
        snowflakes.current = newFlakes;
    };

    const animate = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        ctx.clearRect(0, 0, width, height);

        // Snow color based on theme
        // Dark Mode: White (255, 255, 255)
        // Light Mode: Gray-700 (55, 65, 81) for high visibility
        const snowColor = isDark ? '255, 255, 255' : '55, 65, 81';

        // We can animate logic even if clearing, but we only draw if canvas exists
        snowflakes.current.forEach(flake => {
            flake.y += flake.speed;
            flake.x += flake.wind;

            if (flake.y > height) flake.y = -flake.radius;
            if (flake.x > width) flake.x = 0;
            if (flake.x < 0) flake.x = width;

            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${snowColor}, ${flake.opacity})`;
            ctx.fill();
        });

        requestRef.current = requestAnimationFrame(animate);
    };

    // Start/Stop Animation based on isSnowing
    useEffect(() => {
        if (isSnowing) {
            // Initialize flakes
            createSnowflakes(window.innerWidth, window.innerHeight);
            requestRef.current = requestAnimationFrame(animate);
        } else {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }

        return () => {
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, [isSnowing]);

    // Resize Listener
    useEffect(() => {
        if (!isSnowing) return;
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                createSnowflakes(window.innerWidth, window.innerHeight);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [isSnowing]);

    if (!isSnowing) return null;

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-40"
            style={{ width: '100%', height: '100%' }}
        />
    );
};

export default SnowOverlay;
