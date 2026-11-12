import * as THREE from 'three';

// Pre-allocated math helpers to avoid GC in render loop
export const _vec3 = new THREE.Vector3();
export const _euler = new THREE.Euler();
export const _quat = new THREE.Quaternion();
export const _color = new THREE.Color();
export const _mat4 = new THREE.Matrix4();

export interface MechanicalObjectParts {
  group: THREE.Group;
  dispose: () => void;
}

export interface PartDefinition {
  shape: 'cylinder' | 'box' | 'torus' | 'tube' | 'cone' | 'sphere';
  dimensions: { 
    x?: number; 
    y?: number; 
    z?: number; 
    radius?: number; 
    innerRadius?: number; 
    height?: number; 
    radiusTop?: number; 
    radiusBottom?: number;
    segments?: number;
  };
  position: { x: number, y: number, z: number };
  rotation: { x: number, y: number, z: number };
  material: {
    color: string | number;
    metalness: number;
    roughness: number;
    emissive?: string | number;
    transmission?: number;
    opacity?: number;
    transparent?: boolean;
  };
  count?: number; 
  pattern?: 'circle' | 'none';
  patternRadius?: number;
}

export interface MechanicalRecipe {
  name: string;
  type: string;
  parts: PartDefinition[];
}

/**
 * Deterministic hash for string-based variety
 */
function getStringHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Assembly from Recipe - Dynamic Procedural Engine
 */
export function createAssemblyFromRecipe(recipe: MechanicalRecipe): MechanicalObjectParts {
  const group = new THREE.Group();
  const disposables: (THREE.BufferGeometry | THREE.Material)[] = [];

  recipe.parts.forEach((p) => {
    let geo: THREE.BufferGeometry;
    const d = p.dimensions;

    switch (p.shape) {
      case 'box':
        geo = new THREE.BoxGeometry(d.x || 1, d.y || 1, d.z || 1);
        break;
      case 'cylinder':
        geo = new THREE.CylinderGeometry(
          d.radiusTop ?? d.radius ?? 0.5, 
          d.radiusBottom ?? d.radius ?? 0.5, 
          d.height || 1, 
          d.segments || 32
        );
        break;
      case 'cone':
        geo = new THREE.ConeGeometry(d.radius || 0.5, d.height || 1, d.segments || 32);
        break;
      case 'sphere':
        geo = new THREE.SphereGeometry(d.radius || 0.5, d.segments || 32, d.segments || 32);
        break;
      case 'torus':
        geo = new THREE.TorusGeometry(d.radius || 0.5, d.innerRadius || 0.1, 16, d.segments || 32);
        break;
      case 'tube':
        // A tube is a hollow cylinder. We'll use CylinderGeometry with open ends 
        // and potentially a small thickness if we wanted to be fancy, 
        // but open ends + doubleSided material is often enough for mechanical viz.
        geo = new THREE.CylinderGeometry(
          d.radiusTop ?? d.radius ?? 0.5, 
          d.radiusBottom ?? d.radius ?? 0.5, 
          d.height || 1, 
          d.segments || 32, 
          1, 
          true
        );
        break;
      default:
        geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    }

    const mat = new THREE.MeshPhysicalMaterial({
      color: p.material.color,
      metalness: p.material.metalness,
      roughness: p.material.roughness,
      emissive: p.material.emissive || 0x000000,
      transmission: p.material.transmission || 0,
      opacity: p.material.opacity ?? 1,
      transparent: p.material.transparent ?? (p.material.opacity ? p.material.opacity < 1 : false),
      thickness: 1.0,
      envMapIntensity: 1.0,
      side: THREE.DoubleSide
    });

    const createMesh = () => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.position.x, p.position.y, p.position.z);
      mesh.rotation.set(p.rotation.x, p.rotation.y, p.rotation.z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      return mesh;
    };

    if (p.pattern === 'circle' && p.count && p.count > 1) {
      for (let i = 0; i < p.count; i++) {
        const mesh = createMesh();
        const angle = (i / p.count) * Math.PI * 2;
        const r = p.patternRadius || 0;
        mesh.position.x += Math.cos(angle) * r;
        mesh.position.z += Math.sin(angle) * r;
        mesh.rotation.y += -angle; // Orient to center
        group.add(mesh);
      }
    } else {
      group.add(createMesh());
    }

    disposables.push(geo, mat);
  });

  // Calculate bounding box to ground the object
  const bbox = new THREE.Box3().setFromObject(group);
  group.position.y = -bbox.min.y;

  return {
    group,
    dispose: () => disposables.forEach(d => d.dispose())
  };
}

/**
 * Legacy Support: Procedural Gear
 */
export function createGear(teeth: number = 12, radius: number = 1, thickness: number = 0.3): MechanicalObjectParts {
  const recipe: MechanicalRecipe = {
    name: 'Legacy Gear',
    type: 'gear',
    parts: [
      {
        shape: 'cylinder',
        dimensions: { radius: radius * 0.7, height: thickness },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0 },
        material: { color: 0x888888, metalness: 0.9, roughness: 0.25 }
      },
      {
        shape: 'box',
        dimensions: { x: (Math.PI * 2 * radius * 0.7) / teeth * 0.6, y: thickness, z: radius * 0.3 * 2 },
        position: { x: radius * 0.85, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        material: { color: 0x999999, metalness: 0.95, roughness: 0.1 },
        count: teeth,
        pattern: 'circle',
        patternRadius: radius * 0.85
      },
      {
        shape: 'cylinder',
        dimensions: { radius: 0.2, height: thickness + 0.1 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: Math.PI / 2, y: 0, z: 0 },
        material: { color: 0x444444, metalness: 1, roughness: 0.05 }
      }
    ]
  };
  return createAssemblyFromRecipe(recipe);
}

/**
 * Legacy Support: Procedural Piston
 */
export function createPiston(scale: number = 1, color: number = 0xcccccc): MechanicalObjectParts {
  const headRadius = 0.5 * scale;
  const headHeight = 0.8 * scale;
  const rodLength = 1.5 * scale;

  const recipe: MechanicalRecipe = {
    name: 'Legacy Piston',
    type: 'piston',
    parts: [
      {
        shape: 'cylinder',
        dimensions: { radius: headRadius, height: headHeight },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        material: { color, metalness: 0.9, roughness: 0.3 }
      },
      {
        shape: 'box',
        dimensions: { x: 0.15 * scale, y: rodLength, z: 0.2 * scale },
        position: { x: 0, y: -headHeight / 2 - rodLength / 2, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        material: { color: 0x666666, metalness: 0.85, roughness: 0.5 }
      },
      {
        shape: 'cylinder',
        dimensions: { radius: 0.12 * scale, height: headRadius * 2.1 },
        position: { x: 0, y: -headHeight * 0.1, z: 0 },
        rotation: { x: 0, y: 0, z: Math.PI / 2 },
        material: { color: 0x999999, metalness: 1, roughness: 0.1 }
      }
    ]
  };
  return createAssemblyFromRecipe(recipe);
}

/**
 * Legacy Support: Procedural Wrench
 */
export function createWrench(): MechanicalObjectParts {
  const handleLength = 2.5;
  const recipe: MechanicalRecipe = {
    name: 'Legacy Wrench',
    type: 'wrench',
    parts: [
      {
        shape: 'box',
        dimensions: { x: 0.3, y: handleLength, z: 0.1 },
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0 },
        material: { color: 0x777777, metalness: 0.9, roughness: 0.45 }
      },
      {
        shape: 'torus',
        dimensions: { radius: 0.6, innerRadius: 0.2 },
        position: { x: 0, y: handleLength / 2, z: 0 },
        rotation: { x: 0, y: 0, z: -Math.PI * 0.75 },
        material: { color: 0x888888, metalness: 1, roughness: 0.2 }
      }
    ]
  };
  return createAssemblyFromRecipe(recipe);
}

/**
 * Fallback Generic Part
 */
export function createGenericPart(name: string): MechanicalObjectParts {
  const seed = getStringHash(name || 'GENERIC');
  const rng = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  const query = name.toLowerCase();
  const parts: PartDefinition[] = [];
  
  // Detect explicit shapes
  if (query.includes('cube') || query.includes('box')) {
    parts.push({
      shape: 'box',
      dimensions: { x: 1.5, y: 1.5, z: 1.5 },
      position: { x: 0, y: 0.75, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      material: { color: 0x06b6d4, metalness: 0.8, roughness: 0.2 }
    });
    return createAssemblyFromRecipe({ name, type: 'primitive_box', parts });
  }

  if (query.includes('sphere') || query.includes('ball')) {
    parts.push({
      shape: 'sphere',
      dimensions: { radius: 1, segments: 48 },
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      material: { color: 0x8b5cf6, metalness: 0.9, roughness: 0.1 }
    });
    return createAssemblyFromRecipe({ name, type: 'primitive_sphere', parts });
  }

  if (query.includes('cylinder') || query.includes('pipe')) {
    parts.push({
      shape: 'cylinder',
      dimensions: { radius: 0.7, height: 2, segments: 48 },
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      material: { color: 0x94a3b8, metalness: 0.95, roughness: 0.05 }
    });
    return createAssemblyFromRecipe({ name, type: 'primitive_cylinder', parts });
  }

  if (query.includes('cone') || query.includes('pyramid')) {
    parts.push({
      shape: 'cone',
      dimensions: { radius: 1, height: 2, segments: 48 },
      position: { x: 0, y: 1, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      material: { color: 0xf43f5e, metalness: 0.7, roughness: 0.3 }
    });
    return createAssemblyFromRecipe({ name, type: 'primitive_cone', parts });
  }

  if (query.includes('torus') || query.includes('donut') || query.includes('ring')) {
    parts.push({
      shape: 'torus',
      dimensions: { radius: 1, innerRadius: 0.4, segments: 48 },
      position: { x: 0, y: 0.4, z: 0 },
      rotation: { x: Math.PI / 2, y: 0, z: 0 },
      material: { color: 0xeab308, metalness: 1.0, roughness: 0.1 }
    });
    return createAssemblyFromRecipe({ name, type: 'primitive_torus', parts });
  }

  // Base Random
  const baseType = seed % 3;
  parts.push({
    shape: baseType === 0 ? 'box' : (baseType === 1 ? 'cylinder' : 'torus'),
    dimensions: { 
      x: 0.8 + rng(1), y: 0.4 + rng(2) * 0.5, z: 0.8 + rng(3),
      radius: 0.5 + rng(4) * 0.3, height: 0.6 + rng(6),
      innerRadius: 0.15 + rng(8) * 0.1
    },
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: baseType === 2 ? Math.PI / 2 : 0, y: 0, z: 0 },
    material: {
      color: _color.setHSL(rng(9), 0.1, 0.3 + rng(10) * 0.2).getHex(),
      metalness: 0.85 + rng(11) * 0.1,
      roughness: 0.2 + rng(12) * 0.5 
    }
  });

  // Details
  const subCount = 4 + (seed % 5);
  for (let i = 0; i < subCount; i++) {
    const subType = (seed + i) % 4;
    const angle = (i / subCount) * Math.PI * 2;
    parts.push({
      shape: subType === 0 ? 'box' : (subType === 1 ? 'cylinder' : (subType === 2 ? 'sphere' : 'torus')),
      dimensions: { x: 0.15, y: 0.7, z: 0.15, radius: 0.15, height: 0.8 },
      position: { x: Math.cos(angle) * 0.6, y: rng(i + 20) * 0.4 - 0.2, z: Math.sin(angle) * 0.6 },
      rotation: { x: rng(i + 30) * Math.PI, y: rng(i + 40) * Math.PI, z: rng(i + 50) * Math.PI },
      material: {
        color: _color.clone().multiplyScalar(0.8 + rng(i) * 0.4).getHex(),
        metalness: 0.9,
        roughness: 0.1 + rng(i + 100) * 0.8
      }
    });
  }

  return createAssemblyFromRecipe({ name, type: 'generic', parts });
}
