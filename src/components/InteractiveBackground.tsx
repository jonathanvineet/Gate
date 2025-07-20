import React, { useEffect, useRef, useState } from 'react';

interface Dot {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
}

const InteractiveBackground: React.FC = () => {
  const [dots, setDots] = useState<Dot[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Initialize dots
  useEffect(() => {
    const colors = [
      'rgba(168, 85, 247, 0.6)', // Purple
      'rgba(59, 130, 246, 0.6)',  // Blue
      'rgba(16, 185, 129, 0.6)',  // Green
      'rgba(245, 158, 11, 0.6)',  // Yellow
      'rgba(239, 68, 68, 0.6)',   // Red
      'rgba(139, 92, 246, 0.6)',  // Violet
    ];

    const initialDots: Dot[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      opacity: Math.random() * 0.8 + 0.2,
    }));

    setDots(initialDots);
  }, []);

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setDots(prevDots => 
        prevDots.map(dot => {
          const mouse = mouseRef.current;
          const dx = dot.x - mouse.x;
          const dy = dot.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          let newVx = dot.vx;
          let newVy = dot.vy;
          
          // Repulsion from mouse
          const repulsionRadius = 150;
          if (distance < repulsionRadius && distance > 0) {
            const force = (repulsionRadius - distance) / repulsionRadius * 0.5;
            newVx += (dx / distance) * force;
            newVy += (dy / distance) * force;
          }
          
          // Apply damping
          newVx *= 0.99;
          newVy *= 0.99;
          
          // Add small random movement
          newVx += (Math.random() - 0.5) * 0.02;
          newVy += (Math.random() - 0.5) * 0.02;
          
          // Update position
          let newX = dot.x + newVx;
          let newY = dot.y + newVy;
          
          // Boundary wrapping
          if (newX < -10) newX = window.innerWidth + 10;
          if (newX > window.innerWidth + 10) newX = -10;
          if (newY < -10) newY = window.innerHeight + 10;
          if (newY > window.innerHeight + 10) newY = -10;
          
          return {
            ...dot,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        })
      );
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setDots(prevDots => 
        prevDots.map(dot => ({
          ...dot,
          x: Math.min(dot.x, window.innerWidth),
          y: Math.min(dot.y, window.innerHeight),
        }))
      );
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-black"></div>
      
      {/* Animated Particles */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-pulse opacity-10"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          >
            <div 
              className="bg-gradient-to-r from-cyan-300 to-purple-300 rounded-full blur-sm"
              style={{
                width: `${10 + Math.random() * 30}px`,
                height: `${10 + Math.random() * 30}px`
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Floating Orbs */}
      <div className="absolute inset-0">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bounce opacity-5"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${4 + Math.random() * 3}s`
            }}
          >
            <div 
              className="bg-gradient-to-br from-pink-300 to-yellow-300 rounded-full blur-lg"
              style={{
                width: `${50 + Math.random() * 100}px`,
                height: `${50 + Math.random() * 100}px`
              }}
            />
          </div>
        ))}
      </div>
      
      {/* Interactive Dots */}
      <div className="absolute inset-0">
        {dots.map(dot => (
          <div
            key={dot.id}
            className="absolute rounded-full transition-all duration-100 ease-out"
            style={{
              left: `${dot.x}px`,
              top: `${dot.y}px`,
              width: `${dot.size}px`,
              height: `${dot.size}px`,
              backgroundColor: dot.color,
              opacity: dot.opacity,
              boxShadow: `0 0 ${dot.size * 2}px ${dot.color}`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default InteractiveBackground;