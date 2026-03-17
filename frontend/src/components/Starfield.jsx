import React, { useEffect, useRef } from 'react';

export default function Starfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Create stars
    const numStars = 500;
    const stars = [];
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            z: Math.random() * canvas.width,
            o: '0.' + Math.floor(Math.random() * 99) + 1,
            size: Math.random() * 1.5
        });
    }

    // Mouse tracking for subtle parallax
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
        mouseX = (e.clientX - canvas.width / 2) * 0.05;
        mouseY = (e.clientY - canvas.height / 2) * 0.05;
    };
    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (let i = 0; i < numStars; i++) {
            const star = stars[i];

            // Move stars forward toward the camera (z decreases)
            star.z -= 1.5;

            // Shift field subtly based on mouse
            star.x -= mouseX * 0.1;
            star.y -= mouseY * 0.1;

            if (star.z <= 0) {
                star.x = Math.random() * canvas.width;
                star.y = Math.random() * canvas.height;
                star.z = canvas.width;
            }

            // Project 3D coordinates using perspective
            const k = 128.0 / star.z;
            const px = (star.x - centerX) * k + centerX;
            const py = (star.y - centerY) * k + centerY;

            // Size increases as it gets closer
            const s = (1 - star.z / canvas.width) * star.size * 3;

            if (px >= 0 && px <= canvas.width && py >= 0 && py <= canvas.height) {
                ctx.beginPath();
                ctx.fillStyle = `rgba(255, 255, 255, ${star.o})`;
                ctx.arc(px, py, s, 0, 2 * Math.PI);
                ctx.fill();
            }
        }

        animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 z-0 opacity-80 pointer-events-none"
      style={{ backgroundColor: '#020205' }} // extremely deep space blue/black
    />
  );
}
