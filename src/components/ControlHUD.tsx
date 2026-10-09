import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  CloudRain,
  Timer,
  Droplet,
  Waves,
  Eye,
  EyeOff,
  Fish,
  Sparkles,
  Heart,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Play,
  Pause,
  Clock,
} from 'lucide-react';
import {
  DayNightConfig,
  DayNightLighting,
  InteractionMode,
  KoiEcosystemStats,
  KoiNotification,
  RainIntensity,
  WaterTheme,
} from '../types/water';
import { WATER_THEMES } from '../data/themes';
import { formatTimeOfDay } from '../engine/dayNightEngine';

interface ControlHUDProps {
  currentMode: InteractionMode;
  currentTheme: WaterTheme;
  onSelectTheme: (theme: WaterTheme) => void;
  rainIntensity: RainIntensity;
  onChangeRainIntensity: (intensity: RainIntensity) => void;
  zenInterval: number;
  onChangeZenInterval: (sec: number) => void;
  dropStrength: number;
  onChangeDropStrength: (strength: number) => void;
  rippleCount: number;
  isKoiEnabled: boolean;
  onToggleKoi: () => void;
  koiCount: number;
  onChangeKoiCount: (count: number) => void;
  koiStats?: KoiEcosystemStats;
  latestNotification?: KoiNotification | null;
  onScatterFeast?: () => void;
  onSpawnBaby?: () => void;
  dayNightConfig: DayNightConfig;
  dayNightLighting: DayNightLighting;
  onChangeTimeOfDay: (hours: number) => void;
  onToggleDayNightCycling: () => void;
  onChangeSpeedMultiplier: (speed: number) => void;
  onToggleRealTimeSync: () => void;
}

export const ControlHUD: React.FC<ControlHUDProps> = ({
  currentMode,
  currentTheme,
  onSelectTheme,
  rainIntensity,
  onChangeRainIntensity,
  zenInterval,
  onChangeZenInterval,
  dropStrength,
  onChangeDropStrength,
  rippleCount,
  isKoiEnabled,
  onToggleKoi,
  koiCount,
  onChangeKoiCount,
  koiStats,
  latestNotification,
  onScatterFeast,
  onSpawnBaby,
  dayNightConfig,
  dayNightLighting,
  onChangeTimeOfDay,
  onToggleDayNightCycling,
  onChangeSpeedMultiplier,
  onToggleRealTimeSync,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isZenView, setIsZenView] = useState(false);

  if (isZenView) {
    return (
      <div className="absolute bottom-6 right-6 z-20">
        <button
          onClick={() => setIsZenView(false)}
          className="p-3 bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/15 rounded-full shadow-lg transition-all"
          title="恢复控制面板"
          aria-label="恢复面板"
        >
          <Eye className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[94%] max-w-2xl select-none transition-all">
      {/* Real-time Growth & Birth Floating Toast */}
      {latestNotification && (
        <div className="mb-2 flex justify-center">
          <div className="px-4 py-2 bg-slate-900/90 text-amber-200 text-xs font-medium rounded-full shadow-2xl border border-amber-400/50 backdrop-blur-md flex items-center gap-2 animate-bounce pointer-events-none whitespace-nowrap">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{latestNotification.text}</span>
          </div>
        </div>
      )}

      <div className="bg-slate-950/65 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl p-4 text-white overflow-hidden">
        {/* Header line: Interaction mode tip + Zen View & Collapse button */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            {currentMode === 'droplet' && (
              <>
                <Droplet className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>轻触水面坠落水滴，观赏 3D 皇冠水冠 (Corona)、微水珠滑行与 Worthington 水柱回弹</span>
              </>
            )}
            {currentMode === 'feed' && (
              <>
                <Waves className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>轻触或拖动水面投掷香浓鱼食，锦鲤吃饱后会变大成长，成年锦鲤吃饱后将生出金鱼宝宝！</span>
              </>
            )}
            {currentMode === 'touch' && (
              <>
                <Waves className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span>在水面滑动指尖或鼠标，实时激起流体航迹波动与折射涟漪</span>
              </>
            )}
            {currentMode === 'rain' && (
              <>
                <CloudRain className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>自然雨滴节奏敲击水面，多源水波在流体网格中实时发生干涉衍射</span>
              </>
            )}
            {currentMode === 'zen' && (
              <>
                <Timer className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>空灵定拍水滴，静听清泉声韵，抚平焦躁思绪</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {rippleCount > 0 && (
              <span className="text-[11px] text-slate-400 tabular-nums">
                波纹激荡: {rippleCount}
              </span>
            )}
            <button
              onClick={() => setIsZenView(true)}
              className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
              title="沉浸极简观赏模式 (隐藏控制台)"
              aria-label="沉浸模式"
            >
              <EyeOff className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
              title={isExpanded ? '收起面板' : '展开面板'}
              aria-label={isExpanded ? '收起面板' : '展开面板'}
            >
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Expandable Control Body */}
        {isExpanded && (
          <div className="pt-3.5 flex flex-col gap-3.5">
            {/* Koi Growth & Reproduction Family Status Bar */}
            {isKoiEnabled && (
              <div className="p-2.5 bg-black/40 rounded-xl border border-white/10 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Fish className="w-4 h-4 text-amber-400" />
                    <span className="font-medium text-amber-200">锦鲤家族生态</span>
                    <span className="text-[11px] text-slate-400">
                      (共 {koiStats?.total ?? koiCount} 条)
                    </span>
                  </div>

                  {/* Growth stage count badges */}
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-400/30" title="可吃饱长大为幼鱼">
                      🍼 宝宝: {koiStats?.babies ?? 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-400/30" title="可吃饱长大为成鱼">
                      🐟 幼鱼: {koiStats?.young ?? 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30" title="吃饱后可求偶繁育宝宝">
                      🎏 成鱼: {koiStats?.adults ?? 0}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-400/30" title="巨型鱼王，可繁育双胞胎宝宝">
                      👑 鱼王: {koiStats?.giants ?? 0}
                    </span>
                  </div>
                </div>

                {/* Feeding & Breeding Quick Action Buttons */}
                <div className="flex items-center justify-between pt-1 border-t border-white/5 text-xs">
                  <span className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Heart className="w-3 h-3 text-pink-400" />
                    <span>吃饱即长大，成年鱼吃饱后诞生小宝宝</span>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={onScatterFeast}
                      className="px-2.5 py-1 bg-amber-500/25 hover:bg-amber-500/40 text-amber-200 border border-amber-400/40 rounded-lg text-xs font-medium transition-all flex items-center gap-1 active:scale-95"
                      title="撒落丰富鱼食，吸引鱼群聚拢争食"
                    >
                      <span>🍞 撒一把鱼食</span>
                    </button>
                    <button
                      onClick={onSpawnBaby}
                      className="px-2.5 py-1 bg-pink-500/25 hover:bg-pink-500/40 text-pink-200 border border-pink-400/40 rounded-lg text-xs font-medium transition-all flex items-center gap-1 active:scale-95"
                      title="迎来一只灵动可爱的金鱼小宝宝"
                    >
                      <span>🍼 迎新宝宝</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mode Specific Controls */}
            {currentMode === 'rain' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">雨势强度</span>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-lg border border-white/10">
                  {(['light', 'moderate', 'heavy'] as RainIntensity[]).map((intensity) => (
                    <button
                      key={intensity}
                      onClick={() => onChangeRainIntensity(intensity)}
                      className={`px-3 py-1 rounded-md transition-colors ${
                        rainIntensity === intensity
                          ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {intensity === 'light' ? '细雨绵绵' : intensity === 'moderate' ? '中度清雨' : '骤雨敲荷'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentMode === 'zen' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">滴落周期</span>
                <div className="flex items-center gap-2">
                  {[1.5, 2.5, 4.0].map((sec) => (
                    <button
                      key={sec}
                      onClick={() => onChangeZenInterval(sec)}
                      className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                        zenInterval === sec
                          ? 'bg-indigo-500/30 text-indigo-200 border-indigo-400/40'
                          : 'bg-black/30 text-slate-300 border-white/10 hover:text-white'
                      }`}
                    >
                      {sec}秒
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentMode === 'droplet' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">水滴落水冲击力</span>
                <div className="flex items-center gap-2 w-48">
                  <input
                    type="range"
                    min="0.6"
                    max="2.4"
                    step="0.1"
                    value={dropStrength}
                    onChange={(e) => onChangeDropStrength(parseFloat(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/20 rounded-lg appearance-none"
                  />
                  <span className="text-[11px] font-mono text-slate-300 w-8 tabular-nums">
                    {dropStrength.toFixed(1)}x
                  </span>
                </div>
              </div>
            )}

            {/* Koi Initial Count Adjuster */}
            {isKoiEnabled && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-white/5">
                <span className="text-slate-400">基础鱼群底数</span>
                <div className="flex items-center gap-2">
                  {[3, 5, 8, 12].map((c) => (
                    <button
                      key={c}
                      onClick={() => onChangeKoiCount(c)}
                      className={`px-2.5 py-1 rounded-md border text-xs transition-colors ${
                        koiCount === c
                          ? 'bg-amber-500/30 text-amber-200 border-amber-400/40'
                          : 'bg-black/30 text-slate-300 border-white/10 hover:text-white'
                      }`}
                    >
                      {c}条
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Day-Night Cycle & Atmospheric Lighting Controller */}
            <div className="p-3 bg-gradient-to-r from-indigo-950/40 via-black/40 to-slate-950/40 rounded-xl border border-white/10 flex flex-col gap-2.5">
              {/* Header: Phase badge, Digital clock, Play/Pause, Real-time sync */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white/10 border border-white/10 text-cyan-200">
                    {dayNightLighting.phase === 'dawn' && <Sunrise className="w-4 h-4 text-amber-300" />}
                    {dayNightLighting.phase === 'noon' && <Sun className="w-4 h-4 text-yellow-300" />}
                    {dayNightLighting.phase === 'sunset' && <Sunset className="w-4 h-4 text-orange-400" />}
                    {dayNightLighting.phase === 'night' && <Moon className="w-4 h-4 text-cyan-300" />}
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className="text-white">{dayNightLighting.phaseLabel}</span>
                      <span className="font-mono text-cyan-300 text-[11px] bg-black/50 px-1.5 py-0.5 rounded border border-white/10 tabular-nums">
                        {formatTimeOfDay(dayNightConfig.timeOfDay)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls: Play/Pause, Real-time Sync */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onToggleDayNightCycling}
                    className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-all flex items-center gap-1 active:scale-95 ${
                      dayNightConfig.isCycling
                        ? 'bg-cyan-500/25 text-cyan-200 border-cyan-400/40 shadow-[0_0_8px_rgba(6,182,212,0.2)]'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:text-white'
                    }`}
                    title={dayNightConfig.isCycling ? '暂停时间流逝' : '开启时间自然流逝'}
                  >
                    {dayNightConfig.isCycling ? (
                      <>
                        <Pause className="w-3 h-3 text-cyan-300" />
                        <span>流逝中</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3" />
                        <span>自动流逝</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={onToggleRealTimeSync}
                    className={`px-2 py-1 rounded-md border text-[11px] font-medium transition-all flex items-center gap-1 active:scale-95 ${
                      dayNightConfig.isRealTimeSync
                        ? 'bg-purple-500/25 text-purple-200 border-purple-400/40 shadow-[0_0_8px_rgba(168,85,247,0.2)]'
                        : 'bg-black/30 text-slate-300 border-white/10 hover:text-white'
                    }`}
                    title={dayNightConfig.isRealTimeSync ? '解除实况同步' : '同步系统真实本地时间'}
                  >
                    <Clock className="w-3 h-3 text-purple-300" />
                    <span>实况同步</span>
                  </button>
                </div>
              </div>

              {/* Lyrical poetic description of current water atmosphere */}
              <p className="text-[11px] text-slate-300 leading-relaxed font-light">
                {dayNightLighting.phaseDescription}
              </p>

              {/* 24-hour visual scrub slider with daylight gradient track */}
              <div className="flex flex-col gap-1.5">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="24"
                    step="0.05"
                    value={dayNightConfig.timeOfDay}
                    onChange={(e) => onChangeTimeOfDay(parseFloat(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-300 bg-gradient-to-r from-indigo-950 via-sky-600 via-amber-400 via-rose-600 to-indigo-950 border border-white/20"
                    title="拖动平滑调整光照与时间 (00:00 - 24:00)"
                  />
                </div>

                {/* 4 Quick Preset Milestone Buttons */}
                <div className="grid grid-cols-4 gap-1 pt-0.5">
                  {[
                    { time: 6.2, label: '🌅 清晨柔和', desc: '06:12 晨曦薄雾粉金' },
                    { time: 12.5, label: '☀️ 正午明亮', desc: '12:30 骄阳烈照晶澈焦散' },
                    { time: 18.2, label: '🌇 暮色晚霞', desc: '18:12 熔金晚霞残阳' },
                    { time: 23.5, label: '🌙 深邃月色', desc: '23:30 幽夜月芒与繁星' },
                  ].map((preset) => (
                    <button
                      key={preset.time}
                      onClick={() => onChangeTimeOfDay(preset.time)}
                      className={`px-1.5 py-1 rounded text-[10px] font-medium border transition-all text-center truncate ${
                        Math.abs(dayNightConfig.timeOfDay - preset.time) < 1.4
                          ? 'bg-white/25 text-white border-white/50 shadow-sm'
                          : 'bg-black/30 text-slate-400 border-white/5 hover:text-slate-200 hover:bg-white/5'
                      }`}
                      title={preset.desc}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Speed Selector */}
              {dayNightConfig.isCycling && !dayNightConfig.isRealTimeSync && (
                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/5">
                  <span className="text-slate-400">时间流速</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { speed: 45, label: '45秒全天' },
                      { speed: 90, label: '90秒慢赏' },
                      { speed: 180, label: '3分冥想' },
                    ].map((item) => (
                      <button
                        key={item.speed}
                        onClick={() => onChangeSpeedMultiplier(item.speed)}
                        className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                          dayNightConfig.speedMultiplier === item.speed
                            ? 'bg-cyan-500/30 text-cyan-200 border-cyan-400/40'
                            : 'bg-black/30 text-slate-400 border-white/5 hover:text-white'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Theme Preset Switcher */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-400">水面水体底境</span>
              <div className="flex items-center gap-2">
                {WATER_THEMES.map((theme) => {
                  const isSelected = currentTheme.id === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => onSelectTheme(theme)}
                      className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs ${
                        isSelected
                          ? 'bg-white/20 border-white/40 text-white shadow-md'
                          : 'bg-black/30 border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full overflow-hidden border border-white/20 shrink-0">
                        <img
                          src={theme.imageSrc}
                          alt={theme.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-medium whitespace-nowrap">{theme.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
