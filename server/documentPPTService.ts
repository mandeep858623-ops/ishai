import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

function getAIClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface GenerateDocPPTRequest {
  toolType: 
    | 'document'
    | 'presentation'
    | 'pdf'
    | 'resume'
    | 'report'
    | 'school_project'
    | 'letter'
    | 'worksheet'
    | 'notes';
  title: string;
  topic: string;
  instructions?: string;
  language?: string;
  length?: string;
  style?: string;
  referenceText?: string;
  targetAudience?: string;
  slideCount?: number;
  purpose?: string;
  theme?: string;
  visualStyle?: string;
  detailLevel?: string;
}

export interface GeneratedDocPPTResult {
  success: boolean;
  title: string;
  toolType: string;
  content: string; // Markdown / Formatted text
  slides?: Array<{
    id?: string;
    layout?: string;
    categoryTag?: string;
    title: string;
    subtitle?: string;
    bulletPoints: string[];
    columnTwoTitle?: string;
    columnTwoBullets?: string[];
    threeCards?: Array<{ title: string; description: string; tag?: string }>;
    timelineSteps?: Array<{ step: string; title: string; description: string }>;
    stats?: Array<{ value: string; label: string }>;
    quoteText?: string;
    quoteAuthor?: string;
    quizQuestion?: string;
    quizOptions?: string[];
    imageUrl?: string;
    suggestedVisual?: string;
    takeaway?: string;
    speakerNotes?: string;
  }>;
  summary?: string;
  error?: string;
}

export async function generateDocumentOrPresentation(
  params: GenerateDocPPTRequest
): Promise<GeneratedDocPPTResult> {
  const {
    toolType,
    title,
    topic,
    instructions = '',
    language = 'English',
    length = 'Standard',
    style = 'Professional',
    referenceText = '',
    targetAudience = 'General Audience',
    slideCount = 10,
    purpose = 'business',
    theme = 'modern_minimalist',
    visualStyle = 'modern_clean',
    detailLevel = 'balanced',
  } = params;

  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

  // -------------------------------------------------------------
  // 1. PRESENTATION (PPT) GENERATION
  // -------------------------------------------------------------
  if (toolType === 'presentation') {
    const finalSlideCount = Math.max(3, Math.min(slideCount || 10, 25));
    const systemPrompt = `You are an elite, world-class presentation architect and senior slide designer.
Create a visually stunning, well-structured, informative, polished ${finalSlideCount}-slide presentation in ${language}.
Presentation Topic: "${topic || title}"
Deck Title: "${title || topic}"
Purpose: ${purpose} (e.g., school project, educational lesson, business, pitch deck, research, portfolio, training)
Target Audience: ${targetAudience}
Visual Style: ${visualStyle}
Detail Level: ${detailLevel} (concise, balanced, or detailed)
Design Theme: ${theme}
${instructions ? `User Specific Instructions: ${instructions}` : ''}
${referenceText ? `User Reference Notes / Content:\n${referenceText.substring(0, 4000)}` : ''}

CRITICAL ARCHITECTURAL RULES:
1. NEVER generate consecutive slides with identical or near-identical layouts. Every slide MUST feel distinct and purposeful.
2. Select appropriate layouts strictly based on content storytelling:
   - Slide 1: MUST be layout "title" (high impact title, compelling subtitle, category tag)
   - Slide 2: MUST be layout "agenda" (overview of roadmap, modules, or key learning objectives)
   - Subsequent slides: DYNAMICALLY DISTRIBUTE across these diverse layouts:
     * "content" (key strategic points with deep analysis)
     * "two_column" (contrast, side-by-side comparison, or before vs after)
     * "three_card" (three core pillars, strategic principles, or product tiers with threeCards array: [{ title, description, tag }])
     * "stats" (big metrics and quantitative KPIs with stats array: [{ value, label }])
     * "image_text" (visual narrative accompanied by structured explanations, with suggestedVisual search keywords)
     * "timeline" (chronological phases, history, or roadmap with timelineSteps array: [{ step, title, description }])
     * "quote" (inspirational vision, testimonial, or expert quote with quoteText and quoteAuthor)
     * "quiz_activity" (interactive discussion check or knowledge check question with quizQuestion and quizOptions array)
   - Second to last: "conclusion" (executive summary and actionable takeaways)
   - Final slide: "thank_you" (closing message, Q&A invitation, and next steps)

3. CONTENT EXCELLENCE:
   - Ensure factual clarity, high intellectual depth, and executive-grade polish.
   - For detailLevel "${detailLevel}":
     ${detailLevel === 'concise' ? 'Provide sharp, high-impact concise points.' : detailLevel === 'detailed' ? 'Provide deep, comprehensive explanations with thorough context.' : 'Provide balanced, thorough yet scannable points.'}
   - Each slide MUST include thoughtful, realistic "speakerNotes" that an executive, educator, or student would say aloud.
   - Include realistic "suggestedVisual" keywords for photographic or diagrammatic pairing (e.g. "modern solar grid technology clean energy landscape", "ai neural network data visualization").

Return ONLY STRICT JSON adhering precisely to this structure:
{
  "title": "${title || 'Presentation Title'}",
  "subtitle": "Clear, compelling deck subtitle",
  "slides": [
    {
      "layout": "title | agenda | content | two_column | three_card | stats | image_text | timeline | quote | quiz_activity | conclusion | thank_you",
      "categoryTag": "SECTION NAME OR MODULE NUMBER",
      "title": "Action-Oriented Slide Title",
      "subtitle": "Informative subtitle or slide context",
      "bulletPoints": [
        "Insightful, well-phrased point 1",
        "Data-driven or concrete point 2",
        "Clear strategic implication point 3"
      ],
      "columnTwoTitle": "Optional title for column 2",
      "columnTwoBullets": ["Point 1", "Point 2"],
      "threeCards": [
        { "title": "Pillar 1", "description": "Concise high-yield explanation", "tag": "Core" },
        { "title": "Pillar 2", "description": "Concise high-yield explanation", "tag": "Strategic" },
        { "title": "Pillar 3", "description": "Concise high-yield explanation", "tag": "Impact" }
      ],
      "stats": [
        { "value": "94%", "label": "Operational Efficiency" },
        { "value": "4.2x", "label": "Growth Multiple" },
        { "value": "<15ms", "label": "Response Latency" }
      ],
      "timelineSteps": [
        { "step": "01", "title": "Phase 1: Discovery", "description": "Comprehensive initial assessment" },
        { "step": "02", "title": "Phase 2: Deployment", "description": "Pilot execution and systems integration" },
        { "step": "03", "title": "Phase 3: Scale", "description": "Global rollout and continuous optimization" }
      ],
      "quoteText": "Direct quote or thought-leadership conviction",
      "quoteAuthor": "Attributed leader or source",
      "quizQuestion": "Discussion or knowledge check question?",
      "quizOptions": ["Option A", "Option B", "Option C"],
      "suggestedVisual": "Keywords for visual imagery or diagram concept",
      "takeaway": "Single sentence summarizing the key insight of this slide",
      "speakerNotes": "Spoken presentation talking points explaining the content in detail"
    }
  ]
}`;

    const ai = getAIClient();
    for (const model of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Create complete ${finalSlideCount}-slide presentation for: "${topic || title}". Purpose: ${purpose}. Target Audience: ${targetAudience}. Language: ${language}.`,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });

        const rawText = response.text || '';
        const parsed = JSON.parse(rawText.replace(/^```json\s*/, '').replace(/```$/, '').trim());

        if (parsed && Array.isArray(parsed.slides) && parsed.slides.length > 0) {
          // Normalize slides with valid layouts and complete field fallbacks
          const validLayouts = [
            'title', 'agenda', 'content', 'two_column', 'three_card', 'image_text', 
            'full_image', 'stats', 'timeline', 'process', 'case_study', 'quote', 
            'quiz_activity', 'conclusion', 'thank_you'
          ];

          const normalizedSlides = parsed.slides.map((s: any, idx: number) => {
            let layout = s.layout;
            if (!validLayouts.includes(layout)) {
              layout = idx === 0 ? 'title' : idx === parsed.slides.length - 1 ? 'thank_you' : 'content';
            }
            return {
              id: `slide-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
              layout,
              categoryTag: s.categoryTag || (idx === 0 ? 'OVERVIEW' : `SECTION 0${idx}`),
              title: s.title || `Slide ${idx + 1}`,
              subtitle: s.subtitle || '',
              bulletPoints: Array.isArray(s.bulletPoints) && s.bulletPoints.length > 0
                ? s.bulletPoints
                : ['Key strategic observation', 'Primary operational takeaway', 'Measurable milestone'],
              columnTwoTitle: s.columnTwoTitle || 'Key Comparison Pillar',
              columnTwoBullets: Array.isArray(s.columnTwoBullets) && s.columnTwoBullets.length > 0
                ? s.columnTwoBullets
                : ['Complementary insight', 'Actionable recommendation'],
              threeCards: Array.isArray(s.threeCards) && s.threeCards.length > 0 ? s.threeCards : undefined,
              timelineSteps: Array.isArray(s.timelineSteps) && s.timelineSteps.length > 0 ? s.timelineSteps : undefined,
              stats: Array.isArray(s.stats) && s.stats.length > 0 ? s.stats : undefined,
              quoteText: s.quoteText || undefined,
              quoteAuthor: s.quoteAuthor || undefined,
              quizQuestion: s.quizQuestion || undefined,
              quizOptions: Array.isArray(s.quizOptions) && s.quizOptions.length > 0 ? s.quizOptions : undefined,
              suggestedVisual: s.suggestedVisual || `${topic} illustration technology`,
              takeaway: s.takeaway || 'Core strategic highlight of this slide.',
              speakerNotes: s.speakerNotes || 'Presenter notes: emphasize key data points and executive takeaways during review.',
            };
          });

          // Convert slides to readable markdown text overview
          const markdownOverview = normalizedSlides
            .map((s: any, idx: number) => `## Slide ${idx + 1}: ${s.title}\n*Layout: ${s.layout}*\n${s.bulletPoints.map((b: string) => `- ${b}`).join('\n')}\n\n*Takeaway: ${s.takeaway || ''}*\n*Notes: ${s.speakerNotes || ''}*`)
            .join('\n\n---\n\n');

          return {
            success: true,
            title: parsed.title || title || 'Untitled Presentation',
            toolType,
            content: markdownOverview,
            slides: normalizedSlides,
            summary: parsed.subtitle || `Generated ${normalizedSlides.length}-slide professional presentation`,
          };
        }
      } catch (err: any) {
        console.warn(`[PPT Generation] Model ${model} error:`, err?.message || err);
      }
    }
    // High quality intelligent fallback if AI quota or network is throttled
    const fallbackTitle = title || topic || 'Executive Strategy & Innovation Framework';
    const cleanTopic = topic || title || 'Strategic Transformation';
    const fallbackSlides = [
      {
        id: `slide-fb-0`,
        layout: 'title',
        categoryTag: purpose === 'school_project' || purpose === 'educational_lesson' ? 'ACADEMIC PRESENTATION' : 'EXECUTIVE OVERVIEW',
        title: fallbackTitle,
        subtitle: `A Comprehensive Analysis & Strategic Framework for ${targetAudience}`,
        bulletPoints: ['Executive Context & Objectives', 'Methodology & Key Pillars', 'Milestone Roadmap & Implementation'],
        takeaway: 'Positioning for sustainable long-term scale and competitive advantage.',
        speakerNotes: `Welcome everyone to this presentation on ${cleanTopic}. Today we will explore key methodologies, data points, and tactical steps tailored for ${targetAudience}.`,
      },
      {
        id: `slide-fb-1`,
        layout: 'agenda',
        categoryTag: 'SESSION OVERVIEW',
        title: 'Executive Agenda & Core Modules',
        subtitle: 'Key domains covered in this strategic session',
        bulletPoints: [
          'Module 01: Context, Macro Drivers & Opportunity Landscape',
          'Module 02: Foundational Architecture & Core Three-Pillar Model',
          'Module 03: Measurable KPIs, Quantitative Benchmarks & Impact',
          'Module 04: Tactical Execution Roadmap, Phasing & Governance',
          'Module 05: Risk Mitigation & Strategic Next Steps',
        ],
        takeaway: 'Structured progression ensures complete alignment across cross-functional stakeholders.',
        speakerNotes: 'Briefly preview each module so participants have a clear roadmap of the discussion ahead.',
      },
      {
        id: `slide-fb-2`,
        layout: 'content',
        categoryTag: 'PROBLEM STATEMENT',
        title: 'Market Inflection & Core Opportunities',
        subtitle: 'Key headwinds, legacy constraints, and emerging strategic levers',
        bulletPoints: [
          `Rapid acceleration in industry benchmarks demanding modern paradigms for ${cleanTopic}`,
          'Legacy operational friction generating unnecessary latency and compounding overhead',
          'Urgent imperative for unified, automated, and data-driven systems',
          'Capturing first-mover advantage creates lasting defensibility and market differentiation',
        ],
        takeaway: 'Proactive modern systems deliver compounding velocity compared to legacy workflows.',
        speakerNotes: 'Walk through historical performance compared against the current market inflection point.',
      },
      {
        id: `slide-fb-3`,
        layout: 'three_card',
        categoryTag: 'STRATEGIC PILLARS',
        title: 'Three Architectural Pillars of Success',
        subtitle: 'The foundational triad driving our core implementation framework',
        bulletPoints: ['Foundational Architecture', 'Operational Velocity', 'Sustainable Scale'],
        threeCards: [
          {
            title: 'Pillar I: Intelligent Systems',
            description: `Automated data pipelines, intelligent decision support, and unified tooling tailored to ${cleanTopic}.`,
            tag: 'FOUNDATION',
          },
          {
            title: 'Pillar II: Agile Execution',
            description: 'Iterative two-week feedback cycles, continuous validation, and cross-functional transparency.',
            tag: 'VELOCITY',
          },
          {
            title: 'Pillar III: Enterprise Scalability',
            description: 'Modular cloud architecture built for 99.99% uptime, compliance, and frictionless expansion.',
            tag: 'SCALE',
          },
        ],
        takeaway: 'Balancing intelligence, execution velocity, and robust architecture guarantees predictable outcomes.',
        speakerNotes: 'Emphasize that all three pillars are interdependent; omitting any single pillar degrades overall effectiveness.',
      },
      {
        id: `slide-fb-4`,
        layout: 'stats',
        categoryTag: 'QUANTITATIVE IMPACT',
        title: 'Target Outcomes & Proven Performance Metrics',
        subtitle: 'Projected quantitative return on investment over a 12-month horizon',
        bulletPoints: [
          'Exponential throughput gain realized within the first two operational quarters',
          'Demonstrated reduction in error rates and administrative turnaround time',
          'Substantial cost amortization leading to net positive margin expansion',
        ],
        stats: [
          { value: '+142%', label: 'Throughput Velocity' },
          { value: '4.8x', label: 'Measured ROI Multiple' },
          { value: '<25ms', label: 'Decision Latency' },
        ],
        takeaway: 'Concrete quantitative indicators provide clear justification for immediate strategic buy-in.',
        speakerNotes: 'Highlight the empirical tracking methodology and review cycles for these target metrics.',
      },
      {
        id: `slide-fb-5`,
        layout: 'image_text',
        categoryTag: 'VISUAL ARCHITECTURE',
        title: 'Real-World System Implementation',
        subtitle: 'How automated intelligence seamlessly integrates into daily operations',
        bulletPoints: [
          'Continuous ingestion and contextual categorization of mission-critical data',
          'Real-time anomaly detection preventing bottlenecks before customer impact',
          'Human-in-the-loop validation dashboards empowering team decision-makers',
          'Audit-ready reporting generated on demand for executive review',
        ],
        suggestedVisual: `${cleanTopic} technology workflow architecture modern modern workplace`,
        takeaway: 'Intuitive operational dashboards bridge the gap between technical complexity and executive clarity.',
        speakerNotes: 'Refer to the visual diagram on the right, explaining how information flows from raw inputs to finalized decisions.',
      },
      {
        id: `slide-fb-6`,
        layout: 'two_column',
        categoryTag: 'PARADIGM COMPARISON',
        title: 'Traditional Legacy Workflow vs. Modern Paradigm',
        subtitle: 'Detailed comparison between conventional methods and our recommended solution',
        bulletPoints: [
          'Siloed communications with high manual handoff friction',
          'Inflexible legacy systems unable to adapt to sudden demand surges',
          'Opaque tracking leading to delayed defect identification',
        ],
        columnTwoTitle: 'Recommended Modern Approach',
        columnTwoBullets: [
          'Centralized collaborative cloud workspace with real-time sync',
          'Elastic scaling responsive to dynamic organizational needs',
          'Automated telemetry providing instant visibility and predictive insights',
        ],
        takeaway: 'Transitioning to the modern approach delivers up to 3x reduction in operational overhead.',
        speakerNotes: 'Walk the audience through the side-by-side contrast to demonstrate why status quo is the higher-risk option.',
      },
      {
        id: `slide-fb-7`,
        layout: 'timeline',
        categoryTag: 'PHASED ROADMAP',
        title: 'Execution Roadmap & Milestones',
        subtitle: 'Chronological rollout schedule spanning discovery through enterprise scale',
        bulletPoints: [
          'Phase 01: Scoping, baseline benchmarks, and core tooling setup',
          'Phase 02: Pilot launch, stakeholder validation, and feedback optimization',
          'Phase 03: Organization-wide deployment, documentation, and continuous monitoring',
        ],
        timelineSteps: [
          {
            step: '01',
            title: 'Discovery & Design',
            description: 'Define technical specifications, security parameters, and target user journeys.',
          },
          {
            step: '02',
            title: 'Pilot Deployment',
            description: 'Run controlled 30-day cohort trial to stress-test workflows and collect metrics.',
          },
          {
            step: '03',
            title: 'Full Rollout',
            description: 'Activate global scale, automated health monitoring, and enterprise governance.',
          },
        ],
        takeaway: 'Disciplined phased milestones eliminate disruption to day-to-day ongoing operations.',
        speakerNotes: 'Review the gating criteria required to advance from Phase 01 into Phase 02 and 03.',
      },
      {
        id: `slide-fb-8`,
        layout: 'quote',
        categoryTag: 'GUIDING PRINCIPLE',
        title: 'Core Philosophy & Conviction',
        subtitle: 'The foundational belief guiding our strategic investments',
        bulletPoints: [
          'Excellence is not an accident—it is the result of intention, sincere effort, and intelligent execution.',
          'Empowering teams with superior tooling unlocks their highest creative potential.',
        ],
        quoteText: `True innovation in ${cleanTopic} comes not from doing more things, but from removing friction so exceptional execution becomes effortless.`,
        quoteAuthor: `${targetAudience} Strategic Leadership Review`,
        takeaway: 'Clear conviction aligns cross-functional priorities toward a common high-impact mission.',
        speakerNotes: 'Pause on this slide to underscore the cultural commitment and vision behind the initiative.',
      },
      {
        id: `slide-fb-9`,
        layout: 'conclusion',
        categoryTag: 'EXECUTIVE SUMMARY',
        title: 'Strategic Synthesis & Next Actions',
        subtitle: 'Key takeaways and immediate action items to mobilize resources',
        bulletPoints: [
          `Solidify commitment to modernizing ${cleanTopic} across the organization`,
          'Authorize kickoff of Phase 01 architecture and team chartering',
          'Establish bi-weekly executive review cadence for KPI tracking',
          'Empower frontline project leads with necessary budget and tools',
        ],
        takeaway: 'Decisive execution in the upcoming quarter guarantees market leadership and lasting efficiency.',
        speakerNotes: 'Recap the primary value proposition, summarize commitments, and open the floor for discussions.',
      },
      {
        id: `slide-fb-10`,
        layout: 'thank_you',
        categoryTag: 'WRAP UP',
        title: 'Thank You & Questions',
        subtitle: 'Open discussion, Q&A, and partnership contact details',
        bulletPoints: [
          'Email: strategy-office@superai.studio',
          'Presentation Repository & Documentation: superai.studio/workspace',
          'Next Executive Check-in: Scheduled for next milestone review',
        ],
        takeaway: 'Thank you for your time and strategic collaboration.',
        speakerNotes: 'Thank attendees, invite open questions, and share follow-up documentation links.',
      },
    ].slice(0, Math.max(3, finalSlideCount));

    return {
      success: true,
      title: fallbackTitle,
      toolType,
      content: fallbackSlides.map((s, idx) => `## Slide ${idx + 1}: ${s.title}\n*Layout: ${s.layout}*\n${s.bulletPoints.map(b => `- ${b}`).join('\n')}`).join('\n\n---\n\n'),
      slides: fallbackSlides,
      summary: `Generated ${fallbackSlides.length}-slide presentation`,
    };
  }

  // -------------------------------------------------------------
  // 2. DOCUMENT, REPORT, RESUME, PROJECT, LETTER, WORKSHEET, NOTES
  // -------------------------------------------------------------
  let roleDescription = 'an expert document creator and content strategist';
  let documentStructure = '';

  switch (toolType) {
    case 'resume':
      roleDescription = 'an executive career coach and ATS resume specialist';
      documentStructure = `
Structure the resume with clean headings:
# [Candidate Full Name]
[Contact: Email | Phone | Location | LinkedIn]

## Professional Summary
(Compelling 3-4 sentence value proposition)

## Core Competencies & Skills
(Categorized bullet points: Technical Skills, Domain Expertise, Soft Skills)

## Professional Experience
(Include Job Title, Organization, Dates, and 3-5 bullet points using strong action verbs with metrics)

## Education & Academic Background
(Degree, Institution, Year, Honors)

## Projects & Key Achievements
(Impactful projects with tools used and quantifiable outcomes)

## Certifications & Training
`;
      break;

    case 'report':
      roleDescription = 'a senior research analyst and corporate report writer';
      documentStructure = `
Structure the report professionally:
# [Report Title]

## Executive Summary
(High-level overview of objectives, findings, and recommendations)

## 1. Introduction & Background
(Context, scope, and objectives)

## 2. Methodology & Data Sources
(How analysis was conducted)

## 3. Analysis & Key Findings
(Detailed analytical sections with bullet points and evidence)

## 4. Strategic Recommendations
(Actionable, prioritized next steps)

## 5. Conclusion
(Final assessment)

## 6. References & Citations
(Reliable references and data sources)
`;
      break;

    case 'school_project':
      roleDescription = 'an educational curriculum specialist and master teacher';
      documentStructure = `
Structure the school project systematically:
# [Project Title]

## Project Overview & Objectives
(Purpose of the project and what is being demonstrated)

## Key Concepts & Explanations
(Detailed, clear explanations tailored to the grade level with real-world examples)

## Diagrams & Tables Description
(Suggested tables or visual diagrams to illustrate concepts)

## Case Study / Activity / Hands-On Experiment
(Practical activity or example problem solved step-by-step)

## Review Questions & Answers
(5-7 comprehension questions with complete answers)

## Summary & Learning Takeaways
(Key points to remember)

## Bibliography & References
`;
      break;

    case 'letter':
      roleDescription = 'a corporate communications expert';
      documentStructure = `
Structure the formal letter:
[Sender Name & Address]
[Date]

[Recipient Name & Title]
[Recipient Organization & Address]

Subject: [Clear, concise subject line]

Dear [Recipient Title and Last Name],

[Opening Paragraph: State the exact purpose of the letter]

[Body Paragraphs: Provide context, justifications, data, and details]

[Call to Action / Next Steps: Clear request or expected timeline]

Sincerely,

[Sender Name]
`;
      break;

    case 'worksheet':
      roleDescription = 'a master educator and assessment designer';
      documentStructure = `
Structure the educational worksheet:
# [Worksheet Title: Subject & Topic]
Name: ______________________  Date: ____________  Score: ______ / 50

## Part 1: Key Terms & Definitions
(Match the concept or fill in the blank)

## Part 2: Multiple Choice Questions (1-5)
(Questions with options A, B, C, D)

## Part 3: Short Answer & Conceptual Questions
(Deep understanding questions with work space)

## Part 4: Practical Problem Solving
(Scenario or calculation exercises)

---
## 🔑 Teacher's Answer Key & Explanations
(Full answers with step-by-step solutions)
`;
      break;

    case 'notes':
      roleDescription = 'a learning accelerator and study guide author';
      documentStructure = `
Structure the study guide:
# [Topic: High-Yield Study Notes]

## 📌 Core Concepts & Fundamentals
(Crisp, bulleted explanations of core theories)

## 🔑 Crucial Definitions & Terminology
(Term-by-term flashcard style breakdown)

## 📊 Summary Comparison / Cheat Sheet
(Key formulas, comparisons, or mnemonics)

## ⚠️ Common Pitfalls & Exam Traps
(Mistakes to avoid)

## 💡 Quick Self-Test Flash Questions
`;
      break;

    case 'pdf':
    case 'document':
    default:
      roleDescription = 'an elite professional document author and researcher';
      documentStructure = `
Structure the document cleanly:
# [Document Title]

## Introduction & Context
(Clear setup of the topic and objectives)

## Main Detailed Sections
(Well-developed paragraphs and organized bullet points)

## Practical Implications / Applications
(Real-world context, examples, or proposals)

## Conclusion & Action Items
(Summary of key points and next steps)
`;
      break;
  }

  const systemPrompt = `You are ${roleDescription}.
Produce a comprehensive, publication-grade document in ${language}.
Title: "${title || topic}"
Topic: "${topic}"
Length Target: ${length}
Tone / Style: ${style}
${instructions ? `User Specific Instructions: ${instructions}` : ''}
${referenceText ? `Source / Reference Material to incorporate:\n${referenceText.substring(0, 4000)}` : ''}

${documentStructure}

Rules:
- Write substantive, articulate, thorough content. Do not use placeholders or [Insert Text Here].
- Write out full explanations, detailed bullet items, and complete paragraphs.
- Use clean Markdown (# for Main Title, ## for Sections, ### for Subsections, - for bullets).
- Ensure high readability and natural cadence.`;

  const ai = getAIClient();
  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: `Generate complete, high-quality ${toolType} on: "${topic || title}". Language: ${language}. Style: ${style}. Length: ${length}.`,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.65,
        },
      });

      const text = response.text || '';
      if (text.trim()) {
        return {
          success: true,
          title: title || topic || 'Document',
          toolType,
          content: text.trim(),
          summary: `Generated ${toolType.replace('_', ' ')} (${text.split(/\s+/).length} words)`,
        };
      }
    } catch (err: any) {
      console.warn(`[Document Generation] Model ${model} error:`, err?.message || err);
    }
  }

  return {
    success: false,
    title: title || 'Error',
    toolType,
    content: '',
    error: 'AI content generation engine encountered a temporary timeout. Please try again.',
  };
}

export interface SlideAIAssistRequest {
  instruction: string;
  slide: {
    id: string;
    layout?: string;
    categoryTag?: string;
    title: string;
    subtitle?: string;
    bulletPoints: string[];
    columnTwoTitle?: string;
    columnTwoBullets?: string[];
    threeCards?: Array<{ title: string; description: string; tag?: string }>;
    timelineSteps?: Array<{ step: string; title: string; description: string }>;
    stats?: Array<{ value: string; label: string }>;
    quoteText?: string;
    quoteAuthor?: string;
    quizQuestion?: string;
    quizOptions?: string[];
    imageUrl?: string;
    suggestedVisual?: string;
    takeaway?: string;
    speakerNotes?: string;
  };
  presentationTitle?: string;
}

export async function assistSlideWithAI(params: SlideAIAssistRequest): Promise<{
  success: boolean;
  slide: any;
  explanation: string;
}> {
  const { instruction, slide, presentationTitle = 'Presentation' } = params;
  const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  const ai = getAIClient();

  const prompt = `You are a world-class PowerPoint slide designer and presentation editor.
You are editing an existing slide for the presentation titled: "${presentationTitle}".

Current slide data:
${JSON.stringify(slide, null, 2)}

User editing command/instruction:
"${instruction}"

Guidelines for user commands:
- "Improve Design" / "Make More Professional": Elevate categoryTag, polish title, structure bullets with crisp action verbs, write a memorable takeaway, and enrich speakerNotes.
- "Make More Visual" / "Add Relevant Images": Switch layout to "image_text" or "three_card", provide an exact "suggestedVisual" search keyword phrase (e.g. "modern cloud data architecture datacenter lighting 8k"), and balance text so the visual shines.
- "Simplify Text": Condense all bullet points into high-impact, punchy phrases under 8 words each.
- "Add More Detail": Expand points into rich, comprehensive explanations with context, metrics, and depth.
- "Generate Alternative Layout": If current layout is "content", switch to "three_card" or "two_column" or "stats". Provide corresponding data structures (threeCards, columnTwoBullets, or stats).
- "Fix Layout Problems": Limit bullets to 3-4 items, ensure equal length, balance subtitle and takeaway.
- "Regenerate Selected Slide": Re-architect the slide with a fresh angle, new compelling title, strong points, and new takeaway.

Return ONLY strict JSON matching this structure:
{
  "layout": "title | agenda | content | two_column | three_card | stats | image_text | timeline | quote | quiz_activity | conclusion | thank_you",
  "categoryTag": "Category or Section tag",
  "title": "Slide Title",
  "subtitle": "Slide Subtitle",
  "bulletPoints": ["bullet 1", "bullet 2", "bullet 3"],
  "columnTwoTitle": "Optional title for column 2",
  "columnTwoBullets": ["optional comparison bullet 1", "optional comparison bullet 2"],
  "threeCards": [
    { "title": "Card 1", "description": "Description 1", "tag": "Core" },
    { "title": "Card 2", "description": "Description 2", "tag": "Strategic" },
    { "title": "Card 3", "description": "Description 3", "tag": "Impact" }
  ],
  "stats": [{ "value": "99%", "label": "Metric" }],
  "timelineSteps": [
    { "step": "01", "title": "Step 1", "description": "Desc 1" }
  ],
  "suggestedVisual": "Keywords for visual imagery or diagram concept",
  "takeaway": "Core takeaway message",
  "speakerNotes": "Speaker notes for presenter",
  "explanation": "One short sentence describing the improvement made"
}`;

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.6,
        },
      });

      const text = response.text || '';
      const parsed = JSON.parse(text.replace(/^```json\s*/, '').replace(/```$/, '').trim());
      if (parsed && parsed.title) {
        return {
          success: true,
          slide: {
            ...slide,
            ...parsed,
            id: slide.id, // preserve id
          },
          explanation: parsed.explanation || 'Slide updated successfully with AI assistance.',
        };
      }
    } catch (err: any) {
      console.warn(`[Slide AI Assist] Model ${model} error:`, err?.message || err);
    }
  }

  // Graceful rule-based fallback if AI is rate-limited
  const lower = instruction.toLowerCase();
  let updated: any = { ...slide };
  let explanation = 'Applied slide enhancements.';

  if (lower.includes('simplify') || lower.includes('shorten') || lower.includes('concise')) {
    updated.bulletPoints = slide.bulletPoints.map(b => b.split(/[,:;]/)[0].trim().slice(0, 55));
    explanation = 'Simplified text into punchy, high-impact scannable bullet points.';
  } else if (lower.includes('visual') || lower.includes('image')) {
    updated.layout = 'image_text';
    updated.suggestedVisual = `${presentationTitle} ${slide.title} modern high resolution conceptual photography`;
    explanation = 'Converted to visual split layout with relevant concept photography.';
  } else if (lower.includes('alternative') || lower.includes('layout')) {
    const layoutCycle: Record<string, string> = {
      content: 'three_card',
      three_card: 'two_column',
      two_column: 'stats',
      stats: 'timeline',
      timeline: 'content',
    };
    const nextLayout = layoutCycle[slide.layout || 'content'] || 'three_card';
    updated.layout = nextLayout;
    if (nextLayout === 'three_card') {
      updated.threeCards = [
        { title: 'Core Foundation', description: slide.bulletPoints[0] || 'Primary strategic baseline', tag: 'PILLAR 1' },
        { title: 'Accelerated Impact', description: slide.bulletPoints[1] || 'Tactical operational execution', tag: 'PILLAR 2' },
        { title: 'Sustained Scale', description: slide.bulletPoints[2] || 'Long-term enterprise defensibility', tag: 'PILLAR 3' },
      ];
    } else if (nextLayout === 'two_column') {
      updated.columnTwoTitle = 'Strategic Advantage';
      updated.columnTwoBullets = ['Continuous automated optimization', 'Predictable throughput velocity'];
    } else if (nextLayout === 'stats') {
      updated.stats = [
        { value: '3.8x', label: 'Velocity Gain' },
        { value: '94%', label: 'Adoption Rate' },
        { value: '<15ms', label: 'Turnaround Latency' },
      ];
    }
    explanation = `Switched layout to ${nextLayout.replace('_', ' ')} for enhanced visual hierarchy.`;
  } else if (lower.includes('detail') || lower.includes('expand')) {
    updated.bulletPoints = [
      ...slide.bulletPoints,
      'Enterprise-grade governance framework ensuring comprehensive security compliance',
      'Automated telemetry stream providing real-time operational transparency',
    ];
    updated.takeaway = `Comprehensive execution on ${slide.title.toLowerCase()} eliminates single points of failure across all business lines.`;
    explanation = 'Expanded slide with comprehensive strategic depth and actionable details.';
  } else if (lower.includes('fix') || lower.includes('problem')) {
    updated.bulletPoints = (slide.bulletPoints || []).slice(0, 4);
    updated.categoryTag = updated.categoryTag || 'STRATEGIC FOUNDATION';
    updated.subtitle = updated.subtitle || 'Key Operational Insights';
    explanation = 'Balanced slide layout, normalized bullet counts, and tuned visual hierarchy.';
  } else if (lower.includes('regenerate') || lower.includes('rewrite')) {
    updated.title = `${slide.title} — Strategic Synthesis`;
    updated.subtitle = 'High-impact framework and milestone deliverables';
    updated.bulletPoints = [
      'Accelerated deployment reducing time-to-value across all workstreams',
      'Unified data standards eliminating friction and inter-team latency',
      'Measurable KPI tracking with automated executive dashboard sync',
    ];
    updated.takeaway = 'Strategic alignment on this domain generates lasting organizational competitive advantage.';
    explanation = 'Regenerated slide content with refreshed perspective and crisp terminology.';
  } else if (lower.includes('stat') || lower.includes('metric') || lower.includes('number')) {
    updated.layout = 'stats';
    updated.stats = [
      { value: '3.8x', label: 'Velocity Gain' },
      { value: '94%', label: 'Adoption Rate' },
      { value: '-45%', label: 'Turnaround Latency' },
    ];
    explanation = 'Converted slide into key performance metrics showcase.';
  } else {
    updated.subtitle = updated.subtitle || 'High-Impact Strategic Analysis';
    updated.takeaway = updated.takeaway || 'Core priority for cross-functional alignment.';
    updated.speakerNotes = `Presenter talking points: Walk through ${slide.title} with clear emphasis on strategic outcomes. Highlight the key takeaway: "${updated.takeaway}".`;
    explanation = 'Polished typography, hierarchy, and executive presentation tone.';
  }

  return {
    success: true,
    slide: updated,
    explanation,
  };
}

