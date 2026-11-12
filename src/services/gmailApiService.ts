/**
 * Official Gmail API Integration Service for ISHAI
 * Constructs RFC 2822 MIME emails, Base64URL encoding, and interacts with Gmail API endpoints.
 */

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  base64Data: string; // Base64 encoded file data (without data URL prefix)
  sizeBytes?: number;
}

export interface SendEmailParams {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml: string;
  attachments?: EmailAttachment[];
}

export interface GmailProfile {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  from?: string;
  to?: string;
  subject?: string;
  date?: string;
  bodyHtml?: string;
}

/**
 * Base64URL Encoding helper for RFC 2822 MIME email payloads
 */
export function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Constructs a fully compliant RFC 2822 MIME email string
 */
export function buildMimeMessage(params: SendEmailParams, fromEmail: string): string {
  const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  
  let mime = `From: ${fromEmail}\r\n`;
  mime += `To: ${params.to.join(', ')}\r\n`;
  if (params.cc && params.cc.length > 0) mime += `Cc: ${params.cc.join(', ')}\r\n`;
  if (params.bcc && params.bcc.length > 0) mime += `Bcc: ${params.bcc.join(', ')}\r\n`;
  
  // Safe UTF-8 Base64 encoded Subject
  const utf8Subject = new TextEncoder().encode(params.subject || '(No Subject)');
  let binarySub = '';
  for (let i = 0; i < utf8Subject.length; i++) {
    binarySub += String.fromCharCode(utf8Subject[i]);
  }
  mime += `Subject: =?UTF-8?B?${btoa(binarySub)}?=\r\n`;
  mime += `MIME-Version: 1.0\r\n`;

  const hasAttachments = params.attachments && params.attachments.length > 0;

  if (hasAttachments) {
    mime += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n\r\n`;
    mime += `--${boundary}\r\n`;
    mime += `Content-Type: text/html; charset=UTF-8\r\n`;
    mime += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
    mime += `${params.bodyHtml}\r\n\r\n`;

    for (const att of params.attachments!) {
      mime += `--${boundary}\r\n`;
      mime += `Content-Type: ${att.mimeType}; name="${att.filename}"\r\n`;
      mime += `Content-Disposition: attachment; filename="${att.filename}"\r\n`;
      mime += `Content-Transfer-Encoding: base64\r\n\r\n`;
      mime += `${att.base64Data}\r\n\r\n`;
    }
    mime += `--${boundary}--`;
  } else {
    mime += `Content-Type: text/html; charset=UTF-8\r\n\r\n`;
    mime += `${params.bodyHtml}`;
  }

  return mime;
}

/**
 * Sends a real email via Gmail API users.messages.send endpoint
 */
export async function sendGmailApiEmail(
  accessToken: string,
  params: SendEmailParams,
  fromEmail: string
): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
  const mimeMessage = buildMimeMessage(params, fromEmail);
  const rawBase64Url = base64UrlEncode(mimeMessage);

  // Send via direct Gmail REST API or backend proxy
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: rawBase64Url
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errorMessage = errData?.error?.message || `Gmail API returned HTTP ${response.status}`;
    throw new Error(`Gmail Sending Failed: ${errorMessage}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    threadId: data.threadId,
    labelIds: data.labelIds || ['SENT']
  };
}

/**
 * Saves a draft in Gmail via users.drafts.create endpoint
 */
export async function saveGmailApiDraft(
  accessToken: string,
  params: SendEmailParams,
  fromEmail: string
): Promise<{ id: string; message: { id: string; threadId: string } }> {
  const mimeMessage = buildMimeMessage(params, fromEmail);
  const rawBase64Url = base64UrlEncode(mimeMessage);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: {
        raw: rawBase64Url
      }
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Draft Save Failed: ${errData?.error?.message || response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetches Gmail User Profile info
 */
export async function fetchGmailUserProfile(accessToken: string): Promise<GmailProfile> {
  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`Profile Fetch Failed: ${errData?.error?.message || response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetches Sent emails list from Gmail
 */
export async function fetchGmailSentMessages(accessToken: string): Promise<GmailMessageSummary[]> {
  const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:sent&maxResults=10', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!listRes.ok) return [];

  const listData = await listRes.json();
  if (!listData.messages || !Array.isArray(listData.messages)) return [];

  const summaries: GmailMessageSummary[] = [];

  for (const msgItem of listData.messages.slice(0, 8)) {
    try {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgItem.id}?format=full`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (msgRes.ok) {
        const msgDetail = await msgRes.json();
        const headers = msgDetail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        summaries.push({
          id: msgDetail.id,
          threadId: msgDetail.threadId,
          labelIds: msgDetail.labelIds,
          snippet: msgDetail.snippet,
          subject,
          to,
          from,
          date
        });
      }
    } catch {}
  }

  return summaries;
}

/**
 * Fetches Inbox emails list from Gmail
 */
export async function fetchGmailInboxMessages(accessToken: string): Promise<GmailMessageSummary[]> {
  const listRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?q=in:inbox&maxResults=10', {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  if (!listRes.ok) return [];

  const listData = await listRes.json();
  if (!listData.messages || !Array.isArray(listData.messages)) return [];

  const summaries: GmailMessageSummary[] = [];

  for (const msgItem of listData.messages.slice(0, 8)) {
    try {
      const msgRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgItem.id}?format=full`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (msgRes.ok) {
        const msgDetail = await msgRes.json();
        const headers = msgDetail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name.toLowerCase() === 'subject')?.value || '(No Subject)';
        const to = headers.find((h: any) => h.name.toLowerCase() === 'to')?.value || '';
        const from = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
        const date = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

        summaries.push({
          id: msgDetail.id,
          threadId: msgDetail.threadId,
          labelIds: msgDetail.labelIds,
          snippet: msgDetail.snippet,
          subject,
          to,
          from,
          date
        });
      }
    } catch {}
  }

  return summaries;
}
