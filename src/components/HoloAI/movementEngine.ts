/**
 * HOLO AI Movement Control Engine
 * Converts natural-language movement requests into structured 3D avatar pose instructions.
 * Supports single commands, multi-step movement sequences, and emergency interruption.
 */

export type HoloMovementId =
  | 'RAISE_RIGHT_HAND'
  | 'RAISE_LEFT_HAND'
  | 'RAISE_BOTH_HANDS'
  | 'LOWER_HANDS'
  | 'WAVE_RIGHT'
  | 'WAVE_BOTH'
  | 'HANDS_UP_DOWN'
  | 'POINT_SCREEN'
  | 'POINT_LEFT'
  | 'POINT_RIGHT'
  | 'FOLD_ARMS'
  | 'UNFOLD_ARMS'
  | 'CLAP'
  | 'THUMBS_UP'
  | 'NOD_HEAD'
  | 'SHAKE_HEAD'
  | 'TILT_HEAD'
  | 'TURN_LEFT'
  | 'TURN_RIGHT'
  | 'TURN_AROUND'
  | 'LOOK_UP'
  | 'LOOK_DOWN'
  | 'BOW'
  | 'DANCE'
  | 'JUMP'
  | 'WALK_IN_PLACE'
  | 'STAND_STILL'
  | 'STOP_FREEZE';

export interface HoloMovementDefinition {
  id: HoloMovementId;
  name: string;
  category: 'arms' | 'hands' | 'head' | 'body' | 'full_body' | 'system';
  defaultDurationMs: number;
}

export interface HoloMovementInstruction {
  id: string;
  type: HoloMovementId;
  label: string;
  durationMs: number;
}

export const MOVEMENT_DEFINITIONS: Record<HoloMovementId, HoloMovementDefinition> = {
  RAISE_RIGHT_HAND: { id: 'RAISE_RIGHT_HAND', name: 'Raising Right Hand', category: 'arms', defaultDurationMs: 2400 },
  RAISE_LEFT_HAND: { id: 'RAISE_LEFT_HAND', name: 'Raising Left Hand', category: 'arms', defaultDurationMs: 2400 },
  RAISE_BOTH_HANDS: { id: 'RAISE_BOTH_HANDS', name: 'Raising Both Hands', category: 'arms', defaultDurationMs: 2600 },
  LOWER_HANDS: { id: 'LOWER_HANDS', name: 'Lowering Hands', category: 'arms', defaultDurationMs: 1500 },
  WAVE_RIGHT: { id: 'WAVE_RIGHT', name: 'Waving Right Hand', category: 'hands', defaultDurationMs: 3200 },
  WAVE_BOTH: { id: 'WAVE_BOTH', name: 'Waving Both Hands', category: 'hands', defaultDurationMs: 3200 },
  HANDS_UP_DOWN: { id: 'HANDS_UP_DOWN', name: 'Moving Hands Up & Down', category: 'arms', defaultDurationMs: 3500 },
  POINT_SCREEN: { id: 'POINT_SCREEN', name: 'Pointing Forward', category: 'arms', defaultDurationMs: 2500 },
  POINT_LEFT: { id: 'POINT_LEFT', name: 'Pointing Left', category: 'arms', defaultDurationMs: 2500 },
  POINT_RIGHT: { id: 'POINT_RIGHT', name: 'Pointing Right', category: 'arms', defaultDurationMs: 2500 },
  FOLD_ARMS: { id: 'FOLD_ARMS', name: 'Folding Arms', category: 'arms', defaultDurationMs: 3000 },
  UNFOLD_ARMS: { id: 'UNFOLD_ARMS', name: 'Unfolding Arms', category: 'arms', defaultDurationMs: 1800 },
  CLAP: { id: 'CLAP', name: 'Clapping Hands', category: 'hands', defaultDurationMs: 3000 },
  THUMBS_UP: { id: 'THUMBS_UP', name: 'Giving Thumbs Up', category: 'hands', defaultDurationMs: 2600 },
  NOD_HEAD: { id: 'NOD_HEAD', name: 'Nodding Head', category: 'head', defaultDurationMs: 2200 },
  SHAKE_HEAD: { id: 'SHAKE_HEAD', name: 'Shaking Head', category: 'head', defaultDurationMs: 2200 },
  TILT_HEAD: { id: 'TILT_HEAD', name: 'Tilting Head', category: 'head', defaultDurationMs: 2000 },
  TURN_LEFT: { id: 'TURN_LEFT', name: 'Turning Left', category: 'body', defaultDurationMs: 2500 },
  TURN_RIGHT: { id: 'TURN_RIGHT', name: 'Turning Right', category: 'body', defaultDurationMs: 2500 },
  TURN_AROUND: { id: 'TURN_AROUND', name: 'Turning Around', category: 'body', defaultDurationMs: 3200 },
  LOOK_UP: { id: 'LOOK_UP', name: 'Looking Up', category: 'head', defaultDurationMs: 2200 },
  LOOK_DOWN: { id: 'LOOK_DOWN', name: 'Looking Down', category: 'head', defaultDurationMs: 2200 },
  BOW: { id: 'BOW', name: 'Bowing', category: 'full_body', defaultDurationMs: 3000 },
  DANCE: { id: 'DANCE', name: 'Dancing', category: 'full_body', defaultDurationMs: 4500 },
  JUMP: { id: 'JUMP', name: 'Jumping', category: 'full_body', defaultDurationMs: 2200 },
  WALK_IN_PLACE: { id: 'WALK_IN_PLACE', name: 'Walking in Place', category: 'full_body', defaultDurationMs: 4000 },
  STAND_STILL: { id: 'STAND_STILL', name: 'Standing Still (Idle)', category: 'system', defaultDurationMs: 1000 },
  STOP_FREEZE: { id: 'STOP_FREEZE', name: 'Emergency Stop / Freeze', category: 'system', defaultDurationMs: 500 },
};

/**
 * 3D Avatar Kinematic Pose Target
 */
export interface AvatarPoseTarget {
  headRotX: number;
  headRotY: number;
  headRotZ: number;

  torsoRotX: number;
  torsoRotY: number;
  torsoRotZ: number;

  hipsPosY: number;
  hipsRotY: number;
  hipsRotZ: number;

  rArmRotX: number;
  rArmRotY: number;
  rArmRotZ: number;
  rForearmRotX: number;
  rHandRotX: number;
  rHandRotZ: number;

  lArmRotX: number;
  lArmRotY: number;
  lArmRotZ: number;
  lForearmRotX: number;
  lHandRotX: number;
  lHandRotZ: number;

  rThighRotX: number;
  rThighRotZ: number;
  rShinRotX: number;

  lThighRotX: number;
  lThighRotZ: number;
  lShinRotX: number;

  isOscillating?: boolean;
  oscType?: 'wave_right' | 'wave_both' | 'hands_up_down' | 'clap' | 'nod' | 'shake' | 'dance' | 'walk' | 'jump';
}

export const DEFAULT_IDLE_POSE: AvatarPoseTarget = {
  headRotX: 0,
  headRotY: 0,
  headRotZ: 0,
  torsoRotX: 0,
  torsoRotY: 0,
  torsoRotZ: 0,
  hipsPosY: 0,
  hipsRotY: 0,
  hipsRotZ: 0,
  rArmRotX: 0.1,
  rArmRotY: 0,
  rArmRotZ: -0.15,
  rForearmRotX: 0.25,
  rHandRotX: 0,
  rHandRotZ: 0,
  lArmRotX: 0.1,
  lArmRotY: 0,
  lArmRotZ: 0.15,
  lForearmRotX: 0.25,
  lHandRotX: 0,
  lHandRotZ: 0,
  rThighRotX: 0,
  rThighRotZ: 0,
  rShinRotX: 0,
  lThighRotX: 0,
  lThighRotZ: 0,
  lShinRotX: 0,
  isOscillating: false,
};

/**
 * Maps a Movement ID into kinematic target pose parameters
 */
export function getPoseForMovement(movementId: HoloMovementId): AvatarPoseTarget {
  const base = { ...DEFAULT_IDLE_POSE };

  switch (movementId) {
    case 'RAISE_RIGHT_HAND':
      return {
        ...base,
        rArmRotX: -2.3,
        rArmRotY: 0.1,
        rArmRotZ: -0.3,
        rForearmRotX: -0.35,
        rHandRotZ: 0.2,
      };

    case 'RAISE_LEFT_HAND':
      return {
        ...base,
        lArmRotX: -2.3,
        lArmRotY: -0.1,
        lArmRotZ: 0.3,
        lForearmRotX: -0.35,
        lHandRotZ: -0.2,
      };

    case 'RAISE_BOTH_HANDS':
      return {
        ...base,
        rArmRotX: -2.3,
        rArmRotZ: -0.3,
        rForearmRotX: -0.35,
        lArmRotX: -2.3,
        lArmRotZ: 0.3,
        lForearmRotX: -0.35,
      };

    case 'LOWER_HANDS':
    case 'UNFOLD_ARMS':
    case 'STAND_STILL':
    case 'STOP_FREEZE':
      return { ...DEFAULT_IDLE_POSE };

    case 'WAVE_RIGHT':
      return {
        ...base,
        rArmRotX: -1.6,
        rArmRotZ: -0.85,
        rForearmRotX: -0.85,
        isOscillating: true,
        oscType: 'wave_right',
      };

    case 'WAVE_BOTH':
      return {
        ...base,
        rArmRotX: -1.6,
        rArmRotZ: -0.85,
        rForearmRotX: -0.85,
        lArmRotX: -1.6,
        lArmRotZ: 0.85,
        lForearmRotX: -0.85,
        isOscillating: true,
        oscType: 'wave_both',
      };

    case 'HANDS_UP_DOWN':
      return {
        ...base,
        rArmRotX: -1.2,
        rArmRotZ: -0.3,
        lArmRotX: -1.2,
        lArmRotZ: 0.3,
        isOscillating: true,
        oscType: 'hands_up_down',
      };

    case 'POINT_SCREEN':
      return {
        ...base,
        rArmRotX: -1.45,
        rArmRotY: -0.2,
        rArmRotZ: -0.05,
        rForearmRotX: -0.05,
        rHandRotZ: 0.5,
      };

    case 'POINT_LEFT':
      return {
        ...base,
        lArmRotX: -0.2,
        lArmRotY: 0,
        lArmRotZ: 1.45,
        lForearmRotX: -0.1,
      };

    case 'POINT_RIGHT':
      return {
        ...base,
        rArmRotX: -0.2,
        rArmRotY: 0,
        rArmRotZ: -1.45,
        rForearmRotX: -0.1,
      };

    case 'FOLD_ARMS':
      return {
        ...base,
        rArmRotX: -0.85,
        rArmRotY: 0.55,
        rArmRotZ: -0.65,
        rForearmRotX: -1.35,
        lArmRotX: -0.85,
        lArmRotY: -0.55,
        lArmRotZ: 0.65,
        lForearmRotX: -1.35,
      };

    case 'CLAP':
      return {
        ...base,
        rArmRotX: -0.85,
        rArmRotZ: -0.6,
        rForearmRotX: -0.9,
        lArmRotX: -0.85,
        lArmRotZ: 0.6,
        lForearmRotX: -0.9,
        isOscillating: true,
        oscType: 'clap',
      };

    case 'THUMBS_UP':
      return {
        ...base,
        rArmRotX: -1.25,
        rArmRotZ: -0.25,
        rForearmRotX: -0.85,
        rHandRotZ: 1.25,
      };

    case 'NOD_HEAD':
      return {
        ...base,
        isOscillating: true,
        oscType: 'nod',
      };

    case 'SHAKE_HEAD':
      return {
        ...base,
        isOscillating: true,
        oscType: 'shake',
      };

    case 'TILT_HEAD':
      return {
        ...base,
        headRotZ: 0.35,
      };

    case 'TURN_LEFT':
      return {
        ...base,
        hipsRotY: 0.75, // Turned ~43 deg to left
      };

    case 'TURN_RIGHT':
      return {
        ...base,
        hipsRotY: -0.75, // Turned ~43 deg to right
      };

    case 'TURN_AROUND':
      return {
        ...base,
        hipsRotY: Math.PI, // 180 deg turn around
      };

    case 'LOOK_UP':
      return {
        ...base,
        headRotX: -0.45,
      };

    case 'LOOK_DOWN':
      return {
        ...base,
        headRotX: 0.45,
      };

    case 'BOW':
      return {
        ...base,
        torsoRotX: 0.45,
        headRotX: 0.2,
        rArmRotX: -0.3,
        rArmRotZ: -0.4,
        lArmRotX: -0.3,
        lArmRotZ: 0.4,
      };

    case 'DANCE':
      return {
        ...base,
        isOscillating: true,
        oscType: 'dance',
      };

    case 'JUMP':
      return {
        ...base,
        isOscillating: true,
        oscType: 'jump',
      };

    case 'WALK_IN_PLACE':
      return {
        ...base,
        isOscillating: true,
        oscType: 'walk',
      };

    default:
      return DEFAULT_IDLE_POSE;
  }
}

/**
 * Natural Language Movement Command Parser
 * Converts arbitrary text ("Raise your right hand and wave", "Turn left, clap hands, then stop")
 * into a sequential queue of HoloMovementInstruction objects.
 */
export function parseMovementCommands(input: string): HoloMovementInstruction[] {
  if (!input || typeof input !== 'string') return [];
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Check Emergency Interruption / Stop Commands
  if (
    /\b(stop|stop moving|freeze|cancel|cancel movement|cancel the movement|halt|return to idle|stand still|reset pose)\b/i.test(
      lower
    )
  ) {
    return [
      {
        id: `move-${Date.now()}-stop`,
        type: 'STOP_FREEZE',
        label: MOVEMENT_DEFINITIONS.STOP_FREEZE.name,
        durationMs: MOVEMENT_DEFINITIONS.STOP_FREEZE.defaultDurationMs,
      },
    ];
  }

  // 2. Split into clause phrases (commas, "then", "and then", "after that", "next")
  const clauses = lower
    .split(/\b(?:then|and then|after that|next|afterwards|,|;|\.)\b/g)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const matchedInstructions: HoloMovementInstruction[] = [];

  for (const clause of clauses) {
    const movementsInClause = matchSingleClauseMovements(clause);
    matchedInstructions.push(...movementsInClause);
  }

  // If clauses yielded nothing, check whole text once as fallback
  if (matchedInstructions.length === 0) {
    const fallback = matchSingleClauseMovements(lower);
    matchedInstructions.push(...fallback);
  }

  return matchedInstructions;
}

/**
 * Matches movement intents within a single text clause
 */
function matchSingleClauseMovements(clause: string): HoloMovementInstruction[] {
  const instructions: HoloMovementInstruction[] = [];

  const addMovement = (type: HoloMovementId) => {
    // Avoid immediate duplicates
    if (instructions.length > 0 && instructions[instructions.length - 1].type === type) return;
    const def = MOVEMENT_DEFINITIONS[type];
    instructions.push({
      id: `move-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type,
      label: def.name,
      durationMs: def.defaultDurationMs,
    });
  };

  // Raise Both Hands
  if (
    /\b(?:raise|lift|put up)\s+both\s+(?:hands|arms)\b/i.test(clause) ||
    /\b(?:both\s+hands\s+(?:up|raised))\b/i.test(clause)
  ) {
    addMovement('RAISE_BOTH_HANDS');
  }
  // Raise Right Hand
  else if (
    /\b(?:raise|lift|put up)\s+(?:your\s+)?right\s+(?:hand|arm)\b/i.test(clause) ||
    /\b(?:right\s+(?:hand|arm)\s+(?:up|raised))\b/i.test(clause)
  ) {
    addMovement('RAISE_RIGHT_HAND');
  }
  // Raise Left Hand
  else if (
    /\b(?:raise|lift|put up)\s+(?:your\s+)?left\s+(?:hand|arm)\b/i.test(clause) ||
    /\b(?:left\s+(?:hand|arm)\s+(?:up|raised))\b/i.test(clause)
  ) {
    addMovement('RAISE_LEFT_HAND');
  }

  // Lower / Put Down Hands
  if (
    /\b(?:lower|put down|drop)\s+(?:your\s+)?(?:hands|arms)\b/i.test(clause) ||
    /\b(?:hands\s+down)\b/i.test(clause)
  ) {
    addMovement('LOWER_HANDS');
  }

  // Wave Both
  if (
    /\bwave\s+(?:with\s+)?both\s+(?:hands|arms)\b/i.test(clause) ||
    /\bwave\s+both\s+hands\b/i.test(clause)
  ) {
    addMovement('WAVE_BOTH');
  }
  // Wave Right / General Wave
  else if (
    /\bwave\s+(?:your\s+)?(?:right\s+hand|at me|to me|hello|goodbye|hi)\b/i.test(clause) ||
    /\b(?:say hello|greet me)\b/i.test(clause) ||
    clause === 'wave'
  ) {
    addMovement('WAVE_RIGHT');
  }

  // Move Hands Up and Down
  if (
    /\b(?:move|pump|shake)\s+(?:your\s+)?hands?\s+up\s+and\s+down\b/i.test(clause) ||
    /\bhands?\s+up\s+and\s+down\b/i.test(clause)
  ) {
    addMovement('HANDS_UP_DOWN');
  }

  // Pointing
  if (
    /\bpoint\s+(?:towards?\s+)?(?:the\s+)?(?:screen|forward|at me|front)\b/i.test(clause)
  ) {
    addMovement('POINT_SCREEN');
  } else if (/\bpoint\s+(?:to\s+)?(?:your\s+)?left\b/i.test(clause)) {
    addMovement('POINT_LEFT');
  } else if (/\bpoint\s+(?:to\s+)?(?:your\s+)?right\b/i.test(clause)) {
    addMovement('POINT_RIGHT');
  }

  // Fold Arms
  if (/\b(?:fold|cross)\s+(?:your\s+)?arms\b/i.test(clause)) {
    addMovement('FOLD_ARMS');
  } else if (/\b(?:unfold|uncross)\s+(?:your\s+)?arms\b/i.test(clause)) {
    addMovement('UNFOLD_ARMS');
  }

  // Clap
  if (/\b(?:clap|applause|clap hands|clap your hands)\b/i.test(clause)) {
    addMovement('CLAP');
  }

  // Thumbs Up
  if (/\b(?:thumbs up|thumbs-up|thumb up|give me a thumbs up)\b/i.test(clause)) {
    addMovement('THUMBS_UP');
  }

  // Nod
  if (/\b(?:nod|nod head|nod your head|agree)\b/i.test(clause)) {
    addMovement('NOD_HEAD');
  }

  // Shake Head
  if (/\b(?:shake head|shake your head|disagree|say no)\b/i.test(clause)) {
    addMovement('SHAKE_HEAD');
  }

  // Tilt Head
  if (/\b(?:tilt head|tilt your head|head tilt)\b/i.test(clause)) {
    addMovement('TILT_HEAD');
  }

  // Turn Left / Right / Around
  if (/\bturn\s+around\b/i.test(clause) || /\bspin\s+around\b/i.test(clause)) {
    addMovement('TURN_AROUND');
  } else if (/\bturn\s+left\b/i.test(clause) || /\brotate\s+left\b/i.test(clause)) {
    addMovement('TURN_LEFT');
  } else if (/\bturn\s+right\b/i.test(clause) || /\brotate\s+right\b/i.test(clause)) {
    addMovement('TURN_RIGHT');
  }

  // Look Up / Down
  if (/\blook\s+up\b/i.test(clause)) {
    addMovement('LOOK_UP');
  } else if (/\blook\s+down\b/i.test(clause)) {
    addMovement('LOOK_DOWN');
  }

  // Bow
  if (/\b(?:bow|take a bow|curtsy)\b/i.test(clause)) {
    addMovement('BOW');
  }

  // Dance
  if (/\b(?:dance|do a dance|groove)\b/i.test(clause)) {
    addMovement('DANCE');
  }

  // Jump
  if (/\b(?:jump|hop|leap)\b/i.test(clause)) {
    addMovement('JUMP');
  }

  // Walk in place
  if (/\b(?:walk|walk in place|start walking|take steps)\b/i.test(clause)) {
    addMovement('WALK_IN_PLACE');
  }

  // Stand Still / Reset
  if (/\b(?:stand still|idle|return to idle|reset pose|idle position)\b/i.test(clause)) {
    addMovement('STAND_STILL');
  }

  return instructions;
}
