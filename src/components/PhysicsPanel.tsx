import React from 'react';
import { X, RotateCcw, Sliders } from 'lucide-react';
import { WaterPhysicsParams, WaterTheme } from '../types/water';

interface PhysicsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  params: WaterPhysicsParams;
  onChangeParams: (newParams: Partial<WaterPhysicsParams>) => void;
  currentTheme: WaterTheme;
}

export const PhysicsPanel: React.FC<PhysicsPanelProps> = ({
  isOpen,
  onClose,
  params,
  onChangeParams,
  currentTheme,
}) => {
  if (!isOpen) return null;

  const handleReset = () => {
    if (currentTheme.defaultParams) {
      onChangeParams(currentTheme.defaultParams);
    }
  };

  const sliders = [
    {
      key: 'damping' as keyof WaterPhysicsParams,
      label: '水面阻尼 / 粘滞衰减 (Damping)',
      desc: '阻尼越高，水波衰减越慢，涟漪层叠扩散更久',
      min: 0.965,
      max: 0.998,
      step: 0.001,
      format: (v: number) => v.toFixed(3),
    },
    {
      key: 'waveSpeed' as keyof WaterPhysicsParams,
      label: '波动扩散速率 (Wave Speed)',
      desc: '离散波动方程的时间步进率，决定波纹奔涌速度',
      min: 0.6,
      max: 0.97,
      step: 0.02,
      format: (v: number) => v.toFixed(2),
    },
    {
      key: 'refractionStrength' as keyof WaterPhysicsParams,
      label: '光学折射畸变 (Refraction)',
      desc: '根据表面法向量偏移底图坐标，模拟斯涅尔定律',
      min: 0.01,
      max: 0.08,
      step: 0.002,
      format: (v: number) => (v * 100).toFixed(1) + '%',
    },
    {
      key: 'specularIntensity' as keyof WaterPhysicsParams,
      label: '高光镜面反射 (Specular Glint)',
      desc: '波峰迎光面的璀璨日光高光与菲涅尔天光反射',
      min: 0.2,
      max: 2.2,
      step: 0.1,
      format: (v: number) => v.toFixed(1) + 'x',
    },
    {
      key: 'causticStrength' as keyof WaterPhysicsParams,
      label: '水底日光焦散 (Caustics)',
      desc: '波谷与波峰对光线聚散形成的水底亮纹网格',
      min: 0.0,
      max: 1.6,
      step: 0.1,
      format: (v: number) => v.toFixed(1),
    },
    {
      key: 'chromaticAberration' as keyof WaterPhysicsParams,
      label: '色散微彩虹 (Chromatic Dispersion)',
      desc: '光在水体扰动时微弱的波长色散分离',
      min: 0.0,
      max: 0.02,
      step: 0.002,
      format: (v: number) => (v * 1000).toFixed(1) + '‰',
    },
    {
      key: 'dropRadius' as keyof WaterPhysicsParams,
      label: '水滴扰动半径 (Drop Radius)',
      desc: '水滴接触水面时高斯扰动能量的初始半径',
      min: 2.0,
      max: 7.0,
      step: 0.2,
      format: (v: number) => v.toFixed(1) + 'px',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/20 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold">流体微观物理参数微调</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sliders list */}
        <div className="p-6 overflow-y-auto space-y-5">
          {sliders.map((s) => {
            const val = params[s.key] as number;
            return (
              <div key={s.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-200">{s.label}</span>
                  <span className="font-mono text-cyan-300 tabular-nums">
                    {s.format(val)}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">{s.desc}</p>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={val}
                  onChange={(e) =>
                    onChangeParams({ [s.key]: parseFloat(e.target.value) })
                  }
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-white/10 rounded-lg appearance-none"
                />
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-black/40 border-t border-white/10 text-xs">
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>恢复当前场景默认参数</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors shadow-sm"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
};
