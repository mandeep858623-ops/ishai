/**
 * Whiteboard Utilities for tldraw v3
 * Handles richText conversion, text extraction, and snapshot sanitization.
 */

export interface TLRichTextParagraph {
  type: 'paragraph';
  content?: Array<{ type: 'text'; text: string }>;
}

export interface TLRichTextDoc {
  type: 'doc';
  content: TLRichTextParagraph[];
}

/**
 * Converts a plain string to tldraw v3 richText document format.
 */
export function toRichText(text: string): TLRichTextDoc {
  const lines = (text || '').split('\n');
  return {
    type: 'doc',
    content: lines.map((line) => {
      if (!line) {
        return { type: 'paragraph' };
      }
      return {
        type: 'paragraph',
        content: [{ type: 'text', text: line }],
      };
    }),
  };
}

/**
 * Extracts plain text from a tldraw v3 richText document structure.
 */
export function fromRichText(richText: any): string {
  if (!richText) return '';
  if (typeof richText === 'string') return richText;
  if (Array.isArray(richText.content)) {
    return richText.content
      .map((block: any) => {
        if (Array.isArray(block?.content)) {
          return block.content.map((c: any) => c?.text || '').join('');
        }
        return '';
      })
      .join('\n');
  }
  return '';
}

/**
 * Extracts all readable text from any tldraw shape.
 */
export function extractShapeText(shape: any): string {
  if (!shape || !shape.props) return '';
  if (shape.props.richText) {
    const txt = fromRichText(shape.props.richText);
    if (txt) return txt;
  }
  if (shape.props.text) {
    return String(shape.props.text);
  }
  if (shape.props.label) {
    return String(shape.props.label);
  }
  if (shape.type === 'geo' && shape.props.geo) {
    return `[Shape: ${shape.props.geo}]`;
  }
  return '';
}

/**
 * Sanitizes a snapshot before loading into tldraw store.
 * Migrates any legacy props.text into props.richText and deletes props.text
 * to prevent tldraw ValidationError from throwing.
 */
export function sanitizeSnapshot(snapshot: any): any {
  if (!snapshot || typeof snapshot !== 'object') return snapshot;
  try {
    const cloned = JSON.parse(JSON.stringify(snapshot));
    const store = cloned.store || (cloned.document && cloned.document.store);
    if (store && typeof store === 'object') {
      Object.keys(store).forEach((key) => {
        const record = store[key];
        if (record && record.typeName === 'shape' && record.props) {
          if (record.props.text !== undefined) {
            if (!record.props.richText) {
              record.props.richText = toRichText(record.props.text);
            }
            delete record.props.text;
          }
        }
      });
    }
    return cloned;
  } catch (err) {
    console.warn('Snapshot sanitize warning:', err);
    return snapshot;
  }
}
