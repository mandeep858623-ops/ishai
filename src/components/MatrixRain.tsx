import React, { useEffect, useRef } from 'react';

interface MatrixRainProps {
  onClose?: () => void;
  isBackground?: boolean;
}

export const MatrixRain: React.FC<MatrixRainProps> = ({ onClose, isBackground = false }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = isBackground ? window.innerWidth : 800);
    let height = (canvas.height = isBackground ? window.innerHeight : 500);

    const handleResize = () => {
      if (isBackground && canvas) {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }
    };

    window.addEventListener('resize', handleResize);

    const letters = '0123456789ABCDEFｦｱｳｴｵｶｷｹｺｻｼｽｾｿﾀﾂﾃﾅﾆﾇﾈﾊﾋﾎﾏﾐﾑﾒﾓﾔﾕﾗﾘﾜ';
    const fontSize = 16;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = Array.from({ length: columns }, () => Math.floor(Math.random() * -50));

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#00FF41';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = letters.charAt(Math.floor(Math.random() * letters.length));
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Bright tip
        if (Math.random() > 0.9) {
          ctx.fillStyle = '#C8FFC8';
        } else {
          ctx.fillStyle = '#00FF41';
        }

        ctx.fillText(text, x, y);

        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [isBackground]);

  if (isBackground) {
    return (
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none opacity-20 z-0"
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-black border border-emerald-500/80 shadow-[0_0_30px_rgba(16,185,129,0.3)] rounded-lg p-4 max-w-4xl w-full flex flex-col items-center">
        <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-emerald-500/40">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h3 className="font-mono text-emerald-400 font-bold text-sm tracking-widest uppercase">
              // MATRIX_RAIN PIPELINE VISUALIZATION
            </h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-emerald-400 hover:text-black hover:bg-emerald-400 border border-emerald-500 px-3 py-1 font-mono text-xs rounded transition-colors"
            >
              [ TERMINATE VIEW ]
            </button>
          )}
        </div>
        <div className="w-full overflow-hidden border border-emerald-900 rounded bg-black">
          <canvas ref={canvasRef} className="w-full h-[450px] block" />
        </div>
        <div className="w-full flex items-center justify-between mt-3 text-xs font-mono text-emerald-500/80">
          <span>Active Streams: 50+</span>
          <span>Matrix Encryption: 4096-bit</span>
          <span>Buffer: Uncapped</span>
        </div>
      </div>
    </div>
  );
};
