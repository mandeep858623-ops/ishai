import pptxgen from 'pptxgenjs';
import { jsPDF } from 'jspdf';
import { SlideData, PPTTheme } from './types';
import { THEME_CONFIGS } from './themeConfig';

/**
 * 1. REAL EDITABLE MICROSOFT POWERPOINT (.PPTX) STUDIO EXPORTER
 * Exports every slide as genuine, native editable PowerPoint objects
 * (text boxes, shapes, images, containers, and speaker notes).
 */
export async function exportStudioPresentationToPptx(params: {
  title: string;
  slides: SlideData[];
  theme: PPTTheme;
  author?: string;
}): Promise<Blob> {
  const { title, slides, theme, author = 'SUPERAI PowerPoint Studio' } = params;
  const colors = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;

  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9'; // 10 x 5.625 inches
  pptx.title = title;
  pptx.author = author;
  pptx.company = 'SUPERAI';

  // Iterate over each slide
  for (let idx = 0; idx < slides.length; idx++) {
    const slideData = slides[idx];
    const pptxSlide = pptx.addSlide();

    // 1. Set background color
    const slideBg = slideData.bgColor
      ? slideData.bgColor.replace('#', '')
      : colors.hexBg;
    pptxSlide.background = { color: slideBg };

    // 2. If the slide has custom interactive elements, export them directly
    if (slideData.elements && slideData.elements.length > 0) {
      // Sort elements by zIndex so background shapes come first
      const sortedElements = [...slideData.elements].sort(
        (a, b) => (a.zIndex || 1) - (b.zIndex || 1)
      );

      for (const el of sortedElements) {
        // Convert canvas percentage (0-100) to PowerPoint 16:9 inches (10 x 5.625)
        const xInches = (el.x / 100) * 10.0;
        const yInches = (el.y / 100) * 5.625;
        const wInches = Math.max(0.1, (el.w / 100) * 10.0);
        const hInches = Math.max(0.1, (el.h / 100) * 5.625);

        if (el.type === 'shape') {
          let shapeType = pptx.ShapeType.roundRect;
          if (el.shapeType === 'rect') shapeType = pptx.ShapeType.rect;
          else if (el.shapeType === 'circle') shapeType = pptx.ShapeType.ellipse;
          else if (el.shapeType === 'line') shapeType = pptx.ShapeType.rect;

          const fillColor = el.fillColor
            ? el.fillColor.replace('#', '')
            : colors.hexCardBg;
          const borderColor = el.borderColor
            ? el.borderColor.replace('#', '')
            : colors.hexAccent;

          pptxSlide.addShape(shapeType, {
            x: xInches,
            y: yInches,
            w: wInches,
            h: hInches,
            fill: { color: fillColor },
            line: el.borderWidth ? { color: borderColor, width: el.borderWidth } : undefined,
            rectRadius: el.shapeType === 'rect' || el.shapeType === 'line' ? 0 : 0.08,
          });
        } else if (el.type === 'text') {
          const rawContent = el.content || '';
          const textColor = el.color
            ? el.color.replace('#', '')
            : colors.hexText;

          // Split multi-line bullets if bullet formatted
          const lines = rawContent.split('\n').filter((l) => l.trim().length > 0);
          const hasBullets = lines.some((l) => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('✓'));

          if (hasBullets) {
            const formattedBullets = lines.map((line) => {
              const clean = line.replace(/^[•\-✓*]\s*/, '').trim();
              return {
                text: clean,
                options: {
                  fontSize: el.fontSize ? Math.min(24, Math.max(10, el.fontSize)) : 13,
                  bold: el.fontWeight === 'bold',
                  italic: el.fontStyle === 'italic',
                  color: textColor,
                  fontFace: 'Arial',
                  bullet: true,
                  breakLine: true,
                  paraSpaceAfter: 8,
                },
              };
            });

            pptxSlide.addText(formattedBullets, {
              x: xInches,
              y: yInches,
              w: wInches,
              h: hInches,
              valign: 'top',
              align: el.align || 'left',
            });
          } else {
            pptxSlide.addText(rawContent, {
              x: xInches,
              y: yInches,
              w: wInches,
              h: hInches,
              fontSize: el.fontSize ? Math.min(44, Math.max(9, el.fontSize)) : 14,
              bold: el.fontWeight === 'bold',
              italic: el.fontStyle === 'italic',
              color: textColor,
              fontFace: 'Arial',
              valign: 'top',
              align: el.align || 'left',
            });
          }
        } else if (el.type === 'image' && el.imageUrl) {
          try {
            // Check if imageUrl is base64 or remote URL
            if (el.imageUrl.startsWith('data:image')) {
              pptxSlide.addImage({
                data: el.imageUrl,
                x: xInches,
                y: yInches,
                w: wInches,
                h: hInches,
              });
            } else {
              pptxSlide.addImage({
                path: el.imageUrl,
                x: xInches,
                y: yInches,
                w: wInches,
                h: hInches,
              });
            }
          } catch (imgErr) {
            console.warn('[PPTX Export] Image embed fallback shape:', imgErr);
            pptxSlide.addShape(pptx.ShapeType.roundRect, {
              x: xInches,
              y: yInches,
              w: wInches,
              h: hInches,
              fill: { color: colors.hexCardBg },
              line: { color: colors.hexAccent, width: 1 },
            });
          }
        }
      }
    } else {
      // Fallback default native slide rendering if elements array is empty
      if (slideData.layout === 'title' || idx === 0) {
        pptxSlide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 1.6,
          w: 0.12,
          h: 2.8,
          fill: { color: colors.hexAccent },
        });

        pptxSlide.addText(slideData.title, {
          x: 1.1,
          y: 1.6,
          w: 8.2,
          h: 1.6,
          fontSize: 38,
          bold: true,
          color: colors.hexTitle,
          fontFace: 'Arial',
          valign: 'middle',
        });

        if (slideData.subtitle || title) {
          pptxSlide.addText(slideData.subtitle || 'Executive Deck', {
            x: 1.1,
            y: 3.3,
            w: 8.2,
            h: 0.8,
            fontSize: 18,
            color: colors.hexText,
            fontFace: 'Arial',
          });
        }
      } else {
        // Category indicator
        pptxSlide.addText(`SLIDE ${idx + 1} OF ${slides.length} • ${(slideData.categoryTag || 'STRATEGY').toUpperCase()}`, {
          x: 0.8,
          y: 0.35,
          w: 8.4,
          h: 0.3,
          fontSize: 9,
          bold: true,
          color: colors.hexAccent,
          fontFace: 'Arial',
        });

        // Slide title
        pptxSlide.addText(slideData.title, {
          x: 0.8,
          y: 0.7,
          w: 8.4,
          h: 0.7,
          fontSize: 24,
          bold: true,
          color: colors.hexTitle,
          fontFace: 'Arial',
        });

        // Underline
        pptxSlide.addShape(pptx.ShapeType.rect, {
          x: 0.8,
          y: 1.45,
          w: 8.4,
          h: 0.02,
          fill: { color: colors.hexAccent },
        });

        const hasTakeaway = Boolean(slideData.takeaway);
        const cardW = hasTakeaway ? 5.6 : 8.4;

        // Content card
        pptxSlide.addShape(pptx.ShapeType.roundRect, {
          x: 0.8,
          y: 1.65,
          w: cardW,
          h: 3.6,
          fill: { color: colors.hexCardBg },
          line: { color: colors.hexAccent, width: 1 },
          rectRadius: 0.08,
        });

        const bulletsFormatted = (slideData.bulletPoints || []).map((pt) => ({
          text: pt,
          options: {
            fontSize: 13,
            color: colors.hexText,
            fontFace: 'Arial',
            bullet: true,
            breakLine: true,
            paraSpaceAfter: 10,
          },
        }));

        if (bulletsFormatted.length > 0) {
          pptxSlide.addText(bulletsFormatted, {
            x: 1.0,
            y: 1.85,
            w: cardW - 0.4,
            h: 3.2,
            valign: 'top',
          });
        }

        if (hasTakeaway) {
          pptxSlide.addShape(pptx.ShapeType.roundRect, {
            x: 6.6,
            y: 1.65,
            w: 2.6,
            h: 3.6,
            fill: { color: colors.hexCardBg },
            line: { color: colors.hexAccent, width: 1 },
            rectRadius: 0.08,
          });

          pptxSlide.addText('💡 KEY TAKEAWAY', {
            x: 6.8,
            y: 1.85,
            w: 2.2,
            h: 0.35,
            fontSize: 11,
            bold: true,
            color: colors.hexAccent,
            fontFace: 'Arial',
          });

          pptxSlide.addText(slideData.takeaway || '', {
            x: 6.8,
            y: 2.25,
            w: 2.2,
            h: 2.8,
            fontSize: 12,
            color: colors.hexText,
            fontFace: 'Arial',
            valign: 'top',
          });
        }
      }
    }

    // Attach speaker notes to slide
    if (slideData.speakerNotes) {
      pptxSlide.addNotes(slideData.speakerNotes);
    }
  }

  const blob = (await pptx.write({ outputType: 'blob' })) as Blob;
  return blob;
}

/**
 * 2. REAL PRESENTATION SLIDES PDF EXPORTER
 * Exports 16:9 widescreen presentation slides to publication-grade PDF.
 */
export function exportStudioPresentationToPdf(params: {
  title: string;
  slides: SlideData[];
  theme: PPTTheme;
  author?: string;
}): Blob {
  const { title, slides, theme, author = 'SUPERAI' } = params;
  const colors = THEME_CONFIGS[theme] || THEME_CONFIGS.emerald;

  // Landscape A4 or 16:9 aspect ratio PDF
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [297, 167], // 16:9 widescreen proportions
  });

  const pageWidth = 297;
  const pageHeight = 167;

  slides.forEach((slide, idx) => {
    if (idx > 0) doc.addPage();

    // Background fill
    if (theme === 'slate') {
      doc.setFillColor(248, 250, 252);
    } else if (theme === 'navy') {
      doc.setFillColor(11, 19, 43);
    } else if (theme === 'violet') {
      doc.setFillColor(23, 11, 40);
    } else if (theme === 'amber') {
      doc.setFillColor(24, 14, 7);
    } else if (theme === 'obsidian') {
      doc.setFillColor(9, 9, 11);
    } else {
      doc.setFillColor(7, 13, 10); // emerald default
    }
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Title slide layout
    if (slide.layout === 'title' || idx === 0) {
      // Accent bar
      doc.setFillColor(16, 185, 129);
      doc.rect(20, 45, 3, 75, 'F');

      // Tag
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(52, 211, 153);
      doc.text(slide.categoryTag || 'EXECUTIVE PRESENTATION', 28, 48);

      // Title
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      const titleLines = doc.splitTextToSize(slide.title, 240);
      doc.text(titleLines, 28, 62);

      // Subtitle
      if (slide.subtitle || title) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(14);
        doc.setTextColor(203, 213, 225);
        doc.text(slide.subtitle || title, 28, 88);
      }

      // Footer
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text(`Generated via ${author} • ${new Date().toLocaleDateString()}`, 28, 140);
    } else {
      // Header tag
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(52, 211, 153);
      doc.text(`SLIDE ${idx + 1} OF ${slides.length} • ${(slide.categoryTag || 'OVERVIEW').toUpperCase()}`, 18, 15);

      // Slide title
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.text(slide.title, 18, 25);

      // Divider line
      doc.setDrawColor(16, 185, 129);
      doc.setLineWidth(0.6);
      doc.line(18, 29, pageWidth - 18, 29);

      // Content card
      const hasTakeaway = Boolean(slide.takeaway);
      const cardWidth = hasTakeaway ? 175 : 261;

      doc.setFillColor(18, 32, 25);
      doc.setDrawColor(30, 58, 45);
      doc.roundedRect(18, 36, cardWidth, 115, 3, 3, 'FD');

      // Bullets
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(226, 232, 240);
      let cursorY = 48;
      (slide.bulletPoints || []).forEach((bp) => {
        const bpLines = doc.splitTextToSize(`•  ${bp}`, cardWidth - 16);
        doc.text(bpLines, 26, cursorY);
        cursorY += bpLines.length * 7 + 5;
      });

      // Takeaway Card
      if (hasTakeaway) {
        doc.setFillColor(18, 32, 25);
        doc.setDrawColor(16, 185, 129);
        doc.roundedRect(200, 36, 79, 115, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(52, 211, 153);
        doc.text('💡 KEY TAKEAWAY', 208, 48);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(226, 232, 240);
        const takeawayLines = doc.splitTextToSize(slide.takeaway || '', 65);
        doc.text(takeawayLines, 208, 60);
      }
    }
  });

  return doc.output('blob');
}

/**
 * Triggers browser download for a Blob
 */
export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
