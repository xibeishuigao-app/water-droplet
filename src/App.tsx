/**
 * AquaZen - Realistic Water Droplet & Ripple Simulation Application
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DayNightConfig,
  InteractionMode,
  KoiEcosystemStats,
  KoiNotification,
  RainIntensity,
  WaterPhysicsParams,
  WaterTheme,
} from './types/water';
import { WATER_THEMES, DEFAULT_PHYSICS_PARAMS } from './data/themes';
import { WaterCanvas } from './components/WaterCanvas';
import { TopNavbar } from './components/TopNavbar';
import { ControlHUD } from './components/ControlHUD';
import { PhysicsPanel } from './components/PhysicsPanel';
import { WaterInfoModal } from './components/WaterInfoModal';
import { waterAudio } from './audio/waterSound';
import { getDayNightLighting, getCurrentLocalTimeOfDay } from './engine/dayNightEngine';

export default function App() {
  const [currentTheme, setCurrentTheme] = useState<WaterTheme>(WATER_THEMES[0]);
  const [interactionMode, setInteractionMode] = useState<InteractionMode>('feed');
  const [rainIntensity, setRainIntensity] = useState<RainIntensity>('moderate');
  const [zenInterval, setZenInterval] = useState<number>(2.5);
  const [isSlowMotion, setIsSlowMotion] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [rippleCount, setRippleCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isKoiEnabled, setIsKoiEnabled] = useState<boolean>(true);
  const [koiCount, setKoiCount] = useState<number>(6);

  // Day-Night Environmental Cycle State (昼夜流转系统)
  const [dayNightConfig, setDayNightConfig] = useState<DayNightConfig>({
    timeOfDay: 6.5, // Start at dawn (06:30) with soft morning light
    isCycling: true, // Auto cycle enabled
    speedMultiplier: 45, // 45 seconds for a full 24h cycle
    isRealTimeSync: false,
  });

  // Calculate dynamic physical lighting based on time & current theme
  const dayNightLighting = useMemo(() => {
    return getDayNightLighting(dayNightConfig.timeOfDay, currentTheme);
  }, [dayNightConfig.timeOfDay, currentTheme]);

  // Animation frame loop for continuous, smooth day-night time progression
  useEffect(() => {
    if (!dayNightConfig.isCycling && !dayNightConfig.isRealTimeSync) return;

    let animId: number;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(100, now - lastTime) / 1000; // in seconds
      lastTime = now;

      setDayNightConfig((prev) => {
        if (prev.isRealTimeSync) {
          return {
            ...prev,
            timeOfDay: getCurrentLocalTimeOfDay(),
          };
        }
        if (!prev.isCycling) return prev;

        // hoursPerSecond = 24 / speedMultiplier
        const hoursDelta = (24 / Math.max(5, prev.speedMultiplier)) * dt;
        const newTime = (prev.timeOfDay + hoursDelta) % 24;
        return {
          ...prev,
          timeOfDay: newTime,
        };
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [dayNightConfig.isCycling, dayNightConfig.isRealTimeSync, dayNightConfig.speedMultiplier]);

  const handleChangeTimeOfDay = useCallback((hours: number) => {
    setDayNightConfig((prev) => ({
      ...prev,
      timeOfDay: ((hours % 24) + 24) % 24,
      isRealTimeSync: false,
    }));
  }, []);

  const handleToggleDayNightCycling = useCallback(() => {
    setDayNightConfig((prev) => ({
      ...prev,
      isCycling: !prev.isCycling,
      isRealTimeSync: false,
    }));
  }, []);

  const handleChangeSpeedMultiplier = useCallback((speed: number) => {
    setDayNightConfig((prev) => ({
      ...prev,
      speedMultiplier: speed,
      isRealTimeSync: false,
      isCycling: true,
    }));
  }, []);

  const handleToggleRealTimeSync = useCallback(() => {
    setDayNightConfig((prev) => {
      const nextSync = !prev.isRealTimeSync;
      return {
        ...prev,
        isRealTimeSync: nextSync,
        timeOfDay: nextSync ? getCurrentLocalTimeOfDay() : prev.timeOfDay,
        isCycling: nextSync ? false : prev.isCycling,
      };
    });
  }, []);

  const handleNextDayPhase = useCallback(() => {
    // Jump between 4 milestones: Dawn (6.2) -> Noon (12.5) -> Sunset (18.2) -> Night (23.5)
    setDayNightConfig((prev) => {
      const h = prev.timeOfDay;
      let nextH = 6.2;
      if (h < 6.2 || h >= 23.0) nextH = 6.2;
      else if (h < 12.5) nextH = 12.5;
      else if (h < 18.2) nextH = 18.2;
      else nextH = 23.5;
      return {
        ...prev,
        timeOfDay: nextH,
        isRealTimeSync: false,
      };
    });
  }, []);

  // Koi Ecosystem Stats & Triggers
  const [koiStats, setKoiStats] = useState<KoiEcosystemStats>({
    total: 6,
    babies: 1,
    young: 1,
    adults: 3,
    giants: 1,
  });
  const [latestNotification, setLatestNotification] = useState<KoiNotification | null>(null);
  const [triggerScatterFeast, setTriggerScatterFeast] = useState<number>(0);
  const [triggerSpawnBaby, setTriggerSpawnBaby] = useState<number>(0);

  // Modals
  const [isPhysicsOpen, setIsPhysicsOpen] = useState<boolean>(false);
  const [isInfoOpen, setIsInfoOpen] = useState<boolean>(false);

  // Physics parameters state
  const [physicsParams, setPhysicsParams] = useState<WaterPhysicsParams>({
    ...DEFAULT_PHYSICS_PARAMS,
    ...WATER_THEMES[0].defaultParams,
  });

  // Sound enable/disable sync
  useEffect(() => {
    waterAudio.setMuted(!isSoundEnabled);
  }, [isSoundEnabled]);

  const handleKoiNotification = useCallback((notif: KoiNotification) => {
    setLatestNotification(notif);
    // Auto dismiss toast after 4.8 seconds
    setTimeout(() => {
      setLatestNotification((current) => (current?.id === notif.id ? null : current));
    }, 4800);
  }, []);

  const handleScatterFeast = useCallback(() => {
    setTriggerScatterFeast((t) => t + 1);
  }, []);

  const handleSpawnBaby = useCallback(() => {
    setTriggerSpawnBaby((t) => t + 1);
  }, []);

  const handleSelectTheme = (theme: WaterTheme) => {
    setCurrentTheme(theme);
    if (theme.defaultParams) {
      setPhysicsParams((prev) => ({
        ...prev,
        ...theme.defaultParams,
      }));
    }
  };

  const handleUpdatePhysicsParams = (newParams: Partial<WaterPhysicsParams>) => {
    setPhysicsParams((prev) => ({
      ...prev,
      ...newParams,
    }));
  };

  const handleRippleCreated = useCallback(() => {
    setRippleCount((c) => c + 1);
  }, []);

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans">
      {/* Top 3-Zone Navigation Bar */}
      <TopNavbar
        currentMode={interactionMode}
        onSelectMode={setInteractionMode}
        isSoundEnabled={isSoundEnabled}
        onToggleSound={() => setIsSoundEnabled(!isSoundEnabled)}
        isSlowMotion={isSlowMotion}
        onToggleSlowMotion={() => setIsSlowMotion(!isSlowMotion)}
        isKoiEnabled={isKoiEnabled}
        onToggleKoi={() => setIsKoiEnabled(!isKoiEnabled)}
        onOpenPhysics={() => setIsPhysicsOpen(true)}
        onOpenInfo={() => setIsInfoOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        dayNightConfig={dayNightConfig}
        dayNightLighting={dayNightLighting}
        onToggleDayNightCycling={handleToggleDayNightCycling}
        onNextDayPhase={handleNextDayPhase}
      />

      {/* Main Interactive Water Canvas Simulation */}
      <WaterCanvas
        currentTheme={currentTheme}
        interactionMode={interactionMode}
        rainIntensity={rainIntensity}
        zenInterval={zenInterval}
        physicsParams={physicsParams}
        isSlowMotion={isSlowMotion}
        isSoundEnabled={isSoundEnabled}
        isKoiEnabled={isKoiEnabled}
        koiCount={koiCount}
        dayNightLighting={dayNightLighting}
        onRippleCreated={handleRippleCreated}
        onPopulationChange={setKoiStats}
        onKoiNotification={handleKoiNotification}
        triggerScatterFeast={triggerScatterFeast}
        triggerSpawnBaby={triggerSpawnBaby}
      />

      {/* Bottom Floating Control HUD */}
      <ControlHUD
        currentMode={interactionMode}
        currentTheme={currentTheme}
        onSelectTheme={handleSelectTheme}
        rainIntensity={rainIntensity}
        onChangeRainIntensity={setRainIntensity}
        zenInterval={zenInterval}
        onChangeZenInterval={setZenInterval}
        dropStrength={physicsParams.dropStrength}
        onChangeDropStrength={(strength) =>
          handleUpdatePhysicsParams({ dropStrength: strength })
        }
        rippleCount={rippleCount}
        isKoiEnabled={isKoiEnabled}
        onToggleKoi={() => setIsKoiEnabled(!isKoiEnabled)}
        koiCount={koiCount}
        onChangeKoiCount={setKoiCount}
        koiStats={koiStats}
        latestNotification={latestNotification}
        onScatterFeast={handleScatterFeast}
        onSpawnBaby={handleSpawnBaby}
        dayNightConfig={dayNightConfig}
        dayNightLighting={dayNightLighting}
        onChangeTimeOfDay={handleChangeTimeOfDay}
        onToggleDayNightCycling={handleToggleDayNightCycling}
        onChangeSpeedMultiplier={handleChangeSpeedMultiplier}
        onToggleRealTimeSync={handleToggleRealTimeSync}
      />

      {/* Physics Tuning Panel Modal */}
      <PhysicsPanel
        isOpen={isPhysicsOpen}
        onClose={() => setIsPhysicsOpen(false)}
        params={physicsParams}
        onChangeParams={handleUpdatePhysicsParams}
        currentTheme={currentTheme}
      />

      {/* Physical Dynamics Science Insight Modal */}
      <WaterInfoModal
        isOpen={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
      />
    </div>
  );
}
