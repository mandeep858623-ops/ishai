/**
 * HOLO AI General-Purpose AI-Driven Procedural 3D Motion Engine
 * Synthesizes dynamic, unconstrained 3D skeletal keyframe animation plans
 * from natural language instructions, follow-up corrections, and creative requests.
 */

export type AvatarJoint =
  | 'head'
  | 'torso'
  | 'hips'
  | 'rightArm'
  | 'rightForearm'
  | 'rightHand'
  | 'leftArm'
  | 'leftForearm'
  | 'leftHand'
  | 'rightThigh'
  | 'rightShin'
  | 'leftThigh'
  | 'leftShin';

export interface JointRotationTarget {
  joint: AvatarJoint;
  rotX?: number; // Pitch (rad)
  rotY?: number; // Yaw (rad)
  rotZ?: number; // Roll (rad)
  posX?: number; // Translation offset (meters)
  posY?: number; // Height offset (e.g. jump/crouch)
  posZ?: number;
}

export interface JointOscillationSpec {
  joint: AvatarJoint;
  channel: 'rotX' | 'rotY' | 'rotZ' | 'posX' | 'posY' | 'posZ';
  amplitude: number;
  frequency: number; // Hz (e.g. 1.5)
  phaseOffset?: number; // radians
  shape?: 'sine' | 'cosine' | 'saw' | 'pulse';
}

export interface MotionPhaseSpec {
  name: string;
  durationMs: number;
  easing?: 'easeInOut' | 'easeIn' | 'easeOut' | 'linear';
  jointTargets: JointRotationTarget[];
  oscillations?: JointOscillationSpec[];
}

export interface HoloMotionPlan {
  id: string;
  title: string;
  description?: string;
  phases: MotionPhaseSpec[];
  repeatCount?: number; // 1 = once, N = N times, -1 = infinite loop
  speedMultiplier?: number; // 1.0 = normal, 0.5 = slow, 2.0 = fast
  returnToIdleOnComplete?: boolean;
  totalDurationMs?: number;
}

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
  oscType?: string;
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
 * Anatomical Joint Limits Guard
 * Prevents broken limbs, twisted elbows/knees or anatomically impossible angles.
 */
export function clampJointTarget(target: JointRotationTarget): JointRotationTarget {
  const t = { ...target };
  const clamp = (v: number | undefined, min: number, max: number) =>
    v !== undefined ? Math.max(min, Math.min(max, v)) : undefined;

  switch (t.joint) {
    case 'rightForearm':
    case 'leftForearm':
      t.rotX = clamp(t.rotX, -2.4, 0.1); // Natural elbow flexion
      break;
    case 'rightShin':
    case 'leftShin':
      t.rotX = clamp(t.rotX, 0.0, 2.4); // Natural knee bend backward
      break;
    case 'head':
      t.rotX = clamp(t.rotX, -0.75, 0.75); // Head pitch
      t.rotY = clamp(t.rotY, -1.2, 1.2); // Head yaw
      t.rotZ = clamp(t.rotZ, -0.5, 0.5); // Head roll
      break;
    case 'torso':
      t.rotX = clamp(t.rotX, -0.85, 0.85); // Bowing / Back arch
      t.rotY = clamp(t.rotY, -1.1, 1.1); // Torso twist
      t.rotZ = clamp(t.rotZ, -0.6, 0.6);
      break;
    case 'rightArm':
    case 'leftArm':
      t.rotX = clamp(t.rotX, -3.0, 1.2); // Shoulder pitch
      t.rotZ = clamp(t.rotZ, -2.6, 2.6); // Shoulder roll
      break;
  }
  return t;
}

/**
 * Evaluates a HoloMotionPlan at a given timestamp to compute exact AvatarPoseTarget
 */
export function evaluateMotionPlanAtTime(
  plan: HoloMotionPlan | null,
  elapsedMs: number,
  baseIdle: AvatarPoseTarget = DEFAULT_IDLE_POSE
): { pose: AvatarPoseTarget; currentPhaseIndex: number; isComplete: boolean } {
  if (!plan || !plan.phases || plan.phases.length === 0) {
    return { pose: { ...baseIdle }, currentPhaseIndex: -1, isComplete: true };
  }

  const speed = plan.speedMultiplier || 1.0;
  const scaledElapsed = elapsedMs * speed;

  // Calculate total plan cycle duration
  const totalPlanMs = plan.phases.reduce((acc, p) => acc + p.durationMs, 0);
  if (totalPlanMs <= 0) {
    return { pose: { ...baseIdle }, currentPhaseIndex: 0, isComplete: true };
  }

  const repeatCount = plan.repeatCount ?? 1;
  const completedCycles = Math.floor(scaledElapsed / totalPlanMs);

  if (repeatCount > 0 && completedCycles >= repeatCount) {
    // Return final phase targets or idle
    return { pose: { ...baseIdle }, currentPhaseIndex: plan.phases.length - 1, isComplete: true };
  }

  const cycleTime = scaledElapsed % totalPlanMs;

  // Find active phase
  let phaseStartTime = 0;
  let activePhaseIndex = 0;
  let activePhase = plan.phases[0];

  for (let i = 0; i < plan.phases.length; i++) {
    const p = plan.phases[i];
    if (cycleTime >= phaseStartTime && cycleTime < phaseStartTime + p.durationMs) {
      activePhaseIndex = i;
      activePhase = p;
      break;
    }
    phaseStartTime += p.durationMs;
  }

  const timeInPhase = cycleTime - phaseStartTime;
  const phaseProgress = Math.min(1.0, Math.max(0.0, timeInPhase / (activePhase.durationMs || 1000)));

  // Smooth Easing (easeInOut quadratic)
  const easingFunc = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
  const alpha = activePhase.easing === 'linear' ? phaseProgress : easingFunc(phaseProgress);

  // Construct target pose starting from idle base
  const pose: AvatarPoseTarget = { ...baseIdle };

  // Apply Joint Rotation Targets from active phase
  if (activePhase.jointTargets) {
    for (const rawTarget of activePhase.jointTargets) {
      const target = clampJointTarget(rawTarget);
      switch (target.joint) {
        case 'head':
          if (target.rotX !== undefined) pose.headRotX = lerp(pose.headRotX, target.rotX, alpha);
          if (target.rotY !== undefined) pose.headRotY = lerp(pose.headRotY, target.rotY, alpha);
          if (target.rotZ !== undefined) pose.headRotZ = lerp(pose.headRotZ, target.rotZ, alpha);
          break;
        case 'torso':
          if (target.rotX !== undefined) pose.torsoRotX = lerp(pose.torsoRotX, target.rotX, alpha);
          if (target.rotY !== undefined) pose.torsoRotY = lerp(pose.torsoRotY, target.rotY, alpha);
          if (target.rotZ !== undefined) pose.torsoRotZ = lerp(pose.torsoRotZ, target.rotZ, alpha);
          break;
        case 'hips':
          if (target.rotY !== undefined) pose.hipsRotY = lerp(pose.hipsRotY, target.rotY, alpha);
          if (target.rotZ !== undefined) pose.hipsRotZ = lerp(pose.hipsRotZ, target.rotZ, alpha);
          if (target.posY !== undefined) pose.hipsPosY = lerp(pose.hipsPosY, target.posY, alpha);
          break;
        case 'rightArm':
          if (target.rotX !== undefined) pose.rArmRotX = lerp(pose.rArmRotX, target.rotX, alpha);
          if (target.rotY !== undefined) pose.rArmRotY = lerp(pose.rArmRotY, target.rotY, alpha);
          if (target.rotZ !== undefined) pose.rArmRotZ = lerp(pose.rArmRotZ, target.rotZ, alpha);
          break;
        case 'rightForearm':
          if (target.rotX !== undefined) pose.rForearmRotX = lerp(pose.rForearmRotX, target.rotX, alpha);
          break;
        case 'rightHand':
          if (target.rotX !== undefined) pose.rHandRotX = lerp(pose.rHandRotX, target.rotX, alpha);
          if (target.rotZ !== undefined) pose.rHandRotZ = lerp(pose.rHandRotZ, target.rotZ, alpha);
          break;
        case 'leftArm':
          if (target.rotX !== undefined) pose.lArmRotX = lerp(pose.lArmRotX, target.rotX, alpha);
          if (target.rotY !== undefined) pose.lArmRotY = lerp(pose.lArmRotY, target.rotY, alpha);
          if (target.rotZ !== undefined) pose.lArmRotZ = lerp(pose.lArmRotZ, target.rotZ, alpha);
          break;
        case 'leftForearm':
          if (target.rotX !== undefined) pose.lForearmRotX = lerp(pose.lForearmRotX, target.rotX, alpha);
          break;
        case 'leftHand':
          if (target.rotX !== undefined) pose.lHandRotX = lerp(pose.lHandRotX, target.rotX, alpha);
          if (target.rotZ !== undefined) pose.lHandRotZ = lerp(pose.lHandRotZ, target.rotZ, alpha);
          break;
        case 'rightThigh':
          if (target.rotX !== undefined) pose.rThighRotX = lerp(pose.rThighRotX, target.rotX, alpha);
          if (target.rotZ !== undefined) pose.rThighRotZ = lerp(pose.rThighRotZ, target.rotZ, alpha);
          break;
        case 'rightShin':
          if (target.rotX !== undefined) pose.rShinRotX = lerp(pose.rShinRotX, target.rotX, alpha);
          break;
        case 'leftThigh':
          if (target.rotX !== undefined) pose.lThighRotX = lerp(pose.lThighRotX, target.rotX, alpha);
          if (target.rotZ !== undefined) pose.lThighRotZ = lerp(pose.lThighRotZ, target.rotZ, alpha);
          break;
        case 'leftShin':
          if (target.rotX !== undefined) pose.lShinRotX = lerp(pose.lShinRotX, target.rotX, alpha);
          break;
      }
    }
  }

  // Evaluate Oscillations (Dynamic continuous math curves)
  if (activePhase.oscillations) {
    const sec = timeInPhase / 1000;
    for (const osc of activePhase.oscillations) {
      const omega = 2 * Math.PI * osc.frequency;
      const val = Math.sin(omega * sec + (osc.phaseOffset || 0)) * osc.amplitude;

      switch (osc.joint) {
        case 'rightHand':
          if (osc.channel === 'rotZ') pose.rHandRotZ += val;
          break;
        case 'leftHand':
          if (osc.channel === 'rotZ') pose.lHandRotZ += val;
          break;
        case 'rightArm':
          if (osc.channel === 'rotX') pose.rArmRotX += val;
          if (osc.channel === 'rotZ') pose.rArmRotZ += val;
          break;
        case 'leftArm':
          if (osc.channel === 'rotX') pose.lArmRotX += val;
          if (osc.channel === 'rotZ') pose.lArmRotZ += val;
          break;
        case 'head':
          if (osc.channel === 'rotX') pose.headRotX += val;
          if (osc.channel === 'rotY') pose.headRotY += val;
          break;
        case 'torso':
          if (osc.channel === 'rotY') pose.torsoRotY += val;
          if (osc.channel === 'rotX') pose.torsoRotX += val;
          break;
        case 'hips':
          if (osc.channel === 'posY') pose.hipsPosY += Math.abs(val);
          if (osc.channel === 'rotZ') pose.hipsRotZ += val;
          break;
        case 'rightThigh':
          if (osc.channel === 'rotX') pose.rThighRotX += val;
          break;
        case 'leftThigh':
          if (osc.channel === 'rotX') pose.lThighRotX += val;
          break;
      }
    }
  }

  return { pose, currentPhaseIndex: activePhaseIndex, isComplete: false };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Checks whether an input text query is a conversational follow-up modifier
 * (e.g., "do it more slowly", "raise hand higher", "move the other hand instead", "make it bigger")
 */
export function isFollowUpCorrection(lower: string): boolean {
  return /\b(more slowly|faster|higher|lower|other hand|other arm|bigger|smaller|repeat|straight|backwards|combine|slower)\b/i.test(
    lower
  );
}

/**
 * Modifies an existing HoloMotionPlan in response to conversational follow-up corrections
 */
export function applyFollowUpCorrection(
  existingPlan: HoloMotionPlan,
  correctionText: string
): HoloMotionPlan {
  const newPlan: HoloMotionPlan = JSON.parse(JSON.stringify(existingPlan));
  newPlan.id = `motion-mod-${Date.now()}`;
  const lower = correctionText.toLowerCase();

  // "do it more slowly" / "slower"
  if (/\b(more slowly|slower|slow motion)\b/i.test(lower)) {
    newPlan.speedMultiplier = (newPlan.speedMultiplier || 1.0) * 0.5;
    newPlan.title = `${newPlan.title} (Slow Motion)`;
  }
  // "faster"
  else if (/\b(faster|quicker|speed up)\b/i.test(lower)) {
    newPlan.speedMultiplier = (newPlan.speedMultiplier || 1.0) * 1.8;
    newPlan.title = `${newPlan.title} (Fast)`;
  }

  // "raise your hand higher" / "higher"
  if (/\bhigher\b/i.test(lower)) {
    newPlan.phases.forEach((phase) => {
      phase.jointTargets.forEach((t) => {
        if (t.joint === 'rightArm' || t.joint === 'leftArm') {
          if (t.rotX !== undefined) t.rotX -= 0.45; // Move shoulder further up
        }
      });
    });
  }

  // "move the other hand instead" / "other arm"
  if (/\bother (hand|arm)\b/i.test(lower)) {
    newPlan.phases.forEach((phase) => {
      phase.jointTargets.forEach((t) => {
        if (t.joint === 'rightArm') t.joint = 'leftArm';
        else if (t.joint === 'leftArm') t.joint = 'rightArm';
        else if (t.joint === 'rightForearm') t.joint = 'leftForearm';
        else if (t.joint === 'leftForearm') t.joint = 'rightForearm';
        else if (t.joint === 'rightHand') t.joint = 'leftHand';
        else if (t.joint === 'leftHand') t.joint = 'rightHand';
      });
    });
  }

  // "make the movement bigger" / "bigger"
  if (/\b(bigger|larger|exaggerate)\b/i.test(lower)) {
    newPlan.phases.forEach((phase) => {
      phase.jointTargets.forEach((t) => {
        if (t.rotX) t.rotX *= 1.4;
        if (t.rotY) t.rotY *= 1.4;
        if (t.rotZ) t.rotZ *= 1.4;
      });
      if (phase.oscillations) {
        phase.oscillations.forEach((o) => (o.amplitude *= 1.5));
      }
    });
  }

  // "repeat three times" / "repeat N times"
  if (/\brepeat\s+(\d+)\s+times\b/i.test(lower)) {
    const m = lower.match(/\brepeat\s+(\d+)\s+times\b/i);
    if (m) newPlan.repeatCount = parseInt(m[1], 10);
  } else if (/\brepeat\b/i.test(lower)) {
    newPlan.repeatCount = (newPlan.repeatCount || 1) + 2;
  }

  // "keep your head straight"
  if (/\bkeep (your )?head straight\b/i.test(lower)) {
    newPlan.phases.forEach((phase) => {
      phase.jointTargets = phase.jointTargets.filter((t) => t.joint !== 'head');
    });
  }

  // "combine that with a turn"
  if (/\b(combine|with a turn|turn)\b/i.test(lower)) {
    newPlan.phases.forEach((phase) => {
      phase.jointTargets.push({ joint: 'hips', rotY: 0.75 });
    });
  }

  return newPlan;
}

/**
 * General-Purpose Dynamic Motion Synthesizer
 * Generates an unconstrained HoloMotionPlan for ANY natural language motion description!
 */
export function generateDynamicMotionPlan(
  input: string,
  previousPlan?: HoloMotionPlan | null
): HoloMotionPlan {
  const text = input.trim();
  const lower = text.toLowerCase();

  // 1. Emergency Stop / Idle Reset
  if (
    /\b(stop|stop moving|freeze|cancel|cancel movement|cancel the movement|halt|return to idle|stand still|reset pose)\b/i.test(
      lower
    )
  ) {
    return {
      id: `motion-${Date.now()}-stop`,
      title: 'Emergency Stop / Idle Reset',
      description: 'Stopping movement and resetting skeleton to natural idle pose.',
      totalDurationMs: 400,
      repeatCount: 1,
      speedMultiplier: 1.0,
      returnToIdleOnComplete: true,
      phases: [
        {
          name: 'Reset to Idle',
          durationMs: 400,
          easing: 'easeInOut',
          jointTargets: [],
        },
      ],
    };
  }

  // 2. Follow-Up Conversational Correction
  if (previousPlan && isFollowUpCorrection(lower)) {
    return applyFollowUpCorrection(previousPlan, lower);
  }

  // 3. Clause Splitting
  const clauseTexts = lower
    .split(/\b(?:then|and then|after that|next|afterwards|,|;|\.)\b/g)
    .map((c) => c.trim())
    .filter((c) => c.length > 0);

  const synthesizedPhases: MotionPhaseSpec[] = [];
  const isSlow = /\b(slowly|slow|graceful|gently|sluggish)\b/i.test(lower);
  const isFast = /\b(fast|rapidly|quick|quickly|swiftly)\b/i.test(lower);
  const speedMultiplier = isSlow ? 0.5 : isFast ? 1.8 : 1.0;
  let repeatCount = 1;

  if (/\brepeat\s+(\d+)\s+times\b/i.test(lower)) {
    const match = lower.match(/\brepeat\s+(\d+)\s+times\b/i);
    if (match) repeatCount = parseInt(match[1], 10);
  } else if (/\b(loop|continuously|keep doing|dance|walk|orchestra|conductor|robot)\b/i.test(lower)) {
    repeatCount = 3;
  }

  for (let i = 0; i < clauseTexts.length; i++) {
    const clause = clauseTexts[i];
    const phase = synthesizePhaseFromClause(clause, i + 1, clauseTexts.length);
    if (phase.jointTargets.length > 0 || (phase.oscillations && phase.oscillations.length > 0)) {
      synthesizedPhases.push(phase);
    }
  }

  if (synthesizedPhases.length === 0) {
    const fallbackPhase = synthesizePhaseFromClause(lower, 1, 1);
    synthesizedPhases.push(fallbackPhase);
  }

  let title = text.length > 36 ? text.slice(0, 36) + '...' : text;
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const totalDuration = synthesizedPhases.reduce((sum, p) => sum + p.durationMs, 0);

  return {
    id: `motion-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    title,
    description: `Procedural motion synthesized for: "${text}"`,
    totalDurationMs: Math.max(1200, totalDuration),
    repeatCount,
    speedMultiplier,
    returnToIdleOnComplete: true,
    phases: synthesizedPhases,
  };
}

/**
 * Synthesizes a MotionPhaseSpec from a single natural language clause
 */
function synthesizePhaseFromClause(clause: string, phaseIndex: number, totalClauses: number): MotionPhaseSpec {
  const jointTargets: JointRotationTarget[] = [];
  const oscillations: JointOscillationSpec[] = [];

  const addTarget = (target: JointRotationTarget) => {
    const clamped = clampJointTarget(target);
    const existing = jointTargets.find((t) => t.joint === clamped.joint);
    if (existing) {
      Object.assign(existing, clamped);
    } else {
      jointTargets.push(clamped);
    }
  };

  // 1. Right Hand / Arm Instructions
  if (/\b(right hand|right arm|right shoulder)\b/i.test(clause)) {
    if (/\bbehind (your )?back\b/i.test(clause)) {
      addTarget({ joint: 'rightArm', rotX: 0.6, rotY: 0.6, rotZ: -0.5 });
      addTarget({ joint: 'rightForearm', rotX: -1.2 });
    } else if (/\braise|lift|up\b/i.test(clause)) {
      const isSlow = /\bslowly\b/i.test(clause);
      addTarget({ joint: 'rightArm', rotX: -2.3, rotZ: -0.3 });
      addTarget({ joint: 'rightForearm', rotX: -0.35 });
    } else if (/\bcircular|circle|rotate wrist\b/i.test(clause)) {
      addTarget({ joint: 'rightArm', rotX: -1.4, rotZ: -0.4 });
      oscillations.push({ joint: 'rightHand', channel: 'rotZ', amplitude: 0.5, frequency: 2.0 });
    } else if (/\bpoint\b/i.test(clause)) {
      addTarget({ joint: 'rightArm', rotX: -1.45, rotY: -0.2, rotZ: -0.05 });
    }
  }

  // 2. Left Hand / Arm Instructions
  if (/\b(left hand|left arm|left shoulder)\b/i.test(clause)) {
    if (/\bbehind (your )?back\b/i.test(clause)) {
      addTarget({ joint: 'leftArm', rotX: 0.6, rotY: -0.6, rotZ: 0.5 });
      addTarget({ joint: 'leftForearm', rotX: -1.2 });
    } else if (/\bmove (your )?left shoulder forward\b/i.test(clause)) {
      addTarget({ joint: 'leftArm', rotX: -0.3, rotY: 0.5 });
    } else if (/\braise|lift|up\b/i.test(clause)) {
      addTarget({ joint: 'leftArm', rotX: -2.3, rotZ: 0.3 });
      addTarget({ joint: 'leftForearm', rotX: -0.35 });
    } else if (/\bpoint\b/i.test(clause)) {
      addTarget({ joint: 'leftArm', rotX: -0.2, rotZ: 1.45 });
    }
  }

  // 3. Both Arms / Both Hands Instructions
  if (/\b(both arms|both hands|stretch|arms sideways)\b/i.test(clause)) {
    if (/\bstretch.*sideways|sideways\b/i.test(clause) && phaseIndex === 1 && totalClauses > 1) {
      addTarget({ joint: 'rightArm', rotX: -0.2, rotZ: -1.5 });
      addTarget({ joint: 'leftArm', rotX: -0.2, rotZ: 1.5 });
    } else if (/\bbring them together|together\b/i.test(clause) || (/\bstretch.*sideways\b/i.test(clause) && phaseIndex === 2)) {
      addTarget({ joint: 'rightArm', rotX: -0.85, rotZ: -0.5 });
      addTarget({ joint: 'leftArm', rotX: -0.85, rotZ: 0.5 });
    } else if (/\braise|lift|up\b/i.test(clause)) {
      addTarget({ joint: 'rightArm', rotX: -2.3, rotZ: -0.3 });
      addTarget({ joint: 'leftArm', rotX: -2.3, rotZ: 0.3 });
    }
  }

  // 4. Crossed Arms
  if (/\b(cross|fold)\s+(your\s+)?arms\b/i.test(clause)) {
    addTarget({ joint: 'rightArm', rotX: -0.85, rotY: 0.55, rotZ: -0.65 });
    addTarget({ joint: 'rightForearm', rotX: -1.35 });
    addTarget({ joint: 'leftArm', rotX: -0.85, rotY: -0.55, rotZ: 0.65 });
    addTarget({ joint: 'leftForearm', rotX: -1.35 });
  }

  // 5. Torso / Knees / Lean
  if (/\b(bend knees|lean|crouch|upper body forward)\b/i.test(clause)) {
    addTarget({ joint: 'torso', rotX: 0.5 });
    addTarget({ joint: 'rightThigh', rotX: 0.4 });
    addTarget({ joint: 'rightShin', rotX: 0.6 });
    addTarget({ joint: 'leftThigh', rotX: 0.4 });
    addTarget({ joint: 'leftShin', rotX: 0.6 });
    addTarget({ joint: 'hips', posY: -0.15 });
  }

  // 6. Turn Upper Body vs Feet Forward
  if (/\bturn (your )?upper body\b/i.test(clause) || /\bturn torso\b/i.test(clause)) {
    addTarget({ joint: 'torso', rotY: 0.75 });
    addTarget({ joint: 'hips', rotY: 0.0 });
  }

  // 7. Superhero Landing Pose
  if (/\b(superhero|hero landing|superhero landing)\b/i.test(clause)) {
    addTarget({ joint: 'hips', posY: -0.32 });
    addTarget({ joint: 'torso', rotX: 0.75 });
    addTarget({ joint: 'head', rotX: -0.55 });
    addTarget({ joint: 'rightArm', rotX: -0.4, rotZ: -0.3 });
    addTarget({ joint: 'rightForearm', rotX: -1.25 });
    addTarget({ joint: 'leftArm', rotX: -1.8, rotZ: 0.7 });
    addTarget({ joint: 'rightThigh', rotX: 0.85 });
    addTarget({ joint: 'rightShin', rotX: 1.25 });
    addTarget({ joint: 'leftThigh', rotX: 0.3 });
    addTarget({ joint: 'leftShin', rotX: 1.4 });
  }

  // 8. Orchestra Conductor
  if (/\b(conductor|orchestra|directing)\b/i.test(clause)) {
    addTarget({ joint: 'rightArm', rotX: -1.4, rotZ: -0.4 });
    addTarget({ joint: 'leftArm', rotX: -1.4, rotZ: 0.4 });
    oscillations.push({ joint: 'rightArm', channel: 'rotX', amplitude: 0.4, frequency: 1.8 });
    oscillations.push({ joint: 'leftArm', channel: 'rotX', amplitude: 0.35, frequency: 1.8, phaseOffset: 0.5 });
  }

  // 9. Robot Dance / New Creative Dance
  if (/\b(dance|robot|robot dance|new dance|creative dance|funny dance|invent a dance)\b/i.test(clause)) {
    addTarget({ joint: 'rightArm', rotX: -1.5, rotZ: -0.8 });
    addTarget({ joint: 'rightForearm', rotX: -1.2 });
    addTarget({ joint: 'leftArm', rotX: -0.5, rotZ: 0.8 });
    oscillations.push({ joint: 'hips', channel: 'rotZ', amplitude: 0.25, frequency: 2.2 });
    oscillations.push({ joint: 'torso', channel: 'rotY', amplitude: 0.3, frequency: 2.2 });
    oscillations.push({ joint: 'rightThigh', channel: 'rotX', amplitude: 0.4, frequency: 2.2 });
    oscillations.push({ joint: 'leftThigh', channel: 'rotX', amplitude: 0.4, frequency: 2.2, phaseOffset: Math.PI });
  }

  // 9b. Walk
  if (/\b(walk|running|run|step)\b/i.test(clause)) {
    addTarget({ joint: 'rightArm', rotX: 0.2, rotZ: -0.15 });
    addTarget({ joint: 'leftArm', rotX: 0.2, rotZ: 0.15 });
    oscillations.push({ joint: 'rightThigh', channel: 'rotX', amplitude: 0.5, frequency: 2.0 });
    oscillations.push({ joint: 'leftThigh', channel: 'rotX', amplitude: 0.5, frequency: 2.0, phaseOffset: Math.PI });
    oscillations.push({ joint: 'hips', channel: 'posY', amplitude: 0.05, frequency: 4.0 });
  }

  // 9c. Jump
  if (/\b(jump|leap|hop)\b/i.test(clause)) {
    oscillations.push({ joint: 'hips', channel: 'posY', amplitude: 0.4, frequency: 1.5, shape: 'pulse' });
    addTarget({ joint: 'rightThigh', rotX: 0.4 });
    addTarget({ joint: 'leftThigh', rotX: 0.4 });
  }

  // 10. Head Tilt / Nod / Shake
  if (/\btilt (your )?head\b/i.test(clause)) {
    addTarget({ joint: 'head', rotZ: 0.35 });
  } else if (/\bnod\b/i.test(clause)) {
    oscillations.push({ joint: 'head', channel: 'rotX', amplitude: 0.25, frequency: 2.5 });
  } else if (/\bshake head\b/i.test(clause)) {
    oscillations.push({ joint: 'head', channel: 'rotY', amplitude: 0.3, frequency: 2.5 });
  }

  // 11. Wave
  if (/\bwave\b/i.test(clause)) {
    addTarget({ joint: 'rightArm', rotX: -1.6, rotZ: -0.85 });
    addTarget({ joint: 'rightForearm', rotX: -0.85 });
    oscillations.push({ joint: 'rightHand', channel: 'rotZ', amplitude: 0.45, frequency: 2.5 });
  }

  // 12. Clap
  if (/\bclap\b/i.test(clause)) {
    addTarget({ joint: 'rightArm', rotX: -0.85, rotZ: -0.5 });
    addTarget({ joint: 'leftArm', rotX: -0.85, rotZ: 0.5 });
    oscillations.push({ joint: 'rightArm', channel: 'rotZ', amplitude: 0.2, frequency: 3.0 });
    oscillations.push({ joint: 'leftArm', channel: 'rotZ', amplitude: 0.2, frequency: 3.0, phaseOffset: Math.PI });
  }

  // 13. Thumbs Up
  if (/\bthumbs?\s+up\b/i.test(clause)) {
    addTarget({ joint: 'rightArm', rotX: -1.2, rotY: 0.4, rotZ: -0.2 });
    addTarget({ joint: 'rightForearm', rotX: -1.5 });
    addTarget({ joint: 'rightHand', rotX: 0.6 });
  }

  // 14. Bow
  if (/\bbow\b/i.test(clause)) {
    addTarget({ joint: 'torso', rotX: 0.6 });
    addTarget({ joint: 'head', rotX: 0.3 });
  }

  // 15. Turn Around
  if (/\bturn\s+around\b/i.test(clause)) {
    addTarget({ joint: 'hips', rotY: Math.PI });
  }

  // Duration
  let durationMs = 2200;
  if (/\bslowly|slow|graceful\b/i.test(clause)) durationMs = 3200;
  if (/\bfast|quick\b/i.test(clause)) durationMs = 1200;

  return {
    name: `Phase ${phaseIndex}`,
    durationMs,
    easing: 'easeInOut',
    jointTargets,
    oscillations,
  };
}
