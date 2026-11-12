import { TimelineClip, CanvasSettings, SubtitleSegment } from '../types/videoEditor';

/**
 * Format seconds into MM:SS.ms timecode
 */
export function formatTimecode(seconds: number): string {
  const safeSec = Math.max(0, seconds || 0);
  const mins = Math.floor(safeSec / 60);
  const secs = Math.floor(safeSec % 60);
  const ms = Math.floor((safeSec % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * Format seconds into MM:SS
 */
export function formatTimeShort(seconds: number): string {
  const safeSec = Math.max(0, seconds || 0);
  const mins = Math.floor(safeSec / 60);
  const secs = Math.floor(safeSec % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Builds CSS filter string for canvas 2D context
 */
export function buildCanvasFilter(filter: TimelineClip['filter']): string {
  const parts: string[] = [];
  if (filter.brightness !== 100) parts.push(`brightness(${filter.brightness}%)`);
  if (filter.contrast !== 100) parts.push(`contrast(${filter.contrast}%)`);
  if (filter.saturation !== 100) parts.push(`saturate(${filter.saturation}%)`);
  if (filter.grayscale > 0) parts.push(`grayscale(${filter.grayscale}%)`);
  if (filter.sepia > 0) parts.push(`sepia(${filter.sepia}%)`);
  if (filter.blur > 0) parts.push(`blur(${filter.blur}px)`);
  if (filter.invert > 0) parts.push(`invert(${filter.invert}%)`);
  return parts.length > 0 ? parts.join(' ') : 'none';
}

/**
 * Renders a single frame of the timeline onto the destination 2D canvas context.
 */
export function renderCompositeFrame(
  ctx: CanvasRenderingContext2D,
  targetWidth: number,
  targetHeight: number,
  canvasSettings: CanvasSettings,
  clips: TimelineClip[],
  playheadTime: number,
  videoElementsMap: Map<string, HTMLVideoElement>,
  imageElementsMap: Map<string, HTMLImageElement>,
  options?: { showSafeZoneGuides?: boolean }
) {
  // 1. Clear Canvas
  ctx.clearRect(0, 0, targetWidth, targetHeight);

  // 2. Base Background
  ctx.fillStyle = canvasSettings.backgroundColor || '#000000';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Find active video / image clips at playhead
  const activeVisualClips = clips
    .filter(
      (c) =>
        (c.type === 'video' || c.type === 'image') &&
        playheadTime >= c.timelineStart &&
        playheadTime < c.timelineStart + c.duration
    )
    .sort((a, b) => a.layer - b.layer);

  // Background Blur Fill (if canvas aspect ratio doesn't match and blur mode is enabled)
  if (canvasSettings.backgroundMode === 'blur' && activeVisualClips.length > 0) {
    const mainClip = activeVisualClips[0];
    const videoEl = videoElementsMap.get(mainClip.sourceUrl);
    if (videoEl && videoEl.readyState >= 2) {
      ctx.save();
      ctx.filter = 'blur(30px) brightness(60%)';
      // Fill canvas fully
      ctx.drawImage(videoEl, -20, -20, targetWidth + 40, targetHeight + 40);
      ctx.restore();
    }
  }

  // 3. Render Visual Clips (Video & Image layers)
  for (const clip of activeVisualClips) {
    ctx.save();

    // Calculate transition opacity (e.g. fade in/out)
    let opacity = clip.opacity ?? 1;
    const clipLocalTime = playheadTime - clip.timelineStart;

    if (clip.transition?.type === 'fade-black') {
      const transDur = clip.transition.duration || 0.6;
      if (clipLocalTime < transDur) {
        opacity *= clipLocalTime / transDur;
      } else if (clipLocalTime > clip.duration - transDur) {
        opacity *= (clip.duration - clipLocalTime) / transDur;
      }
    }
    ctx.globalAlpha = Math.max(0, Math.min(1, opacity));

    // Apply Filter
    ctx.filter = buildCanvasFilter(clip.filter);

    if (clip.type === 'video') {
      const videoEl = videoElementsMap.get(clip.sourceUrl);
      if (videoEl && videoEl.readyState >= 2) {
        const vW = videoEl.videoWidth || targetWidth;
        const vH = videoEl.videoHeight || targetHeight;

        // Calculate aspect fit inside targetWidth x targetHeight
        const scale = Math.min(targetWidth / vW, targetHeight / vH) * (clip.transform?.scale || 1);
        const drawW = vW * scale;
        const drawH = vH * scale;
        const drawX = (targetWidth - drawW) / 2 + (clip.transform?.x || 0);
        const drawY = (targetHeight - drawH) / 2 + (clip.transform?.y || 0);

        if (clip.transform?.rotation) {
          ctx.translate(targetWidth / 2, targetHeight / 2);
          ctx.rotate((clip.transform.rotation * Math.PI) / 180);
          ctx.drawImage(videoEl, -drawW / 2, -drawH / 2, drawW, drawH);
        } else {
          ctx.drawImage(videoEl, drawX, drawY, drawW, drawH);
        }
      }
    } else if (clip.type === 'image') {
      const imgEl = imageElementsMap.get(clip.sourceUrl);
      if (imgEl && imgEl.complete) {
        const iW = imgEl.naturalWidth || targetWidth;
        const iH = imgEl.naturalHeight || targetHeight;
        const scale = Math.min(targetWidth / iW, targetHeight / iH) * (clip.transform?.scale || 1);
        const drawW = iW * scale;
        const drawH = iH * scale;
        const drawX = (targetWidth - drawW) / 2 + (clip.transform?.x || 0);
        const drawY = (targetHeight - drawH) / 2 + (clip.transform?.y || 0);

        ctx.drawImage(imgEl, drawX, drawY, drawW, drawH);
      }
    }

    ctx.restore();
  }

  // 4. Render Text Overlay Clips
  const activeTextClips = clips.filter(
    (c) =>
      c.type === 'text' &&
      playheadTime >= c.timelineStart &&
      playheadTime < c.timelineStart + c.duration
  );

  for (const clip of activeTextClips) {
    if (!clip.textData || !clip.textData.text) continue;
    const td = clip.textData;
    const clipLocalTime = playheadTime - clip.timelineStart;

    ctx.save();

    // Scale font size proportionally to 720p base
    const baseScale = targetHeight / 720;
    const fontSize = Math.max(14, td.fontSize * baseScale);
    const fontStyle = td.fontStyle === 'italic' ? 'italic ' : '';
    const fontWeight = td.fontWeight === '900' ? '900 ' : td.fontWeight === 'bold' ? 'bold ' : 'normal ';
    ctx.font = `${fontStyle}${fontWeight}${fontSize}px "${td.fontFamily || 'Inter', 'sans-serif'}"`;
    ctx.textAlign = td.alignment || 'center';
    ctx.textBaseline = 'middle';

    // Position
    const posX = (td.posX / 100) * targetWidth;
    let posY = (td.posY / 100) * targetHeight;

    // Animation calculation
    let animAlpha = clip.opacity ?? 1;
    if (td.animation === 'fade') {
      if (clipLocalTime < 0.4) animAlpha *= clipLocalTime / 0.4;
      else if (clipLocalTime > clip.duration - 0.4) animAlpha *= (clip.duration - clipLocalTime) / 0.4;
    } else if (td.animation === 'slide-up') {
      const enter = Math.min(1, clipLocalTime / 0.35);
      posY += (1 - enter) * 40;
      animAlpha *= enter;
    } else if (td.animation === 'pop') {
      const enter = Math.min(1, clipLocalTime / 0.25);
      const popScale = enter < 0.7 ? 0.7 + (enter / 0.7) * 0.4 : 1.1 - (enter - 0.7) * 0.33;
      ctx.translate(posX, posY);
      ctx.scale(popScale, popScale);
      ctx.translate(-posX, -posY);
    }

    ctx.globalAlpha = Math.max(0, Math.min(1, animAlpha));

    // Handle Typewriter Text Slice
    let displayText = td.text;
    if (td.animation === 'typewriter') {
      const revealProgress = Math.min(1, clipLocalTime / Math.max(0.6, clip.duration * 0.7));
      const charCount = Math.floor(td.text.length * revealProgress);
      displayText = td.text.slice(0, charCount);
    }

    const metrics = ctx.measureText(displayText);
    const textWidth = metrics.width;
    const textHeight = fontSize * 1.2;

    // Draw Background Box if configured
    if (td.backgroundColor && td.backgroundColor !== 'transparent') {
      const pad = (td.backgroundPadding || 8) * baseScale;
      ctx.fillStyle = td.backgroundColor;
      let boxX = posX - pad;
      if (td.alignment === 'center') boxX = posX - textWidth / 2 - pad;
      else if (td.alignment === 'right') boxX = posX - textWidth - pad;

      ctx.beginPath();
      ctx.roundRect(boxX, posY - textHeight / 2 - pad, textWidth + pad * 2, textHeight + pad * 2, 6);
      ctx.fill();
    }

    // Shadow
    if (td.shadowColor && td.shadowColor !== 'transparent') {
      ctx.shadowColor = td.shadowColor;
      ctx.shadowBlur = (td.shadowBlur || 4) * baseScale;
      ctx.shadowOffsetX = 2 * baseScale;
      ctx.shadowOffsetY = 2 * baseScale;
    }

    // Outline / Stroke
    if (td.outlineColor && td.outlineWidth > 0) {
      ctx.strokeStyle = td.outlineColor;
      ctx.lineWidth = td.outlineWidth * baseScale * 2;
      ctx.strokeText(displayText, posX, posY);
    }

    // Fill Text
    ctx.fillStyle = td.color || '#ffffff';
    ctx.fillText(displayText, posX, posY);

    ctx.restore();
  }

  // 5. Render Captions / Subtitles Clips
  const activeCaptionClips = clips.filter(
    (c) =>
      c.type === 'caption' &&
      playheadTime >= c.timelineStart &&
      playheadTime < c.timelineStart + c.duration
  );

  for (const clip of activeCaptionClips) {
    if (!clip.captionData || !clip.captionData.text) continue;
    const cd = clip.captionData;

    ctx.save();

    const baseScale = targetHeight / 720;
    const fontSize = Math.max(16, (cd.fontSize || 34) * baseScale);
    const posY = (cd.positionY / 100) * targetHeight;
    const posX = targetWidth / 2;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const words = cd.text.split(' ');
    const textStr = cd.text.toUpperCase();

    if (cd.stylePreset === 'bold-creator') {
      // MrBeast / Creator Punchy Yellow/Cyan with thick black stroke
      ctx.font = `900 ${fontSize}px "Impact", "Montserrat", "Arial Black", sans-serif`;

      // Thick drop shadow + stroke
      ctx.shadowColor = 'rgba(0,0,0,0.9)';
      ctx.shadowBlur = 8 * baseScale;
      ctx.shadowOffsetX = 3 * baseScale;
      ctx.shadowOffsetY = 4 * baseScale;

      ctx.strokeStyle = cd.outlineColor || '#000000';
      ctx.lineWidth = 8 * baseScale;
      ctx.strokeText(textStr, posX, posY);

      ctx.fillStyle = cd.highlightColor || '#FFE600'; // Vibrant Neon Yellow
      ctx.fillText(textStr, posX, posY);
    } else if (cd.stylePreset === 'karaoke-glow') {
      // Radiant Cyber Glow with highlighted segment
      ctx.font = `800 ${fontSize}px "Inter", "Segoe UI", sans-serif`;
      ctx.shadowColor = '#10B981';
      ctx.shadowBlur = 15 * baseScale;

      ctx.strokeStyle = '#022c22';
      ctx.lineWidth = 6 * baseScale;
      ctx.strokeText(textStr, posX, posY);

      ctx.fillStyle = '#34D399';
      ctx.fillText(textStr, posX, posY);
    } else if (cd.stylePreset === 'high-contrast') {
      // High contrast solid dark pill
      ctx.font = `700 ${fontSize * 0.9}px "Inter", sans-serif`;
      const m = ctx.measureText(textStr);
      const padX = 14 * baseScale;
      const padY = 8 * baseScale;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
      ctx.beginPath();
      ctx.roundRect(posX - m.width / 2 - padX, posY - fontSize / 2 - padY, m.width + padX * 2, fontSize + padY * 2, 6);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(textStr, posX, posY);
    } else if (cd.stylePreset === 'cinematic') {
      // Elegant Serif Subtitles
      ctx.font = `italic 600 ${fontSize * 0.85}px "Georgia", serif`;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6 * baseScale;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3 * baseScale;
      ctx.strokeText(cd.text, posX, posY);
      ctx.fillStyle = '#F3F4F6';
      ctx.fillText(cd.text, posX, posY);
    } else {
      // Minimal Clean White
      ctx.font = `700 ${fontSize * 0.9}px "Inter", sans-serif`;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4 * baseScale;
      ctx.strokeText(cd.text, posX, posY);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(cd.text, posX, posY);
    }

    ctx.restore();
  }

  // 6. Safe Area Guides (Optional visual assist for 9:16 Shorts/Reels/TikTok)
  if (options?.showSafeZoneGuides && canvasSettings.aspectRatio === '9:16') {
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);

    // Top Header & Bottom Navigation Safe Zone
    const topMargin = targetHeight * 0.12;
    const bottomMargin = targetHeight * 0.18;
    const rightMargin = targetWidth * 0.18;

    // Top safe line
    ctx.beginPath();
    ctx.moveTo(0, topMargin);
    ctx.lineTo(targetWidth, topMargin);
    ctx.stroke();

    // Bottom safe line
    ctx.beginPath();
    ctx.moveTo(0, targetHeight - bottomMargin);
    ctx.lineTo(targetWidth, targetHeight - bottomMargin);
    ctx.stroke();

    // Right icon rail safe line
    ctx.beginPath();
    ctx.moveTo(targetWidth - rightMargin, topMargin);
    ctx.lineTo(targetWidth - rightMargin, targetHeight - bottomMargin);
    ctx.stroke();

    ctx.fillStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.font = '10px monospace';
    ctx.fillText('⚡ SHORTS/REELS SAFE ZONE', 10, topMargin - 8);
    ctx.restore();
  }
}

/**
 * Generate SRT subtitle string from caption clips
 */
export function exportToSRT(captionClips: TimelineClip[]): string {
  const sorted = [...captionClips]
    .filter((c) => c.type === 'caption' && c.captionData?.text)
    .sort((a, b) => a.timelineStart - b.timelineStart);

  const formatSRTTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  };

  return sorted
    .map((c, idx) => {
      const start = formatSRTTime(c.timelineStart);
      const end = formatSRTTime(c.timelineStart + c.duration);
      return `${idx + 1}\n${start} --> ${end}\n${c.captionData?.text || ''}\n`;
    })
    .join('\n');
}

/**
 * Parse an uploaded SRT subtitle file into SubtitleSegment objects
 */
export function parseSRT(srtContent: string): SubtitleSegment[] {
  const segments: SubtitleSegment[] = [];
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  const parseTime = (timeStr: string): number => {
    const parts = timeStr.trim().split(/[:,]/);
    if (parts.length >= 4) {
      const h = parseFloat(parts[0]);
      const m = parseFloat(parts[1]);
      const s = parseFloat(parts[2]);
      const ms = parseFloat(parts[3]) / 1000;
      return h * 3600 + m * 60 + s + ms;
    }
    return 0;
  };

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      const timeLineIndex = lines[0].includes('-->') ? 0 : 1;
      if (lines[timeLineIndex] && lines[timeLineIndex].includes('-->')) {
        const [startStr, endStr] = lines[timeLineIndex].split('-->');
        const text = lines.slice(timeLineIndex + 1).join(' ').trim();
        if (text) {
          segments.push({
            id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            start: parseTime(startStr),
            end: parseTime(endStr),
            text,
          });
        }
      }
    }
  }

  return segments;
}
