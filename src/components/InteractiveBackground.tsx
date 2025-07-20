import React, { useRef, useEffect } from "react";

const DOTS = 350;
const MOUSE_REPEL_RADIUS = 100;

const random = (max: number) => Math.random() * max;

function makeDot(width: number, height: number) {
  const angle = random(2 * Math.PI);
  const speed = 0.4 + random(0.7); // Adjust for desired slow natural speed
  return {
    x: random(width),
    y: random(height),
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 1.5 + random(2),
    alpha: 0.5 + random(0.5)
  };
}

const InteractiveCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotsRef = useRef<any[]>([]);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    function setSize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    setSize();
    window.addEventListener("resize", setSize);

    dotsRef.current = Array.from({ length: DOTS }, () =>
      makeDot(canvas.width, canvas.height)
    );

    const handleMouse = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouse);
    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 };
    };
    window.addEventListener("mouseout", handleMouseLeave);

    function animate() {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      for (const dot of dotsRef.current) {
        // --- Repulsion: redirect velocity direction only, maintain speed
        const dx = dot.x - mouseRef.current.x;
        const dy = dot.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.sqrt(dot.vx * dot.vx + dot.vy * dot.vy);

        if (dist < MOUSE_REPEL_RADIUS && dist > 0) {
          // Set velocity to same speed, but directed away from mouse
          dot.vx = (dx / dist) * speed;
          dot.vy = (dy / dist) * speed;
        }

        // Move based on velocity
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Wall bounces
        if (dot.x < dot.size) {
          dot.x = dot.size;
          dot.vx *= -1;
        }
        if (dot.x > width - dot.size) {
          dot.x = width - dot.size;
          dot.vx *= -1;
        }
        if (dot.y < dot.size) {
          dot.y = dot.size;
          dot.vy *= -1;
        }
        if (dot.y > height - dot.size) {
          dot.y = height - dot.size;
          dot.vy *= -1;
        }

        // Draw the ball
        ctx.globalAlpha = dot.alpha;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.size, 0, 2 * Math.PI);
        ctx.fillStyle = "#fff";
        ctx.shadowColor = "#fff";
        ctx.shadowBlur = dot.size * 2;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }
    animate();

    return () => {
      window.removeEventListener("resize", setSize);
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("mouseout", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: -10,
        display: "block",
        background: "#000"
      }}
      tabIndex={-1}
    />
  );
};

export default InteractiveCanvasBackground;
