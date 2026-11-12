import { Router, Request, Response } from 'express';
import dns from 'dns';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { GoogleGenAI } from '@google/genai';

const dnsPromises = dns.promises;
export const cyberRouter = Router();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function generateCyberContent(prompt: string) {
  try {
    return await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
    });
  } catch (err: any) {
    console.warn('Primary model error, trying gemini-3.8-flash:', err?.message);
    return await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
  }
}

// Helper: Check if an IP address is private, loopback, or reserved (SSRF protection)
export function isPrivateOrReservedIP(ip: string): boolean {
  // Normalize
  const clean = ip.trim();

  // IPv4 checks
  if (clean === 'localhost' || clean === '127.0.0.1' || clean === '::1' || clean === '0.0.0.0') {
    return true;
  }
  // 10.0.0.0/8
  if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  // 172.16.0.0/12
  if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  // 192.168.0.0/16
  if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  // 169.254.0.0/16 (Link Local / Cloud metadata)
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  // 100.64.0.0/10 (Carrier-grade NAT)
  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(clean)) return true;
  // IPv6 private ranges (fc00::/7, fe80::/10)
  if (clean.toLowerCase().startsWith('fc') || clean.toLowerCase().startsWith('fd') || clean.toLowerCase().startsWith('fe80')) {
    return true;
  }

  return false;
}

// 1. Safe DNS Lookup endpoint
cyberRouter.post('/dns-lookup', async (req: Request, res: Response) => {
  try {
    const { domain } = req.body;
    if (!domain || typeof domain !== 'string') {
      return res.status(400).json({ success: false, error: 'Domain is required' });
    }

    // Clean domain: remove protocols or paths
    let cleanDomain = domain.trim().toLowerCase();
    try {
      if (cleanDomain.startsWith('http://') || cleanDomain.startsWith('https://')) {
        cleanDomain = new URL(cleanDomain).hostname;
      }
    } catch {}
    cleanDomain = cleanDomain.replace(/:\d+$/, '').replace(/^\/+|\/+$/g, '');

    if (!cleanDomain || cleanDomain.length > 253 || !/^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(cleanDomain)) {
      return res.status(400).json({ success: false, error: 'Invalid domain format' });
    }

    const records: Record<string, any> = {};

    // Parallel DNS resolves with safe individual try/catch
    const [a, aaaa, mx, txt, ns, cname, soa] = await Promise.allSettled([
      dnsPromises.resolve4(cleanDomain).catch(() => []),
      dnsPromises.resolve6(cleanDomain).catch(() => []),
      dnsPromises.resolveMx(cleanDomain).catch(() => []),
      dnsPromises.resolveTxt(cleanDomain).catch(() => []),
      dnsPromises.resolveNs(cleanDomain).catch(() => []),
      dnsPromises.resolveCname(cleanDomain).catch(() => []),
      dnsPromises.resolveSoa(cleanDomain).catch(() => null),
    ]);

    records.A = a.status === 'fulfilled' ? a.value : [];
    records.AAAA = aaaa.status === 'fulfilled' ? aaaa.value : [];
    records.MX = mx.status === 'fulfilled' ? mx.value : [];
    records.TXT = txt.status === 'fulfilled' ? txt.value.map(row => row.join(' ')) : [];
    records.NS = ns.status === 'fulfilled' ? ns.value : [];
    records.CNAME = cname.status === 'fulfilled' ? cname.value : [];
    records.SOA = soa.status === 'fulfilled' ? soa.value : null;

    return res.json({
      success: true,
      domain: cleanDomain,
      timestamp: new Date().toISOString(),
      records,
    });
  } catch (err: any) {
    console.error('DNS Lookup error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'DNS query failed' });
  }
});

// 2. Safe IP Intelligence / Geo lookup
cyberRouter.post('/ip-lookup', async (req: Request, res: Response) => {
  try {
    const { ip } = req.body;
    if (!ip || typeof ip !== 'string') {
      return res.status(400).json({ success: false, error: 'IP address or domain is required' });
    }

    let target = ip.trim();
    // If domain provided, resolve first A record
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target) && !/:/.test(target)) {
      try {
        const resolved = await dnsPromises.resolve4(target);
        if (resolved.length > 0) {
          target = resolved[0];
        }
      } catch (err) {
        return res.status(400).json({ success: false, error: `Could not resolve domain ${target}` });
      }
    }

    // SSRF Check
    const isPrivate = isPrivateOrReservedIP(target);
    if (isPrivate) {
      return res.json({
        success: true,
        ip: target,
        isPrivate: true,
        type: 'Private / Reserved / Loopback',
        country: 'Local Network / RFC 1918',
        region: 'Internal',
        city: 'N/A',
        org: 'Private Intranet or Loopback Allocation',
        asn: 'AS-PRIVATE',
        notes: 'Target belongs to an internal, non-routable private address range. External geolocation is not applicable.',
      });
    }

    // Query reliable public IP intelligence (e.g. ipwho.is or fallback)
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const resp = await fetch(`https://ipwho.is/${encodeURIComponent(target)}`, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        return res.json({
          success: true,
          ip: target,
          isPrivate: false,
          country: data.country || 'Unknown',
          countryCode: data.country_code || '',
          region: data.region || 'Unknown',
          city: data.city || 'Unknown',
          latitude: data.latitude,
          longitude: data.longitude,
          org: data.connection?.isp || data.connection?.org || 'Unknown Provider',
          asn: data.connection?.asn ? `AS${data.connection.asn}` : 'Unknown',
          timezone: data.timezone?.id || 'UTC',
          postal: data.postal || '',
        });
      }
    } catch {
      // Fallback
    }

    return res.json({
      success: true,
      ip: target,
      isPrivate: false,
      country: 'Public IPv4/IPv6',
      region: 'Routable Global Internet',
      city: 'Distributed',
      org: 'Global Autonomous System',
      asn: 'AS-GLOBAL',
      notes: 'Active routable public IP. External Geo-DNS lookup timed out or rate-limited.',
    });
  } catch (err: any) {
    console.error('IP lookup error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'IP lookup failed' });
  }
});

// 3. Safe Website Security Header & TLS Scanner (Passive, Non-destructive)
cyberRouter.post('/web-check', async (req: Request, res: Response) => {
  try {
    const { targetUrl } = req.body;
    if (!targetUrl || typeof targetUrl !== 'string') {
      return res.status(400).json({ success: false, error: 'targetUrl is required' });
    }

    let parsedUrl: URL;
    try {
      const prefixed = targetUrl.startsWith('http://') || targetUrl.startsWith('https://') 
        ? targetUrl 
        : `https://${targetUrl}`;
      parsedUrl = new URL(prefixed);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid URL provided' });
    }

    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return res.status(400).json({ success: false, error: 'Only HTTP and HTTPS are supported' });
    }

    // SSRF Check on hostname
    const hostname = parsedUrl.hostname.toLowerCase();
    if (isPrivateOrReservedIP(hostname)) {
      return res.status(403).json({ success: false, error: 'Scanning private or internal hostnames is prohibited for security.' });
    }

    // Resolve hostname to IP and check resolved IP
    try {
      const resolved = await dnsPromises.resolve4(hostname);
      for (const ip of resolved) {
        if (isPrivateOrReservedIP(ip)) {
          return res.status(403).json({ success: false, error: 'Resolved IP is in a private/restricted address space (SSRF blocked).' });
        }
      }
    } catch (dnsErr) {
      // If DNS fails, fail early
      return res.status(400).json({ success: false, error: `Could not resolve domain ${hostname}` });
    }

    // Passive HTTP HEAD request with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const fetchRes = await fetch(parsedUrl.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'SuperAI-EthicalHacker-SecurityAuditor/1.0 (+https://superai.app/security-scanner)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    }).catch(err => {
      throw new Error(`Connection failed: ${err.message}`);
    });
    clearTimeout(timeout);

    const headers: Record<string, string> = {};
    fetchRes.headers.forEach((val, key) => {
      headers[key.toLowerCase()] = val;
    });

    // Analyze Security Headers
    const checks = [
      {
        id: 'hsts',
        name: 'Strict-Transport-Security (HSTS)',
        present: Boolean(headers['strict-transport-security']),
        value: headers['strict-transport-security'] || null,
        severity: 'HIGH',
        weight: 20,
        description: 'Forces modern browsers to always communicate over secure HTTPS, preventing SSL stripping attacks.',
        recommendation: 'Strict-Transport-Security: max-age=63072000; includeSubDomains; preload',
      },
      {
        id: 'csp',
        name: 'Content-Security-Policy (CSP)',
        present: Boolean(headers['content-security-policy']),
        value: headers['content-security-policy'] || null,
        severity: 'HIGH',
        weight: 25,
        description: 'Mitigates Cross-Site Scripting (XSS), data injection attacks, and unauthorized script execution.',
        recommendation: "default-src 'self'; script-src 'self' 'nonce-...'; object-src 'none';",
      },
      {
        id: 'x_frame',
        name: 'X-Frame-Options (Clickjacking Protection)',
        present: Boolean(headers['x-frame-options']),
        value: headers['x-frame-options'] || null,
        severity: 'MEDIUM',
        weight: 15,
        description: 'Defends users from clickjacking by forbidding third parties from rendering your site inside frames or iframes.',
        recommendation: 'DENY or SAMEORIGIN',
      },
      {
        id: 'x_content_type',
        name: 'X-Content-Type-Options',
        present: Boolean(headers['x-content-type-options']),
        value: headers['x-content-type-options'] || null,
        severity: 'LOW',
        weight: 10,
        description: 'Instructs browsers to strictly adhere to declared MIME types and never perform MIME sniffing.',
        recommendation: 'nosniff',
      },
      {
        id: 'referrer_policy',
        name: 'Referrer-Policy',
        present: Boolean(headers['referrer-policy']),
        value: headers['referrer-policy'] || null,
        severity: 'LOW',
        weight: 10,
        description: 'Governs how much URL query string and path referrer data is transmitted to outgoing external links.',
        recommendation: 'strict-origin-when-cross-origin',
      },
      {
        id: 'permissions_policy',
        name: 'Permissions-Policy (Feature-Policy)',
        present: Boolean(headers['permissions-policy'] || headers['feature-policy']),
        value: headers['permissions-policy'] || headers['feature-policy'] || null,
        severity: 'LOW',
        weight: 10,
        description: 'Restricts browser hardware capabilities (camera, microphone, geolocation) for third-party embeds.',
        recommendation: 'camera=(), microphone=(), geolocation=()',
      },
      {
        id: 'server_disclosure',
        name: 'Server Header Disclosure',
        present: !Boolean(headers['server']),
        value: headers['server'] || 'Hidden / None',
        severity: 'INFO',
        weight: 10,
        description: 'Revealing exact web server software versions can assist adversaries in fingerprinting known CVEs.',
        recommendation: 'Suppress or obscure the Server and X-Powered-By response headers in web server configuration.',
      },
    ];

    // Calculate score & grade
    let score = 0;
    checks.forEach(c => {
      if (c.present) score += c.weight;
    });

    let grade = 'F';
    if (score >= 90) grade = 'A+';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 55) grade = 'C';
    else if (score >= 40) grade = 'D';

    return res.json({
      success: true,
      url: parsedUrl.toString(),
      statusCode: fetchRes.status,
      statusText: fetchRes.statusText,
      protocol: parsedUrl.protocol,
      score,
      grade,
      checks,
      rawHeaders: headers,
    });
  } catch (err: any) {
    console.error('Web check error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Web security check failed' });
  }
});

// 4. AI Security Assistant (Vulnerability Hunter, Code Auditor, Explainer)
cyberRouter.post('/ai-assist', async (req: Request, res: Response) => {
  try {
    const { action, payload } = req.body;
    if (!action) {
      return res.status(400).json({ success: false, error: 'Action is required' });
    }

    if (action === 'explain_concept') {
      const prompt = `You are the lead security architect of SUPERAI Ethical Hacker.
Provide a crisp, educational, professional explanation of the following cybersecurity topic: "${payload?.concept || 'OWASP Top 10'}".
Format your response with:
1. Executive Definition (2-3 sentences)
2. How it Works / Core Threat Vectors
3. Real-world Defensive Remediation / Hardening Strategy
4. Standard Reference (e.g. CWE, NIST, or OWASP category)

Keep the tone authoritative, defensive, and strictly ethical.`;

      const response = await generateCyberContent(prompt);

      return res.json({ success: true, explanation: response.text });
    }

    if (action === 'audit_code') {
      const code = payload?.code || '';
      const language = payload?.language || 'typescript';

      if (!code.trim()) {
        return res.status(400).json({ success: false, error: 'Code snippet cannot be empty' });
      }

      const prompt = `You are a certified senior application security auditor (OSCP/CISSP level).
Conduct a strict defensive security audit on the following ${language} source code:

\`\`\`${language}
${code}
\`\`\`

Analyze the code for:
- Injection risks (SQL, Command, LDAP, NoSQL)
- Broken Authentication & Session Management
- Insecure Direct Object References (IDOR)
- Cryptographic flaws (weak PRNG, hardcoded keys, ECB mode, broken hashes)
- Cross-Site Scripting (XSS) / SSRF
- Race conditions / resource exhaustion

Respond strictly in valid JSON format matching this schema:
{
  "summary": "High-level audit assessment summary",
  "overallRisk": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "CLEAN",
  "score": 0-100 (where 100 is completely secure),
  "findings": [
    {
      "id": "VULN-01",
      "title": "Clear finding title",
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
      "cwe": "CWE-89",
      "owasp": "A03:2021-Injection",
      "lineNumbers": "e.g. Line 14-16",
      "vulnerableCodeSnippet": "snippet",
      "impact": "Concrete technical impact",
      "remediation": "Step-by-step fix guidance",
      "secureCodeSnippet": "Safe refactored code snippet"
    }
  ],
  "bestPractices": [
    "Key engineering recommendation 1",
    "Key engineering recommendation 2"
  ]
}
Return ONLY pure JSON with no markdown backticks or preface.`;

      const response = await generateCyberContent(prompt);

      let cleanText = (response.text || '{}').trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```/, '').replace(/```$/, '').trim();
      }

      try {
        const parsed = JSON.parse(cleanText);
        return res.json({ success: true, result: parsed });
      } catch (pErr) {
        return res.json({ success: true, raw: cleanText });
      }
    }

    if (action === 'generate_report_summary') {
      const { projectTitle, targetScope, findings } = payload || {};
      const prompt = `You are a Lead Penetration Tester writing an authorized Security Assessment Executive Summary.
Project: ${projectTitle || 'Penetration Testing Assessment'}
Target Scope: ${JSON.stringify(targetScope || [])}
Findings Summary: ${JSON.stringify(findings || [])}

Generate:
1. Executive Summary (written for C-suite & technical leads)
2. Strategic Risk Posture Assessment
3. Prioritized 30-60-90 Day Remediation Roadmap
Keep it professional, balanced, defensive, and actionable.`;

      const response = await generateCyberContent(prompt);

      return res.json({ success: true, summary: response.text });
    }

    return res.status(400).json({ success: false, error: 'Unknown action' });
  } catch (err: any) {
    console.error('AI Security Assist error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'AI request failed' });
  }
});
