import React from 'react';
import {
  Volume2,
  VolumeX,
  Sliders,
  Maximize2,
  Minimize2,
  Sparkles,
  BookOpen,
  Fish,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Play,
  Pause,
} from 'lucide-react';
import { DayNightConfig, DayNightLighting, InteractionMode } from '../types/water';
import { formatTimeOfDay } from '../engine/dayNightEngine';

interface TopNavbarProps {
  currentMode: InteractionMode;
  onSelectMode: (mode: InteractionMode) => void;
  isSoundEnabled: boolean;
  onToggleSound: () => void;
  isSlowMotion: boolean;
  onToggleSlowMotion: () => void;
  isKoiEnabled: boolean;
  onToggleKoi: () => void;
  onOpenPhysics: () => void;
  onOpenInfo: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  dayNightConfig?: DayNightConfig;
  dayNightLighting?: DayNightLighting;
  onToggleDayNightCycling?: () => void;
  onNextDayPhase?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentMode,
  onSelectMode,
  isSoundEnabled,
  onToggleSound,
  isSlowMotion,
  onToggleSlowMotion,
  isKoiEnabled,
  onToggleKoi,
  onOpenPhysics,
  onOpenInfo,
  isFullscreen,
  onToggleFullscreen,
  dayNightConfig,
  dayNightLighting,
  onToggleDayNightCycling,
  onNextDayPhase,
}) => {
  const modes: { id: InteractionMode; label: string; desc: string }[] = [
    { id: 'droplet', label: '单滴凝视', desc: '真实坠落与皇冠水花反弹' },
    { id: 'touch', label: '涟漪触抚', desc: '触指实时流体划痕' },
    { id: 'feed', label: '投喂锦鲤', desc: '投掷鱼食喂养锦鲤，吃饱长大蜕变并诞生金鱼宝宝' },
    { id: 'rain', label: '自然雨境', desc: '多重雨滴干涉波纹' },
    { id: 'zen', label: '禅意空灵', desc: '定拍心境节律滴落' },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-3.5 bg-slate-950/40 backdrop-blur-md border-b border-white/10 select-none transition-all">
      {/* Zone 1: Brand wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          className="text-lg font-semibold tracking-wide text-white/95 flex items-center gap-2 hover:text-white transition-colors"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
          <span>AquaZen</span>
        </a>
      </div>

      {/* Zone 2: Clean Mode Switcher */}
      <nav className="flex items-center gap-1.5 p-1 bg-black/30 backdrop-blur-sm rounded-lg border border-white/10">
        {modes.map((m) => {
          const isActive = currentMode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMode(m.id)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white/20 text-white shadow-sm shadow-black/40 border border-white/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
              title={m.desc}
            >
              {m.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Functional Actions */}
      <div className="flex items-center gap-2">
        {/* Day-Night Current Atmosphere Pill */}
        {dayNightLighting && dayNightConfig && (
          <div className="flex items-center bg-black/40 border border-white/10 rounded-md p-0.5">
            <button
              onClick={onNextDayPhase}
              className="px-2 py-1 text-xs font-medium text-slate-200 hover:text-white transition-all flex items-center gap-1.5 whitespace-nowrap hover:bg-white/10 rounded"
              title={`当前光景: ${dayNightLighting.phaseLabel} (${dayNightLighting.phaseDescription})，点击切换至下一时光`}
            >
              {dayNightLighting.phase === 'dawn' && <Sunrise className="w-3.5 h-3.5 text-amber-300" />}
              {dayNightLighting.phase === 'noon' && <Sun className="w-3.5 h-3.5 text-yellow-300" />}
              {dayNightLighting.phase === 'sunset' && <Sunset className="w-3.5 h-3.5 text-orange-400" />}
              {dayNightLighting.phase === 'night' && <Moon className="w-3.5 h-3.5 text-cyan-300" />}
              <span className="font-mono text-cyan-200 text-[11px] tabular-nums">
                {formatTimeOfDay(dayNightConfig.timeOfDay)}
              </span>
              <span className="text-slate-300 hidden md:inline">{dayNightLighting.phaseLabel}</span>
            </button>
            <button
              onClick={onToggleDayNightCycling}
              className={`p-1 rounded transition-colors ${
                dayNightConfig.isCycling ? 'text-cyan-300 hover:bg-cyan-500/20' : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
              title={dayNightConfig.isCycling ? '暂停昼夜循环' : '开启昼夜自动流转'}
            >
              {dayNightConfig.isCycling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        )}

        {/* Koi Fish Toggle */}
        <button
          onClick={onToggleKoi}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all flex items-center gap-1.5 whitespace-nowrap ${
            isKoiEnabled
              ? 'bg-amber-500/25 text-amber-200 border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
              : 'bg-black/30 text-slate-400 border-white/10 hover:text-slate-200'
          }`}
          title={isKoiEnabled ? '关闭水中金鱼' : '开启水中锦鲤游动'}
        >
          <Fish className="w-3.5 h-3.5 text-amber-300" />
          <span>{isKoiEnabled ? '水中锦鲤' : '锦鲤静止'}</span>
        </button>

        {/* Slow Motion */}
        <button
          onClick={onToggleSlowMotion}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-all flex items-center gap-1.5 whitespace-nowrap ${
            isSlowMotion
              ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/40 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
              : 'bg-black/30 text-slate-300 border-white/10 hover:text-white hover:bg-white/10'
          }`}
          title="慢动作模式 (0.25x 观赏微观水花皇冠与微水柱物理)"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isSlowMotion ? '0.25x 慢放' : '慢动作'}</span>
        </button>

        {/* Audio Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 text-xs rounded-md border transition-all ${
            isSoundEnabled
              ? 'bg-black/30 text-white border-white/15 hover:bg-white/15'
              : 'bg-black/40 text-slate-400 border-white/10 hover:text-slate-200'
          }`}
          title={isSoundEnabled ? '静音' : '开启水滴音效'}
          aria-label={isSoundEnabled ? '静音' : '开启水滴音效'}
        >
          {isSoundEnabled ? (
            <Volume2 className="w-4 h-4 text-cyan-300" />
          ) : (
            <VolumeX className="w-4 h-4" />
          )}
        </button>

        {/* Physics Panel */}
        <button
          onClick={onOpenPhysics}
          className="p-2 text-xs bg-black/30 text-slate-300 border border-white/10 rounded-md hover:text-white hover:bg-white/10 transition-all"
          title="调节水面流体物理参数"
          aria-label="流体物理参数"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Physics Guide / Info */}
        <button
          onClick={onOpenInfo}
          className="p-2 text-xs bg-black/30 text-slate-300 border border-white/10 rounded-md hover:text-white hover:bg-white/10 transition-all hidden sm:flex"
          title="流体力学与光学原理"
          aria-label="物理原理"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        {/* Fullscreen */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 text-xs bg-black/30 text-slate-300 border border-white/10 rounded-md hover:text-white hover:bg-white/10 transition-all"
          title={isFullscreen ? '退出全屏' : '全屏沉浸模式'}
          aria-label={isFullscreen ? '退出全屏' : '全屏沉浸'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4" />
          ) : (
            <Maximize2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
