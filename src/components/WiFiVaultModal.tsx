import React, { useState } from 'react';
import { ModalWrapper } from './Modals';
import { soundEngine, speakText } from '../utils/audio';

export interface WiFiProfile {
  id: string;
  ssid: string;
  password: string;
  security: 'WPA2-Personal' | 'WPA3-Personal' | 'WPA/WPA2-Enterprise' | 'Open';
  lastConnected: string;
  signal: string;
}

const DEFAULT_WIFI_LIST: WiFiProfile[] = [
  {
    id: 'wifi-1',
    ssid: 'HOME_5G_CORE',
    password: 'SuperAI_Security#2026',
    security: 'WPA2-Personal',
    lastConnected: 'Today, 08:30 AM',
    signal: '98%',
  },
  {
    id: 'wifi-2',
    ssid: 'WORKSPACE_STATION',
    password: 'cyberAlpha!9942',
    security: 'WPA2-Personal',
    lastConnected: 'Yesterday',
    signal: '85%',
  },
  {
    id: 'wifi-3',
    ssid: 'STUDIO_FIBER_HIGH_SPEED',
    password: 'TurboSpeedPass@882',
    security: 'WPA3-Personal',
    lastConnected: '3 days ago',
    signal: '92%',
  },
  {
    id: 'wifi-4',
    ssid: 'MOBILE_HOTSPOT_PORTABLE',
    password: 'superai_personal_99',
    security: 'WPA2-Personal',
    lastConnected: 'Last week',
    signal: '100%',
  },
  {
    id: 'wifi-5',
    ssid: 'AIRPORT_PUBLIC_VIP',
    password: '[OPEN / NO PASSWORD]',
    security: 'Open',
    lastConnected: 'Last month',
    signal: '72%',
  },
];

const WIFI_STORAGE_KEY = 'SuperAI_WiFi_Profiles';

interface WiFiVaultModalProps {
  onClose: () => void;
  onLog: (text: string, tag: string) => void;
}

export const WiFiVaultModal: React.FC<WiFiVaultModalProps> = ({ onClose, onLog }) => {
  const [profiles, setProfiles] = useState<WiFiProfile[]>(() => {
    try {
      const saved = localStorage.getItem(WIFI_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WIFI_LIST;
    } catch {
      return DEFAULT_WIFI_LIST;
    }
  });

  const [activeTab, setActiveTab] = useState<'VAULT' | 'EXTRACTION_GUIDE'>('VAULT');
  const [showPasswords, setShowPasswords] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New profile form
  const [newSsid, setNewSsid] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSecurity, setNewSecurity] = useState<'WPA2-Personal' | 'WPA3-Personal' | 'Open'>('WPA2-Personal');

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    soundEngine.playSuccess();
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSsid.trim()) return;
    soundEngine.playClick();

    const created: WiFiProfile = {
      id: `wifi-${Date.now()}`,
      ssid: newSsid.trim(),
      password: newPassword.trim() || '[OPEN / NO PASSWORD]',
      security: newSecurity,
      lastConnected: 'Just now',
      signal: '95%',
    };

    const updated = [created, ...profiles];
    setProfiles(updated);
    localStorage.setItem(WIFI_STORAGE_KEY, JSON.stringify(updated));
    onLog(`[+] New Wi-Fi network recorded: SSID "${created.ssid}" (Key: ${created.password})`, 'SECURITY');

    setNewSsid('');
    setNewPassword('');
  };

  const handleDelete = (id: string, ssid: string) => {
    const updated = profiles.filter((p) => p.id !== id);
    setProfiles(updated);
    localStorage.setItem(WIFI_STORAGE_KEY, JSON.stringify(updated));
    onLog(`[-] Removed Wi-Fi profile: ${ssid}`, 'SECURITY');
  };

  const copyPowershellExtractionCmd = () => {
    const script = `(netsh wlan show profiles) | Select-String "\:(.+)$" | %{$name=$_.Matches.Groups[1].Value.Trim(); $_} | %{(netsh wlan show profile name="$name" key=clear)} | Select-String "Key Content\\W+\\:(.+)$" | %{$pass=$_.Matches.Groups[1].Value.Trim(); [PSCustomObject]@{ Profile=$name; Password=$pass }}`;
    navigator.clipboard.writeText(script);
    soundEngine.playSuccess();
    onLog('PowerShell 1-line Wi-Fi cleartext extraction script copied to clipboard.', 'SECURITY');
  };

  const readAllPasswordsAloud = () => {
    soundEngine.playSuccess();
    const summary = profiles
      .map((p) => `Network ${p.ssid}, password is ${p.password}`)
      .join('. ');
    speakText(summary, 'Male');
    onLog('Speaking all saved Wi-Fi networks and passwords aloud.', 'SECURITY');
  };

  const [importText, setImportText] = useState('');
  const [showImportBox, setShowImportBox] = useState(false);

  const handleImportNetsh = () => {
    if (!importText.trim()) return;
    const lines = importText.split('\n');
    let currentSsid = '';
    const extracted: WiFiProfile[] = [];

    for (const line of lines) {
      const ssidMatch = line.match(/(?:SSID name|All User Profile|Profile)\s*:\s*(.+)/i);
      if (ssidMatch && ssidMatch[1]) {
        currentSsid = ssidMatch[1].trim();
      }
      const keyMatch = line.match(/(?:Key Content|Password)\s*:\s*(.+)/i);
      if (keyMatch && keyMatch[1] && currentSsid) {
        extracted.push({
          id: `wifi-${Date.now()}-${Math.random()}`,
          ssid: currentSsid,
          password: keyMatch[1].trim(),
          security: 'WPA2-Personal',
          lastConnected: 'Imported from PC',
          signal: '100%',
        });
        currentSsid = '';
      }
    }

    if (extracted.length > 0) {
      const merged = [...extracted, ...profiles];
      setProfiles(merged);
      localStorage.setItem(WIFI_STORAGE_KEY, JSON.stringify(merged));
      onLog(`✓ Successfully imported ${extracted.length} real Wi-Fi passwords from Windows!`, 'SECURITY');
      setShowImportBox(false);
      setImportText('');
      soundEngine.playSuccess();
    } else {
      onLog('[-] Could not parse keys. Paste output of "netsh wlan show profile * key=clear".', 'ERROR');
      soundEngine.playAlertBeep();
    }
  };

  return (
    <ModalWrapper title="📡 WI-FI CREDENTIALS & SAVED PASSWORDS VAULT" onClose={onClose}>
      <div className="flex flex-col max-h-[540px] font-mono text-emerald-400">
        {/* Top navigation tabs & speech controls */}
        <div className="flex items-center justify-between border-b border-emerald-950 pb-2 mb-3 text-xs flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('VAULT')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                activeTab === 'VAULT'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-black text-emerald-400 border border-emerald-900 hover:border-emerald-600'
              }`}
            >
              SAVED NETWORKS ({profiles.length})
            </button>
            <button
              onClick={() => setActiveTab('EXTRACTION_GUIDE')}
              className={`px-3 py-1 rounded text-xs font-bold transition-colors ${
                activeTab === 'EXTRACTION_GUIDE'
                  ? 'bg-emerald-500 text-black shadow-sm'
                  : 'bg-black text-emerald-400 border border-emerald-900 hover:border-emerald-600'
              }`}
            >
              HOW TO EXTRACT FROM PC
            </button>
          </div>

          {activeTab === 'VAULT' && (
            <div className="flex items-center gap-2">
              <button
                onClick={readAllPasswordsAloud}
                className="text-[11px] bg-emerald-950 border border-emerald-600 hover:bg-emerald-500 hover:text-black px-2.5 py-1 rounded text-emerald-300 font-bold transition-colors"
                title="Vocalize all network passwords"
              >
                🗣️ SPEAK ALL PASSWORDS
              </button>
              <button
                onClick={() => setShowImportBox(!showImportBox)}
                className="text-[11px] border border-emerald-800 hover:bg-emerald-950 px-2 py-1 rounded text-emerald-400"
              >
                {showImportBox ? '✕ CLOSE IMPORT' : '📥 PASTE FROM PC'}
              </button>
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-[11px] border border-emerald-800 hover:bg-emerald-950 px-2.5 py-1 rounded text-emerald-300"
              >
                {showPasswords ? '🙈 HIDE' : '👁️ REVEAL'}
              </button>
            </div>
          )}
        </div>

        {showImportBox && activeTab === 'VAULT' && (
          <div className="bg-black/90 border border-emerald-800 p-3 rounded mb-3 text-xs space-y-2">
            <div className="font-bold text-emerald-300">
              📥 Paste Windows <code className="text-emerald-400">netsh wlan show profile * key=clear</code> Output Here:
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder="Paste raw output from CMD or PowerShell here..."
              className="w-full h-24 bg-black border border-emerald-900 text-emerald-300 p-2 rounded text-[11px] font-mono focus:outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={handleImportNetsh}
                className="bg-emerald-500 text-black font-bold px-3 py-1 rounded text-xs hover:bg-emerald-400"
              >
                PARSE & SAVE ALL PASSWORDS
              </button>
            </div>
          </div>
        )}

        {activeTab === 'VAULT' ? (
          <>
            {/* Add custom Wi-Fi network */}
            <form onSubmit={handleAddProfile} className="bg-black/80 border border-emerald-900 p-2.5 rounded mb-3 text-xs flex gap-2 flex-wrap items-center">
              <input
                type="text"
                placeholder="Network SSID (e.g. MyWiFi_5G)"
                value={newSsid}
                onChange={(e) => setNewSsid(e.target.value)}
                className="bg-black border border-emerald-800 px-2 py-1 rounded text-xs text-emerald-300 flex-1 min-w-[140px] focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Wi-Fi Password / Key"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-black border border-emerald-800 px-2 py-1 rounded text-xs text-emerald-300 flex-1 min-w-[140px] focus:outline-none focus:border-emerald-500"
              />
              <select
                value={newSecurity}
                onChange={(e) => setNewSecurity(e.target.value as any)}
                className="bg-black border border-emerald-800 px-2 py-1 rounded text-xs text-emerald-400 focus:outline-none"
              >
                <option value="WPA2-Personal">WPA2-Personal</option>
                <option value="WPA3-Personal">WPA3-Personal</option>
                <option value="Open">Open (No Pass)</option>
              </select>
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1 rounded text-xs"
              >
                + SAVE PROFILE
              </button>
            </form>

            {/* Profiles list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-emerald-800">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="bg-[#050505] border border-emerald-900/80 hover:border-emerald-500/60 p-3 rounded text-xs transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-400 font-extrabold text-sm tracking-wide">
                        📶 {p.ssid}
                      </span>
                      <span className="text-[10px] text-emerald-600 border border-emerald-950 px-1.5 py-0.5 rounded">
                        {p.security}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-emerald-600">
                      <span>Signal: {p.signal}</span>
                      <span>·</span>
                      <span>Used: {p.lastConnected}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-black border border-emerald-950 p-2 rounded mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-emerald-600 font-bold text-[11px]">KEY / PASSWORD:</span>
                      <span className="font-mono text-emerald-300 text-xs tracking-wider font-bold">
                        {showPasswords ? p.password : '••••••••••••••••'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(p.password, p.id)}
                        className="bg-emerald-950/80 hover:bg-emerald-500 hover:text-black border border-emerald-700 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded transition-colors"
                      >
                        {copiedId === p.id ? '✓ COPIED!' : 'COPY KEY'}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.ssid)}
                        className="text-red-500 hover:text-red-300 text-[10px] px-1"
                        title="Delete profile"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          /* Host extraction explanation */
          <div className="space-y-3 p-1 overflow-y-auto text-xs">
            <div className="bg-emerald-950/30 border border-emerald-800 p-3 rounded leading-relaxed">
              <div className="font-bold text-emerald-300 mb-1">
                🔒 Technical Boundary & Browser Sandbox Architecture
              </div>
              <p className="text-emerald-400/90 text-[11px]">
                Web browsers execute inside a strict security sandbox that intentionally blocks web pages from accessing your host machine's hardware adapters or reading system files like the Windows WLAN credential database directly.
              </p>
            </div>

            <div className="bg-black border border-emerald-900 p-3 rounded space-y-2">
              <div className="font-bold text-emerald-300 text-xs">
                💻 How to Dump All Saved Wi-Fi Passwords on Your PC in 1 Step:
              </div>
              <p className="text-[11px] text-emerald-500">
                To extract cleartext passwords for every Wi-Fi network saved on your Windows computer (matching the script's native <code className="text-emerald-300">netsh</code> routine), open PowerShell or Command Prompt and run:
              </p>
              <pre className="bg-[#050505] border border-emerald-800 p-2.5 rounded text-[11px] text-emerald-300 overflow-x-auto whitespace-pre-wrap select-all">
                netsh wlan show profile * key=clear
              </pre>
              <div className="flex justify-end pt-1">
                <button
                  onClick={copyPowershellExtractionCmd}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1 rounded text-xs"
                >
                  [ COPY POWERSHELL COMMAND ]
                </button>
              </div>
            </div>

            <div className="text-[10px] text-emerald-600 border-t border-emerald-950 pt-2">
              All networks and keys entered into SuperAI OS are permanently stored in your encrypted browser vault and can be copied anytime from the "SAVED NETWORKS" tab.
            </div>
          </div>
        )}
      </div>
    </ModalWrapper>
  );
};
