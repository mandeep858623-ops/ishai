import React from 'react';
import { WeatherConditionCategory } from './types';

interface WeatherIllustrationProps {
  condition: WeatherConditionCategory;
  isDay: boolean;
  className?: string;
}

export const WeatherIllustration: React.FC<WeatherIllustrationProps> = ({
  condition,
  isDay,
  className = 'w-32 h-32 md:w-44 md:h-44'
}) => {
  switch (condition) {
    case 'sunny':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl animate-pulse" />
          {/* Sun Rays */}
          <svg className="w-full h-full animate-[spin_20s_linear_infinite]" viewBox="0 0 100 100" fill="none">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
              <line
                key={i}
                x1="50"
                y1="12"
                x2="50"
                y2="20"
                stroke="url(#sunRayGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                transform={`rotate(${angle} 50 50)`}
              />
            ))}
            <defs>
              <linearGradient id="sunRayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
            </defs>
          </svg>
          {/* Central Sphere */}
          <div className="absolute w-1/2 h-1/2 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-200 shadow-lg shadow-amber-500/40 border border-amber-200/50" />
        </div>
      );

    case 'partly-cloudy':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          {/* Peeking Sun */}
          <div className="absolute top-2 right-4 w-14 h-14 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 shadow-md shadow-amber-500/30 animate-pulse" />
          {/* Drifting Cloud */}
          <svg className="w-full h-full drop-shadow-xl animate-[bounce_6s_ease-in-out_infinite]" viewBox="0 0 120 100" fill="none">
            <path
              d="M30 65 A 16 16 0 0 1 45 42 A 22 22 0 0 1 82 40 A 18 18 0 0 1 98 55 A 16 16 0 0 1 90 75 L 34 75 A 12 12 0 0 1 30 65 Z"
              fill="url(#partlyCloudGrad)"
            />
            <defs>
              <linearGradient id="partlyCloudGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#cbd5e1" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case 'cloudy':
      return (
        <div className={`relative flex items-center justify-center ${className}`}>
          {/* Back darker cloud */}
          <svg className="absolute -top-1 left-2 w-4/5 h-4/5 opacity-70" viewBox="0 0 120 100" fill="none">
            <path
              d="M30 60 A 16 16 0 0 1 45 38 A 22 22 0 0 1 82 36 A 18 18 0 0 1 98 50 A 16 16 0 0 1 90 70 L 34 70 A 12 12 0 0 1 30 60 Z"
              fill="#64748b"
            />
          </svg>
          {/* Front cloud */}
          <svg className="w-full h-full drop-shadow-2xl animate-[pulse_4s_ease-in-out_infinite]" viewBox="0 0 120 100" fill="none">
            <path
              d="M25 65 A 18 18 0 0 1 42 40 A 24 24 0 0 1 84 38 A 20 20 0 0 1 102 55 A 18 18 0 0 1 92 78 L 30 78 A 14 14 0 0 1 25 65 Z"
              fill="url(#cloudyGrad)"
            />
            <defs>
              <linearGradient id="cloudyGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      );

    case 'rain':
      return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
          {/* Rain Cloud */}
          <svg className="w-full h-3/4 drop-shadow-lg" viewBox="0 0 120 80" fill="none">
            <path
              d="M25 50 A 16 16 0 0 1 42 28 A 22 22 0 0 1 82 26 A 18 18 0 0 1 100 42 A 16 16 0 0 1 90 62 L 30 62 A 12 12 0 0 1 25 50 Z"
              fill="url(#rainCloudGrad)"
            />
            <defs>
              <linearGradient id="rainCloudGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="100%" stopColor="#64748b" />
              </linearGradient>
            </defs>
          </svg>
          {/* Animated Rain Streaks */}
          <div className="flex gap-3 -mt-2">
            {[1, 2, 3, 4].map((drop) => (
              <div
                key={drop}
                className="w-1 h-5 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500 animate-[bounce_1s_infinite]"
                style={{ animationDelay: `${drop * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      );

    case 'thunderstorm':
      return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
          {/* Dark Storm Cloud */}
          <svg className="w-full h-3/4 drop-shadow-2xl" viewBox="0 0 120 80" fill="none">
            <path
              d="M25 50 A 16 16 0 0 1 42 28 A 22 22 0 0 1 82 26 A 18 18 0 0 1 100 42 A 16 16 0 0 1 90 62 L 30 62 A 12 12 0 0 1 25 50 Z"
              fill="url(#stormCloudGrad)"
            />
            <defs>
              <linearGradient id="stormCloudGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
            </defs>
          </svg>
          {/* Lightning Bolt */}
          <svg className="w-10 h-10 -mt-3 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)] animate-pulse" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
      );

    case 'snow':
      return (
        <div className={`relative flex flex-col items-center justify-center ${className}`}>
          {/* Snow Cloud */}
          <svg className="w-full h-3/4 drop-shadow-lg" viewBox="0 0 120 80" fill="none">
            <path
              d="M25 50 A 16 16 0 0 1 42 28 A 22 22 0 0 1 82 26 A 18 18 0 0 1 100 42 A 16 16 0 0 1 90 62 L 30 62 A 12 12 0 0 1 25 50 Z"
              fill="url(#snowCloudGrad)"
            />
            <defs>
              <linearGradient id="snowCloudGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
          </svg>
          {/* Falling Snow Crystals */}
          <div className="flex gap-3 text-sm -mt-2">
            {['❄️', '❅', '❄️'].map((flake, idx) => (
              <span
                key={idx}
                className="animate-[pulse_1.5s_infinite] text-sky-200"
                style={{ animationDelay: `${idx * 0.3}s` }}
              >
                {flake}
              </span>
            ))}
          </div>
        </div>
      );

    case 'fog':
    case 'haze':
      return (
        <div className={`relative flex flex-col items-center justify-center gap-2 ${className}`}>
          {/* Soft Sun in Background */}
          <div className={`w-14 h-14 rounded-full opacity-60 blur-xs ${condition === 'haze' ? 'bg-amber-400' : 'bg-slate-300'}`} />
          {/* Layered Horizontal Mist Bars */}
          <div className="w-4/5 h-2 rounded-full bg-slate-400/60 blur-xs animate-[pulse_3s_infinite]" />
          <div className="w-full h-2.5 rounded-full bg-slate-300/50 blur-xs -mt-1" />
          <div className="w-3/5 h-2 rounded-full bg-slate-400/70 blur-xs -mt-1" />
        </div>
      );

    case 'windy':
    default:
      return (
        <div className={`relative flex flex-col items-center justify-center gap-2 ${className}`}>
          <svg className="w-full h-full drop-shadow-md" viewBox="0 0 100 100" fill="none" stroke="currentColor">
            <path
              d="M10 35 C 30 35, 60 30, 75 35 C 85 38, 88 50, 78 52 C 68 53, 65 42, 70 38"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-cyan-400 animate-[pulse_2s_infinite]"
            />
            <path
              d="M15 55 C 35 55, 65 52, 80 55 C 90 57, 92 68, 82 70 C 72 71, 70 60, 75 58"
              strokeWidth="4"
              strokeLinecap="round"
              className="text-sky-300"
            />
            <path
              d="M20 75 C 40 75, 55 72, 65 75"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="text-blue-400"
            />
          </svg>
        </div>
      );
  }
};
