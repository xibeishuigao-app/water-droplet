/**
 * Day-Night Cycle and Environmental Lighting Simulation Engine
 * Simulates physical sunlight and moonlight progression across 24 hours:
 * - 05:00 - 08:30: 清晨柔和 (Soft morning glow & warm golden-rose sunrise)
 * - 09:00 - 16:00: 正午明亮 (Brilliant daylight, sparkling sun caustics & high clarity)
 * - 16:30 - 19:30: 暮色晚霞 (Warm amber & crimson sunset reflections)
 * - 20:00 - 04:30: 深邃月色 (Deep nocturnal sapphire, cool silvery moonlight & stars)
 */

import { DayNightLighting, DayPhase, WaterTheme } from '../types/water';

interface TimeKeyframe {
  hour: number;
  phase: DayPhase;
  phaseLabel: string;
  phaseDescription: string;
  lightDirection: [number, number, number];
  tintColor: [number, number, number];
  ambientColor: [number, number, number];
  specularColor: [number, number, number];
  specularMultiplier: number;
  causticMultiplier: number;
  clarityMultiplier: number;
  bgTint: [number, number, number];
  nightGlowAlpha: number;
}

const KEYFRAMES: TimeKeyframe[] = [
  {
    hour: 0.0,
    phase: 'night',
    phaseLabel: '深邃月色',
    phaseDescription: '幽夜星垂，清冷银色月芒洒落深邃水面，静谧空灵',
    lightDirection: [-0.2, 0.45, 0.88],
    tintColor: [0.015, 0.045, 0.18],
    ambientColor: [0.15, 0.24, 0.48],
    specularColor: [0.72, 0.88, 1.0],
    specularMultiplier: 0.65,
    causticMultiplier: 0.4,
    clarityMultiplier: 0.82,
    bgTint: [0.28, 0.36, 0.58],
    nightGlowAlpha: 1.0,
  },
  {
    hour: 4.5,
    phase: 'night',
    phaseLabel: '夜尽天明',
    phaseDescription: '晓星残月，夜色微敛，天际泛起极淡的微蓝冷光',
    lightDirection: [-0.4, 0.35, 0.75],
    tintColor: [0.03, 0.07, 0.22],
    ambientColor: [0.25, 0.34, 0.58],
    specularColor: [0.75, 0.85, 0.98],
    specularMultiplier: 0.7,
    causticMultiplier: 0.45,
    clarityMultiplier: 0.84,
    bgTint: [0.38, 0.44, 0.62],
    nightGlowAlpha: 0.8,
  },
  {
    hour: 6.2,
    phase: 'dawn',
    phaseLabel: '清晨柔和',
    phaseDescription: '晨曦初破，柔美粉金色朝阳洒下薄雾暖辉，水色轻灵',
    lightDirection: [-0.75, 0.32, 0.42],
    tintColor: [0.12, 0.28, 0.34],
    ambientColor: [0.94, 0.82, 0.74],
    specularColor: [1.0, 0.92, 0.82],
    specularMultiplier: 1.05,
    causticMultiplier: 0.72,
    clarityMultiplier: 0.9,
    bgTint: [0.88, 0.82, 0.78],
    nightGlowAlpha: 0.05,
  },
  {
    hour: 8.5,
    phase: 'noon',
    phaseLabel: '晨光初盛',
    phaseDescription: '朝气蓬勃，金光初盛，水面泛起轻快纯澈的波光',
    lightDirection: [-0.45, 0.65, 0.68],
    tintColor: [0.06, 0.36, 0.45],
    ambientColor: [0.92, 0.96, 1.0],
    specularColor: [1.0, 0.98, 0.94],
    specularMultiplier: 1.25,
    causticMultiplier: 0.95,
    clarityMultiplier: 0.96,
    bgTint: [0.96, 0.97, 0.98],
    nightGlowAlpha: 0.0,
  },
  {
    hour: 12.5,
    phase: 'noon',
    phaseLabel: '正午明亮',
    phaseDescription: '晴空万里，烈阳当顶，水质晶莹澄澈，焦散如蛛网跃动',
    lightDirection: [0.15, 0.92, 0.84],
    tintColor: [0.02, 0.42, 0.52],
    ambientColor: [0.92, 0.98, 1.0],
    specularColor: [1.0, 1.0, 1.0],
    specularMultiplier: 1.5,
    causticMultiplier: 1.25,
    clarityMultiplier: 1.0,
    bgTint: [1.0, 1.0, 1.0],
    nightGlowAlpha: 0.0,
  },
  {
    hour: 15.5,
    phase: 'noon',
    phaseLabel: '煦日午后',
    phaseDescription: '午后斜阳，光影温润通透，池底五彩卵石纤毫毕现',
    lightDirection: [0.48, 0.72, 0.72],
    tintColor: [0.06, 0.38, 0.46],
    ambientColor: [0.96, 0.94, 0.92],
    specularColor: [1.0, 0.98, 0.92],
    specularMultiplier: 1.35,
    causticMultiplier: 1.1,
    clarityMultiplier: 0.98,
    bgTint: [0.98, 0.96, 0.92],
    nightGlowAlpha: 0.0,
  },
  {
    hour: 18.2,
    phase: 'sunset',
    phaseLabel: '暮色晚霞',
    phaseDescription: '落霞熔金，晚风微澜，紫红霞光与炽金波光相映成趣',
    lightDirection: [0.78, 0.26, 0.36],
    tintColor: [0.28, 0.16, 0.28],
    ambientColor: [0.88, 0.48, 0.42],
    specularColor: [1.0, 0.72, 0.42],
    specularMultiplier: 1.3,
    causticMultiplier: 0.85,
    clarityMultiplier: 0.88,
    bgTint: [0.86, 0.62, 0.52],
    nightGlowAlpha: 0.15,
  },
  {
    hour: 19.8,
    phase: 'sunset',
    phaseLabel: '暮霭苍茫',
    phaseDescription: '日暮沉沉，余霞渐敛，幽蓝暮色浸润微温的水面',
    lightDirection: [0.65, 0.18, 0.45],
    tintColor: [0.12, 0.12, 0.28],
    ambientColor: [0.55, 0.35, 0.52],
    specularColor: [0.88, 0.65, 0.68],
    specularMultiplier: 0.95,
    causticMultiplier: 0.6,
    clarityMultiplier: 0.85,
    bgTint: [0.65, 0.52, 0.58],
    nightGlowAlpha: 0.4,
  },
  {
    hour: 21.5,
    phase: 'night',
    phaseLabel: '夜幕降临',
    phaseDescription: '月上柳梢，深蓝入潭，银辉初照，水中游鱼若空游无所依',
    lightDirection: [0.1, 0.38, 0.82],
    tintColor: [0.02, 0.06, 0.22],
    ambientColor: [0.22, 0.3, 0.52],
    specularColor: [0.68, 0.82, 0.98],
    specularMultiplier: 0.75,
    causticMultiplier: 0.45,
    clarityMultiplier: 0.83,
    bgTint: [0.36, 0.42, 0.6],
    nightGlowAlpha: 0.85,
  },
  {
    hour: 24.0,
    phase: 'night',
    phaseLabel: '深邃月色',
    phaseDescription: '幽夜星垂，清冷银色月芒洒落深邃水面，静谧空灵',
    lightDirection: [-0.2, 0.45, 0.88],
    tintColor: [0.015, 0.045, 0.18],
    ambientColor: [0.15, 0.24, 0.48],
    specularColor: [0.72, 0.88, 1.0],
    specularMultiplier: 0.65,
    causticMultiplier: 0.4,
    clarityMultiplier: 0.82,
    bgTint: [0.28, 0.36, 0.58],
    nightGlowAlpha: 1.0,
  },
];

/**
 * Smooth Hermite interpolation (smoothstep)
 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Linear vector interpolation
 */
function lerpVec3(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/**
 * Normalize 3D vector
 */
function normalizeVec3(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1.0;
  return [v[0] / len, v[1] / len, v[2] / len];
}

/**
 * Formats a 24-hour float into a digital clock string, e.g. 6.5 -> "06:30"
 */
export function formatTimeOfDay(hourFloat: number): string {
  const normalized = ((hourFloat % 24) + 24) % 24;
  const hours = Math.floor(normalized);
  const minutes = Math.floor((normalized - hours) * 60);
  const padH = hours.toString().padStart(2, '0');
  const padM = minutes.toString().padStart(2, '0');
  return `${padH}:${padM}`;
}

/**
 * Returns current real-world local time as 24h float
 */
export function getCurrentLocalTimeOfDay(): number {
  const now = new Date();
  return now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600;
}

/**
 * Returns the current day phase name based on time
 */
export function getDayPhase(hourFloat: number): DayPhase {
  const h = ((hourFloat % 24) + 24) % 24;
  if (h >= 5.0 && h < 8.0) return 'dawn';
  if (h >= 8.0 && h < 16.5) return 'noon';
  if (h >= 16.5 && h < 20.0) return 'sunset';
  return 'night';
}

/**
 * Calculates environmental and surface lighting at a specific time of day.
 * Modulates the chosen base theme's palette so themes preserve their distinct flavors.
 */
export function getDayNightLighting(
  timeOfDay: number,
  baseTheme: WaterTheme
): DayNightLighting {
  const h = ((timeOfDay % 24) + 24) % 24;

  // Find surrounding keyframes
  let k0 = KEYFRAMES[0];
  let k1 = KEYFRAMES[1];

  for (let i = 0; i < KEYFRAMES.length - 1; i++) {
    if (h >= KEYFRAMES[i].hour && h <= KEYFRAMES[i + 1].hour) {
      k0 = KEYFRAMES[i];
      k1 = KEYFRAMES[i + 1];
      break;
    }
  }

  const duration = k1.hour - k0.hour || 1.0;
  const rawT = (h - k0.hour) / duration;
  const t = smoothstep(0, 1, rawT);

  // Interpolate properties
  const rawLightDir = lerpVec3(k0.lightDirection, k1.lightDirection, t);
  const lightDirection = normalizeVec3(rawLightDir);

  const kfTint = lerpVec3(k0.tintColor, k1.tintColor, t);
  const kfAmbient = lerpVec3(k0.ambientColor, k1.ambientColor, t);
  const specularColor = lerpVec3(k0.specularColor, k1.specularColor, t);
  const bgTint = lerpVec3(k0.bgTint, k1.bgTint, t);

  const specularMultiplier =
    k0.specularMultiplier + (k1.specularMultiplier - k0.specularMultiplier) * t;
  const causticMultiplier =
    k0.causticMultiplier + (k1.causticMultiplier - k0.causticMultiplier) * t;
  const clarityMultiplier =
    k0.clarityMultiplier + (k1.clarityMultiplier - k0.clarityMultiplier) * t;
  const nightGlowAlpha =
    k0.nightGlowAlpha + (k1.nightGlowAlpha - k0.nightGlowAlpha) * t;

  // Harmoniously blend keyframe environmental lighting with theme's inherent color signature
  const baseTint = baseTheme.tintColor;
  const baseAmbient = baseTheme.ambientColor;

  const tintColor: [number, number, number] = [
    Math.min(1.0, baseTint[0] * 0.4 + kfTint[0] * 0.6),
    Math.min(1.0, baseTint[1] * 0.4 + kfTint[1] * 0.6),
    Math.min(1.0, baseTint[2] * 0.4 + kfTint[2] * 0.6),
  ];

  const ambientColor: [number, number, number] = [
    Math.min(1.0, baseAmbient[0] * 0.45 + kfAmbient[0] * 0.55),
    Math.min(1.0, baseAmbient[1] * 0.45 + kfAmbient[1] * 0.55),
    Math.min(1.0, baseAmbient[2] * 0.45 + kfAmbient[2] * 0.55),
  ];

  const themeSpec = baseTheme.defaultParams.specularIntensity ?? 1.2;
  const themeCaust = baseTheme.defaultParams.causticStrength ?? 0.75;
  const themeClarity = baseTheme.defaultParams.waterClarity ?? 0.88;

  const specularIntensity = themeSpec * specularMultiplier;
  const causticStrength = themeCaust * causticMultiplier;
  const waterClarity = Math.min(0.99, themeClarity * clarityMultiplier);

  const currentKeyframe = t < 0.5 ? k0 : k1;

  return {
    timeOfDay: h,
    phase: currentKeyframe.phase,
    phaseLabel: currentKeyframe.phaseLabel,
    phaseDescription: currentKeyframe.phaseDescription,
    lightDirection,
    tintColor,
    ambientColor,
    specularColor,
    specularIntensity,
    causticStrength,
    waterClarity,
    bgTint,
    nightGlowAlpha,
  };
}
