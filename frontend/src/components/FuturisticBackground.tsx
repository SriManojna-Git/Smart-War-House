import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

interface FuturisticBackgroundProps {
  variant?: 'app' | 'login' | 'dashboard';
}

const FuturisticBackground: React.FC<FuturisticBackgroundProps> = ({ variant = 'app' }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef<{ x: number; y: number; targetX: number; targetY: number }>({
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
  });

  const isDark = theme === 'dark';
  const currentPath = location.pathname;

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.targetY = (e.clientY / window.innerHeight - 0.5) * 2;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = width < 768;

    // =========================================================================
    // 1. ENTERPRISE WAREHOUSE TOPOLOGY (CAD Blueprint Waypoints)
    // =========================================================================
    const getWaypoints = () => {
      return [
        { id: 'inbound', x: width * 0.12, y: height * 0.22, name: 'DOCK-INBOUND [01]', type: 'hub' },
        { id: 'zone_a', x: width * 0.30, y: height * 0.26, name: 'ZONE A (STORAGE BAY)', type: 'rack' },
        { id: 'zone_b', x: width * 0.50, y: height * 0.28, name: 'ZONE B (HIGH-VELOCITY)', type: 'rack' },
        { id: 'zone_c', x: width * 0.74, y: height * 0.30, name: 'ZONE C (AUTOMATED HIGH-BAY)', type: 'rack' },
        { id: 'aisle_main', x: width * 0.52, y: height * 0.50, name: 'CENTRAL AGV ARTERY', type: 'corridor' },
        { id: 'zone_d', x: width * 0.26, y: height * 0.74, name: 'ZONE D (PACKING & QC)', type: 'station' },
        { id: 'zone_e', x: width * 0.66, y: height * 0.76, name: 'ZONE E (STAGING & SORT)', type: 'station' },
        { id: 'outbound', x: width * 0.88, y: height * 0.80, name: 'DISPATCH FREIGHT DOCK [04]', type: 'hub' },
        { id: 'ai_core', x: width * 0.50, y: height * 0.40, name: 'AI ORCHESTRATION HUB', type: 'ai' },
      ];
    };

    let waypoints = getWaypoints();

    const routes = [
      ['inbound', 'zone_a', 'aisle_main', 'zone_d', 'outbound'],
      ['zone_a', 'zone_b', 'ai_core', 'zone_e', 'outbound'],
      ['zone_c', 'zone_b', 'aisle_main', 'zone_d', 'zone_e'],
      ['inbound', 'ai_core', 'zone_c', 'zone_e', 'outbound'],
    ];

    // =========================================================================
    // 2. RESTRAINED LOGISTICS DATA STREAMS (Calm, slow, enterprise pacing)
    // =========================================================================
    const particleCount = isMobile ? 6 : (variant === 'login' ? 14 : 10);
    const particles: Array<{
      routeIndex: number;
      segmentIndex: number;
      t: number;
      speed: number;
      size: number;
      color: string;
      trail: Array<{ x: number; y: number }>;
    }> = [];

    const streamColors = isDark 
      ? ['#6366f1', '#38bdf8', '#06b6d4', '#818cf8'] 
      : ['#4f46e5', '#0284c7', '#0891b2', '#6366f1'];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        routeIndex: Math.floor(Math.random() * routes.length),
        segmentIndex: 0,
        t: Math.random(),
        speed: 0.0008 + Math.random() * 0.0012, // Very slow, calm cadence
        size: 1.6,
        color: streamColors[i % streamColors.length],
        trail: [],
      });
    }

    // =========================================================================
    // 3. SUBTLE AI TELEMETRY NODES
    // =========================================================================
    const nodeCount = isMobile ? 8 : (variant === 'login' ? 20 : 14);
    const nodes: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
    }> = [];

    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.08, // Subtle drift
        vy: (Math.random() - 0.5) * 0.08,
        radius: 1.2,
      });
    }

    let tick = 0;

    // =========================================================================
    // RENDER LOOP (Fortune-500 Enterprise Visual Standards)
    // =========================================================================
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      tick += 0.006;

      // Extremely subtle, dampened parallax (±6px max)
      mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.03;
      mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.03;

      const parallaxX = mouseRef.current.x * (isMobile ? 0 : 6);
      const parallaxY = mouseRef.current.y * (isMobile ? 0 : 4);

      ctx.save();
      ctx.translate(parallaxX, parallaxY);

      waypoints = getWaypoints();

      // --- 1. ABSTRACT WAREHOUSE RACKS & ARCHITECTURAL SILHOUETTES ---
      const rackFill = isDark ? 'rgba(255, 255, 255, 0.012)' : 'rgba(15, 23, 42, 0.015)';
      const rackBorder = isDark ? 'rgba(99, 102, 241, 0.07)' : 'rgba(79, 70, 229, 0.05)';

      const drawRackBay = (rx: number, ry: number, rw: number, rh: number, label: string) => {
        ctx.fillStyle = rackFill;
        ctx.strokeStyle = rackBorder;
        ctx.lineWidth = 0.7;

        ctx.beginPath();
        ctx.roundRect(rx, ry, rw, rh, 3);
        ctx.fill();
        ctx.stroke();

        // Subtle internal division lines
        const divisions = 3;
        for (let d = 1; d < divisions; d++) {
          const slatY = ry + (rh / divisions) * d;
          ctx.beginPath();
          ctx.setLineDash([2, 4]);
          ctx.moveTo(rx + 4, slatY);
          ctx.lineTo(rx + rw - 4, slatY);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        // Faint technical CAD label
        ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.22)' : 'rgba(100, 116, 139, 0.22)';
        ctx.font = '8px "SF Mono", "Fira Code", monospace';
        ctx.fillText(label, rx + 4, ry + rh + 10);
      };

      // Subtle Rack Layout Silhouettes
      drawRackBay(width * 0.18, height * 0.20, width * 0.11, height * 0.10, 'BAY A-01..08');
      drawRackBay(width * 0.40, height * 0.22, width * 0.12, height * 0.11, 'BAY B-01..12 [HIGH-PICK]');
      drawRackBay(width * 0.65, height * 0.24, width * 0.13, height * 0.11, 'BAY C-01..16 [AUTO-RACK]');
      drawRackBay(width * 0.20, height * 0.68, width * 0.14, height * 0.10, 'CELL D-PK [SORT & QC]');
      drawRackBay(width * 0.60, height * 0.70, width * 0.15, height * 0.10, 'CELL E-STG [DISPATCH]');

      // --- 2. THIN LOGISTICS ROUTE GUIDEWAYS ---
      routes.forEach((route) => {
        ctx.beginPath();
        ctx.strokeStyle = isDark ? 'rgba(99, 102, 241, 0.05)' : 'rgba(79, 70, 229, 0.035)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 6]);

        for (let i = 0; i < route.length; i++) {
          const wp = waypoints.find((w) => w.id === route[i]);
          if (!wp) continue;
          if (i === 0) ctx.moveTo(wp.x, wp.y);
          else ctx.lineTo(wp.x, wp.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // --- 3. RESTRAINED LOGISTICS DATA STREAMS ---
      if (!prefersReducedMotion) {
        particles.forEach((p) => {
          const currentRoute = routes[p.routeIndex];
          const startId = currentRoute[p.segmentIndex];
          const endId = currentRoute[(p.segmentIndex + 1) % currentRoute.length];

          const startWp = waypoints.find((w) => w.id === startId);
          const endWp = waypoints.find((w) => w.id === endId);

          if (startWp && endWp) {
            p.t += p.speed;
            if (p.t >= 1) {
              p.t = 0;
              p.segmentIndex++;
              if (p.segmentIndex >= currentRoute.length - 1) {
                p.segmentIndex = 0;
                p.routeIndex = Math.floor(Math.random() * routes.length);
              }
            }

            const currentX = startWp.x + (endWp.x - startWp.x) * p.t;
            const currentY = startWp.y + (endWp.y - startWp.y) * p.t;

            // Trail
            p.trail.unshift({ x: currentX, y: currentY });
            if (p.trail.length > 5) p.trail.pop();

            for (let tr = 0; tr < p.trail.length; tr++) {
              const alpha = (1 - tr / p.trail.length) * (isDark ? 0.20 : 0.12);
              ctx.beginPath();
              ctx.arc(p.trail[tr].x, p.trail[tr].y, p.size * (1 - tr / (p.trail.length * 2)), 0, Math.PI * 2);
              ctx.fillStyle = p.color;
              ctx.globalAlpha = alpha;
              ctx.fill();
              ctx.globalAlpha = 1;
            }

            // Head node
            ctx.beginPath();
            ctx.arc(currentX, currentY, p.size, 0, Math.PI * 2);
            ctx.fillStyle = isDark ? '#ffffff' : p.color;
            ctx.globalAlpha = isDark ? 0.7 : 0.5;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        });
      }

      // --- 4. SUBTLE CONNECTED DATA NODES ---
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = 120;

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (isDark ? 0.04 : 0.025);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = isDark ? `rgba(99, 102, 241, ${alpha})` : `rgba(79, 70, 229, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      nodes.forEach((node) => {
        if (!prefersReducedMotion) {
          node.x += node.vx;
          node.y += node.vy;
          if (node.x < 0 || node.x > width) node.vx *= -1;
          if (node.y < 0 || node.y > height) node.vy *= -1;
        }

        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(100, 116, 139, 0.2)';
        ctx.fill();
      });

      // --- 5. WAYPOINT NODES & SUBTLE PULSES ---
      waypoints.forEach((wp) => {
        const isCore = wp.id === 'ai_core';
        const pulse = Math.sin(tick * 1.5 + wp.x) * 0.5 + 0.5;

        // Faint concentric calibration ring
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, isCore ? 12 + pulse * 4 : 7 + pulse * 2, 0, Math.PI * 2);
        ctx.strokeStyle = isCore
          ? (isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(2, 132, 199, 0.12)')
          : (isDark ? 'rgba(99, 102, 241, 0.08)' : 'rgba(79, 70, 229, 0.06)');
        ctx.lineWidth = 0.6;
        ctx.stroke();

        // Node center
        ctx.beginPath();
        ctx.arc(wp.x, wp.y, isCore ? 3 : 1.8, 0, Math.PI * 2);
        ctx.fillStyle = isCore
          ? (isDark ? '#38bdf8' : '#0284c7')
          : (isDark ? '#818cf8' : '#6366f1');
        ctx.fill();

        // Waypoint identifier
        ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.30)' : 'rgba(71, 85, 105, 0.30)';
        ctx.font = '7.5px "SF Mono", "Fira Code", monospace';
        ctx.fillText(wp.name, wp.x + 6, wp.y - 4);
      });

      // --- 6. SUBTLE CAD HUD COORDINATES (Outer Perimeter) ---
      ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(100, 116, 139, 0.16)';
      ctx.font = '7.5px "SF Mono", "Fira Code", monospace';
      ctx.fillText(`SYSTEM: ENTERPRISE_WMS_V4 [${currentPath.toUpperCase()}]`, 24, height - 28);
      ctx.fillText(`FACILITY_COORDS: 37.77°N, 122.41°W | THROUGHPUT: NOMINAL`, 24, height - 16);

      ctx.fillText(`STATUS: OPTIMAL`, width - 120, 24);
      ctx.fillText(`GRID_SCALE: 1:50M`, width - 120, 34);

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isDark, variant, currentPath]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 1. DEEP CHARCOAL / NAVY FOUNDATION GRADIENT */}
      <div 
        className={`absolute inset-0 transition-colors duration-700 ${
          isDark 
            ? 'bg-gradient-to-br from-[#060911] via-[#090e1a] to-[#070b14]' 
            : 'bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#edf2f7]'
        }`} 
      />

      {/* 2. RESTRAINED ATMOSPHERIC LIGHTING (Top & Corners) */}
      {/* Top-Left Blue Ambient Shadows */}
      <div 
        className={`absolute top-[-12%] left-[-6%] w-[45vw] h-[45vw] rounded-full blur-[150px] pointer-events-none transition-opacity duration-700 ${
          isDark ? 'bg-indigo-600/[0.06]' : 'bg-indigo-400/[0.04]'
        }`} 
      />
      {/* Top-Right Soft Cyan Highlight */}
      <div 
        className={`absolute top-[-8%] right-[-6%] w-[40vw] h-[40vw] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isDark ? 'bg-cyan-500/[0.045]' : 'bg-cyan-400/[0.03]'
        }`} 
      />
      {/* Bottom-Right Soft Violet Secondary Light */}
      <div 
        className={`absolute bottom-[-10%] right-[-4%] w-[38vw] h-[38vw] rounded-full blur-[140px] pointer-events-none transition-opacity duration-700 ${
          isDark ? 'bg-purple-600/[0.035]' : 'bg-purple-400/[0.025]'
        }`} 
      />

      {/* 3. DIGITAL WAREHOUSE FLOOR GRID */}
      <div 
        className="absolute inset-0 opacity-[0.025] dark:opacity-[0.04] transition-opacity duration-700"
        style={{
          backgroundImage: isDark
            ? `linear-gradient(to right, rgba(255, 255, 255, 0.35) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(255, 255, 255, 0.35) 1px, transparent 1px)`
            : `linear-gradient(to right, rgba(0, 0, 0, 0.35) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(0, 0, 0, 0.35) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
          maskImage: 'radial-gradient(ellipse at 50% 40%, black 40%, transparent 88%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, black 40%, transparent 88%)',
        }}
      />

      {/* 4. DIGITAL TWIN CANVAS (Racks, Guideways, Streams, Nodes) */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90" />

      {/* 5. VIGNETTE CONTRAST MASK (Guarantees Content Readability) */}
      <div 
        className="absolute inset-0"
        style={{
          background: isDark
            ? 'radial-gradient(ellipse at 50% 35%, transparent 30%, rgba(6, 9, 17, 0.6) 80%, rgba(6, 9, 17, 0.92) 100%)'
            : 'radial-gradient(ellipse at 50% 35%, transparent 35%, rgba(241, 245, 249, 0.5) 80%, rgba(241, 245, 249, 0.88) 100%)',
        }}
      />
    </div>
  );
};

export default FuturisticBackground;
