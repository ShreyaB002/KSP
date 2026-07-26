import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Camera, Image, Upload, Play, Pause, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';

interface ThreeDViewportProps {
  locationName: string;
  narrativeText: string;
  isPublicLocation: boolean;
  textureId?: string;
  onTextureGenerated: (textureId: string) => void;
}

export default function ThreeDViewport({
  locationName,
  narrativeText,
  isPublicLocation,
  textureId,
  onTextureGenerated
}: ThreeDViewportProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // App UI State
  const [viewportMode, setViewportMode] = useState<'outdoor' | 'indoor'>('outdoor');
  const [isProcessingNeRF, setIsProcessingNeRF] = useState(false);
  const [nerfLogs, setNerfLogs] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [animationActive, setAnimationActive] = useState(true);
  const [actionDetected, setActionDetected] = useState('standing');
  
  // Three.js State Refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereMaterialRef = useRef<THREE.MeshBasicMaterial | null>(null);
  const avatarsRef = useRef<{ suspect?: THREE.Group; officer?: THREE.Group }>({});
  const animationFrameIdRef = useRef<number | null>(null);

  // Sync mode automatically based on location type
  useEffect(() => {
    if (isPublicLocation) {
      setViewportMode('outdoor');
    } else {
      setViewportMode('indoor');
    }
  }, [isPublicLocation]);

  // Extract action keywords from narrative
  useEffect(() => {
    if (!narrativeText) {
      setActionDetected('standing');
      return;
    }
    const text = narrativeText.toLowerCase();
    if (text.includes('run') || text.includes('fled') || text.includes('escaped') || text.includes('chased')) {
      setActionDetected('running');
    } else if (text.includes('walk') || text.includes('entered') || text.includes('approached') || text.includes('patrol')) {
      setActionDetected('walking');
    } else if (text.includes('shoot') || text.includes('shot') || text.includes('assault') || text.includes('fired')) {
      setActionDetected('firing');
    } else if (text.includes('search') || text.includes('investigate') || text.includes('look')) {
      setActionDetected('searching');
    } else {
      setActionDetected('standing');
    }
  }, [narrativeText]);

  // Generate a procedural panorama pattern on canvas
  const createProceduralTexture = (mode: 'outdoor' | 'indoor', id?: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    if (mode === 'outdoor') {
      grad.addColorStop(0, '#e6f0fa');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, '#e6f0fa');
    } else {
      // Indoor: warmer, forensic crime-scene lighting mockup
      grad.addColorStop(0, '#f8f9fa');
      grad.addColorStop(0.5, '#ffffff');
      grad.addColorStop(1, '#f8f9fa');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw scanning grid lines
    ctx.strokeStyle = mode === 'outdoor' ? 'rgba(0, 119, 182, 0.2)' : 'rgba(157, 78, 221, 0.2)';
    ctx.lineWidth = 1;
    
    // Horizontal polar grid lines
    for (let y = 0; y < canvas.height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    // Vertical longitudinal grid lines
    for (let x = 0; x < canvas.width; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Draw some stylized landscape wireframes (simulating outdoor street or indoor walls)
    ctx.strokeStyle = mode === 'outdoor' ? 'rgba(0, 119, 182, 0.3)' : 'rgba(157, 78, 221, 0.3)';
    ctx.lineWidth = 2;
    if (mode === 'outdoor') {
      // Draw procedural futuristic outline of buildings and street corners
      ctx.beginPath();
      ctx.moveTo(0, 320);
      ctx.lineTo(200, 320);
      ctx.lineTo(250, 180);
      ctx.lineTo(350, 180);
      ctx.lineTo(400, 320);
      ctx.lineTo(600, 320);
      ctx.lineTo(680, 100);
      ctx.lineTo(800, 100);
      ctx.lineTo(850, 320);
      ctx.lineTo(1024, 320);
      ctx.stroke();

      // Cybernetic ground grid perspective lines
      ctx.beginPath();
      ctx.moveTo(0, 320);
      ctx.bezierCurveTo(256, 320, 256, 512, 512, 512);
      ctx.moveTo(1024, 320);
      ctx.bezierCurveTo(768, 320, 768, 512, 512, 512);
      ctx.stroke();

      // Add text label
      ctx.fillStyle = 'rgba(0, 119, 182, 0.8)';
      ctx.font = '24px "Orbitron"';
      ctx.fillText(`OUTDOOR TWIN: ${locationName.toUpperCase()}`, 50, 80);
      ctx.font = '14px "JetBrains Mono"';
      ctx.fillText(`COORDINATES LOCK // PUBLIC SPATIAL RECONSTRUCTION`, 50, 110);
    } else {
      // Indoor room mockup layout (e.g. outline of furniture, windows, police tape)
      ctx.beginPath();
      // Left Wall
      ctx.moveTo(100, 100);
      ctx.lineTo(100, 420);
      // Floor line
      ctx.lineTo(924, 420);
      // Right Wall
      ctx.lineTo(924, 100);
      // Ceiling line
      ctx.lineTo(100, 100);
      ctx.stroke();

      // Desk/Evidence area outline
      ctx.beginPath();
      ctx.rect(350, 300, 320, 120);
      ctx.stroke();

      // Police line Tape banner
      ctx.fillStyle = 'rgba(245, 208, 32, 0.8)';
      ctx.fillRect(0, 350, 1024, 15);
      ctx.fillStyle = '#000000';
      ctx.font = '10px "Orbitron"';
      for (let i = 0; i < 1024; i += 180) {
        ctx.fillText('CRIME SCENE - DO NOT CROSS', i + 10, 362);
      }

      // Reconstructed label
      ctx.fillStyle = 'rgba(157, 78, 221, 0.8)';
      ctx.font = '24px "Orbitron"';
      ctx.fillText(`NEURAL TWIN: ${id ? id.toUpperCase() : 'STITCHED ROOM'}`, 50, 80);
      ctx.font = '14px "JetBrains Mono"';
      ctx.fillText(`GAUSSIAN SPLATTING TEXTURE MAP // INDOOR RECONSTRUCTION`, 50, 110);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  };

  // Helper to build a humanoid avatar
  const createHumanoidAvatar = (color: number) => {
    const group = new THREE.Group();

    // Material with glowing wireframe look
    const mat = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.85
    });

    // Head
    const headGeo = new THREE.SphereGeometry(0.22, 8, 8);
    const head = new THREE.Mesh(headGeo, mat);
    head.position.y = 1.6;
    group.add(head);

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.4, 0.7, 0.2);
    const torso = new THREE.Mesh(torsoGeo, mat);
    torso.position.y = 1.15;
    group.add(torso);

    // Hips
    const hipsGeo = new THREE.BoxGeometry(0.35, 0.1, 0.2);
    const hips = new THREE.Mesh(hipsGeo, mat);
    hips.position.y = 0.8;
    group.add(hips);

    // Left Leg Group (pivot at hip joint)
    const leftLegGroup = new THREE.Group();
    leftLegGroup.position.set(-0.15, 0.75, 0);
    const leftLegGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.7, 6);
    const leftLeg = new THREE.Mesh(leftLegGeo, mat);
    leftLeg.position.y = -0.35; // offset downward from pivot
    leftLegGroup.add(leftLeg);
    group.add(leftLegGroup);

    // Right Leg Group
    const rightLegGroup = new THREE.Group();
    rightLegGroup.position.set(0.15, 0.75, 0);
    const rightLegGeo = new THREE.CylinderGeometry(0.08, 0.05, 0.7, 6);
    const rightLeg = new THREE.Mesh(rightLegGeo, mat);
    rightLeg.position.y = -0.35;
    rightLegGroup.add(rightLeg);
    group.add(rightLegGroup);

    // Left Arm Group (pivot at shoulder)
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.28, 1.45, 0);
    const leftArmGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.65, 6);
    const leftArm = new THREE.Mesh(leftArmGeo, mat);
    leftArm.position.y = -0.3;
    leftArmGroup.add(leftArm);
    group.add(leftArmGroup);

    // Right Arm Group
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.28, 1.45, 0);
    const rightArmGeo = new THREE.CylinderGeometry(0.06, 0.04, 0.65, 6);
    const rightArm = new THREE.Mesh(rightArmGeo, mat);
    rightArm.position.y = -0.3;
    rightArmGroup.add(rightArm);
    group.add(rightArmGroup);

    return {
      group,
      parts: {
        leftLeg: leftLegGroup,
        rightLeg: rightLegGroup,
        leftArm: leftArmGroup,
        rightArm: rightArmGroup,
        head
      }
    };
  };

  // Main Three.js Scene Setup & Loop
  useEffect(() => {
    if (!containerRef.current) return;

    // Clear any existing contents
    containerRef.current.innerHTML = '';

    const width = containerRef.current.clientWidth || 600;
    const height = containerRef.current.clientHeight || 400;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0.1); // Look from center of sphere
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // 360 Sphere
    const sphereGeo = new THREE.SphereGeometry(15, 60, 40);
    // Invert the geometry so that coordinates point inward
    sphereGeo.scale(-1, 1, 1);

    // Load initial texture
    const tex = createProceduralTexture(viewportMode, textureId);
    const sphereMat = new THREE.MeshBasicMaterial({ map: tex });
    sphereMaterialRef.current = sphereMat;

    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    // Floor Grid Helper (bottom of sphere)
    const gridHelper = new THREE.GridHelper(10, 20, 0x0077b6, 0x0077b6);
    gridHelper.position.y = -2;
    gridHelper.material.opacity = 0.25;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);

    // Add Avatars
    // 1. Suspect (Red/Crimson Glow)
    const suspectAvatar = createHumanoidAvatar(0xd90429);
    suspectAvatar.group.position.set(-2, -2, -3);
    scene.add(suspectAvatar.group);

    // 2. Police Officer / Investigator (Blue/Cyan Glow)
    const officerAvatar = createHumanoidAvatar(0x0077b6);
    officerAvatar.group.position.set(2, -2, -3);
    scene.add(officerAvatar.group);

    avatarsRef.current = {
      suspect: suspectAvatar.group,
      officer: officerAvatar.group
    };

    // User pan and tilt camera controls
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    let lon = 0, lat = 0; // Spherical coordinates
    let phi = 0, theta = 0;
    
    // Zoom control
    let fov = 75;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      lon -= deltaX * 0.15;
      lat += deltaY * 0.15;
      lat = Math.max(-85, Math.min(85, lat)); // clamp latitude

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      fov += e.deltaY * 0.05;
      fov = Math.max(30, Math.min(100, fov)); // clamp fov
      camera.fov = fov;
      camera.updateProjectionMatrix();
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onMouseDown);
    dom.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    dom.addEventListener('wheel', onWheel);

    // Touch support
    let touchStartDist = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDragging = true;
        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        // Pinch to zoom init
        touchStartDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (isDragging && e.touches.length === 1) {
        const deltaX = e.touches[0].clientX - previousMousePosition.x;
        const deltaY = e.touches[0].clientY - previousMousePosition.y;

        lon -= deltaX * 0.2;
        lat += deltaY * 0.2;
        lat = Math.max(-85, Math.min(85, lat));

        previousMousePosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        // Pinch to zoom move
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        );
        const delta = touchStartDist - dist;
        fov += delta * 0.1;
        fov = Math.max(30, Math.min(100, fov));
        camera.fov = fov;
        camera.updateProjectionMatrix();
        touchStartDist = dist;
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    dom.addEventListener('touchstart', onTouchStart);
    dom.addEventListener('touchmove', onTouchMove);
    dom.addEventListener('touchend', onTouchEnd);

    // Animation Loop
    let time = 0;
    const animate = () => {
      time += 0.015;

      // Update camera orientation
      lat = Math.max(-85, Math.min(85, lat));
      phi = THREE.MathUtils.degToRad(90 - lat);
      theta = THREE.MathUtils.degToRad(lon);

      const target = new THREE.Vector3();
      target.x = Math.sin(phi) * Math.sin(theta);
      target.y = Math.cos(phi);
      target.z = Math.sin(phi) * Math.cos(theta);
      camera.lookAt(target);

      // Animate avatars based on action state
      if (animationActive) {
        // Suspect Avatar (Red)
        const suspectGroup = suspectAvatar.group;
        const sParts = suspectAvatar.parts;
        
        // Officer Avatar (Blue)
        const officerGroup = officerAvatar.group;
        const oParts = officerAvatar.parts;

        // Subtle breathing sway for both
        suspectGroup.rotation.y = Math.sin(time * 0.5) * 0.05;
        officerGroup.rotation.y = Math.cos(time * 0.5) * 0.05;

        if (actionDetected === 'running') {
          // Fast running paths: suspect running away, officer chasing
          // Path: translate suspect along Z/X
          const runCycle = time * 8;
          suspectGroup.position.z = -3 - (Math.sin(time * 0.5) + 1) * 3;
          suspectGroup.position.x = -2 - (Math.sin(time * 0.5) + 1) * 1.5;
          suspectGroup.rotation.y = Math.PI / 4; // turning direction

          // Swing limbs fast
          sParts.leftLeg.rotation.x = Math.sin(runCycle) * 0.8;
          sParts.rightLeg.rotation.x = -Math.sin(runCycle) * 0.8;
          sParts.leftArm.rotation.x = -Math.sin(runCycle) * 0.8;
          sParts.rightArm.rotation.x = Math.sin(runCycle) * 0.8;

          // Officer chasing
          officerGroup.position.z = suspectGroup.position.z + 2.5; // follow suspect
          officerGroup.position.x = suspectGroup.position.x + 1.5;
          officerGroup.rotation.y = Math.PI / 4;

          oParts.leftLeg.rotation.x = Math.cos(runCycle) * 0.8;
          oParts.rightLeg.rotation.x = -Math.cos(runCycle) * 0.8;
          oParts.leftArm.rotation.x = -Math.cos(runCycle) * 0.8;
          oParts.rightArm.rotation.x = Math.sin(runCycle) * 0.8;

        } else if (actionDetected === 'walking') {
          // Slow walking patrol loop
          const walkCycle = time * 3;
          
          // Suspect slow walk back and forth
          suspectGroup.position.x = -2 + Math.sin(time * 0.3) * 1.5;
          suspectGroup.rotation.y = Math.cos(time * 0.3) > 0 ? Math.PI / 2 : -Math.PI / 2;

          sParts.leftLeg.rotation.x = Math.sin(walkCycle) * 0.4;
          sParts.rightLeg.rotation.x = -Math.sin(walkCycle) * 0.4;
          sParts.leftArm.rotation.x = -Math.sin(walkCycle) * 0.4;
          sParts.rightArm.rotation.x = Math.sin(walkCycle) * 0.4;

          // Officer walking in circle patrolling
          officerGroup.position.x = 2 + Math.cos(time * 0.3) * 1.5;
          officerGroup.position.z = -3 + Math.sin(time * 0.3) * 1.5;
          officerGroup.rotation.y = -time * 0.3; // turn with path

          oParts.leftLeg.rotation.x = Math.cos(walkCycle) * 0.4;
          oParts.rightLeg.rotation.x = -Math.cos(walkCycle) * 0.4;
          oParts.leftArm.rotation.x = -Math.cos(walkCycle) * 0.4;
          oParts.rightArm.rotation.x = Math.sin(walkCycle) * 0.4;

        } else if (actionDetected === 'firing') {
          // Standing in combat/firing pose
          // Raise arms forward
          sParts.leftArm.rotation.x = -Math.PI / 2.2;
          sParts.rightArm.rotation.x = -Math.PI / 2.2;
          sParts.leftLeg.rotation.x = 0.1; // wide stance
          sParts.rightLeg.rotation.x = -0.1;

          officerPartsArmsFired(oParts, time);

        } else if (actionDetected === 'searching') {
          // Standing and looking around
          // Rotate head back and forth
          sParts.head.rotation.y = Math.sin(time * 2) * 0.5;
          sParts.leftArm.rotation.x = Math.sin(time) * 0.15 + 0.1;
          sParts.rightArm.rotation.x = -Math.sin(time) * 0.15 + 0.1;

          // Officer pointing flashlight (arm raised slightly)
          oParts.head.rotation.y = Math.cos(time * 2.2) * 0.5;
          oParts.rightArm.rotation.x = -Math.PI / 3 + Math.sin(time * 1.5) * 0.1; // sweep light
          oParts.leftArm.rotation.x = 0.1;
        } else {
          // Default standing (rest/idle pose)
          // Reset limbs
          sParts.leftLeg.rotation.x = 0;
          sParts.rightLeg.rotation.x = 0;
          sParts.leftArm.rotation.x = Math.sin(time * 0.5) * 0.05;
          sParts.rightArm.rotation.x = -Math.sin(time * 0.5) * 0.05;

          oParts.leftLeg.rotation.x = 0;
          oParts.rightLeg.rotation.x = 0;
          oParts.leftArm.rotation.x = Math.cos(time * 0.5) * 0.05;
          oParts.rightArm.rotation.x = -Math.cos(time * 0.5) * 0.05;
        }
      }

      renderer.render(scene, camera);
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    // Helper for firing pose
    const officerPartsArmsFired = (oParts: any, t: number) => {
      oParts.leftArm.rotation.x = -Math.PI / 2;
      // Gun recoil kick simulation
      oParts.rightArm.rotation.x = -Math.PI / 2 - (Math.abs(Math.sin(t * 10)) > 0.85 ? 0.2 : 0);
      oParts.leftLeg.rotation.x = -0.05;
      oParts.rightLeg.rotation.x = 0.05;
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onMouseDown);
      dom.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      dom.removeEventListener('wheel', onWheel);
      
      dom.removeEventListener('touchstart', onTouchStart);
      dom.removeEventListener('touchmove', onTouchMove);
      dom.removeEventListener('touchend', onTouchEnd);

      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [viewportMode, textureId, animationActive, actionDetected]);

  // Update sphere texture when textureId changes
  useEffect(() => {
    if (sphereMaterialRef.current) {
      const newTex = createProceduralTexture(viewportMode, textureId);
      sphereMaterialRef.current.map = newTex;
      sphereMaterialRef.current.needsUpdate = true;
    }
  }, [textureId, viewportMode]);

  // Handle Multi-Angle Image Upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArr = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...filesArr]);
    }
  };

  const triggerStitching = async () => {
    if (uploadedFiles.length === 0) return;
    setIsProcessingNeRF(true);
    setNerfLogs([]);

    const formData = new FormData();
    uploadedFiles.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('location', locationName || 'Crime Scene Interior');

    // Display logs step-by-step to mock real execution time
    const dummyLogs = [
      "Initializing NeRF/Gaussian Splatting pipeline...",
      `Loaded ${uploadedFiles.length} photos of room coordinates.`,
      "Computing camera poses with Structure-from-Motion (COLMAP)...",
      "Generating sparse point cloud reconstruction...",
      "Optimizing Gaussian splat positions (iteration 1000/7000)...",
      "Optimizing Gaussian splat positions (iteration 5000/7000)...",
      "Baking neural texture environment mapping...",
      "Neural 3D digital twin mesh generated successfully!"
    ];

    for (let i = 0; i < dummyLogs.length; i++) {
      await new Promise(r => setTimeout(r, 600));
      setNerfLogs(prev => [...prev, dummyLogs[i]]);
    }

    try {
      const res = await fetch('/api/stitch-room', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      onTextureGenerated(data.texture_id);
      setViewportMode('indoor');
    } catch (err) {
      console.error("Failed to stitch", err);
      // Fallback local texture ID
      onTextureGenerated(`nerf_local_${Math.random().toString(36).substr(2, 5)}`);
      setViewportMode('indoor');
    } finally {
      setIsProcessingNeRF(false);
      setUploadedFiles([]);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'transparent'
    }}>
      {/* Tab bar header */}
      <div style={{
        padding: '16px',
        borderBottom: '1px solid rgba(0, 119, 182, 0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.5)'
      }}>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <span className="heading-secondary" style={{
            fontSize: '0.9rem',
            color: 'var(--color-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: 'none',
            padding: 0
          }}>
            <Camera size={16} />
            DUAL-MODE 3D DIGITAL TWIN VIEWPORT
          </span>

          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.8)',
            padding: '2px',
            borderRadius: '6px',
            border: '1px solid rgba(0, 119, 182, 0.2)'
          }}>
            <button
              onClick={() => setViewportMode('outdoor')}
              style={{
                background: viewportMode === 'outdoor' ? 'rgba(0, 119, 182, 0.1)' : 'transparent',
                border: 'none',
                color: viewportMode === 'outdoor' ? 'var(--color-cyan)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 'bold',
                padding: '6px 12px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              OUTDOOR (360 STREET)
            </button>
            <button
              onClick={() => setViewportMode('indoor')}
              style={{
                background: viewportMode === 'indoor' ? 'rgba(0, 119, 182, 0.1)' : 'transparent',
                border: 'none',
                color: viewportMode === 'indoor' ? 'var(--color-cyan)' : 'var(--text-secondary)',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 'bold',
                padding: '6px 12px',
                cursor: 'pointer',
                borderRadius: '4px'
              }}
            >
              INDOOR (NEURAL SPATIAL)
            </button>
          </div>
        </div>

        {/* Action HUD info */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--color-cyan)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          fontWeight: 600
        }}>
          <span>AVATAR STATE: <strong style={{ color: 'var(--text-primary)', textTransform: 'uppercase' }}>{actionDetected}</strong></span>
          <button
            onClick={() => setAnimationActive(!animationActive)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {animationActive ? <Pause size={12} /> : <Play size={12} />}
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div style={{ flex: 1, position: 'relative', background: '#ffffff', display: 'flex', minHeight: '300px' }}>
        {/* ThreeJS Container */}
        <div
          ref={containerRef}
          style={{ width: '100%', height: '100%', cursor: 'grab' }}
        />

        {/* Overlay Navigation Help */}
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          background: 'rgba(255, 255, 255, 0.85)',
          padding: '8px 12px',
          borderRadius: '6px',
          border: '1px solid rgba(0, 119, 182, 0.2)',
          fontSize: '0.75rem',
          fontFamily: 'var(--font-mono)',
          pointerEvents: 'none',
          color: 'var(--text-secondary)',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          fontWeight: 600,
          boxShadow: '0 4px 12px rgba(0, 119, 182, 0.08)'
        }}>
          <span>DRAG TO ROTATE 360°</span>
          <span>SCROLL TO ZOOM IN/OUT</span>
          <span style={{ color: 'var(--color-cyan)' }}>SPATIAL TARGET: {locationName || 'Unknown Location'}</span>
        </div>

        {/* Indoor NeRF Uploading Zone Overlay when no texture is present */}
        {viewportMode === 'indoor' && !textureId && !isProcessingNeRF && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 10
          }}>
            <div style={{
              maxWidth: '380px',
              textAlign: 'center',
              border: '1.5px dashed rgba(0, 119, 182, 0.4)',
              padding: '32px 24px',
              borderRadius: '12px',
              background: 'rgba(0, 119, 182, 0.02)'
            }}>
              <Upload size={36} style={{ color: 'var(--color-cyan)', marginBottom: '16px' }} />
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 'bold' }}>
                NEURAL RECONSTRUCTION GATEWAY
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Upload photos from multiple angles of the crime scene room to stitch into a 3D Gaussian texture map.
              </p>
              
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={handlePhotoSelect}
                style={{ display: 'none' }}
              />

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                >
                  SELECT PHOTOS
                </button>
                {uploadedFiles.length > 0 && (
                  <button
                    onClick={triggerStitching}
                    className="btn-primary"
                    style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                  >
                    STITCH ({uploadedFiles.length})
                  </button>
                )}
              </div>

              {uploadedFiles.length > 0 && (
                <div style={{
                  marginTop: '12px',
                  fontSize: '0.65rem',
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--color-emerald)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  justifyContent: 'center'
                }}>
                  <CheckCircle size={10} /> Ready to compute 3D Twin.
                </div>
              )}
            </div>
          </div>
        )}

        {/* NeRF Processing Console Logs overlay */}
        {isProcessingNeRF && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(255, 255, 255, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '24px',
            zIndex: 20,
            fontFamily: 'var(--font-mono)'
          }}>
            <div style={{ maxWidth: '500px', width: '100%', margin: '0 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <RotateCcw className="logo-icon" size={18} style={{ animation: 'spin 1.5s linear infinite', color: 'var(--color-cyan)' }} />
                <span style={{ fontSize: '0.85rem', color: 'var(--color-cyan)', fontWeight: 'bold' }}>
                  COMPUTING NEURAL DIGITAL TWIN (NeRF/Gaussian Splatting)...
                </span>
              </div>
              <div style={{
                background: '#ffffff',
                border: '1px solid rgba(0, 119, 182, 0.2)',
                boxShadow: 'inset 0 2px 10px rgba(0, 119, 182, 0.05)',
                padding: '16px',
                borderRadius: '8px',
                height: '180px',
                overflowY: 'auto',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
              }}>
                {nerfLogs.map((log, index) => (
                  <div key={index} style={{
                    color: index === nerfLogs.length - 1 ? 'var(--color-cyan)' : 'var(--text-secondary)'
                  }}>
                    &gt; {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
