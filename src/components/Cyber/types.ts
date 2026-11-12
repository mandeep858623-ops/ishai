export type CyberModule =
  | 'COMMAND_CENTER'
  | 'IP_INTELLIGENCE'
  | 'WEB_SCANNER'
  | 'HACKER_TERMINAL'
  | 'PASSWORD_LAB'
  | 'CODE_AUDITOR'
  | 'DIGITAL_FORENSICS'
  | 'HACKER_ACADEMY'
  | 'LOG_ANALYZER'
  | 'PHISHING_MALWARE'
  | 'CHALLENGE_ARENA'
  | 'SECURITY_PROJECTS';

export interface SecurityFinding {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  cwe?: string;
  owasp?: string;
  cvssScore?: number;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ACCEPTED_RISK';
  target: string;
  description: string;
  impact: string;
  remediation: string;
  evidence?: string;
  createdAt: string;
}

export interface SecurityProject {
  id: string;
  title: string;
  clientName: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  startDate: string;
  inScope: string[];
  outOfScope: string[];
  rulesOfEngagement: string;
  findings: SecurityFinding[];
}

export interface DnsRecordResult {
  domain: string;
  timestamp: string;
  records: {
    A: string[];
    AAAA: string[];
    MX: { exchange: string; priority: number }[];
    TXT: string[];
    NS: string[];
    CNAME: string[];
    SOA: any;
  };
}

export interface IpIntelligenceData {
  ip: string;
  isPrivate: boolean;
  type?: string;
  country: string;
  countryCode?: string;
  region: string;
  city: string;
  org: string;
  asn: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  notes?: string;
}

export interface WebSecurityHeaderCheck {
  id: string;
  name: string;
  present: boolean;
  value: string | null;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  weight: number;
  description: string;
  recommendation: string;
}

export interface WebSecurityScanResult {
  url: string;
  statusCode: number;
  statusText: string;
  protocol: string;
  score: number;
  grade: string;
  checks: WebSecurityHeaderCheck[];
  rawHeaders: Record<string, string>;
}

export interface AcademyLesson {
  id: string;
  category: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  title: string;
  duration: string;
  description: string;
  content: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface CtfChallenge {
  id: string;
  category: 'Web' | 'Crypto' | 'Forensics' | 'Network' | 'Reverse';
  title: string;
  points: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  hint: string;
  flagHash: string; // SHA-256 of the flag for client-side check
  plainFlag?: string; // or direct verify
  explanation: string;
}
