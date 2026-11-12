import { SlideData, SlideElement, SlideLayout } from './types';
import { ThemeColors } from './themeConfig';

// High-definition curated visual stock backgrounds and topic illustrations
export const TOPIC_CURATED_IMAGES: Record<string, string> = {
  ai: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1000&auto=format&fit=crop&q=80',
  artificial: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1000&auto=format&fit=crop&q=80',
  neural: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80',
  tech: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1000&auto=format&fit=crop&q=80',
  technology: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1000&auto=format&fit=crop&q=80',
  data: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1000&auto=format&fit=crop&q=80',
  analytics: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1000&auto=format&fit=crop&q=80',
  business: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=80',
  finance: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=1000&auto=format&fit=crop&q=80',
  investor: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=1000&auto=format&fit=crop&q=80',
  pitch: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1000&auto=format&fit=crop&q=80',
  science: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=1000&auto=format&fit=crop&q=80',
  physics: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=1000&auto=format&fit=crop&q=80',
  chemistry: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1000&auto=format&fit=crop&q=80',
  biology: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?w=1000&auto=format&fit=crop&q=80',
  medical: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1000&auto=format&fit=crop&q=80',
  health: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=1000&auto=format&fit=crop&q=80',
  nature: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1000&auto=format&fit=crop&q=80',
  environment: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1000&auto=format&fit=crop&q=80',
  solar: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=1000&auto=format&fit=crop&q=80',
  energy: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1000&auto=format&fit=crop&q=80',
  history: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=1000&auto=format&fit=crop&q=80',
  education: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=1000&auto=format&fit=crop&q=80',
  school: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1000&auto=format&fit=crop&q=80',
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=80',
  creative: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=1000&auto=format&fit=crop&q=80',
  cloud: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=1000&auto=format&fit=crop&q=80',
  security: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1000&auto=format&fit=crop&q=80',
  code: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1000&auto=format&fit=crop&q=80',
  robot: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=1000&auto=format&fit=crop&q=80',
  marketing: 'https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=1000&auto=format&fit=crop&q=80',
  space: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=1000&auto=format&fit=crop&q=80',
  city: 'https://images.unsplash.com/photo-1477959858617-67f30ac4ce78?w=1000&auto=format&fit=crop&q=80',
  transport: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1000&auto=format&fit=crop&q=80',
};

/**
 * Resolve topic matching image URL
 */
export function resolveVisualImage(query?: string, fallbackIndex: number = 0): string {
  if (!query) {
    const values = Object.values(TOPIC_CURATED_IMAGES);
    return values[fallbackIndex % values.length];
  }

  const q = query.toLowerCase();
  for (const [key, url] of Object.entries(TOPIC_CURATED_IMAGES)) {
    if (q.includes(key)) return url;
  }

  // Pollinations AI high-speed proxy with clean prompt
  const cleanPrompt = encodeURIComponent(`${query} professional presentation photographic visual high resolution 8k`);
  return `https://image.pollinations.ai/prompt/${cleanPrompt}?width=1000&height=600&nologo=true&seed=${Math.floor(Math.random() * 8000) + 1000}&model=turbo`;
}

/**
 * Generate default visual slide elements for all 16 distinct slide layouts
 */
export function generateLayoutElements(slide: SlideData, theme: ThemeColors): SlideElement[] {
  const elements: SlideElement[] = [];
  const layout: SlideLayout = slide.layout || 'content';

  // =========================================================================
  // LAYOUT 1: TITLE / COVER SLIDE
  // =========================================================================
  if (layout === 'title') {
    elements.push({
      id: `el-accent-bar-${Date.now()}`,
      type: 'shape',
      shapeType: 'rect',
      x: 7,
      y: 22,
      w: 1.2,
      h: 52,
      fillColor: theme.accent,
      zIndex: 1,
    });

    elements.push({
      id: `el-tag-${Date.now()}`,
      type: 'text',
      content: slide.categoryTag || 'EXECUTIVE BRIEFING',
      fontSize: 14,
      fontWeight: 'bold',
      fontFamily: theme.fontBody,
      color: theme.accent,
      align: 'left',
      x: 10,
      y: 22,
      w: 80,
      h: 6,
      zIndex: 2,
    });

    elements.push({
      id: `el-title-${Date.now()}`,
      type: 'text',
      content: slide.title,
      fontSize: 38,
      fontWeight: 'bold',
      fontFamily: theme.fontTitle,
      color: theme.titleColor,
      align: 'left',
      x: 10,
      y: 30,
      w: 82,
      h: 22,
      zIndex: 2,
    });

    elements.push({
      id: `el-sub-${Date.now()}`,
      type: 'text',
      content: slide.subtitle || slide.centralMessage || 'Strategic Analysis, Comprehensive Roadmap & Implementation Plan',
      fontSize: 18,
      fontWeight: 'normal',
      fontStyle: 'italic',
      fontFamily: theme.fontBody,
      color: theme.subtitleColor,
      align: 'left',
      x: 10,
      y: 54,
      w: 80,
      h: 12,
      zIndex: 2,
    });

    elements.push({
      id: `el-pres-${Date.now()}`,
      type: 'text',
      content: `SUPERAI PRESENTATION STUDIO • ${new Date().toLocaleDateString()}`,
      fontSize: 11,
      fontWeight: 'bold',
      fontFamily: 'monospace',
      color: theme.secondaryText,
      align: 'left',
      x: 10,
      y: 72,
      w: 80,
      h: 6,
      zIndex: 2,
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 2: SECTION DIVIDER
  // =========================================================================
  if (layout === 'section') {
    elements.push({
      id: `el-sec-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 12,
      y: 20,
      w: 76,
      h: 60,
      fillColor: theme.cardBg,
      borderColor: theme.accent,
      borderWidth: 2,
      zIndex: 1,
    });

    elements.push({
      id: `el-sec-tag-${Date.now()}`,
      type: 'text',
      content: slide.categoryTag || 'PART / MILESTONE',
      fontSize: 14,
      fontWeight: 'bold',
      fontFamily: 'monospace',
      color: theme.accent,
      align: 'center',
      x: 14,
      y: 30,
      w: 72,
      h: 6,
      zIndex: 2,
    });

    elements.push({
      id: `el-sec-title-${Date.now()}`,
      type: 'text',
      content: slide.title,
      fontSize: 34,
      fontWeight: 'bold',
      fontFamily: theme.fontTitle,
      color: theme.titleColor,
      align: 'center',
      x: 14,
      y: 40,
      w: 72,
      h: 20,
      zIndex: 2,
    });

    elements.push({
      id: `el-sec-sub-${Date.now()}`,
      type: 'text',
      content: slide.subtitle || slide.centralMessage || 'Core Section Overview & Strategic Foundations',
      fontSize: 16,
      fontFamily: theme.fontBody,
      color: theme.secondaryText,
      align: 'center',
      x: 14,
      y: 62,
      w: 72,
      h: 12,
      zIndex: 2,
    });

    return elements;
  }

  // Standard Header for other slides
  elements.push({
    id: `el-cat-${Date.now()}`,
    type: 'text',
    content: (slide.categoryTag || 'SECTION OVERVIEW').toUpperCase(),
    fontSize: 11,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: theme.accent,
    align: 'left',
    x: 6,
    y: 5,
    w: 88,
    h: 5,
    zIndex: 2,
  });

  elements.push({
    id: `el-title-${Date.now()}`,
    type: 'text',
    content: slide.title,
    fontSize: 26,
    fontWeight: 'bold',
    fontFamily: theme.fontTitle,
    color: theme.titleColor,
    align: 'left',
    x: 6,
    y: 10,
    w: 88,
    h: 10,
    zIndex: 2,
  });

  elements.push({
    id: `el-line-${Date.now()}`,
    type: 'shape',
    shapeType: 'line',
    x: 6,
    y: 21,
    w: 88,
    h: 0.5,
    fillColor: theme.accent,
    zIndex: 1,
  });

  // =========================================================================
  // LAYOUT 3: AGENDA / TABLE OF CONTENTS
  // =========================================================================
  if (layout === 'agenda') {
    const agendaPoints = slide.bulletPoints && slide.bulletPoints.length > 0
      ? slide.bulletPoints
      : ['Executive Summary & Strategic Vision', 'Current Market Landscape & Core Challenge', 'Proposed Solution & Architectural Framework', 'Execution Roadmap & Measurable Milestones'];

    agendaPoints.slice(0, 5).forEach((pt, pIdx) => {
      const y = 26 + pIdx * 13;
      elements.push({
        id: `el-agenda-card-${pIdx}-${Date.now()}`,
        type: 'shape',
        shapeType: 'card',
        x: 6,
        y,
        w: 88,
        h: 11,
        fillColor: theme.cardBg,
        borderColor: theme.cardBorder,
        borderWidth: 1,
        zIndex: 1,
      });

      elements.push({
        id: `el-agenda-num-${pIdx}-${Date.now()}`,
        type: 'text',
        content: `0${pIdx + 1}`,
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.accent,
        align: 'center',
        x: 8,
        y: y + 2,
        w: 6,
        h: 7,
        zIndex: 2,
      });

      elements.push({
        id: `el-agenda-text-${pIdx}-${Date.now()}`,
        type: 'text',
        content: pt,
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.textColor,
        align: 'left',
        x: 16,
        y: y + 2.5,
        w: 76,
        h: 7,
        zIndex: 2,
      });
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 4: THREE CARDS / INFOGRAPHIC PILLARS
  // =========================================================================
  if (layout === 'three_card') {
    const cards = slide.threeCards || (slide.bulletPoints && slide.bulletPoints.length >= 3
      ? slide.bulletPoints.slice(0, 3).map((bp, i) => ({
          title: `Pillar 0${i + 1}`,
          description: bp,
          tag: 'CORE STRATEGY',
        }))
      : [
          { title: 'Operational Speed', description: 'Real-time workflow execution minimizing latency', tag: 'VELOCITY' },
          { title: 'Intelligent Automation', description: 'Continuous AI decision making and optimization', tag: 'SCALE' },
          { title: 'Demonstrated ROI', description: 'Measurable cost reduction and efficiency gains', tag: 'IMPACT' },
        ]);

    const cardW = 27;
    const gap = 3.5;
    const startX = 6;

    cards.slice(0, 3).forEach((cd, cIdx) => {
      const x = startX + cIdx * (cardW + gap);

      elements.push({
        id: `el-3card-${cIdx}-${Date.now()}`,
        type: 'shape',
        shapeType: 'card',
        x,
        y: 26,
        w: cardW,
        h: 66,
        fillColor: theme.cardBg,
        borderColor: theme.cardBorder,
        borderWidth: 1,
        zIndex: 1,
      });

      elements.push({
        id: `el-3card-tag-${cIdx}-${Date.now()}`,
        type: 'text',
        content: cd.tag || `PILLAR 0${cIdx + 1}`,
        fontSize: 11,
        fontWeight: 'bold',
        color: theme.accent,
        align: 'left',
        x: x + 2,
        y: 30,
        w: cardW - 4,
        h: 6,
        zIndex: 2,
      });

      elements.push({
        id: `el-3card-title-${cIdx}-${Date.now()}`,
        type: 'text',
        content: cd.title,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.titleColor,
        align: 'left',
        x: x + 2,
        y: 37,
        w: cardW - 4,
        h: 12,
        zIndex: 2,
      });

      elements.push({
        id: `el-3card-desc-${cIdx}-${Date.now()}`,
        type: 'text',
        content: cd.description,
        fontSize: 13,
        color: theme.textColor,
        align: 'left',
        x: x + 2,
        y: 51,
        w: cardW - 4,
        h: 38,
        zIndex: 2,
      });
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 5: TIMELINE / CHRONOLOGICAL PROCESS
  // =========================================================================
  if (layout === 'timeline' || layout === 'process') {
    const steps = slide.timelineSteps || (slide.bulletPoints && slide.bulletPoints.length >= 3
      ? slide.bulletPoints.slice(0, 4).map((bp, i) => ({
          step: `Phase ${i + 1}`,
          title: `Milestone 0${i + 1}`,
          description: bp,
        }))
      : [
          { step: 'Phase 1', title: 'Research & Discovery', description: 'Analyze baseline data and establish governance' },
          { step: 'Phase 2', title: 'Architecture Pilot', description: 'Deploy core prototypes and validate key metrics' },
          { step: 'Phase 3', title: 'Enterprise Rollout', description: 'Automate across departments with live telemetry' },
          { step: 'Phase 4', title: 'Continuous Growth', description: 'Iterative refinement and compounding ROI' },
        ]);

    const stepW = 20;
    const gap = 2.6;
    const startX = 6;

    // Horizontal connecting track
    elements.push({
      id: `el-timeline-track-${Date.now()}`,
      type: 'shape',
      shapeType: 'line',
      x: 8,
      y: 42,
      w: 84,
      h: 0.8,
      fillColor: theme.accent,
      zIndex: 1,
    });

    steps.slice(0, 4).forEach((st, sIdx) => {
      const x = startX + sIdx * (stepW + gap);

      // Node Circle
      elements.push({
        id: `el-node-${sIdx}-${Date.now()}`,
        type: 'shape',
        shapeType: 'circle',
        x: x + 7.5,
        y: 38.5,
        w: 5,
        h: 8,
        fillColor: theme.accent,
        borderColor: theme.cardBg,
        borderWidth: 2,
        zIndex: 3,
      });

      // Top Phase Label
      elements.push({
        id: `el-phase-${sIdx}-${Date.now()}`,
        type: 'text',
        content: st.step,
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.accent,
        align: 'center',
        x,
        y: 28,
        w: stepW,
        h: 7,
        zIndex: 2,
      });

      // Bottom Card with Title & Description
      elements.push({
        id: `el-stepcard-${sIdx}-${Date.now()}`,
        type: 'shape',
        shapeType: 'card',
        x,
        y: 50,
        w: stepW,
        h: 42,
        fillColor: theme.cardBg,
        borderColor: theme.cardBorder,
        borderWidth: 1,
        zIndex: 1,
      });

      elements.push({
        id: `el-steptitle-${sIdx}-${Date.now()}`,
        type: 'text',
        content: st.title,
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.titleColor,
        align: 'center',
        x: x + 1,
        y: 53,
        w: stepW - 2,
        h: 8,
        zIndex: 2,
      });

      elements.push({
        id: `el-stepdesc-${sIdx}-${Date.now()}`,
        type: 'text',
        content: st.description,
        fontSize: 11,
        color: theme.textColor,
        align: 'center',
        x: x + 1,
        y: 63,
        w: stepW - 2,
        h: 27,
        zIndex: 2,
      });
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 6: FULL BLEED / IMAGE-LED SLIDE
  // =========================================================================
  if (layout === 'full_image') {
    const heroImg = slide.imageUrl || resolveVisualImage(slide.suggestedVisual || slide.title, 2);

    elements.push({
      id: `el-fullimg-${Date.now()}`,
      type: 'image',
      imageUrl: heroImg,
      x: 6,
      y: 25,
      w: 88,
      h: 68,
      borderRadius: 10,
      objectFit: 'cover',
      zIndex: 1,
    });

    // Dark gradient overlay card at bottom of image
    elements.push({
      id: `el-overlay-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 8,
      y: 68,
      w: 84,
      h: 23,
      fillColor: '#000000',
      borderColor: theme.accent,
      borderWidth: 1,
      opacity: 0.88,
      zIndex: 2,
    });

    elements.push({
      id: `el-overlay-text-${Date.now()}`,
      type: 'text',
      content: slide.takeaway || slide.centralMessage || (slide.bulletPoints && slide.bulletPoints[0]) || 'Visual narrative anchor illustrating core strategic inflection.',
      fontSize: 15,
      fontWeight: 'bold',
      color: '#ffffff',
      align: 'left',
      x: 10,
      y: 72,
      w: 80,
      h: 16,
      zIndex: 3,
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 7: QUOTE / TESTIMONIAL / VISION
  // =========================================================================
  if (layout === 'quote') {
    elements.push({
      id: `el-quote-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 10,
      y: 26,
      w: 80,
      h: 64,
      fillColor: theme.cardBg,
      borderColor: theme.accent,
      borderWidth: 2,
      zIndex: 1,
    });

    elements.push({
      id: `el-quote-mark-${Date.now()}`,
      type: 'text',
      content: '“',
      fontSize: 64,
      fontWeight: 'bold',
      color: theme.accent,
      align: 'center',
      x: 12,
      y: 28,
      w: 76,
      h: 14,
      zIndex: 2,
    });

    elements.push({
      id: `el-quote-body-${Date.now()}`,
      type: 'text',
      content: slide.quoteText || slide.centralMessage || (slide.bulletPoints && slide.bulletPoints[0]) || 'Innovation distinguishes between a leader and a follower.',
      fontSize: 22,
      fontStyle: 'italic',
      fontFamily: theme.fontTitle,
      color: theme.titleColor,
      align: 'center',
      x: 14,
      y: 44,
      w: 72,
      h: 30,
      zIndex: 2,
    });

    elements.push({
      id: `el-quote-author-${Date.now()}`,
      type: 'text',
      content: `— ${slide.quoteAuthor || slide.categoryTag || 'Executive Perspective'}`,
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.accent,
      align: 'center',
      x: 14,
      y: 76,
      w: 72,
      h: 10,
      zIndex: 2,
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 8: QUIZ / ACTIVITY / DISCUSSION
  // =========================================================================
  if (layout === 'quiz_activity') {
    elements.push({
      id: `el-quiz-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 6,
      y: 25,
      w: 88,
      h: 68,
      fillColor: theme.cardBg,
      borderColor: theme.accent,
      borderWidth: 1,
      zIndex: 1,
    });

    elements.push({
      id: `el-quiz-question-${Date.now()}`,
      type: 'text',
      content: slide.quizQuestion || slide.title || 'Discussion / Knowledge Check Question:',
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.titleColor,
      align: 'left',
      x: 9,
      y: 29,
      w: 82,
      h: 14,
      zIndex: 2,
    });

    const options = slide.quizOptions || (slide.bulletPoints && slide.bulletPoints.length > 0
      ? slide.bulletPoints
      : ['A) Option One', 'B) Option Two', 'C) Option Three', 'D) Option Four']);

    options.slice(0, 4).forEach((opt, oIdx) => {
      const y = 46 + oIdx * 11;
      elements.push({
        id: `el-opt-${oIdx}-${Date.now()}`,
        type: 'text',
        content: opt.startsWith('•') ? opt : `•  ${opt}`,
        fontSize: 14,
        color: theme.textColor,
        align: 'left',
        x: 10,
        y,
        w: 80,
        h: 9,
        zIndex: 2,
      });
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 9: THANK YOU / CLOSING SLIDE
  // =========================================================================
  if (layout === 'thank_you') {
    elements.push({
      id: `el-ty-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 14,
      y: 22,
      w: 72,
      h: 64,
      fillColor: theme.cardBg,
      borderColor: theme.accent,
      borderWidth: 2,
      zIndex: 1,
    });

    elements.push({
      id: `el-ty-title-${Date.now()}`,
      type: 'text',
      content: 'Thank You!',
      fontSize: 44,
      fontWeight: 'bold',
      fontFamily: theme.fontTitle,
      color: theme.accent,
      align: 'center',
      x: 16,
      y: 30,
      w: 68,
      h: 18,
      zIndex: 2,
    });

    elements.push({
      id: `el-ty-sub-${Date.now()}`,
      type: 'text',
      content: slide.subtitle || 'Questions & Discussion • Thank you for your time',
      fontSize: 18,
      color: theme.titleColor,
      align: 'center',
      x: 16,
      y: 52,
      w: 68,
      h: 12,
      zIndex: 2,
    });

    elements.push({
      id: `el-ty-contact-${Date.now()}`,
      type: 'text',
      content: slide.takeaway || 'Contact: team@superai.studio • superai.applet',
      fontSize: 12,
      fontFamily: 'monospace',
      color: theme.secondaryText,
      align: 'center',
      x: 16,
      y: 68,
      w: 68,
      h: 8,
      zIndex: 2,
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 10: TWO COLUMN
  // =========================================================================
  if (layout === 'two_column') {
    elements.push({
      id: `el-card1-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 6,
      y: 25,
      w: 42,
      h: 68,
      fillColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      zIndex: 1,
    });

    elements.push({
      id: `el-col1-title-${Date.now()}`,
      type: 'text',
      content: 'Core Strategic Pillars',
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.accent,
      align: 'left',
      x: 8,
      y: 28,
      w: 38,
      h: 6,
      zIndex: 2,
    });

    elements.push({
      id: `el-col1-bullets-${Date.now()}`,
      type: 'text',
      content: slide.bulletPoints.map((b) => `• ${b}`).join('\n\n'),
      fontSize: 13,
      color: theme.textColor,
      align: 'left',
      x: 8,
      y: 36,
      w: 38,
      h: 54,
      zIndex: 2,
    });

    elements.push({
      id: `el-card2-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 52,
      y: 25,
      w: 42,
      h: 68,
      fillColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      zIndex: 1,
    });

    elements.push({
      id: `el-col2-title-${Date.now()}`,
      type: 'text',
      content: slide.columnTwoTitle || 'Strategic Counterpart / Action Plan',
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.accent,
      align: 'left',
      x: 54,
      y: 28,
      w: 38,
      h: 6,
      zIndex: 2,
    });

    elements.push({
      id: `el-col2-bullets-${Date.now()}`,
      type: 'text',
      content: (slide.columnTwoBullets || ['Proactive operational alignment', 'Measurable velocity boost', 'Iterative milestone tracking']).map((b) => `• ${b}`).join('\n\n'),
      fontSize: 13,
      color: theme.textColor,
      align: 'left',
      x: 54,
      y: 36,
      w: 38,
      h: 54,
      zIndex: 2,
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 11: IMAGE WITH TEXT
  // =========================================================================
  if (layout === 'image_text') {
    const resolvedImg = slide.imageUrl || resolveVisualImage(slide.suggestedVisual || slide.title, 1);
    elements.push({
      id: `el-img-${Date.now()}`,
      type: 'image',
      imageUrl: resolvedImg,
      x: 6,
      y: 25,
      w: 42,
      h: 68,
      borderRadius: 8,
      objectFit: 'cover',
      zIndex: 1,
    });

    elements.push({
      id: `el-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 51,
      y: 25,
      w: 43,
      h: 68,
      fillColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      zIndex: 1,
    });

    elements.push({
      id: `el-bullets-${Date.now()}`,
      type: 'text',
      content: slide.bulletPoints.map((b) => `• ${b}`).join('\n\n'),
      fontSize: 14,
      color: theme.textColor,
      align: 'left',
      x: 53,
      y: 29,
      w: 39,
      h: 42,
      zIndex: 2,
    });

    if (slide.takeaway) {
      elements.push({
        id: `el-takeaway-${Date.now()}`,
        type: 'text',
        content: `💡 Takeaway: ${slide.takeaway}`,
        fontSize: 12,
        fontWeight: 'bold',
        color: theme.accent,
        align: 'left',
        x: 53,
        y: 75,
        w: 39,
        h: 15,
        zIndex: 2,
      });
    }

    return elements;
  }

  // =========================================================================
  // LAYOUT 12: STATS / BIG METRICS
  // =========================================================================
  if (layout === 'stats') {
    const stats = slide.stats || [
      { value: '+142%', label: 'Throughput Growth' },
      { value: '4.8x', label: 'ROI Multiple' },
      { value: '-65%', label: 'Turnaround Latency' },
    ];

    const cardWidth = 27;
    const gap = 3.5;
    const startX = 6;

    stats.slice(0, 3).forEach((st, sIdx) => {
      const x = startX + sIdx * (cardWidth + gap);

      elements.push({
        id: `el-statcard-${sIdx}-${Date.now()}`,
        type: 'shape',
        shapeType: 'card',
        x,
        y: 26,
        w: cardWidth,
        h: 40,
        fillColor: theme.cardBg,
        borderColor: theme.cardBorder,
        borderWidth: 1,
        zIndex: 1,
      });

      elements.push({
        id: `el-statval-${sIdx}-${Date.now()}`,
        type: 'text',
        content: st.value,
        fontSize: 34,
        fontWeight: 'bold',
        color: theme.accent,
        align: 'center',
        x,
        y: 30,
        w: cardWidth,
        h: 16,
        zIndex: 2,
      });

      elements.push({
        id: `el-statlbl-${sIdx}-${Date.now()}`,
        type: 'text',
        content: st.label,
        fontSize: 13,
        fontWeight: 'bold',
        color: theme.textColor,
        align: 'center',
        x,
        y: 48,
        w: cardWidth,
        h: 14,
        zIndex: 2,
      });
    });

    elements.push({
      id: `el-bottom-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 6,
      y: 70,
      w: 88,
      h: 23,
      fillColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      zIndex: 1,
    });

    elements.push({
      id: `el-bottom-text-${Date.now()}`,
      type: 'text',
      content: slide.takeaway || slide.bulletPoints[0] || 'Quantitative performance targets deliver demonstrable value across every phase of implementation.',
      fontSize: 13,
      color: theme.textColor,
      align: 'left',
      x: 8,
      y: 73,
      w: 84,
      h: 17,
      zIndex: 2,
    });

    return elements;
  }

  // =========================================================================
  // LAYOUT 13: CONCLUSION / NEXT STEPS
  // =========================================================================
  if (layout === 'conclusion') {
    elements.push({
      id: `el-conc-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 6,
      y: 25,
      w: 56,
      h: 68,
      fillColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      zIndex: 1,
    });

    elements.push({
      id: `el-conc-bullets-${Date.now()}`,
      type: 'text',
      content: slide.bulletPoints.map((b) => `✓ ${b}`).join('\n\n'),
      fontSize: 14,
      color: theme.textColor,
      align: 'left',
      x: 9,
      y: 29,
      w: 50,
      h: 58,
      zIndex: 2,
    });

    elements.push({
      id: `el-cta-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 65,
      y: 25,
      w: 29,
      h: 68,
      fillColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      zIndex: 1,
    });

    elements.push({
      id: `el-cta-title-${Date.now()}`,
      type: 'text',
      content: '🚀 NEXT STEPS',
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.accent,
      align: 'center',
      x: 67,
      y: 30,
      w: 25,
      h: 8,
      zIndex: 2,
    });

    elements.push({
      id: `el-cta-desc-${Date.now()}`,
      type: 'text',
      content: slide.takeaway || 'Immediate execution ensures sustainable industry leadership. Contact core steering team to kick off Phase 1.',
      fontSize: 12,
      color: theme.textColor,
      align: 'center',
      x: 67,
      y: 42,
      w: 25,
      h: 46,
      zIndex: 2,
    });

    return elements;
  }

  // =========================================================================
  // DEFAULT CONTENT LAYOUT (Title + Content Bullets + Takeaway Card)
  // =========================================================================
  const hasTakeaway = Boolean(slide.takeaway);
  const bulletsWidth = hasTakeaway ? 58 : 88;

  elements.push({
    id: `el-bullets-card-${Date.now()}`,
    type: 'shape',
    shapeType: 'card',
    x: 6,
    y: 25,
    w: bulletsWidth,
    h: 68,
    fillColor: theme.cardBg,
    borderColor: theme.cardBorder,
    borderWidth: 1,
    zIndex: 1,
  });

  elements.push({
    id: `el-bullets-text-${Date.now()}`,
    type: 'text',
    content: slide.bulletPoints.map((b) => `• ${b}`).join('\n\n'),
    fontSize: 14,
    color: theme.textColor,
    align: 'left',
    x: 8.5,
    y: 28,
    w: bulletsWidth - 5,
    h: 61,
    zIndex: 2,
  });

  if (hasTakeaway) {
    elements.push({
      id: `el-takeaway-card-${Date.now()}`,
      type: 'shape',
      shapeType: 'card',
      x: 67,
      y: 25,
      w: 27,
      h: 68,
      fillColor: theme.cardBg,
      borderColor: theme.cardBorder,
      borderWidth: 1,
      zIndex: 1,
    });

    elements.push({
      id: `el-takeaway-badge-${Date.now()}`,
      type: 'text',
      content: '💡 KEY TAKEAWAY',
      fontSize: 13,
      fontWeight: 'bold',
      color: theme.accent,
      align: 'left',
      x: 69.5,
      y: 29,
      w: 22,
      h: 6,
      zIndex: 2,
    });

    elements.push({
      id: `el-takeaway-body-${Date.now()}`,
      type: 'text',
      content: slide.takeaway || '',
      fontSize: 13,
      color: theme.textColor,
      align: 'left',
      x: 69.5,
      y: 38,
      w: 22,
      h: 50,
      zIndex: 2,
    });
  }

  return elements;
}
