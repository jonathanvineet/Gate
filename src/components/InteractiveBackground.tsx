import React, { useRef, useEffect } from "react";

const InteractiveCanvasBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // DPI-aware sizing
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  // Offscreen nebula canvas for deep space dust (pre-rendered)
  let nebulaCanvas: HTMLCanvasElement | null = null;
  let nebulaCtx: CanvasRenderingContext2D | null = null;

  // Sparse bright stars for twinkle
  type GiantStar = { x: number; y: number; r: number; hue: number; sat: number; light: number; phase: number; speed: number; baseA: number };
  let giants: GiantStar[] = [];
    function setSize() {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    setSize();
    window.addEventListener("resize", setSize);

    // Minimal parallax for depth
    let mouseX = 0, mouseY = 0;
    let targetMX = 0, targetMY = 0;
    const onMove = (e: MouseEvent) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      targetMX = (e.clientX - w / 2) / (w / 2); // -1..1
      targetMY = (e.clientY - h / 2) / (h / 2);
    };
    window.addEventListener("mousemove", onMove);

    // Reduced motion support
    let reduceMotion = false;
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onMotionChange = () => { reduceMotion = mql.matches; };
    onMotionChange();
    mql.addEventListener('change', onMotionChange);

    // 3D starfield
    type Star = {
      x: number; // -1..1
      y: number; // -1..1
      z: number; // 0..1 depth (smaller is closer)
      speed: number;
      hue: number;
      sat: number;
      light: number;
    };

  let stars: Star[] = [];
  function resetStar(s: Star, spawnFar = false) {
      // spawn near the outer ring to avoid clustering in center
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.sqrt(Math.random()); // more at edge
      s.x = Math.cos(angle) * radius * (Math.random() < 0.7 ? 1 : 0.4);
      s.y = Math.sin(angle) * radius * (Math.random() < 0.7 ? 1 : 0.4);
      s.z = spawnFar ? Math.random() * 0.9 + 0.1 : 1; // far then fly in
  s.speed = 0.26 + Math.random() * 0.56; // slightly faster for forward feel
      const palette = [200, 215, 265, 275, 300];
      const hue = palette[Math.floor(Math.random() * palette.length)];
      const colored = Math.random() < 0.7;
  s.hue = hue;
  s.sat = colored ? 55 + Math.random() * 25 : 0;
  // slightly lower lightness so black reads more dominant
  s.light = colored ? 68 + Math.random() * 16 : 88;
    }

    function initStars() {
      const area = window.innerWidth * window.innerHeight;
      const count = Math.max(70, Math.min(200, Math.floor(area / 18000))); // fewer for performance
      stars = new Array(count).fill(0).map(() => {
        const s: Star = { x: 0, y: 0, z: 1, speed: 0.5, hue: 260, sat: 60, light: 80 };
        resetStar(s, true);
        return s;
      });
    }
    initStars();
    window.addEventListener("resize", initStars);

    // Deep space: pre-render a soft nebula/dust layer to an offscreen canvas
    function renderNebula() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      nebulaCanvas = document.createElement('canvas');
      nebulaCtx = nebulaCanvas.getContext('2d');
      if (!nebulaCtx) return;
      // Render at lower resolution for performance then scale up
      const scale = 0.6;
      nebulaCanvas.width = Math.max(1, Math.floor(w * scale));
      nebulaCanvas.height = Math.max(1, Math.floor(h * scale));
      const nctx = nebulaCtx;
      nctx.setTransform(1, 0, 0, 1, 0, 0);
      nctx.clearRect(0, 0, nebulaCanvas.width, nebulaCanvas.height);

      // Base very dark background
      nctx.fillStyle = '#000';
      nctx.fillRect(0, 0, nebulaCanvas.width, nebulaCanvas.height);

      // Soft diagonal band to hint at a galaxy arm
      nctx.save();
      nctx.globalCompositeOperation = 'lighter';
      const band = nctx.createLinearGradient(0, 0, nebulaCanvas.width, nebulaCanvas.height);
      band.addColorStop(0.2, 'rgba(124, 58, 237, 0.05)'); // violet
      band.addColorStop(0.5, 'rgba(34, 211, 238, 0.06)'); // cyan
      band.addColorStop(0.8, 'rgba(96, 165, 250, 0.05)'); // sky
      nctx.fillStyle = band;
      nctx.fillRect(0, 0, nebulaCanvas.width, nebulaCanvas.height);
      nctx.restore();

      // Nebula blobs
      const blobs = Math.floor(60 + (w * h) / 120000); // scale with area
      for (let i = 0; i < blobs; i++) {
        const cx = (Math.random() * 1.2 - 0.1) * nebulaCanvas.width;
        const cy = (Math.random() * 1.2 - 0.1) * nebulaCanvas.height;
        const maxR = Math.max(nebulaCanvas.width, nebulaCanvas.height) * (0.08 + Math.random() * 0.18);
        const g = nctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
        const palette = [
          [124, 58, 237, 0.05],  // violet
          [34, 211, 238, 0.05],  // cyan
          [96, 165, 250, 0.05],  // sky
        ];
        const c = palette[Math.floor(Math.random() * palette.length)];
        g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${c[3]})`);
        g.addColorStop(0.6, `rgba(${c[0]},${c[1]},${c[2]},${c[3] * 0.6})`);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        nctx.fillStyle = g;
        nctx.beginPath();
        nctx.arc(cx, cy, maxR, 0, Math.PI * 2);
        nctx.fill();
      }

      // Sparse dust speckles
      const speckles = Math.floor(200 + (w * h) / 8000);
      nctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < speckles; i++) {
        const x = Math.random() * nebulaCanvas.width;
        const y = Math.random() * nebulaCanvas.height;
        nctx.fillRect(x, y, 1, 1);
      }
    }

    function initGiants() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const count = Math.max(12, Math.min(28, Math.floor((w * h) / 70000)));
      giants = new Array(count).fill(0).map(() => {
        const huePalette = [200, 215, 265, 275, 300];
        const hue = huePalette[Math.floor(Math.random() * huePalette.length)];
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.8 + Math.random() * 1.8,
          hue,
          sat: 60 + Math.random() * 20,
          light: 78 + Math.random() * 10,
          phase: Math.random() * Math.PI * 2,
          speed: 0.4 + Math.random() * 0.5,
          baseA: 0.22 + Math.random() * 0.18,
        } as GiantStar;
      });
    }

    const onResizeDeep = () => {
      renderNebula();
      initGiants();
    };
    onResizeDeep();
    window.addEventListener('resize', onResizeDeep);

    let raf = 0;
    let last = performance.now();
    function draw(now: number) {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      // ease parallax
      mouseX += (targetMX - mouseX) * 0.06;
      mouseY += (targetMY - mouseY) * 0.06;

      const w = window.innerWidth;
      const h = window.innerHeight;
      const cx = w / 2;
      const cy = h / 2;
      const scale = Math.min(w, h) * 0.6; // perspective scale

      // matte black base
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, w, h);

      // deep space nebula/dust layer (pre-rendered)
      if (nebulaCanvas) {
        ctx.save();
        ctx.globalAlpha = 0.06; // very subtle
        // scale up the offscreen render to fit
        ctx.drawImage(nebulaCanvas, 0, 0, nebulaCanvas.width, nebulaCanvas.height, 0, 0, w, h);
        ctx.restore();
      }

      // sparse twinkling giants
      if (giants.length) {
        for (let i = 0; i < giants.length; i++) {
          const g = giants[i];
          const tw = reduceMotion ? g.baseA : g.baseA * (0.8 + 0.2 * Math.sin(now * 0.001 * g.speed + g.phase));
          const grad = ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r * 4);
          grad.addColorStop(0, `hsla(${g.hue}, ${g.sat}%, ${g.light}%, ${tw})`);
          grad.addColorStop(0.5, `hsla(${g.hue}, ${g.sat}%, ${Math.max(60, g.light - 12)}%, ${tw * 0.6})`);
          grad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(g.x, g.y, g.r * 3.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // draw stars with perspective and motion trails
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];

        // advance
        if (!reduceMotion) {
          // deterministic advancement to avoid per-frame randomness cost
          s.z -= s.speed * dt * 0.5;
        }

        // project
  const px = (s.x + mouseX * 0.08 * (1 - s.z)) / Math.max(0.08, s.z);
  const py = (s.y + mouseY * 0.08 * (1 - s.z)) / Math.max(0.08, s.z);
        const sx = cx + px * scale;
        const sy = cy + py * scale;

        // off-screen or passed viewer (reset a bit earlier to not "hit" the screen)
  if (s.z <= 0.12 || sx < -50 || sx > w + 50 || sy < -50 || sy > h + 50) {
          resetStar(s, true);
          continue;
        }

        // star size and alpha increase as it comes closer (slightly toned down)
        const r = Math.max(0.40, (1 / s.z) * 0.44);
        const alpha = Math.min(1, 0.07 + (1 - s.z) * 0.58);

        // simplified rendering based on depth for performance
        if (s.z > 0.6) {
          // far stars: simple point, no trail/gradient
          ctx.fillStyle = `hsla(${s.hue}, ${s.sat}%, ${Math.max(55, s.light - 16)}%, ${alpha * 0.35})`;
          ctx.fillRect(sx, sy, 1, 1);
        } else if (s.z > 0.3) {
          // mid stars: tiny solid dot
          ctx.fillStyle = `hsla(${s.hue}, ${s.sat}%, ${Math.max(58, s.light - 14)}%, ${alpha * 0.45})`;
          ctx.beginPath();
          ctx.arc(sx, sy, Math.min(1.4, r * 0.6), 0, Math.PI * 2);
          ctx.fill();
        } else {
          // near stars: trail + soft glow
          const prevZ = Math.min(1, s.z + 0.02 + s.speed * 0.008);
          const ppx = (s.x + mouseX * 0.08 * (1 - prevZ)) / Math.max(0.08, prevZ);
          const ppy = (s.y + mouseY * 0.08 * (1 - prevZ)) / Math.max(0.08, prevZ);
          const psx = cx + ppx * scale;
          const psy = cy + ppy * scale;

          ctx.strokeStyle = `hsla(${s.hue}, ${s.sat}%, ${Math.max(60, s.light - 10)}%, ${alpha * 0.32})`;
          ctx.lineWidth = Math.min(1.2, r * 0.42);
          ctx.beginPath();
          ctx.moveTo(psx, psy);
          ctx.lineTo(sx, sy);
          ctx.stroke();

          const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 3);
          g.addColorStop(0, `hsla(${s.hue}, ${s.sat}%, ${s.light}%, ${alpha})`);
          g.addColorStop(0.6, `hsla(${s.hue}, ${s.sat}%, ${Math.max(55, s.light - 12)}%, ${alpha * 0.45})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(sx, sy, r * 2.1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // vignette
      const vignette = ctx.createRadialGradient(
        w * 0.5, h * 0.5, Math.min(w, h) * 0.2,
        w * 0.5, h * 0.5, Math.max(w, h) * 0.9
      );
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(1, "rgba(0,0,0,0.6)");
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", setSize);
      window.removeEventListener("resize", initStars);
      window.removeEventListener("mousemove", onMove);
  mql.removeEventListener('change', onMotionChange);
  window.removeEventListener('resize', onResizeDeep);
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
  background: "#000000",
  pointerEvents: "none"
      }}
      tabIndex={-1}
    />
  );
};

export default InteractiveCanvasBackground;
