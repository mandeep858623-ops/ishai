import React, { useState } from 'react';
import {
  Globe,
  Search,
  Server,
  Network,
  Cpu,
  Layers,
  Activity,
  ArrowRight,
  Shield,
  Clock,
  MapPin,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import { DnsRecordResult, IpIntelligenceData } from './types';

export const IpIntelligenceView: React.FC = () => {
  const [queryInput, setQueryInput] = useState('google.com');
  const [loadingDns, setLoadingDns] = useState(false);
  const [loadingIp, setLoadingIp] = useState(false);
  const [dnsData, setDnsData] = useState<DnsRecordResult | null>(null);
  const [ipData, setIpData] = useState<IpIntelligenceData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // CIDR Calculator state
  const [cidrInput, setCidrInput] = useState('192.168.1.0/24');
  const [cidrResult, setCidrResult] = useState<{
    network: string;
    broadcast: string;
    netmask: string;
    wildcard: string;
    firstHost: string;
    lastHost: string;
    totalHosts: number;
    usableHosts: number;
  } | null>(() => calculateCidr('192.168.1.0/24'));

  // Latency test state
  const [pingLatency, setPingLatency] = useState<number | null>(null);
  const [isPinging, setIsPinging] = useState(false);

  // Trigger DNS lookup
  const handleDnsLookup = async (overrideTarget?: string) => {
    const target = (overrideTarget || queryInput).trim();
    if (!target) return;
    setErrorMsg(null);
    setLoadingDns(true);
    try {
      const res = await fetch('/api/cyber/dns-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: target }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'DNS lookup failed');
      }
      setDnsData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'DNS resolution failed');
    } finally {
      setLoadingDns(false);
    }
  };

  // Trigger IP intelligence
  const handleIpLookup = async (overrideTarget?: string) => {
    const target = (overrideTarget || queryInput).trim();
    if (!target) return;
    setErrorMsg(null);
    setLoadingIp(true);
    try {
      const res = await fetch('/api/cyber/ip-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: target }),
      });
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.error || 'IP intelligence query failed');
      }
      setIpData(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'IP intelligence query failed');
    } finally {
      setLoadingIp(false);
    }
  };

  const handleFullRecon = async () => {
    await Promise.all([handleDnsLookup(), handleIpLookup()]);
  };

  // Test Latency
  const handleTestLatency = async () => {
    setIsPinging(true);
    const start = performance.now();
    try {
      await fetch(`/api/cyber/dns-lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: 'one.one.one.one' }),
      });
      const duration = Math.round(performance.now() - start);
      setPingLatency(duration);
    } catch {
      setPingLatency(null);
    } finally {
      setIsPinging(false);
    }
  };

  // Copy helper
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Client-side CIDR calculator
  function calculateCidr(cidr: string) {
    try {
      const parts = cidr.trim().split('/');
      if (parts.length !== 2) return null;
      const ip = parts[0];
      const prefix = parseInt(parts[1], 10);
      if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;

      const ipOctets = ip.split('.').map((x) => parseInt(x, 10));
      if (ipOctets.length !== 4 || ipOctets.some((o) => isNaN(o) || o < 0 || o > 255)) return null;

      const ipInt =
        ((ipOctets[0] << 24) >>> 0) +
        ((ipOctets[1] << 16) >>> 0) +
        ((ipOctets[2] << 8) >>> 0) +
        (ipOctets[3] >>> 0);

      const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
      const wildcardInt = ~maskInt >>> 0;

      const netInt = (ipInt & maskInt) >>> 0;
      const bcastInt = (netInt | wildcardInt) >>> 0;

      const intToIp = (val: number) =>
        `${(val >>> 24) & 255}.${(val >>> 16) & 255}.${(val >>> 8) & 255}.${val & 255}`;

      const totalHosts = prefix === 32 ? 1 : Math.pow(2, 32 - prefix);
      const usableHosts = prefix >= 31 ? (prefix === 31 ? 2 : 1) : totalHosts - 2;

      return {
        network: intToIp(netInt),
        broadcast: prefix >= 31 ? 'N/A' : intToIp(bcastInt),
        netmask: intToIp(maskInt),
        wildcard: intToIp(wildcardInt),
        firstHost: prefix >= 31 ? intToIp(netInt) : intToIp(netInt + 1),
        lastHost: prefix >= 31 ? intToIp(bcastInt) : intToIp(bcastInt - 1),
        totalHosts,
        usableHosts,
      };
    } catch {
      return null;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            IP &amp; Domain Intelligence Explorer
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time passive DNS resolution, autonomous system (AS) inspection, and CIDR subnet calculation.
          </p>
        </div>

        {/* Quick query presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {['cloudflare.com', 'github.com', 'wikipedia.org', '1.1.1.1', '8.8.8.8'].map((preset) => (
            <button
              key={preset}
              onClick={() => {
                setQueryInput(preset);
                handleDnsLookup(preset);
                handleIpLookup(preset);
              }}
              className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-emerald-300 hover:border-emerald-500/50 transition-colors cursor-pointer"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Input query form */}
      <div className="p-4 rounded-xl border border-emerald-500/30 bg-zinc-950/90 shadow-xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleFullRecon();
          }}
          className="flex flex-col sm:flex-row gap-2.5"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Enter domain or IP (e.g., example.com, 1.1.1.1)..."
              className="w-full bg-black border border-zinc-700 focus:border-emerald-400 text-emerald-300 pl-9 pr-4 py-2.5 rounded-lg text-xs font-mono focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loadingDns || loadingIp}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Activity className="w-4 h-4" />
              {loadingDns || loadingIp ? 'Resolving...' : 'Run Intelligence'}
            </button>
            <button
              type="button"
              onClick={handleTestLatency}
              disabled={isPinging}
              className="px-3 py-2.5 bg-zinc-900 border border-zinc-700 hover:border-cyan-400 text-cyan-300 font-bold text-xs rounded-lg transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap"
              title="Test DNS resolver round-trip latency"
            >
              <Clock className="w-3.5 h-3.5" />
              {isPinging ? 'Pinging...' : pingLatency ? `${pingLatency} ms` : 'Ping'}
            </button>
          </div>
        </form>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded bg-rose-950/40 border border-rose-800 text-xs text-rose-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-rose-400 shrink-0" />
            {errorMsg}
          </div>
        )}
      </div>

      {/* Network Topology Route Simulation Banner */}
      <div className="p-4 rounded-xl border border-zinc-800 bg-black/60 relative overflow-hidden">
        <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
          <span>Passive Route Topology</span>
          <span className="text-[10px] text-emerald-400 font-mono">NON-INTRUSIVE PASSIVE MAPPING</span>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-lg bg-zinc-950 border border-zinc-900 font-mono text-xs">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="text-white font-bold">Client Node</div>
              <div className="text-[10px] text-zinc-500">Local Browser</div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-zinc-600">
            <div className="w-8 sm:w-16 h-0.5 bg-emerald-500/40 relative">
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-900">
              TLS / DNS
            </span>
            <div className="w-8 sm:w-16 h-0.5 bg-emerald-500/40" />
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Network className="w-4 h-4" />
            </div>
            <div>
              <div className="text-white font-bold">{ipData?.org || 'Public AS Provider'}</div>
              <div className="text-[10px] text-zinc-500">{ipData?.asn || 'BGP Routing Gateway'}</div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-zinc-600">
            <div className="w-8 sm:w-16 h-0.5 bg-cyan-500/40" />
            <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
          </div>

          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-violet-500/10 text-violet-400 border border-violet-500/30">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <div className="text-white font-bold">{dnsData?.domain || queryInput}</div>
              <div className="text-[10px] text-zinc-500">{ipData?.ip || 'Target Host'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: DNS Records */}
        <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">DNS Zone Records</h3>
            </div>
            {dnsData && (
              <span className="text-[10px] text-zinc-500 font-mono">
                {new Date(dnsData.timestamp).toLocaleTimeString()}
              </span>
            )}
          </div>

          {dnsData ? (
            <div className="space-y-3 font-mono text-xs">
              {/* A Records */}
              <div>
                <span className="text-emerald-400 font-bold text-[11px] block mb-1">A Records (IPv4):</span>
                <div className="space-y-1">
                  {dnsData.records.A.length > 0 ? (
                    dnsData.records.A.map((ip, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-black border border-zinc-800 text-zinc-300"
                      >
                        <span>{ip}</span>
                        <button
                          onClick={() => copyToClipboard(ip, `a-${idx}`)}
                          className="text-zinc-500 hover:text-white"
                        >
                          {copiedKey === `a-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-zinc-600 text-[11px] italic">No A records found</span>
                  )}
                </div>
              </div>

              {/* AAAA Records */}
              <div>
                <span className="text-cyan-400 font-bold text-[11px] block mb-1">AAAA Records (IPv6):</span>
                <div className="space-y-1">
                  {dnsData.records.AAAA.length > 0 ? (
                    dnsData.records.AAAA.map((ip, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-black border border-zinc-800 text-zinc-300 break-all"
                      >
                        <span>{ip}</span>
                        <button
                          onClick={() => copyToClipboard(ip, `aaaa-${idx}`)}
                          className="text-zinc-500 hover:text-white ml-2"
                        >
                          {copiedKey === `aaaa-${idx}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-zinc-600 text-[11px] italic">No AAAA records found</span>
                  )}
                </div>
              </div>

              {/* MX Records */}
              <div>
                <span className="text-amber-400 font-bold text-[11px] block mb-1">MX Records (Mail Exchangers):</span>
                <div className="space-y-1">
                  {dnsData.records.MX.length > 0 ? (
                    dnsData.records.MX.map((mx, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded bg-black border border-zinc-800 text-zinc-300"
                      >
                        <span>
                          [{mx.priority}] {mx.exchange}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span className="text-zinc-600 text-[11px] italic">No MX records found</span>
                  )}
                </div>
              </div>

              {/* NS Records */}
              <div>
                <span className="text-violet-400 font-bold text-[11px] block mb-1">NS Records (Name Servers):</span>
                <div className="space-y-1">
                  {dnsData.records.NS.length > 0 ? (
                    dnsData.records.NS.map((ns, idx) => (
                      <div key={idx} className="p-2 rounded bg-black border border-zinc-800 text-zinc-300">
                        {ns}
                      </div>
                    ))
                  ) : (
                    <span className="text-zinc-600 text-[11px] italic">No NS records found</span>
                  )}
                </div>
              </div>

              {/* TXT Records */}
              <div>
                <span className="text-pink-400 font-bold text-[11px] block mb-1">TXT Records (SPF / Verification):</span>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {dnsData.records.TXT.length > 0 ? (
                    dnsData.records.TXT.map((txt, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-black border border-zinc-800 text-zinc-400 break-all text-[11px]"
                      >
                        {txt}
                      </div>
                    ))
                  ) : (
                    <span className="text-zinc-600 text-[11px] italic">No TXT records found</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Execute DNS resolution to view live authoritative zone records.
            </div>
          )}
        </div>

        {/* Right: IP Intelligence & Autonomous System */}
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">IP &amp; AS Routing Intelligence</h3>
              </div>
              {ipData && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    ipData.isPrivate
                      ? 'bg-amber-950 border border-amber-800 text-amber-300'
                      : 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                  }`}
                >
                  {ipData.isPrivate ? 'PRIVATE / RFC 1918' : 'GLOBAL ROUTABLE'}
                </span>
              )}
            </div>

            {ipData ? (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-black border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Target Address</div>
                  <div className="text-emerald-300 font-mono font-bold mt-1 text-sm">{ipData.ip}</div>
                </div>

                <div className="p-3 rounded-lg bg-black border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Geographic Region</div>
                  <div className="text-white font-medium mt-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    {ipData.city}, {ipData.country}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Autonomous System (ASN)</div>
                  <div className="text-cyan-300 font-mono font-bold mt-1">{ipData.asn}</div>
                </div>

                <div className="p-3 rounded-lg bg-black border border-zinc-800">
                  <div className="text-[10px] text-zinc-500 uppercase">Organization / ISP</div>
                  <div className="text-zinc-300 font-medium mt-1 truncate" title={ipData.org}>
                    {ipData.org}
                  </div>
                </div>

                {ipData.timezone && (
                  <div className="p-3 rounded-lg bg-black border border-zinc-800 col-span-2 flex items-center justify-between text-zinc-400">
                    <span>Timezone: <strong className="text-white">{ipData.timezone}</strong></span>
                    {ipData.latitude && ipData.longitude && (
                      <span className="font-mono text-[11px] text-zinc-500">
                        GPS: {ipData.latitude.toFixed(2)}, {ipData.longitude.toFixed(2)}
                      </span>
                    )}
                  </div>
                )}

                {ipData.notes && (
                  <div className="p-2.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400 col-span-2">
                    {ipData.notes}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-zinc-500 text-xs">
                No IP telemetry loaded. Click "Run Intelligence" to fetch AS and regional data.
              </div>
            )}
          </div>

          {/* Subnet / CIDR Calculator */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-bold text-white">Subnet &amp; CIDR Calculator</h3>
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={cidrInput}
                onChange={(e) => {
                  setCidrInput(e.target.value);
                  setCidrResult(calculateCidr(e.target.value));
                }}
                placeholder="e.g. 10.0.0.0/16 or 192.168.1.0/24"
                className="flex-1 bg-black border border-zinc-700 text-zinc-200 px-3 py-1.5 rounded text-xs font-mono focus:outline-none focus:border-violet-400"
              />
            </div>

            {cidrResult && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono mt-2">
                <div className="p-2 rounded bg-black border border-zinc-800">
                  <div className="text-zinc-500 text-[9px] uppercase">Network Address</div>
                  <div className="text-violet-300 font-bold">{cidrResult.network}</div>
                </div>
                <div className="p-2 rounded bg-black border border-zinc-800">
                  <div className="text-zinc-500 text-[9px] uppercase">Netmask</div>
                  <div className="text-zinc-300">{cidrResult.netmask}</div>
                </div>
                <div className="p-2 rounded bg-black border border-zinc-800">
                  <div className="text-zinc-500 text-[9px] uppercase">First Host</div>
                  <div className="text-emerald-400">{cidrResult.firstHost}</div>
                </div>
                <div className="p-2 rounded bg-black border border-zinc-800">
                  <div className="text-zinc-500 text-[9px] uppercase">Last Host</div>
                  <div className="text-emerald-400">{cidrResult.lastHost}</div>
                </div>
                <div className="p-2 rounded bg-black border border-zinc-800">
                  <div className="text-zinc-500 text-[9px] uppercase">Broadcast</div>
                  <div className="text-rose-400">{cidrResult.broadcast}</div>
                </div>
                <div className="p-2 rounded bg-black border border-zinc-800">
                  <div className="text-zinc-500 text-[9px] uppercase">Wildcard</div>
                  <div className="text-zinc-400">{cidrResult.wildcard}</div>
                </div>
                <div className="p-2 rounded bg-black border border-zinc-800 col-span-2">
                  <div className="text-zinc-500 text-[9px] uppercase">Usable Hosts Range</div>
                  <div className="text-white font-bold">
                    {cidrResult.usableHosts.toLocaleString()} hosts
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
