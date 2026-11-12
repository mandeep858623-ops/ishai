/**
 * Real Web Audio Multi-Track Music Synthesizer & Waveform Renderer
 * Produces real, original polyphonic music directly in-memory and renders
 * uncompressed 16-bit PCM WAV audio blobs for playback and download.
 */

export interface SongComposition {
  title: string;
  genre: string;
  mood: string;
  tempoBpm: number;
  musicalKey: string;
  scale?: 'major' | 'minor' | 'pentatonic';
  chordProgression: string[];
  suggestedInstruments?: string[];
  vocalStyle?: string;
  audioPrompt?: string;
  sections: Array<{
    name: string;
    type: string;
    chords?: string;
    lines: string[];
  }>;
  fullLyrics?: string;
}

// Frequencies for standard musical notes
const NOTE_FREQS: Record<string, number> = {
  'C2': 65.41, 'C#2': 69.30, 'D2': 73.42, 'D#2': 77.78, 'E2': 82.41, 'F2': 87.31, 'F#2': 92.50, 'G2': 98.00, 'G#2': 103.83, 'A2': 110.00, 'A#2': 116.54, 'B2': 123.47,
  'C3': 130.81, 'C#3': 138.59, 'D3': 146.83, 'D#3': 155.56, 'E3': 164.81, 'F3': 174.61, 'F#3': 185.00, 'G3': 196.00, 'G#3': 207.65, 'A3': 220.00, 'A#3': 233.08, 'B3': 246.94,
  'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13, 'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00, 'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
  'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25, 'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99, 'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
};

// Chord note map (root + intervals)
const CHORD_NOTES: Record<string, string[]> = {
  'C': ['C3', 'E3', 'G3'],
  'Cmaj': ['C3', 'E3', 'G3'],
  'Cm': ['C3', 'D#3', 'G3'],
  'D': ['D3', 'F#3', 'A3'],
  'Dm': ['D3', 'F3', 'A3'],
  'E': ['E3', 'G#3', 'B3'],
  'Em': ['E3', 'G3', 'B3'],
  'F': ['F3', 'A3', 'C4'],
  'Fm': ['F3', 'G#3', 'C4'],
  'G': ['G3', 'B3', 'D4'],
  'Gm': ['G3', 'A#3', 'D4'],
  'A': ['A3', 'C#4', 'E4'],
  'Am': ['A3', 'C4', 'E4'],
  'B': ['B3', 'D#4', 'F#4'],
  'Bm': ['B3', 'D4', 'F#4'],
  'Bb': ['A#3', 'D4', 'F4'],
  'Eb': ['D#3', 'G3', 'A#3'],
  'Ab': ['G#3', 'C4', 'D#4'],
  'Db': ['C#3', 'F3', 'G#3'],
};

// Root bass note for each chord
const BASS_ROOT: Record<string, string> = {
  'C': 'C2', 'Cmaj': 'C2', 'Cm': 'C2',
  'D': 'D2', 'Dm': 'D2',
  'E': 'E2', 'Em': 'E2',
  'F': 'F2', 'Fm': 'F2',
  'G': 'G2', 'Gm': 'G2',
  'A': 'A2', 'Am': 'A2',
  'B': 'B2', 'Bm': 'B2',
  'Bb': 'A#2', 'Eb': 'D#2', 'Ab': 'G#2', 'Db': 'C#2',
};

/**
 * Encodes an AudioBuffer to a valid 16-bit stereo PCM WAV blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  
  const length = buffer.length;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // Write WAV header
  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, format, true); // AudioFormat
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
  view.setUint16(32, blockAlign, true); // BlockAlign
  view.setUint16(34, bitDepth, true); // BitsPerSample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true); // SubChunk2Size

  // Write interleaved PCM samples
  const channelData: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channelData.push(buffer.getChannelData(c));
  }

  let offset = 44;
  for (let i = 0; i < length; i++) {
    for (let c = 0; c < numChannels; c++) {
      let sample = channelData[c][i];
      // Clamp between -1.0 and 1.0
      sample = Math.max(-1, Math.min(1, sample));
      // Scale to 16-bit integer
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Synthesizes a real multi-track music piece using OfflineAudioContext.
 * Returns an AudioBuffer and a downloadable WAV Blob.
 */
export async function synthesizeSongAudio(
  comp: SongComposition,
  durationSeconds: number = 32,
  vocalAudioBuffer?: AudioBuffer | null
): Promise<{ buffer: AudioBuffer; wavBlob: Blob; audioUrl: string; duration: number }> {
  const sampleRate = 44100;
  const bpm = Math.max(60, Math.min(180, comp.tempoBpm || 115));
  const beatSec = 60 / bpm;
  const barSec = beatSec * 4;
  
  // Total bars to render
  const totalBars = Math.max(4, Math.ceil(durationSeconds / barSec));
  const totalDuration = totalBars * barSec;
  const totalSamples = Math.ceil(totalDuration * sampleRate);

  const ctx = new OfflineAudioContext(2, totalSamples, sampleRate);

  // Master bus with limiter compressor to prevent distortion
  const masterCompressor = ctx.createDynamicsCompressor();
  masterCompressor.threshold.setValueAtTime(-2.0, 0);
  masterCompressor.knee.setValueAtTime(10, 0);
  masterCompressor.ratio.setValueAtTime(8, 0);
  masterCompressor.attack.setValueAtTime(0.003, 0);
  masterCompressor.release.setValueAtTime(0.25, 0);
  masterCompressor.connect(ctx.destination);

  // Master Gain
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.85, 0);
  // Gentle fade out at the very end
  masterGain.gain.setValueAtTime(0.85, totalDuration - 2.5);
  masterGain.gain.linearRampToValueAtTime(0.001, totalDuration);
  masterGain.connect(masterCompressor);

  // Reverb simulation bus (simple filtered delay network)
  const reverbSend = ctx.createGain();
  reverbSend.gain.value = 0.22;
  const delayNode = ctx.createDelay();
  delayNode.delayTime.value = 0.28;
  const delayFeedback = ctx.createGain();
  delayFeedback.gain.value = 0.35;
  const delayFilter = ctx.createBiquadFilter();
  delayFilter.type = 'lowpass';
  delayFilter.frequency.value = 2400;

  reverbSend.connect(delayNode);
  delayNode.connect(delayFilter);
  delayFilter.connect(delayFeedback);
  delayFeedback.connect(delayNode);
  delayFilter.connect(masterGain);

  // Extract or generate chord progression
  let chords = comp.chordProgression && comp.chordProgression.length > 0
    ? comp.chordProgression
    : ['C', 'G', 'Am', 'F'];

  // Normalize chords
  chords = chords.map((c) => {
    const clean = c.replace(/[^a-zA-Z#b]/g, '').trim();
    return CHORD_NOTES[clean] ? clean : (clean.toLowerCase().includes('m') ? 'Am' : 'C');
  });
  if (chords.length === 0) chords = ['C', 'G', 'Am', 'F'];

  const genre = (comp.genre || 'pop').toLowerCase();

  // 1. INSTRUMENT: SYNTH CHORD PADS / KEYS
  const padGain = ctx.createGain();
  padGain.gain.value = 0.45;
  padGain.connect(masterGain);
  padGain.connect(reverbSend);

  for (let bar = 0; bar < totalBars; bar++) {
    const chordIndex = bar % chords.length;
    const chordName = chords[chordIndex];
    const notes = CHORD_NOTES[chordName] || ['C3', 'E3', 'G3'];
    const barStart = bar * barSec;

    notes.forEach((noteStr, idx) => {
      const freq = NOTE_FREQS[noteStr] || 261.63;
      
      const osc = ctx.createOscillator();
      // Wave type based on genre
      if (genre.includes('rock')) {
        osc.type = 'sawtooth';
      } else if (genre.includes('lo-fi') || genre.includes('romantic')) {
        osc.type = 'sine';
      } else if (genre.includes('edm')) {
        osc.type = 'sawtooth';
      } else {
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
      }
      osc.frequency.setValueAtTime(freq, barStart);

      // Filter for warmth
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      const cutoff = genre.includes('edm') ? 3500 : (genre.includes('lo-fi') ? 1200 : 2200);
      filter.frequency.setValueAtTime(cutoff, barStart);

      const noteGain = ctx.createGain();
      const chordDuration = barSec;
      noteGain.gain.setValueAtTime(0.0001, barStart);
      noteGain.gain.linearRampToValueAtTime(0.18, barStart + 0.12);
      noteGain.gain.setValueAtTime(0.15, barStart + chordDuration - 0.2);
      noteGain.gain.linearRampToValueAtTime(0.0001, barStart + chordDuration);

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(padGain);

      osc.start(barStart);
      osc.stop(barStart + chordDuration);
    });
  }

  // 2. INSTRUMENT: BASSLINE (Sub bass + punch)
  const bassGain = ctx.createGain();
  bassGain.gain.value = 0.65;
  bassGain.connect(masterGain);

  for (let bar = 0; bar < totalBars; bar++) {
    const chordIndex = bar % chords.length;
    const chordName = chords[chordIndex];
    const rootStr = BASS_ROOT[chordName] || 'C2';
    const rootFreq = NOTE_FREQS[rootStr] || 65.41;
    const barStart = bar * barSec;

    // Pattern based on genre
    const bassHits = genre.includes('edm')
      ? [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5] // Driving 8th notes
      : (genre.includes('rap') || genre.includes('hip-hop'))
      ? [0, 1.5, 2.0, 3.0] // 808 syncopated
      : [0, 1.0, 2.0, 3.0]; // Standard 4-on-beat

    bassHits.forEach((hitBeat) => {
      const hitTime = barStart + hitBeat * beatSec;
      if (hitTime >= totalDuration) return;

      const osc = ctx.createOscillator();
      osc.type = genre.includes('rap') || genre.includes('hip-hop') ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(rootFreq, hitTime);

      const bEnv = ctx.createGain();
      const dur = beatSec * 0.85;
      bEnv.gain.setValueAtTime(0.001, hitTime);
      bEnv.gain.linearRampToValueAtTime(0.35, hitTime + 0.02);
      bEnv.gain.exponentialRampToValueAtTime(0.0001, hitTime + dur);

      osc.connect(bEnv);
      bEnv.connect(bassGain);

      osc.start(hitTime);
      osc.stop(hitTime + dur);
    });
  }

  // 3. INSTRUMENT: DRUMS & PERCUSSION (Kick, Snare, Hi-Hat)
  if (!genre.includes('classical') && !genre.includes('devotional')) {
    const drumGain = ctx.createGain();
    drumGain.gain.value = 0.75;
    drumGain.connect(masterGain);

    for (let bar = 0; bar < totalBars; bar++) {
      const barStart = bar * barSec;

      // KICK DRUM
      const kickBeats = genre.includes('edm')
        ? [0, 1, 2, 3] // Four on the floor
        : (genre.includes('rap') || genre.includes('hip-hop'))
        ? [0, 1.75, 2.5]
        : [0, 2]; // Pop/Rock standard

      kickBeats.forEach((b) => {
        const t = barStart + b * beatSec;
        if (t >= totalDuration) return;

        const osc = ctx.createOscillator();
        const env = ctx.createGain();
        osc.frequency.setValueAtTime(140, t);
        osc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

        env.gain.setValueAtTime(0.8, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        osc.connect(env);
        env.connect(drumGain);
        osc.start(t);
        osc.stop(t + 0.25);
      });

      // SNARE / CLAP
      const snareBeats = [1, 3]; // Beats 2 and 4 (0-indexed 1 and 3)
      snareBeats.forEach((b) => {
        const t = barStart + b * beatSec;
        if (t >= totalDuration) return;

        // Noise snare
        const bufferSize = ctx.sampleRate * 0.15;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(1000, t);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.4, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

        whiteNoise.connect(filter);
        filter.connect(env);
        env.connect(drumGain);
        whiteNoise.start(t);
        whiteNoise.stop(t + 0.16);

        // Body tone
        const osc = ctx.createOscillator();
        const bEnv = ctx.createGain();
        osc.frequency.setValueAtTime(180, t);
        bEnv.gain.setValueAtTime(0.3, t);
        bEnv.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

        osc.connect(bEnv);
        bEnv.connect(drumGain);
        osc.start(t);
        osc.stop(t + 0.1);
      });

      // HI-HATS
      const hatSteps = genre.includes('rap') || genre.includes('hip-hop') ? 8 : 4;
      for (let s = 0; s < hatSteps; s++) {
        const t = barStart + (s / hatSteps) * barSec;
        if (t >= totalDuration) break;

        const bufferSize = ctx.sampleRate * 0.04;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6000, t);

        const env = ctx.createGain();
        const vol = s % 2 === 0 ? 0.15 : 0.08;
        env.gain.setValueAtTime(vol, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        whiteNoise.connect(filter);
        filter.connect(env);
        env.connect(drumGain);
        whiteNoise.start(t);
        whiteNoise.stop(t + 0.04);
      }
    }
  }

  // 4. INSTRUMENT: MELODIC ARPEGGIO / LEAD HOOK
  const leadGain = ctx.createGain();
  leadGain.gain.value = 0.38;
  leadGain.connect(masterGain);
  leadGain.connect(reverbSend);

  // Notes scale for melodic hooks
  const scaleNotes = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];
  for (let bar = 0; bar < totalBars; bar++) {
    const barStart = bar * barSec;
    // 8th-note melodic sequence
    for (let step = 0; step < 8; step++) {
      const t = barStart + step * (beatSec / 2);
      if (t >= totalDuration) break;

      // Musical seed from bar and step
      const noteIdx = (bar * 3 + step * 2) % scaleNotes.length;
      const noteStr = scaleNotes[noteIdx];
      const freq = NOTE_FREQS[noteStr] || 392.0;

      const osc = ctx.createOscillator();
      osc.type = genre.includes('edm') ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      const env = ctx.createGain();
      env.gain.setValueAtTime(0.001, t);
      env.gain.linearRampToValueAtTime(0.12, t + 0.015);
      env.gain.exponentialRampToValueAtTime(0.0001, t + beatSec * 0.45);

      osc.connect(env);
      env.connect(leadGain);
      osc.start(t);
      osc.stop(t + beatSec * 0.5);
    }
  }

  // 5. VOCAL TRACK MIX-IN (If synthesized vocal audio buffer was provided)
  if (vocalAudioBuffer) {
    const vocalGain = ctx.createGain();
    vocalGain.gain.value = 0.95;
    vocalGain.connect(masterGain);
    vocalGain.connect(reverbSend);

    const vocalSource = ctx.createBufferSource();
    vocalSource.buffer = vocalAudioBuffer;
    // Delay slightly to let the beat establish (e.g. 1 bar intro)
    const vocalStart = Math.min(barSec, totalDuration * 0.1);
    vocalSource.connect(vocalGain);
    vocalSource.start(vocalStart);
  }

  // Render audio into buffer
  const renderedBuffer = await ctx.startRendering();
  const wavBlob = audioBufferToWav(renderedBuffer);
  const audioUrl = URL.createObjectURL(wavBlob);

  return {
    buffer: renderedBuffer,
    wavBlob,
    audioUrl,
    duration: totalDuration,
  };
}
