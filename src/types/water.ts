export type InteractionMode = 'droplet' | 'touch' | 'rain' | 'zen' | 'feed';

export type RainIntensity = 'off' | 'light' | 'moderate' | 'heavy';

export type DayPhase = 'dawn' | 'noon' | 'sunset' | 'night';

export interface DayNightLighting {
  timeOfDay: number;          // 0.0 ~ 24.0 (小时, 例如 6.5 为 06:30)
  phase: DayPhase;            // 阶段
  phaseLabel: string;         // '清晨柔和' | '正午明亮' | '暮色晚霞' | '深邃月色'
  phaseDescription: string;   // 诗意描述
  lightDirection: [number, number, number]; // 光照方向向量
  tintColor: [number, number, number];      // 水体吸收底色 (RGB 0..1)
  ambientColor: [number, number, number];   // 环境光与天空倒影色
  specularColor: [number, number, number];  // 高光反光色 (日芒/月色)
  specularIntensity: number;  // 高光强度倍率
  causticStrength: number;    // 水底焦散强度
  waterClarity: number;       // 水面清澈度
  bgTint: [number, number, number]; // 水底背景光影乘积 (RGB 0..1)
  nightGlowAlpha: number;     // 月光微光与星芒透明度 (0..1)
}

export interface DayNightConfig {
  timeOfDay: number;          // 0.0 ~ 24.0
  isCycling: boolean;         // 是否自动随时间流逝循环
  speedMultiplier: number;    // 流逝速度倍率 (例如 30x 表示 48秒走完一天)
  isRealTimeSync: boolean;    // 是否同步真实世界时间
}

export interface WaterPhysicsParams {
  damping: number;          // 阻尼系数 (0.95 ~ 0.998)
  waveSpeed: number;        // 波传播速度 (0.5 ~ 1.5)
  refractionStrength: number; // 折射强度 (0.0 ~ 0.08)
  specularIntensity: number;  // 阳光高光强度 (0.0 ~ 2.0)
  dropRadius: number;       // 冲击半径 (1 ~ 8)
  dropStrength: number;     // 水滴冲击力度 (0.5 ~ 3.0)
  causticStrength: number;  // 焦散光照强度 (0.0 ~ 1.5)
  chromaticAberration: number; // 色散色差 (0.0 ~ 0.02)
  waterTint: string;        // 水体吸收底色
  waterClarity: number;     // 清澈度 (0.0 ~ 1.0)
}

export interface WaterTheme {
  id: string;
  name: string;
  description: string;
  category: string;
  imageSrc: string;
  lightDirection: [number, number, number];
  tintColor: [number, number, number];
  specularColor: [number, number, number];
  ambientColor: [number, number, number];
  defaultParams: Partial<WaterPhysicsParams>;
}

export interface FallingDroplet {
  id: string;
  x: number;
  y: number;
  altitude: number;       // 距离水面的垂直高度 (px)
  initialAltitude: number;
  velocityZ: number;      // 竖直下落速度
  size: number;           // 水滴半径
  mass: number;
  color: string;
  alpha: number;
  status: 'falling' | 'impacted' | 'rebound';
  oscillationPhase?: number; // 液滴表面张力形变振荡相位
  reboundHeight?: number;
  reboundCount?: number;
}

export interface SplashCrown {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  height: number;
  maxHeight: number;
  age: number;
  maxAge: number;
  spikes: number;
  alpha: number;
}

export interface FloatingMicroBead {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  alpha: number;
}

export interface SplashParticle {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface WorthingtonJet {
  id: string;
  x: number;
  y: number;
  height: number;
  maxHeight: number;
  width: number;
  age: number;
  maxAge: number;
  satelliteDropY?: number;
  satelliteDropVz?: number;
  hasBounced?: boolean;
}

export interface ImpactRing {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
  alpha: number;
}

export interface FishFoodPellet {
  id: string;
  x: number;
  y: number;
  size: number;
  age: number;
  maxAge: number;
  amount: number;
}

export type KoiVariety = 'kohaku' | 'sanke' | 'yamabuki' | 'tancho' | 'asagi';

export type KoiStage = 'baby' | 'young' | 'adult' | 'giant';

export interface KoiFish {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  speed: number;
  baseSpeed: number;
  maxSpeed: number;
  length: number;
  targetLength: number;
  variety: KoiVariety;
  finPhase: number;
  swimPhase: number;
  fearTimer: number; // 惊吓加速计时器
  jointAngles: number[];
  depth: number; // 水深 (0.2 ~ 0.8)
  stage: KoiStage;
  foodEaten: number; // 已吃食物营养累积
  foodToGrow: number; // 升阶或繁殖所需食物总量
  growthProgress: number; // 当前阶段成长进度 (0 ~ 1)
  breedCooldown: number; // 繁殖冷却
  justGrownTimer?: number; // 升级成长特效计时器
  justBredTimer?: number; // 繁育特效计时器
  generation: number; // 世代 (1: 初代, 2: 鱼宝宝, 3: 孙代)
}

export interface KoiEcosystemStats {
  total: number;
  babies: number;
  young: number;
  adults: number;
  giants: number;
}

export interface KoiNotification {
  id: string;
  text: string;
  type: 'birth' | 'growth' | 'feed';
  timestamp: number;
}
