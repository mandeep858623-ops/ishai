/**
 * Gemini-powered AI Email Assistant Service for ISHAI Gmail Workspace
 */

export async function aiAssistEmailDraft(params: {
  topic: string;
  recipientName?: string;
  tone?: 'Formal' | 'Friendly' | 'Persuasive' | 'Executive' | 'Urgent';
  keyPoints?: string;
}): Promise<{ subject: string; bodyHtml: string }> {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `Write a complete email draft based on this request:
Topic / Intent: ${params.topic}
Recipient: ${params.recipientName || 'Valued Recipient'}
Tone: ${params.tone || 'Formal'}
Key Points: ${params.keyPoints || 'None specified'}

Return a JSON object in this exact format:
{
  "subject": "Subject line here",
  "bodyHtml": "<p>Professional email body in HTML format...</p>"
}`
      })
    });

    const data = await response.json();
    if (data.answer) {
      // Clean JSON string if enclosed in markdown backticks
      const cleanJson = data.answer.replace(/```json\s*|```/g, '').trim();
      try {
        const parsed = JSON.parse(cleanJson);
        return {
          subject: parsed.subject || 'Follow-up Regarding Project',
          bodyHtml: parsed.bodyHtml || `<p>${data.answer}</p>`
        };
      } catch {
        return {
          subject: 'Communication from ISHAI',
          bodyHtml: `<p>${data.answer.replace(/\n/g, '<br/>')}</p>`
        };
      }
    }
    throw new Error('No draft generated');
  } catch (err: any) {
    console.error('AI Draft Error:', err);
    return {
      subject: `Draft: ${params.topic.slice(0, 40)}`,
      bodyHtml: `<p>Dear ${params.recipientName || 'Team'},</p><p>${params.topic}</p><p>Best regards,<br/>Sent via ISHAI Gmail Workspace</p>`
    };
  }
}

export async function aiImproveEmail(params: {
  text: string;
  action: 'polish' | 'subject_suggestions' | 'rewrite_tone' | 'summarize';
  tone?: string;
}): Promise<string | string[]> {
  try {
    let promptText = '';
    if (params.action === 'polish') {
      promptText = `Improve this email draft for perfect grammar, elegance, and clarity. Keep HTML markup structure intact:\n\n${params.text}`;
    } else if (params.action === 'subject_suggestions') {
      promptText = `Suggest 3 compelling, clear email subject lines based on this email body:\n\n${params.text}\n\nReturn only JSON array of 3 strings: ["Subject 1", "Subject 2", "Subject 3"]`;
    } else if (params.action === 'rewrite_tone') {
      promptText = `Rewrite this email draft in a ${params.tone || 'Formal'} tone while preserving key information:\n\n${params.text}`;
    } else if (params.action === 'summarize') {
      promptText = `Provide a concise 2-sentence executive summary of this email draft:\n\n${params.text}`;
    }

    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    });

    const data = await response.json();
    if (data.answer) {
      if (params.action === 'subject_suggestions') {
        const clean = data.answer.replace(/```json\s*|```/g, '').trim();
        try {
          return JSON.parse(clean);
        } catch {
          return [data.answer.split('\n')[0] || 'Important Notice'];
        }
      }
      return data.answer;
    }
    return params.text;
  } catch (err) {
    console.error('AI Improve Error:', err);
    return params.text;
  }
}
