import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import {
  TileData,
  BuildingInstance,
  BuildingDefinition,
  VehicleAgent,
  OverlayMode,
  ActiveTool,
  CitySimulationState,
} from './types';
import { BUILDING_CATALOG } from './cityData';

interface CityCanvas3DProps {
  gridSize: number;
  tiles: TileData[];
  buildings: BuildingInstance[];
  vehicles: VehicleAgent[];
  simState: CitySimulationState;
  overlayMode: OverlayMode;
  activeTool: ActiveTool;
  selectedBuildingDefId?: string;
  selectedInstanceId?: string | null;
  cameraView: 'orbit' | 'isometric' | 'top_down' | 'street';
  onSelectTile: (x: number, z: number, instanceId?: string | null) => void;
  onHoverTile: (x: number, z: number) => void;
  theme?: 'dark' | 'light';
}

export const CityCanvas3D: React.FC<CityCanvas3DProps> = ({
  gridSize,
  tiles,
  buildings,
  vehicles,
  simState,
  overlayMode,
  activeTool,
  selectedBuildingDefId,
  selectedInstanceId,
  cameraView,
  onSelectTile,
  onHoverTile,
  theme = 'dark',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);

  // Group references
  const terrainGroupRef = useRef<THREE.Group | null>(null);
  const buildingsGroupRef = useRef<THREE.Group | null>(null);
  const roadsGroupRef = useRef<THREE.Group | null>(null);
  const vehiclesGroupRef = useRef<THREE.Group | null>(null);
  const hoverCursorRef = useRef<THREE.Mesh | null>(null);
  const dirLightRef = useRef<THREE.DirectionalLight | null>(null);
  const ambLightRef = useRef<THREE.AmbientLight | null>(null);

  // Raycasting hover state
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const hoveredTileRef = useRef<{ x: number; z: number } | null>(null);

  // Camera Orbit state
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3.8, distance: 48 });
  const isDraggingRef = useRef(false);
  const isPanningRef = useRef(false);
  const prevMouseRef = useRef({ x: 0, y: 0 });
  const cameraTargetRef = useRef(new THREE.Vector3(gridSize / 2, 0, gridSize / 2));

  // Mutable props ref for animation loop
  const propsRef = useRef({
    gridSize,
    tiles,
    buildings,
    vehicles,
    simState,
    overlayMode,
    activeTool,
    selectedBuildingDefId,
    selectedInstanceId,
    cameraView,
  });

  useEffect(() => {
    propsRef.current = {
      gridSize,
      tiles,
      buildings,
      vehicles,
      simState,
      overlayMode,
      activeTool,
      selectedBuildingDefId,
      selectedInstanceId,
      cameraView,
    };
  }, [
    gridSize,
    tiles,
    buildings,
    vehicles,
    simState,
    overlayMode,
    activeTool,
    selectedBuildingDefId,
    selectedInstanceId,
    cameraView,
  ]);

  // Main Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1000);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // Lighting
    const ambLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambLight);
    ambLightRef.current = ambLight;

    const dirLight = new THREE.DirectionalLight(0xfff7ed, 2.8);
    dirLight.position.set(40, 60, 40);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 180;
    const d = 50;
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);
    dirLightRef.current = dirLight;

    // Groups
    const terrainGroup = new THREE.Group();
    scene.add(terrainGroup);
    terrainGroupRef.current = terrainGroup;

    const roadsGroup = new THREE.Group();
    scene.add(roadsGroup);
    roadsGroupRef.current = roadsGroup;

    const buildingsGroup = new THREE.Group();
    scene.add(buildingsGroup);
    buildingsGroupRef.current = buildingsGroup;

    const vehiclesGroup = new THREE.Group();
    scene.add(vehiclesGroup);
    vehiclesGroupRef.current = vehiclesGroup;

    // Hover Cursor Indicator
    const cursorGeo = new THREE.BoxGeometry(1.02, 0.15, 1.02);
    const cursorMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.55 });
    const hoverCursor = new THREE.Mesh(cursorGeo, cursorMat);
    hoverCursor.position.set(0, 0.1, 0);
    scene.add(hoverCursor);
    hoverCursorRef.current = hoverCursor;

    // Pointer Event Listeners
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isDraggingRef.current = true;
      } else if (e.button === 2) {
        isPanningRef.current = true;
      }
      prevMouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isPanningRef.current = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isDraggingRef.current) {
        const dx = e.clientX - prevMouseRef.current.x;
        const dy = e.clientY - prevMouseRef.current.y;
        cameraAngleRef.current.theta -= dx * 0.005;
        cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.1, cameraAngleRef.current.phi + dy * 0.005));
        prevMouseRef.current = { x: e.clientX, y: e.clientY };
      } else if (isPanningRef.current) {
        const dx = (e.clientX - prevMouseRef.current.x) * 0.08;
        const dy = (e.clientY - prevMouseRef.current.y) * 0.08;
        cameraTargetRef.current.x -= dx;
        cameraTargetRef.current.z += dy;
        prevMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handleWheel = (e: WheelEvent) => {
      cameraAngleRef.current.distance = Math.max(12, Math.min(120, cameraAngleRef.current.distance + e.deltaY * 0.04));
    };

    const handleClick = (e: MouseEvent) => {
      // Ignore click if user was dragging camera
      if (hoveredTileRef.current) {
        const { x, z } = hoveredTileRef.current;
        const tile = propsRef.current.tiles.find((t) => t.x === x && t.z === z);
        onSelectTile(x, z, tile?.buildingInstanceId || null);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('click', handleClick);
    container.addEventListener('contextmenu', handleContextMenu);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Render Loop
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);

      const {
        gridSize: gSize,
        simState: state,
        cameraView: cView,
        overlayMode: oMode,
      } = propsRef.current;

      // Time of Day Lighting Adjustments
      if (dirLightRef.current && ambLightRef.current && sceneRef.current) {
        if (state.timeOfDay === 'night') {
          sceneRef.current.background = new THREE.Color(0x050a18);
          dirLightRef.current.color.setHex(0x38bdf8);
          dirLightRef.current.intensity = 0.6;
          ambLightRef.current.intensity = 0.4;
        } else if (state.timeOfDay === 'sunset') {
          sceneRef.current.background = new THREE.Color(0x3b0764);
          dirLightRef.current.color.setHex(0xf97316);
          dirLightRef.current.intensity = 2.4;
          ambLightRef.current.intensity = 1.0;
        } else if (state.timeOfDay === 'sunrise') {
          sceneRef.current.background = new THREE.Color(0x1e1b4b);
          dirLightRef.current.color.setHex(0xfde047);
          dirLightRef.current.intensity = 2.2;
          ambLightRef.current.intensity = 0.9;
        } else {
          // Day
          sceneRef.current.background = new THREE.Color(0x0284c7);
          dirLightRef.current.color.setHex(0xfff7ed);
          dirLightRef.current.intensity = 2.8;
          ambLightRef.current.intensity = 1.2;
        }
      }

      // Camera Positioning Presets & Smooth Damping
      let dist = cameraAngleRef.current.distance;
      let theta = cameraAngleRef.current.theta;
      let phi = cameraAngleRef.current.phi;

      if (cView === 'top_down') {
        phi = Math.PI / 2.05;
      } else if (cView === 'isometric') {
        theta = Math.PI / 4;
        phi = Math.PI / 3.5;
      } else if (cView === 'street') {
        dist = 16;
        phi = Math.PI / 6;
      }

      const cx = cameraTargetRef.current.x + dist * Math.sin(phi) * Math.sin(theta);
      const cy = cameraTargetRef.current.y + dist * Math.cos(phi);
      const cz = cameraTargetRef.current.z + dist * Math.sin(phi) * Math.cos(theta);

      camera.position.set(cx, cy, cz);
      camera.lookAt(cameraTargetRef.current);

      // Raycast hover tile
      if (terrainGroupRef.current) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera);
        const intersects = raycasterRef.current.intersectObjects(terrainGroupRef.current.children, true);

        if (intersects.length > 0) {
          const hit = intersects[0].point;
          const hx = Math.floor(hit.x + 0.5);
          const hz = Math.floor(hit.z + 0.5);

          if (hx >= 0 && hx < gSize && hz >= 0 && hz < gSize) {
            hoveredTileRef.current = { x: hx, z: hz };
            if (hoverCursorRef.current) {
              hoverCursorRef.current.position.set(hx, 0.1, hz);
              hoverCursorRef.current.visible = true;
            }
            onHoverTile(hx, hz);
          }
        }
      }

      renderer.render(scene, camera);
    };

    frameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameIdRef.current) cancelAnimationFrame(frameIdRef.current);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('click', handleClick);
      container.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current && rendererRef.current.domElement) {
        rendererRef.current.domElement.remove();
      }
    };
  }, []);

  // Re-render 3D World Objects whenever tiles or buildings change
  useEffect(() => {
    if (!terrainGroupRef.current || !roadsGroupRef.current || !buildingsGroupRef.current) return;

    // Clear previous geometries
    terrainGroupRef.current.clear();
    roadsGroupRef.current.clear();
    buildingsGroupRef.current.clear();

    const grassMat = new THREE.MeshStandardMaterial({ color: 0x34d399, roughness: 0.8 });
    const waterMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.1, metalness: 0.8, transparent: true, opacity: 0.85 });
    const sandMat = new THREE.MeshStandardMaterial({ color: 0xfde047, roughness: 0.9 });
    const soilMat = new THREE.MeshStandardMaterial({ color: 0xa16207, roughness: 0.9 });
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5 });
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    // 1. Build Terrain Mesh
    tiles.forEach((t) => {
      const tileGeo = new THREE.BoxGeometry(1, 0.2 + t.elevation * 0.4, 1);
      tileGeo.translate(0, (0.2 + t.elevation * 0.4) / 2 - 0.1, 0);

      let mat = grassMat;
      if (t.terrain === 'water') mat = waterMat;
      else if (t.terrain === 'sand') mat = sandMat;
      else if (t.terrain === 'soil') mat = soilMat;

      // Apply Overlay Colors if overlay mode active
      if (overlayMode === 'power') {
        mat = t.hasPower
          ? new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.5 })
          : new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.5 });
      } else if (overlayMode === 'water') {
        mat = t.hasWater
          ? new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.5 })
          : new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
      } else if (overlayMode === 'services') {
        mat = t.hasServiceCoverage
          ? new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.5 })
          : new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.5 });
      }

      const tileMesh = new THREE.Mesh(tileGeo, mat);
      tileMesh.position.set(t.x, 0, t.z);
      tileMesh.receiveShadow = true;
      terrainGroupRef.current?.add(tileMesh);

      // Render Road surface on tile
      if (t.isRoad) {
        const roadGeo = new THREE.BoxGeometry(0.98, 0.05, 0.98);
        const roadMesh = new THREE.Mesh(roadGeo, roadMat);
        roadMesh.position.set(t.x, 0.05 + t.elevation * 0.4, t.z);
        roadMesh.receiveShadow = true;
        roadsGroupRef.current?.add(roadMesh);

        // Center line
        const lineGeo = new THREE.BoxGeometry(0.12, 0.06, 0.5);
        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        lineMesh.position.set(t.x, 0.06 + t.elevation * 0.4, t.z);
        roadsGroupRef.current?.add(lineMesh);
      }
    });

    // 2. Build 3D Buildings
    buildings.forEach((b) => {
      const def = BUILDING_CATALOG.find((cat) => cat.id === b.defId);
      if (!def) return;

      const buildGroup = new THREE.Group();
      buildGroup.position.set(b.x + (def.width - 1) / 2, 0.1, b.z + (def.height - 1) / 2);

      const isSelected = selectedInstanceId === b.instanceId;
      const bColor = isSelected ? '#a855f7' : def.color;
      const mainMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(bColor),
        roughness: 0.3,
        metalness: 0.4,
      });

      const glassMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        roughness: 0.1,
        metalness: 0.9,
      });

      if (def.modelStyle === 'skyscraper') {
        const heightMultiplier = 4.5;
        const bGeo = new THREE.BoxGeometry(def.width * 0.88, heightMultiplier, def.height * 0.88);
        bGeo.translate(0, heightMultiplier / 2, 0);
        const bMesh = new THREE.Mesh(bGeo, mainMat);
        bMesh.castShadow = true;
        buildGroup.add(bMesh);

        // Spire
        const spireGeo = new THREE.CylinderGeometry(0.05, 0.15, 1.2, 8);
        spireGeo.translate(0, heightMultiplier + 0.6, 0);
        const spireMesh = new THREE.Mesh(spireGeo, glassMat);
        buildGroup.add(spireMesh);
      } else if (def.modelStyle === 'apartment' || def.modelStyle === 'office') {
        const heightMultiplier = 2.8;
        const bGeo = new THREE.BoxGeometry(def.width * 0.9, heightMultiplier, def.height * 0.9);
        bGeo.translate(0, heightMultiplier / 2, 0);
        const bMesh = new THREE.Mesh(bGeo, mainMat);
        bMesh.castShadow = true;
        buildGroup.add(bMesh);
      } else if (def.modelStyle === 'house') {
        const bGeo = new THREE.BoxGeometry(0.7, 0.6, 0.7);
        bGeo.translate(0, 0.3, 0);
        const bMesh = new THREE.Mesh(bGeo, mainMat);
        bMesh.castShadow = true;
        buildGroup.add(bMesh);

        // Roof
        const roofGeo = new THREE.ConeGeometry(0.55, 0.4, 4);
        roofGeo.rotateY(Math.PI / 4);
        roofGeo.translate(0, 0.8, 0);
        const roofMesh = new THREE.Mesh(roofGeo, new THREE.MeshStandardMaterial({ color: 0xef4444 }));
        buildGroup.add(roofMesh);
      } else if (def.modelStyle === 'power_plant' || def.modelStyle === 'water_tower') {
        const cylGeo = new THREE.CylinderGeometry(0.4, 0.5, 1.8, 16);
        cylGeo.translate(0, 0.9, 0);
        const cylMesh = new THREE.Mesh(cylGeo, mainMat);
        cylMesh.castShadow = true;
        buildGroup.add(cylMesh);
      } else {
        // Default commercial / public building
        const bGeo = new THREE.BoxGeometry(def.width * 0.85, 1.4, def.height * 0.85);
        bGeo.translate(0, 0.7, 0);
        const bMesh = new THREE.Mesh(bGeo, mainMat);
        bMesh.castShadow = true;
        buildGroup.add(bMesh);
      }

      buildingsGroupRef.current?.add(buildGroup);
    });
  }, [tiles, buildings, selectedInstanceId, overlayMode]);

  // Render Vehicles
  useEffect(() => {
    if (!vehiclesGroupRef.current) return;
    vehiclesGroupRef.current.clear();

    const carGeo = new THREE.BoxGeometry(0.32, 0.18, 0.55);
    carGeo.translate(0, 0.12, 0);

    vehicles.forEach((v) => {
      const carMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(v.color), roughness: 0.4 });
      const carMesh = new THREE.Mesh(carGeo, carMat);
      carMesh.position.set(v.posX, 0.08, v.posZ);
      carMesh.rotation.y = v.rotY;
      vehiclesGroupRef.current?.add(carMesh);
    });
  }, [vehicles]);

  return <div ref={mountRef} className="w-full h-full relative cursor-crosshair select-none overflow-hidden" />;
};
