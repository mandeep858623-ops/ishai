import { createShapeId } from 'tldraw';
import { toRichText } from './whiteboardUtils';

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  tagColor: string;
  generateShapes: () => any[];
}

export const WHITEBOARD_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'blank',
    name: 'Blank Board',
    description: 'A clean, infinite canvas studio with a subtle dot grid.',
    category: 'General',
    tagColor: 'zinc',
    generateShapes: () => [],
  },
  {
    id: 'brainstorm',
    name: 'Brainstorm Studio',
    description: 'Categorized brainstorming workspace with themed columns and sticky notes.',
    category: 'Ideation',
    tagColor: 'cyan',
    generateShapes: () => {
      const shapes: any[] = [];
      const titleId = createShapeId();
      shapes.push({
        id: titleId,
        type: 'text',
        x: 100,
        y: 60,
        props: {
          richText: toRichText('⚡ STRATEGIC BRAINSTORM SESSION'),
          size: 'l',
          color: 'blue',
          font: 'sans',
        },
      });

      const columns = [
        {
          title: '🎯 CORE OBJECTIVES',
          color: 'light-blue',
          x: 100,
          notes: [
            'Define Q3 performance milestones',
            'Streamline user onboarding velocity',
          ],
        },
        {
          title: '💡 BREAKTHROUGH IDEAS',
          color: 'violet',
          x: 420,
          notes: [
            'Autonomous AI canvas assistant',
            'Real-time collaborative diagramming',
            'Instant LaTeX & diagram renderer',
          ],
        },
        {
          title: '⚠️ RISKS & ROADBLOCKS',
          color: 'orange',
          x: 740,
          notes: [
            'API rate limits on large clusters',
            'Stylus latency on low-end hardware',
          ],
        },
        {
          title: '🚀 QUICK WINS & NEXT STEPS',
          color: 'green',
          x: 1060,
          notes: [
            'Deploy PDF export with vector fidelity',
            'Set up keyboard hotkey guide',
          ],
        },
      ];

      columns.forEach((col) => {
        // Background card
        const colId = createShapeId();
        shapes.push({
          id: colId,
          type: 'geo',
          x: col.x,
          y: 120,
          props: {
            geo: 'rectangle',
            w: 280,
            h: 520,
            color: 'grey',
            fill: 'none',
            richText: toRichText(col.title),
            size: 's',
            font: 'sans',
          },
        });

        // Notes inside column
        col.notes.forEach((noteText, idx) => {
          shapes.push({
            id: createShapeId(),
            type: 'note',
            x: col.x + 20,
            y: 180 + idx * 140,
            props: {
              richText: toRichText(noteText),
              color: col.color,
              size: 's',
            },
          });
        });
      });

      return shapes;
    },
  },
  {
    id: 'mindmap',
    name: 'Mind Map',
    description: 'Structured radial diagram with editable core concept, branches, and connector arrows.',
    category: 'Planning',
    tagColor: 'violet',
    generateShapes: () => {
      const shapes: any[] = [];
      const rootId = createShapeId();
      const centerX = 600;
      const centerY = 350;

      // Central Hub
      shapes.push({
        id: rootId,
        type: 'geo',
        x: centerX - 140,
        y: centerY - 45,
        props: {
          geo: 'rectangle',
          w: 280,
          h: 90,
          richText: toRichText('🌐 ISHAI CORE ECOSYSTEM\n[Central Architecture]'),
          color: 'violet',
          fill: 'semi',
          size: 'm',
          font: 'sans',
        },
      });

      const branches = [
        {
          text: '⚡ INTELLIGENCE\n• Gemini Flash\n• Vision OCR\n• Memory Vault',
          color: 'light-blue',
          x: centerX - 420,
          y: centerY - 180,
        },
        {
          text: '🎨 CREATIVE SUITE\n• Whiteboard Studio\n• Image Studio\n• Video Compositor',
          color: 'blue',
          x: centerX + 180,
          y: centerY - 180,
        },
        {
          text: '🛡️ SECURITY MATRIX\n• ABAC Rules\n• Intruder Defense\n• Cloud Firestore',
          color: 'green',
          x: centerX - 420,
          y: centerY + 140,
        },
        {
          text: '🚀 RUNTIME & LAB\n• Three.js Procedural\n• WebXR Virtual Reality\n• WebRTC Voice',
          color: 'orange',
          x: centerX + 180,
          y: centerY + 140,
        },
      ];

      branches.forEach((b) => {
        const branchId = createShapeId();
        shapes.push({
          id: branchId,
          type: 'geo',
          x: b.x,
          y: b.y,
          props: {
            geo: 'rectangle',
            w: 240,
            h: 110,
            richText: toRichText(b.text),
            color: b.color,
            fill: 'semi',
            size: 's',
            font: 'sans',
          },
        });

        // Connector Arrow
        shapes.push({
          id: createShapeId(),
          type: 'arrow',
          props: {
            start: {
              type: 'binding',
              boundShapeId: rootId,
              normalizedAnchor: { x: 0.5, y: 0.5 },
              isExact: false,
            },
            end: {
              type: 'binding',
              boundShapeId: branchId,
              normalizedAnchor: { x: 0.5, y: 0.5 },
              isExact: false,
            },
            color: 'grey',
            dash: 'draw',
            size: 'm',
          },
        });
      });

      return shapes;
    },
  },
  {
    id: 'study',
    name: 'Study Notes',
    description: 'Structured Cornell-style study guide with key takeaways, formulas, and summary checklist.',
    category: 'Education',
    tagColor: 'emerald',
    generateShapes: () => {
      const shapes: any[] = [];

      shapes.push({
        id: createShapeId(),
        type: 'text',
        x: 80,
        y: 60,
        props: {
          richText: toRichText('📖 DISTRIBUTED SYSTEMS & CONCURRENCY'),
          size: 'l',
          color: 'blue',
          font: 'sans',
        },
      });

      // Left column: Keywords & Questions
      shapes.push({
        id: createShapeId(),
        type: 'geo',
        x: 80,
        y: 120,
        props: {
          geo: 'rectangle',
          w: 300,
          h: 460,
          color: 'grey',
          fill: 'none',
          richText: toRichText('📌 KEY CUES & QUESTIONS\n\n• What is the CAP theorem?\n• How does Paxos achieve consensus?\n• Vector Clocks vs Wall Clock\n• Zero-Trust ABAC isolation'),
          size: 's',
          font: 'sans',
        },
      });

      // Right column: Detailed Notes
      shapes.push({
        id: createShapeId(),
        type: 'note',
        x: 410,
        y: 120,
        props: {
          richText: toRichText('CAP Theorem:\nA distributed data store can only guarantee at most two out of:\n1. Consistency (C)\n2. Availability (A)\n3. Partition Tolerance (P)'),
          color: 'light-blue',
          size: 'm',
        },
      });

      shapes.push({
        id: createShapeId(),
        type: 'note',
        x: 740,
        y: 120,
        props: {
          richText: toRichText('Key Invariant:\nIn the presence of a network partition (P), one must choose between Consistency (cancel the request) or Availability (return stale data).'),
          color: 'violet',
          size: 'm',
        },
      });

      // Bottom Summary
      shapes.push({
        id: createShapeId(),
        type: 'geo',
        x: 80,
        y: 600,
        props: {
          geo: 'rectangle',
          w: 920,
          h: 120,
          color: 'green',
          fill: 'semi',
          richText: toRichText('📝 SUMMARY TAKEAWAYS:\nModern web applications prioritize partition tolerance with tunable consistency models (e.g. eventual consistency with vector clocks and idempotent replication).'),
          size: 's',
          font: 'sans',
        },
      });

      return shapes;
    },
  },
  {
    id: 'kanban',
    name: 'Project Planning',
    description: 'Agile Kanban board with Backlog, In Progress, Review, and Done columns.',
    category: 'Productivity',
    tagColor: 'orange',
    generateShapes: () => {
      const shapes: any[] = [];

      shapes.push({
        id: createShapeId(),
        type: 'text',
        x: 100,
        y: 60,
        props: {
          richText: toRichText('📋 AGILE SPRINT BOARD (SPRINT 42)'),
          size: 'l',
          color: 'blue',
          font: 'sans',
        },
      });

      const cols = [
        {
          title: '📋 BACKLOG (3)',
          x: 100,
          color: 'grey',
          tasks: [
            { text: 'Add WebRTC screen share support', color: 'grey' },
            { text: 'Refactor audio oscillator envelope', color: 'grey' },
          ],
        },
        {
          title: '⚡ IN PROGRESS (2)',
          x: 420,
          color: 'light-blue',
          tasks: [
            { text: 'Whiteboard infinite canvas release', color: 'blue' },
            { text: 'Gemini OCR sketch recognition', color: 'light-blue' },
          ],
        },
        {
          title: '🔍 IN REVIEW (1)',
          x: 740,
          color: 'violet',
          tasks: [
            { text: 'Three.js WebXR headset tracking test', color: 'violet' },
          ],
        },
        {
          title: '✅ COMPLETED (3)',
          x: 1060,
          color: 'green',
          tasks: [
            { text: 'Firebase zero-trust security rules', color: 'green' },
            { text: 'Mechanical Lab STL/GLTF exporter', color: 'green' },
          ],
        },
      ];

      cols.forEach((col) => {
        shapes.push({
          id: createShapeId(),
          type: 'geo',
          x: col.x,
          y: 120,
          props: {
            geo: 'rectangle',
            w: 280,
            h: 500,
            color: 'grey',
            fill: 'none',
            richText: toRichText(col.title),
            size: 's',
            font: 'sans',
          },
        });

        col.tasks.forEach((task, idx) => {
          shapes.push({
            id: createShapeId(),
            type: 'note',
            x: col.x + 20,
            y: 175 + idx * 135,
            props: {
              richText: toRichText(task.text),
              color: task.color,
              size: 's',
            },
          });
        });
      });

      return shapes;
    },
  },
];
