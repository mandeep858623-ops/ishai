export type HoloModelId = 'nova' | 'aura' | 'nexus';

export type HoloEnvironmentId =
  | 'command_center'
  | 'space_station'
  | 'neon_room'
  | 'minimal_studio'
  | 'transparent_hologram';

export type HoloState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'explaining'
  | 'greeting'
  | 'celebrating';

export type HoloGesture =
  | 'wave'
  | 'explain'
  | 'think'
  | 'celebrate'
  | 'nod'
  | 'neutral';

export interface HoloAction {
  type: 'NAVIGATE' | 'WEATHER_INFO' | 'SUMMARIZE' | 'MOVEMENT' | 'NONE';
  modal?: string;
  movements?: Array<{ type: string; label?: string }>;
  params?: Record<string, any>;
  message?: string;
}

export interface HoloChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
  emotion?: HoloState;
  gesture?: HoloGesture;
  action?: HoloAction;
  liveData?: any;
}

export interface HoloUserSettings {
  user_id: string;
  model_id: HoloModelId;
  environment_id: HoloEnvironmentId;
  avatar_scale: number;
  voice_id: string;
  voice_pitch: number;
  voice_speed: number;
  voice_gender: 'Male' | 'Female';
  animation_intensity: number;
  reduced_motion: boolean;
  show_floating_hud: boolean;
  theme: 'dark' | 'light';
  conversation_history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  updated_at: string;
}

export const DEFAULT_HOLO_SETTINGS: HoloUserSettings = {
  user_id: 'guest',
  model_id: 'nova',
  environment_id: 'command_center',
  avatar_scale: 1.0,
  voice_id: '',
  voice_pitch: 1.0,
  voice_speed: 1.0,
  voice_gender: 'Female',
  animation_intensity: 1.0,
  reduced_motion: false,
  show_floating_hud: true,
  theme: 'dark',
  updated_at: new Date().toISOString(),
};

export interface HoloModelDefinition {
  id: HoloModelId;
  name: string;
  archetype: string;
  description: string;
  primaryColor: string;
  accentColor: string;
  glowHex: number;
}

export const HOLO_MODELS: HoloModelDefinition[] = [
  {
    id: 'nova',
    name: 'Holo-Nova',
    archetype: 'Cybernetic Android',
    description: 'Sleek ceramic-composite armor with flowing cyan energy lines and an expressive luminous visor.',
    primaryColor: '#00f0ff',
    accentColor: '#3b82f6',
    glowHex: 0x00f0ff,
  },
  {
    id: 'aura',
    name: 'Aura-Prime',
    archetype: 'Luminous Sentient',
    description: 'Translucent refractive energy being with an exposed prismatic quantum core and orbital rings.',
    primaryColor: '#a855f7',
    accentColor: '#ec4899',
    glowHex: 0xa855f7,
  },
  {
    id: 'nexus',
    name: 'Nexus-V',
    archetype: 'Quantum Guardian',
    description: 'Faceted high-tech tactical chassis with geometric energy plating and holographic crest.',
    primaryColor: '#10b981',
    accentColor: '#06b6d4',
    glowHex: 0x10b981,
  },
];

export interface HoloEnvironmentDefinition {
  id: HoloEnvironmentId;
  name: string;
  description: string;
  icon: string;
}

export const HOLO_ENVIRONMENTS: HoloEnvironmentDefinition[] = [
  {
    id: 'command_center',
    name: 'Holographic Command Center',
    description: 'Infinite cyber grid, rotating data rings, and deep neon projection beacons.',
    icon: 'Terminal',
  },
  {
    id: 'space_station',
    name: 'Futuristic Space Station',
    description: 'Orbital panorama with starfields, structural titanium struts, and atmospheric earth glow.',
    icon: 'Orbit',
  },
  {
    id: 'neon_room',
    name: 'Digital Neon Room',
    description: 'Glossy dark surface with vibrant vertical cyan/magenta light pillars.',
    icon: 'Sparkles',
  },
  {
    id: 'minimal_studio',
    name: 'Minimal Dark Studio',
    description: 'Clean shadow-grounded studio with soft directional rim lighting.',
    icon: 'Box',
  },
  {
    id: 'transparent_hologram',
    name: 'Transparent Hologram',
    description: 'Pure alpha transparency so HOLO AI floats directly over ISHAI OS.',
    icon: 'Eye',
  },
];
