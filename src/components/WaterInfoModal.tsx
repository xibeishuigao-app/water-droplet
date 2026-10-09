import React from 'react';
import { X, Sparkles, Droplets, Sun, Activity } from 'lucide-react';

interface WaterInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WaterInfoModal: React.FC<WaterInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-white/20 rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden text-white">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-semibold">真实水滴与水面波动的物理奥秘</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          <div className="flex gap-3">
            <Droplets className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">
                1. 沃辛顿射流 (Worthington Jet) 与卫星水滴反弹
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                当水滴高速撞击水面时，最初会砸出一个瞬态半球形冲击凹坑（Crater）。水面在表面张力与静水压的作用下向中心迅速回涌塌陷，反弹冲出一根垂直向上的细长液柱——即物理学著名的“沃辛顿射流”。随后在高原-瑞利不稳定性（Plateau-Rayleigh instability）驱动下，柱尖会断裂并向空中抛射出 1~2 颗卫星小水滴，再次坠入水面形成次级涟漪。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Activity className="w-5 h-5 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">
                2. 偏微分波动方程与同心圆干涉
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                本模拟器在 GPU/Canvas 网格上实时求解二维波动方程（Wave Equation: ∂²h/∂t² = c²∇²h）。相邻网格点通过拉普拉斯算子传递动能与势能，当多个水滴或滑动触摸连续发生时，波峰与波谷在水面相互穿透、叠加，产生真实的物理干涉与衍射图样。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Sun className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">
                3. 光线折射畸变与日光焦散 (Refraction & Caustics)
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                着色器实时计算水面高度场的局部法向量（Normal），依据斯涅尔折射定律对水底卵石、细沙像素进行动态偏移；同时对波面的曲率（Laplacian）进行光线汇聚积分，在水底投射出随波荡漾的日光焦散亮纹网格。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">
                4. 皇冠水花飞溅 (Splash Corona) 与微水珠气垫滑行
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                水滴撞水瞬间，水膜向上卷起形成经典皇冠状水冠（Crown splash sheet），边缘失稳分裂出 14 颗晶莹微小珠串；同时被气垫托起微观水珠短暂在水面滑行跳跃（Non-coalescing droplet floating），随后融于水波。
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Activity className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-white mb-1">
                5. 锦鲤避障游水与多层水体折射
              </h3>
              <p className="text-xs leading-relaxed text-slate-400">
                水中锦鲤采用多骨骼运动学拟合波动推进方程，水深阴影实时投影于水底。水面涟漪经过鱼身时，鱼体受表面法向量光学折射发生物理畸变，受水滴震动时产生 C 型急速折返避险并甩尾激起次级尾波。
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-3.5 bg-black/40 border-t border-white/10 text-xs">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-colors"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
};
