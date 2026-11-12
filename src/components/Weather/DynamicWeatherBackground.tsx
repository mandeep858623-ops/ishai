import React, { useEffect, useRef } from 'react';
import { WeatherConditionCategory } from './types';

interface DynamicWeatherBackgroundProps {
  condition: WeatherConditionCategory;
  isDay: boolean;
  theme: 'dark' | 'light';
}

export const DynamicWeatherBackground: React.FC<DynamicWeatherBackgroundProps> = ({
  condition,
  isDay,
  theme
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle state
    interface Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      length?: number;
      angle?: number;
    }

    const particles: Particle[] = [];
    let count = 60;
    if (condition === 'rain' || condition === 'thunderstorm') count = 120;
    else if (condition === 'snow') count = 90;
    else if (condition === 'fog' || condition === 'haze') count = 40;
    else if (condition === 'windy') count = 50;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: Math.random() * 0.5 + 0.2,
        opacity: Math.random() * 0.5 + 0.2,
        length: Math.random() * 18 + 10,
        angle: (Math.random() - 0.5) * 0.2
      });
    }

    let lightningTimer = 0;
    let isFlashing = false;
    let flashOpacity = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Thunderstorm lightning logic
      if (condition === 'thunderstorm') {
        lightningTimer++;
        if (lightningTimer > 180 + Math.random() * 240) {
          isFlashing = true;
          flashOpacity = 0.85;
          lightningTimer = 0;
        }

        if (isFlashing) {
          ctx.fillStyle = `rgba(255, 255, 255, ${flashOpacity})`;
          ctx.fillRect(0, 0, width, height);
          flashOpacity -= 0.08;
          if (flashOpacity <= 0) {
            isFlashing = false;
          }
        }
      }

      // Draw weather particles
      particles.forEach((p) => {
        ctx.save();

        if (condition === 'rain' || condition === 'thunderstorm') {
          // Rain streaks
          ctx.strokeStyle = `rgba(147, 197, 253, ${p.opacity * (theme === 'dark' ? 0.7 : 0.5)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + (p.length || 15));
          ctx.stroke();

          p.y += 14 + p.size * 2;
          p.x -= 1.8;
          if (p.y > height) {
            p.y = -10;
            p.x = Math.random() * (width + 50);
          }
        } else if (condition === 'snow') {
          // Snowflakes
          ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * (theme === 'dark' ? 0.85 : 0.65)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();

          p.y += p.speedY * 1.5 + 0.8;
          p.x += Math.sin(p.y * 0.02) * 1.2;
          if (p.y > height) {
            p.y = -5;
            p.x = Math.random() * width;
          }
        } else if (condition === 'fog' || condition === 'haze') {
          // Floating mist particles
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 24);
          const col = condition === 'haze' ? '217, 119, 6' : '148, 163, 184';
          grad.addColorStop(0, `rgba(${col}, ${p.opacity * 0.25})`);
          grad.addColorStop(1, `rgba(${col}, 0)`);

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 24, 0, Math.PI * 2);
          ctx.fill();

          p.x += (Math.random() - 0.48) * 0.6;
          p.y += (Math.random() - 0.5) * 0.2;
          if (p.x > width + 50) p.x = -50;
          if (p.x < -50) p.x = width + 50;
        } else if (condition === 'windy') {
          // Wind streaks
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.opacity * 0.4})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + (p.length || 30), p.y + Math.sin(p.x * 0.05) * 2);
          ctx.stroke();

          p.x += 16 + p.size * 2;
          if (p.x > width) {
            p.x = -50;
            p.y = Math.random() * height;
          }
        } else if (condition === 'sunny') {
          // Subtle warm dust motes in sunbeams
          ctx.fillStyle = `rgba(253, 224, 71, ${p.opacity * (theme === 'dark' ? 0.35 : 0.25)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.8, 0, Math.PI * 2);
          ctx.fill();

          p.y -= 0.3;
          p.x += Math.sin(p.y * 0.01) * 0.4;
          if (p.y < 0) {
            p.y = height + 5;
            p.x = Math.random() * width;
          }
        } else {
          // Partly cloudy / cloudy drifting particles
          ctx.fillStyle = `rgba(148, 163, 184, ${p.opacity * 0.15})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx.fill();

          p.x += 0.4;
          if (p.x > width) p.x = 0;
        }

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [condition, isDay, theme]);

  // CSS Gradients depending on condition, day/night, and theme
  const getAtmosphereGradient = () => {
    if (theme === 'dark') {
      switch (condition) {
        case 'sunny':
          return isDay
            ? 'from-sky-950/70 via-[#0a1120]/80 to-[#07090e]'
            : 'from-indigo-950/70 via-slate-950/80 to-[#07090e]';
        case 'partly-cloudy':
          return isDay
            ? 'from-cyan-950/60 via-slate-950/80 to-[#07090e]'
            : 'from-blue-950/60 via-zinc-950/80 to-[#07090e]';
        case 'cloudy':
          return 'from-slate-900/80 via-zinc-950/80 to-[#07090e]';
        case 'rain':
          return 'from-blue-950/80 via-slate-950/85 to-[#07090e]';
        case 'thunderstorm':
          return 'from-violet-950/90 via-slate-950/90 to-[#07090e]';
        case 'snow':
          return 'from-blue-950/60 via-slate-900/70 to-[#07090e]';
        case 'fog':
          return 'from-zinc-900/80 via-stone-950/80 to-[#07090e]';
        case 'haze':
          return 'from-amber-950/60 via-stone-950/80 to-[#07090e]';
        case 'windy':
          return 'from-teal-950/60 via-slate-950/80 to-[#07090e]';
      }
    } else {
      switch (condition) {
        case 'sunny':
          return 'from-amber-100/70 via-sky-50 to-slate-100';
        case 'partly-cloudy':
          return 'from-sky-100/70 via-blue-50/50 to-slate-100';
        case 'cloudy':
          return 'from-slate-200/70 via-zinc-100 to-slate-100';
        case 'rain':
          return 'from-blue-100/70 via-sky-100/50 to-slate-150';
        case 'thunderstorm':
          return 'from-indigo-200/70 via-purple-100/40 to-slate-200';
        case 'snow':
          return 'from-blue-50 via-slate-100 to-white';
        case 'fog':
          return 'from-zinc-200/60 via-slate-100 to-slate-100';
        case 'haze':
          return 'from-amber-100/60 via-yellow-50 to-slate-100';
        case 'windy':
          return 'from-teal-100/60 via-cyan-50 to-slate-100';
      }
    }
  };

  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden transition-all duration-700 bg-gradient-to-b ${getAtmosphereGradient()}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />
      
      {/* Decorative ambient sun/cloud light gradients */}
      {condition === 'sunny' && isDay && (
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-gradient-to-br from-amber-400/20 via-yellow-500/10 to-transparent blur-3xl animate-pulse" />
      )}
      {condition === 'thunderstorm' && (
        <div className="absolute top-0 inset-x-0 h-72 bg-gradient-to-b from-violet-600/15 via-indigo-900/10 to-transparent blur-2xl" />
      )}
      {condition === 'rain' && (
        <div className="absolute bottom-0 inset-x-0 h-48 bg-gradient-to-t from-cyan-500/10 to-transparent blur-xl" />
      )}
    </div>
  );
};
