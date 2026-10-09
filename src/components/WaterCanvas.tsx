/**
 * Interactive Water Surface Canvas Component
 * Integrates:
 * 1. Physical 2D Wave Equation solver
 * 2. Swimming Japanese Koi fish with shadow, startled flight, and feeding behaviors
 * 3. 3D Falling droplets with hydrodynamic surface tension shape oscillations
 * 4. 3D Splash Corona Crowns (皇冠水花) and non-coalescing micro-beads
 * 5. Worthington Jet liquid rebound columns with Plateau-Rayleigh satellite droplets
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  DayNightLighting,
  FallingDroplet,
  FishFoodPellet,
  FloatingMicroBead,
  ImpactRing,
  InteractionMode,
  KoiEcosystemStats,
  KoiNotification,
  RainIntensity,
  SplashCrown,
  SplashParticle,
  WaterPhysicsParams,
  WaterTheme,
  WorthingtonJet,
} from '../types/water';
import { WaterSimulationEngine } from '../engine/waterEngine';
import { DropletSplashLayer } from './DropletSplashLayer';
import { KoiFishEngine } from '../engine/koiEngine';
import { waterAudio } from '../audio/waterSound';

interface WaterCanvasProps {
  currentTheme: WaterTheme;
  interactionMode: InteractionMode;
  rainIntensity: RainIntensity;
  zenInterval: number; // seconds
  physicsParams: WaterPhysicsParams;
  isSlowMotion: boolean;
  isSoundEnabled: boolean;
  isKoiEnabled: boolean;
  koiCount: number;
  dayNightLighting?: DayNightLighting;
  onRippleCreated?: () => void;
  onPopulationChange?: (stats: KoiEcosystemStats) => void;
  onKoiNotification?: (notification: KoiNotification) => void;
  triggerScatterFeast?: number;
  triggerSpawnBaby?: number;
}

export const WaterCanvas: React.FC<WaterCanvasProps> = ({
  currentTheme,
  interactionMode,
  rainIntensity,
  zenInterval,
  physicsParams,
  isSlowMotion,
  isSoundEnabled,
  isKoiEnabled,
  koiCount,
  dayNightLighting,
  onRippleCreated,
  onPopulationChange,
  onKoiNotification,
  triggerScatterFeast,
  triggerSpawnBaby,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<WaterSimulationEngine | null>(null);

  // Koi Fish Engine & Composite Offscreen Canvas
  const koiEngineRef = useRef<KoiFishEngine | null>(null);
  const cachedBgImageRef = useRef<HTMLImageElement | null>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dayNightLightingRef = useRef<DayNightLighting | undefined>(dayNightLighting);

  const [dimensions, setDimensions] = useState({ width: 1200, height: 800 });

  // Physical particles and falling drops state (managed via ref for 60/120fps performance)
  const dropletsRef = useRef<FallingDroplet[]>([]);
  const crownsRef = useRef<SplashCrown[]>([]);
  const microBeadsRef = useRef<FloatingMicroBead[]>([]);
  const ringsRef = useRef<ImpactRing[]>([]);
  const jetsRef = useRef<WorthingtonJet[]>([]);
  const particlesRef = useRef<SplashParticle[]>([]);

  // State exposed to React layer
  const [renderDroplets, setRenderDroplets] = useState<FallingDroplet[]>([]);
  const [renderCrowns, setRenderCrowns] = useState<SplashCrown[]>([]);
  const [renderMicroBeads, setRenderMicroBeads] = useState<FloatingMicroBead[]>([]);
  const [renderRings, setRenderRings] = useState<ImpactRing[]>([]);
  const [renderJets, setRenderJets] = useState<WorthingtonJet[]>([]);
  const [renderParticles, setRenderParticles] = useState<SplashParticle[]>([]);
  const [renderPellets, setRenderPellets] = useState<FishFoodPellet[]>([]);

  const isPointerDownRef = useRef(false);
  const lastPointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const rainTimerRef = useRef<number>(0);
  const zenTimerRef = useRef<number>(0);
  const statTimerRef = useRef<number>(0);

  // Initialize Koi Engine
  useEffect(() => {
    const koi = new KoiFishEngine(koiCount, dimensions.width, dimensions.height);
    koi.setLightDirection(currentTheme.lightDirection);
    koi.onNotification = (notif) => {
      onKoiNotification?.(notif);
    };
    koiEngineRef.current = koi;

    const comp = document.createElement('canvas');
    comp.width = 640;
    comp.height = Math.round(640 / (dimensions.width / dimensions.height || 1.33));
    compositeCanvasRef.current = comp;
  }, []);

  // Update Koi count, dimensions, and callbacks
  useEffect(() => {
    if (koiEngineRef.current) {
      koiEngineRef.current.setDimensions(dimensions.width, dimensions.height);
      koiEngineRef.current.setFishCount(koiCount);
      koiEngineRef.current.setLightDirection(currentTheme.lightDirection);
      koiEngineRef.current.onNotification = (notif) => {
        onKoiNotification?.(notif);
      };
    }
    if (compositeCanvasRef.current) {
      compositeCanvasRef.current.width = 640;
      compositeCanvasRef.current.height = Math.round(640 / (dimensions.width / dimensions.height || 1.33));
    }
  }, [dimensions.width, dimensions.height, koiCount, currentTheme.lightDirection, onKoiNotification]);

  // Support external triggers for feast scatter & baby spawn
  useEffect(() => {
    if (triggerScatterFeast && triggerScatterFeast > 0 && koiEngineRef.current) {
      koiEngineRef.current.scatterFeast(dimensions.width * 0.5, dimensions.height * 0.5);
      triggerImpactAt(dimensions.width * 0.5, dimensions.height * 0.5, 0.75, 0.9);
      onRippleCreated?.();
    }
  }, [triggerScatterFeast]);

  useEffect(() => {
    if (triggerSpawnBaby && triggerSpawnBaby > 0 && koiEngineRef.current) {
      koiEngineRef.current.spawnBabyNear();
      onRippleCreated?.();
    }
  }, [triggerSpawnBaby]);

  // Resize listener
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.floor(rect.width);
        const h = Math.floor(rect.height);
        setDimensions({ width: w, height: h });
        if (engineRef.current) {
          engineRef.current.updateDimensions(w, h);
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Initialize Water Engine
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new WaterSimulationEngine(
      canvas,
      dimensions.width,
      dimensions.height,
      physicsParams
    );
    engineRef.current = engine;

    engine.setLighting(
      currentTheme.lightDirection,
      currentTheme.tintColor,
      currentTheme.ambientColor
    );

    const img = new Image();
    img.onload = () => {
      cachedBgImageRef.current = img;
      engine.setBackgroundImage(img);
    };
    img.src = currentTheme.imageSrc;
    if (img.complete) {
      cachedBgImageRef.current = img;
      engine.setBackgroundImage(img);
    }

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [dimensions.width, dimensions.height]);

  // Update engine params
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setParams(physicsParams);
    }
  }, [physicsParams]);

  // Synchronize Day-Night Environmental Lighting with Water and Koi Engines
  useEffect(() => {
    dayNightLightingRef.current = dayNightLighting;
    if (dayNightLighting && engineRef.current) {
      engineRef.current.setLighting(
        dayNightLighting.lightDirection,
        dayNightLighting.tintColor,
        dayNightLighting.ambientColor,
        dayNightLighting.specularColor
      );
      engineRef.current.setParams({
        specularIntensity: dayNightLighting.specularIntensity,
        causticStrength: dayNightLighting.causticStrength,
        waterClarity: dayNightLighting.waterClarity,
      });
    }
    if (dayNightLighting && koiEngineRef.current) {
      koiEngineRef.current.setLighting(
        dayNightLighting.lightDirection,
        dayNightLighting.nightGlowAlpha
      );
    }
  }, [dayNightLighting]);

  // Load and apply theme image & lighting on theme change
  useEffect(() => {
    if (!engineRef.current) return;
    const engine = engineRef.current;

    engine.setLighting(
      currentTheme.lightDirection,
      currentTheme.tintColor,
      currentTheme.ambientColor
    );
    engine.clearDisturbances();

    const img = new Image();
    img.onload = () => {
      cachedBgImageRef.current = img;
      engine.setBackgroundImage(img);
    };
    img.onerror = () => {
      console.warn('Failed to load image for theme:', currentTheme.name);
    };
    img.src = currentTheme.imageSrc;
    if (img.complete) {
      cachedBgImageRef.current = img;
      engine.setBackgroundImage(img);
    }
  }, [currentTheme]);

  // Audio rain ambience sync
  useEffect(() => {
    if (interactionMode === 'rain') {
      waterAudio.updateRainAmbience(rainIntensity);
    } else {
      waterAudio.updateRainAmbience('off');
    }
  }, [interactionMode, rainIntensity, isSoundEnabled]);

  /**
   * Spawns a physical impact at (x, y) on water surface
   */
  const triggerImpactAt = useCallback(
    (x: number, y: number, strength: number = 1.0, radiusMod: number = 1.0) => {
      if (!engineRef.current) return;

      const normX = x / dimensions.width;
      const normY = y / dimensions.height;

      // 1. Water engine surface impulse
      engineRef.current.addDisturbance(normX, normY, radiusMod, strength);
      onRippleCreated?.();

      // 2. Startle Koi fish near the impact point
      if (koiEngineRef.current && isKoiEnabled) {
        koiEngineRef.current.startleNear(x, y, 160 + strength * 40);
      }

      // 3. Play acoustic cavity sound
      if (isSoundEnabled) {
        waterAudio.playDrop(strength, 0.9 + Math.random() * 0.2);
      }

      // 4. Impact Corona Ring
      ringsRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x,
        y,
        radius: 3,
        maxRadius: (26 + 8 * Math.sqrt(strength)) * radiusMod,
        strength,
        alpha: 1.0,
      });

      // 5. 3D Splash Corona Crown (Milk-drop crown sheet with rim beads)
      if (strength > 0.35) {
        crownsRef.current.push({
          id: Math.random().toString(36).substring(2, 9),
          x,
          y,
          radius: 5 * radiusMod,
          maxRadius: (22 + 12 * Math.sqrt(strength)) * radiusMod,
          height: 0,
          maxHeight: (18 + 15 * strength) * radiusMod,
          age: 0,
          maxAge: 24,
          spikes: 14,
          alpha: 1.0,
        });

        // 6. Non-coalescing micro beads skipping over water surface
        const beadCount = Math.floor(2 + Math.random() * 3 * strength);
        for (let b = 0; b < beadCount; b++) {
          const beadAngle = Math.random() * Math.PI * 2;
          const beadSpeed = (1.2 + Math.random() * 2.6) * strength;
          microBeadsRef.current.push({
            id: Math.random().toString(36).substring(2, 9),
            x: x + Math.cos(beadAngle) * 8,
            y: y + Math.sin(beadAngle) * 4,
            vx: Math.cos(beadAngle) * beadSpeed,
            vy: Math.sin(beadAngle) * beadSpeed * 0.5,
            radius: 1.2 + Math.random() * 1.6,
            life: 18 + Math.floor(Math.random() * 18),
            maxLife: 36,
            alpha: 1.0,
          });
        }
      }

      // 7. Worthington Jet (Liquid rebound column with satellite droplet)
      if (strength > 0.4) {
        const jetHeight = (22 + strength * 24) * radiusMod;
        jetsRef.current.push({
          id: Math.random().toString(36).substring(2, 9),
          x,
          y,
          height: 0,
          maxHeight: jetHeight,
          width: 5.5 * radiusMod,
          age: 0,
          maxAge: 32, // frames
          satelliteDropY: 0,
          satelliteDropVz: 3.5 * Math.sqrt(strength),
          hasBounced: false,
        });
      }

      // 8. Micro spray droplets flying in 3D arcs
      const particleCount = Math.min(14, Math.floor(6 + strength * 6));
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = (1.5 + Math.random() * 3.2) * strength;
        particlesRef.current.push({
          id: Math.random().toString(36).substring(2, 9),
          x,
          y,
          z: 2 + Math.random() * 4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.5, // perspective flattening
          vz: 3.0 + Math.random() * 4.5 * strength,
          radius: 1.2 + Math.random() * 1.8,
          alpha: 1.0,
          life: 20 + Math.floor(Math.random() * 20),
          maxLife: 40,
        });
      }
    },
    [dimensions.width, dimensions.height, isSoundEnabled, isKoiEnabled, onRippleCreated]
  );

  /**
   * Drops a 3D falling droplet with hydrodynamic surface tension oscillation
   */
  const spawnFallingDrop = useCallback(
    (x: number, y: number, altitude: number = 220, sizeRatio: number = 1.0) => {
      dropletsRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x,
        y,
        altitude,
        initialAltitude: altitude,
        velocityZ: -1.5,
        size: 5.5 * sizeRatio,
        mass: sizeRatio,
        color: '#ffffff',
        alpha: 1.0,
        status: 'falling',
        oscillationPhase: Math.random() * Math.PI * 2,
      });
    },
    []
  );

  // Main 60/120fps Animation Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(32, currentTime - lastTime);
      lastTime = currentTime;

      const timeScale = isSlowMotion ? 0.25 : 1.0;
      const engine = engineRef.current;
      const koiEngine = koiEngineRef.current;

      // 1. Update Underwater Environment & Dynamic Background
      if (cachedBgImageRef.current && compositeCanvasRef.current) {
        const compCanvas = compositeCanvasRef.current;
        const compCtx = compCanvas.getContext('2d');
        const activeLighting = dayNightLightingRef.current;

        // Step fish simulation and get swimming wake ripples if enabled
        if (koiEngine && isKoiEnabled) {
          const wakeRipples = koiEngine.update(timeScale);
          if (engine && wakeRipples.length > 0) {
            for (const wr of wakeRipples) {
              const nx = wr.x / dimensions.width;
              const ny = wr.y / dimensions.height;
              if (nx >= 0 && nx <= 1 && ny >= 0 && ny <= 1) {
                engine.addDisturbance(nx, ny, 0.45, wr.strength * 0.35);
              }
            }
          }
        }

        // Draw and grade seabed/pond bed with dynamic Day-Night atmospheric wash
        if (compCtx && cachedBgImageRef.current) {
          compCtx.drawImage(cachedBgImageRef.current, 0, 0, compCanvas.width, compCanvas.height);

          if (activeLighting) {
            compCtx.save();
            compCtx.globalCompositeOperation = 'multiply';
            compCtx.fillStyle = `rgb(${Math.round(activeLighting.bgTint[0] * 255)}, ${Math.round(activeLighting.bgTint[1] * 255)}, ${Math.round(activeLighting.bgTint[2] * 255)})`;
            compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);

            // Nighttime soft moonlit blue wash
            if (activeLighting.nightGlowAlpha > 0.08) {
              compCtx.globalCompositeOperation = 'screen';
              compCtx.fillStyle = `rgba(18, 42, 85, ${0.35 * activeLighting.nightGlowAlpha})`;
              compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
            } else if (activeLighting.phase === 'sunset') {
              // Sunset warm amber-violet wash
              compCtx.globalCompositeOperation = 'screen';
              compCtx.fillStyle = 'rgba(75, 25, 15, 0.22)';
              compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
            } else if (activeLighting.phase === 'dawn') {
              // Dawn golden-rose mist wash
              compCtx.globalCompositeOperation = 'screen';
              compCtx.fillStyle = 'rgba(45, 30, 20, 0.16)';
              compCtx.fillRect(0, 0, compCanvas.width, compCanvas.height);
            }
            compCtx.restore();
          }

          if (koiEngine && isKoiEnabled) {
            koiEngine.render(compCtx, compCanvas.width, compCanvas.height);
          }

          if (engine) {
            engine.updateDynamicBackground(compCanvas);
          }
        }

        // Periodically report population stats to UI
        if (koiEngine && isKoiEnabled) {
          statTimerRef.current += 1;
          if (statTimerRef.current % 24 === 0 && onPopulationChange) {
            onPopulationChange(koiEngine.getPopulationStats());
          }
        }
      }

      // 2. Step wave physics
      if (engine) {
        engine.stepPhysics(timeScale);
        engine.render();
      }

      // 3. Update Falling Droplets
      const activeDrops = dropletsRef.current;
      const gravity = 0.45 * timeScale;

      for (let i = activeDrops.length - 1; i >= 0; i--) {
        const d = activeDrops[i];
        if (d.status === 'falling') {
          d.velocityZ -= gravity;
          d.altitude += d.velocityZ * timeScale * 2.2;
          d.oscillationPhase = (d.oscillationPhase || 0) + 0.35 * timeScale;

          // Water surface collision!
          if (d.altitude <= 0) {
            d.altitude = 0;
            d.status = 'impacted';
            triggerImpactAt(d.x, d.y, d.mass * physicsParams.dropStrength, d.mass);
            activeDrops.splice(i, 1);
          }
        }
      }

      // 4. Update Splash Crowns
      const activeCrowns = crownsRef.current;
      for (let i = activeCrowns.length - 1; i >= 0; i--) {
        const cr = activeCrowns[i];
        cr.age += timeScale;
        const progress = cr.age / cr.maxAge;
        cr.radius += 1.5 * timeScale;
        // Parabolic rise and fall of crown sheet
        cr.height = Math.sin(progress * Math.PI) * cr.maxHeight;
        if (cr.age >= cr.maxAge) {
          activeCrowns.splice(i, 1);
        }
      }

      // 5. Update Floating Micro-Beads
      const activeBeads = microBeadsRef.current;
      for (let i = activeBeads.length - 1; i >= 0; i--) {
        const b = activeBeads[i];
        b.x += b.vx * timeScale;
        b.y += b.vy * timeScale;
        b.vx *= 0.94;
        b.vy *= 0.94;
        b.life -= timeScale;
        if (b.life <= 0) {
          activeBeads.splice(i, 1);
        }
      }

      // 6. Update Impact Rings
      const activeRings = ringsRef.current;
      const ringExpandSpeed = 1.6 * timeScale;
      for (let i = activeRings.length - 1; i >= 0; i--) {
        const ring = activeRings[i];
        ring.radius += ringExpandSpeed;
        ring.alpha = Math.max(0, 1.0 - ring.radius / ring.maxRadius);
        if (ring.radius >= ring.maxRadius || ring.alpha <= 0.01) {
          activeRings.splice(i, 1);
        }
      }

      // 7. Update Worthington Jets
      const activeJets = jetsRef.current;
      for (let i = activeJets.length - 1; i >= 0; i--) {
        const jet = activeJets[i];
        jet.age += timeScale;

        // Parabolic rise and fall of water column
        const halfAge = jet.maxAge * 0.4;
        if (jet.age < halfAge) {
          jet.height = (jet.age / halfAge) * jet.maxHeight;
        } else {
          jet.height = Math.max(0, (1.0 - (jet.age - halfAge) / (jet.maxAge - halfAge)) * jet.maxHeight);
        }

        // Satellite droplet trajectory & secondary splash bounce
        if (jet.satelliteDropY !== undefined && jet.satelliteDropVz !== undefined) {
          if (jet.age < jet.maxAge * 0.25) {
            jet.satelliteDropY = jet.height;
          } else {
            jet.satelliteDropVz -= 0.28 * timeScale;
            jet.satelliteDropY += jet.satelliteDropVz * timeScale;

            // Rebound satellite drop hits water surface again!
            if (jet.satelliteDropY <= 0 && !jet.hasBounced) {
              jet.hasBounced = true;
              jet.satelliteDropY = -1;
              if (engine) {
                const normX = jet.x / dimensions.width;
                const normY = jet.y / dimensions.height;
                engine.addDisturbance(normX, normY, 0.4, 0.35);
              }
              if (isSoundEnabled) {
                waterAudio.playDrop(0.4, 1.45);
              }
            }
          }
        }

        if (jet.age >= jet.maxAge) {
          activeJets.splice(i, 1);
        }
      }

      // 8. Update Micro Spray Particles
      const activeParticles = particlesRef.current;
      const pGravity = 0.32 * timeScale;
      for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.x += p.vx * timeScale;
        p.y += p.vy * timeScale;
        p.z += p.vz * timeScale;
        p.vz -= pGravity;
        p.life -= timeScale;

        if (p.z <= 0 || p.life <= 0) {
          if (p.z <= 0 && p.vz < -2.0 && engine) {
            const normX = p.x / dimensions.width;
            const normY = p.y / dimensions.height;
            if (nxValid(normX, normY)) {
              engine.addDisturbance(normX, normY, 0.25, 0.15);
            }
          }
          activeParticles.splice(i, 1);
        }
      }

      // 9. Handle Rain Mode Spawning
      if (interactionMode === 'rain' && rainIntensity !== 'off') {
        rainTimerRef.current += dt;
        let spawnInterval = 300;
        let dropsPerBatch = 1;
        if (rainIntensity === 'light') {
          spawnInterval = 380;
          dropsPerBatch = 1;
        } else if (rainIntensity === 'moderate') {
          spawnInterval = 180;
          dropsPerBatch = 1;
        } else if (rainIntensity === 'heavy') {
          spawnInterval = 80;
          dropsPerBatch = 2;
        }

        if (rainTimerRef.current >= spawnInterval) {
          rainTimerRef.current = 0;
          for (let b = 0; b < dropsPerBatch; b++) {
            const margin = 20;
            const rx = margin + Math.random() * (dimensions.width - margin * 2);
            const ry = margin + Math.random() * (dimensions.height - margin * 2);
            const randAltitude = 160 + Math.random() * 140;
            const size = 0.6 + Math.random() * 0.7;
            spawnFallingDrop(rx, ry, randAltitude, size);
          }
        }
      }

      // 10. Handle Zen Mode Spawning
      if (interactionMode === 'zen') {
        zenTimerRef.current += (dt / 1000);
        if (zenTimerRef.current >= zenInterval) {
          zenTimerRef.current = 0;
          const cx = dimensions.width * (0.46 + Math.random() * 0.08);
          const cy = dimensions.height * (0.46 + Math.random() * 0.08);
          spawnFallingDrop(cx, cy, 260, 1.25);
        }
      }

      // Sync refs to React render state
      setRenderDroplets([...activeDrops]);
      setRenderCrowns([...activeCrowns]);
      setRenderMicroBeads([...activeBeads]);
      setRenderRings([...activeRings]);
      setRenderJets([...activeJets]);
      setRenderParticles([...activeParticles]);
      if (koiEngine) {
        setRenderPellets([...koiEngine.getPellets()]);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [
    dimensions.width,
    dimensions.height,
    interactionMode,
    rainIntensity,
    zenInterval,
    isSlowMotion,
    isSoundEnabled,
    isKoiEnabled,
    physicsParams.dropStrength,
    spawnFallingDrop,
    triggerImpactAt,
  ]);

  const nxValid = (x: number, y: number) => x >= 0 && x <= 1 && y >= 0 && y <= 1;

  // Pointer & Touch Events
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDownRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    lastPointerPosRef.current = { x, y };

    if (interactionMode === 'feed') {
      // Feed Koi mode: drop food pellet into water
      if (koiEngineRef.current) {
        koiEngineRef.current.addFood(x, y, 4);
      }
      triggerImpactAt(x, y, 0.45, 0.6);
      onRippleCreated?.();
    } else if (interactionMode === 'droplet') {
      spawnFallingDrop(x, y, 220, 1.0);
    } else {
      // Touch mode or direct disturbance
      triggerImpactAt(x, y, 1.1, 1.0);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (interactionMode === 'feed') {
      // Drag to continuously sprinkle food pellets
      if (lastPointerPosRef.current) {
        const dx = x - lastPointerPosRef.current.x;
        const dy = y - lastPointerPosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 28 && koiEngineRef.current) {
          koiEngineRef.current.addFood(x, y, 2);
          triggerImpactAt(x, y, 0.35, 0.45);
          onRippleCreated?.();
          lastPointerPosRef.current = { x, y };
        }
      }
    } else if (interactionMode === 'touch') {
      if (lastPointerPosRef.current) {
        const dx = x - lastPointerPosRef.current.x;
        const dy = y - lastPointerPosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Continuous wake drag
        if (dist > 8 && engineRef.current) {
          const normX = x / dimensions.width;
          const normY = y / dimensions.height;
          engineRef.current.addDisturbance(normX, normY, 0.7, Math.min(1.4, dist * 0.05));
          if (koiEngineRef.current && isKoiEnabled) {
            koiEngineRef.current.startleNear(x, y, 100);
          }
          if (isSoundEnabled && dist > 14) {
            waterAudio.playRippleWhoosh(Math.min(1.0, dist / 40));
          }
          onRippleCreated?.();
        }
      }
    }
    lastPointerPosRef.current = { x, y };
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
    lastPointerPosRef.current = null;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className="relative w-full h-full overflow-hidden select-none cursor-pointer touch-none"
      style={{ touchAction: 'none' }}
    >
      {/* WebGL Refractive Surface Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* 3D Falling Droplets, Splash Crowns & Worthington Jet Layer */}
      <DropletSplashLayer
        droplets={renderDroplets}
        crowns={renderCrowns}
        microBeads={renderMicroBeads}
        impactRings={renderRings}
        jets={renderJets}
        particles={renderParticles}
        pellets={renderPellets}
        dayNightLighting={dayNightLighting}
        width={dimensions.width}
        height={dimensions.height}
      />
    </div>
  );
};
