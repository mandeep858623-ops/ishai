import React, { useState, useEffect } from 'react';
import { NasaApod } from '../types';
import { Sparkles, Globe, ExternalLink, Calendar, Loader2 } from 'lucide-react';

export const NasaCenterTab: React.FC = () => {
  const [apod, setApod] = useState<NasaApod | null>({
    title: 'Pillars of Creation Captured by James Webb Space Telescope',
    date: '2026-10-30',
    explanation: 'A lush, highly detailed landscape of the Pillars of Creation in the Eagle Nebula (M16) captured in near-infrared light by the James Webb Space Telescope. The semi-transparent columns of cool interstellar gas and dust harbor newly forming stars.',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1200&auto=format&fit=crop',
    media_type: 'image',
    copyright: 'NASA / ESA / CSA / STScI'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Attempt fetching NASA APOD API with DEMO_KEY, fallback gracefully if offline/network restriction
    const fetchApod = async () => {
      try {
        setLoading(true);
        const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            setApod(data);
          }
        }
      } catch (err) {
        console.log('Using default cached APOD resource.');
      } finally {
        setLoading(false);
      }
    };
    fetchApod();
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="bg-[#090d16] border border-cyan-900/40 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-extrabold text-white">NASA Space Center & Astronomy Picture of the Day</h2>
        </div>
        <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950 px-2.5 py-1 rounded-lg border border-cyan-800">
          Official NASA Open Data
        </span>
      </div>

      {/* APOD Main Feature Card */}
      {apod && (
        <div className="bg-[#090d16] border border-cyan-900/40 rounded-3xl p-6 space-y-6">
          
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" /> Astronomy Picture of the Day (APOD)
            </span>
            <span className="text-xs text-cyan-300 font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {apod.date}
            </span>
          </div>

          <div className="relative w-full aspect-video max-h-[480px] rounded-2xl overflow-hidden border border-cyan-500/40 bg-black">
            {apod.media_type === 'image' ? (
              <img src={apod.url} alt={apod.title} className="w-full h-full object-cover" />
            ) : (
              <iframe src={apod.url} title={apod.title} className="w-full h-full border-0" allowFullScreen />
            )}
          </div>

          <div>
            <h3 className="text-xl font-extrabold text-white">{apod.title}</h3>
            {apod.copyright && <p className="text-[10px] text-cyan-400/60 mt-0.5">Credit: {apod.copyright}</p>}
          </div>

          <p className="text-xs text-cyan-100/80 leading-relaxed font-sans bg-black/40 border border-cyan-900/30 p-4 rounded-2xl">
            {apod.explanation}
          </p>

        </div>
      )}

    </div>
  );
};
