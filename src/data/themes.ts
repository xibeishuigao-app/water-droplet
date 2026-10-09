import { WaterTheme } from '../types/water';
import zenImg from '../assets/images/zen_pebble_pond_1791446554109.jpg';
import lagoonImg from '../assets/images/tropical_lagoon_sand_1791446564703.jpg';
import nightImg from '../assets/images/night_bioluminescence_1791446577281.jpg';

export const WATER_THEMES: WaterTheme[] = [
  {
    id: 'zen_pond',
    name: '禅池锦石',
    description: '澄澈池水中的光滑五彩卵石与静卧秋叶，光影温润静谧',
    category: '自然泉韵',
    imageSrc: zenImg,
    lightDirection: [0.4, 0.7, 0.9],
    tintColor: [0.12, 0.28, 0.35],
    specularColor: [1.0, 0.98, 0.92],
    ambientColor: [0.92, 0.96, 1.0],
    defaultParams: {
      damping: 0.988,
      waveSpeed: 0.95,
      refractionStrength: 0.045,
      specularIntensity: 1.15,
      dropRadius: 3.8,
      dropStrength: 1.4,
      causticStrength: 0.7,
      waterClarity: 0.85,
    },
  },
  {
    id: 'tropical_lagoon',
    name: '蔚蓝浅湾',
    description: '热带海岛近岸水域，纯白细沙波纹与璀璨焦散日芒',
    category: '热带海洋',
    imageSrc: lagoonImg,
    lightDirection: [0.3, 0.85, 0.75],
    tintColor: [0.02, 0.42, 0.52],
    specularColor: [1.0, 1.0, 1.0],
    ambientColor: [0.85, 0.98, 1.0],
    defaultParams: {
      damping: 0.991,
      waveSpeed: 0.96, // Fixed: must be <= 0.98 to maintain numerical stability
      refractionStrength: 0.052,
      specularIntensity: 1.4,
      dropRadius: 4.2,
      dropStrength: 1.5,
      causticStrength: 1.1,
      waterClarity: 0.92,
    },
  },
  {
    id: 'bioluminescent_night',
    name: '幽夜幻荧',
    description: '静止暗夜深潭，水底微光浮游生物与深蓝星轨倒影',
    category: '幻境星海',
    imageSrc: nightImg,
    lightDirection: [0.1, 0.4, 0.9],
    tintColor: [0.03, 0.08, 0.22],
    specularColor: [0.4, 0.85, 1.0],
    ambientColor: [0.3, 0.5, 0.8],
    defaultParams: {
      damping: 0.985,
      waveSpeed: 0.92,
      refractionStrength: 0.038,
      specularIntensity: 0.9,
      dropRadius: 3.5,
      dropStrength: 1.25,
      causticStrength: 0.45,
      waterClarity: 0.75,
    },
  },
];

export const DEFAULT_PHYSICS_PARAMS = {
  damping: 0.988,
  waveSpeed: 0.94,
  refractionStrength: 0.046,
  specularIntensity: 1.25,
  dropRadius: 3.8,
  dropStrength: 1.35,
  causticStrength: 0.75,
  chromaticAberration: 0.008,
  waterTint: '#114455',
  waterClarity: 0.88,
};
