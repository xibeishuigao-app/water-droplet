/**
 * Japanese Koi Fish Simulation Engine with Growth & Breeding Dynamics
 * Features:
 * - Natural skeletal spline kinematics with undulating swimming waves
 * - Feeding growth system: Baby fry -> Young -> Adult -> Giant Koi
 * - Courtship & Reproduction: Well-fed mature fish mate and give birth to baby Koi fry
 * - Realistic Japanese Nishikigoi patterns, shadows, and interactive startled responses
 * - Bulletproof safeEllipse rendering (immune to negative or NaN radius errors)
 */

import {
  FishFoodPellet,
  KoiEcosystemStats,
  KoiFish,
  KoiNotification,
  KoiStage,
  KoiVariety,
} from '../types/water';
import { waterAudio } from '../audio/waterSound';

export interface FloatingKoiBadge {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  size: number;
}

export class KoiFishEngine {
  private fishList: KoiFish[] = [];
  private pellets: FishFoodPellet[] = [];
  private floatingBadges: FloatingKoiBadge[] = [];
  private lightDirection: [number, number, number] = [0.4, 0.7, 0.9];
  private nightGlow: number = 0;
  private width: number = 800;
  private height: number = 600;
  private maxFishLimit: number = 20;

  public onBabyBorn?: (baby: KoiFish, parent: KoiFish) => void;
  public onFishGrown?: (fish: KoiFish, stage: KoiStage) => void;
  public onNotification?: (notification: KoiNotification) => void;

  constructor(count: number = 5, width: number = 800, height: number = 600) {
    this.width = width;
    this.height = height;
    this.initFish(count);
  }

  /**
   * Safe ellipse wrapper that guarantees strictly positive finite radiuses,
   * completely preventing CanvasRenderingContext2D IndexSizeError.
   */
  private safeEllipse(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number = 0,
    startAngle: number = 0,
    endAngle: number = Math.PI * 2
  ) {
    const rx = Math.max(0.1, Math.abs(radiusX) || 0.1);
    const ry = Math.max(0.1, Math.abs(radiusY) || 0.1);
    ctx.ellipse(x, y, rx, ry, rotation, startAngle, endAngle);
  }

  public setDimensions(width: number, height: number) {
    this.width = Math.max(300, width);
    this.height = Math.max(300, height);
  }

  public setLightDirection(dir: [number, number, number], nightGlow: number = 0) {
    this.lightDirection = dir;
    this.nightGlow = nightGlow;
  }

  public setLighting(dir: [number, number, number], nightGlow: number = 0) {
    this.lightDirection = dir;
    this.nightGlow = nightGlow;
  }

  public setFishCount(count: number) {
    const current = this.fishList.length;
    if (count > current) {
      const varieties: KoiVariety[] = ['kohaku', 'sanke', 'yamabuki', 'tancho', 'asagi'];
      for (let i = current; i < count; i++) {
        this.fishList.push(this.createFish(varieties[i % varieties.length], 'adult'));
      }
    } else if (count < current) {
      this.fishList = this.fishList.slice(0, count);
    }
  }

  public getFishList(): KoiFish[] {
    return this.fishList;
  }

  public getPellets(): FishFoodPellet[] {
    return this.pellets;
  }

  public getFloatingBadges(): FloatingKoiBadge[] {
    return this.floatingBadges;
  }

  public getPopulationStats(): KoiEcosystemStats {
    let babies = 0;
    let young = 0;
    let adults = 0;
    let giants = 0;

    for (const f of this.fishList) {
      if (f.stage === 'baby') babies++;
      else if (f.stage === 'young') young++;
      else if (f.stage === 'adult') adults++;
      else if (f.stage === 'giant') giants++;
    }

    return {
      total: this.fishList.length,
      babies,
      young,
      adults,
      giants,
    };
  }

  /**
   * Creates a Koi fish at a specific lifecycle stage
   */
  public createFish(
    variety: KoiVariety,
    stage: KoiStage = 'adult',
    spawnX?: number,
    spawnY?: number,
    generation: number = 1
  ): KoiFish {
    const margin = 100;
    const x = spawnX !== undefined ? spawnX : margin + Math.random() * (this.width - margin * 2);
    const y = spawnY !== undefined ? spawnY : margin + Math.random() * (this.height - margin * 2);
    const angle = Math.random() * Math.PI * 2;

    let length = 72;
    let baseSpeed = 1.15;
    let foodToGrow = 1.6;

    if (stage === 'baby') {
      length = 26 + Math.random() * 4;
      baseSpeed = 1.65 + Math.random() * 0.35; // nimble, fast flutter
      foodToGrow = 0.35; // grows quickly with ~3 bites!
    } else if (stage === 'young') {
      length = 48 + Math.random() * 6;
      baseSpeed = 1.35 + Math.random() * 0.3;
      foodToGrow = 0.85; // requires ~6 bites to reach adulthood
    } else if (stage === 'adult') {
      length = 74 + Math.random() * 8;
      baseSpeed = 1.15 + Math.random() * 0.2;
      foodToGrow = 1.6; // requires ~10 bites to reach giant size
    } else if (stage === 'giant') {
      length = 98 + Math.random() * 8;
      baseSpeed = 0.95 + Math.random() * 0.15; // majestic steady glide
      foodToGrow = 1.8;
    }

    return {
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      targetX: x + Math.cos(angle) * 300,
      targetY: y + Math.sin(angle) * 300,
      angle,
      speed: baseSpeed,
      baseSpeed,
      maxSpeed: baseSpeed * 3.2,
      length,
      targetLength: length,
      variety,
      finPhase: Math.random() * Math.PI * 2,
      swimPhase: Math.random() * Math.PI * 2,
      fearTimer: 0,
      jointAngles: new Array(10).fill(0),
      depth: 0.32 + Math.random() * 0.45,
      stage,
      foodEaten: 0,
      foodToGrow,
      growthProgress: 0,
      breedCooldown: stage === 'adult' ? 180 : 360,
      generation,
    };
  }

  private initFish(count: number) {
    this.fishList = [];
    const varieties: KoiVariety[] = ['kohaku', 'sanke', 'yamabuki', 'tancho', 'asagi'];
    for (let i = 0; i < count; i++) {
      // Start with a natural family: 1 giant patriarch/matriarch, 1 cute fry baby, 1 youngster, and adults
      let stage: KoiStage = 'adult';
      if (i === 0) stage = 'giant';
      else if (i === 1) stage = 'baby';
      else if (i === 2) stage = 'young';

      this.fishList.push(
        this.createFish(
          varieties[i % varieties.length],
          stage,
          undefined,
          undefined,
          stage === 'baby' ? 2 : 1
        )
      );
    }
  }

  /**
   * Spawns food pellets at (x, y)
   */
  public addFood(x: number, y: number, count: number = 4) {
    for (let i = 0; i < count; i++) {
      const offsetX = (Math.random() - 0.5) * 32;
      const offsetY = (Math.random() - 0.5) * 32;
      this.pellets.push({
        id: Math.random().toString(36).substring(2, 9),
        x: Math.max(10, Math.min(this.width - 10, x + offsetX)),
        y: Math.max(10, Math.min(this.height - 10, y + offsetY)),
        size: 3.6 + Math.random() * 2,
        age: 0,
        maxAge: 520 + Math.random() * 200,
        amount: 1.0,
      });
    }

    // Gentle floating food hint
    if (Math.random() < 0.4) {
      this.addBadge(x, y - 10, '🍞 投喂鱼食', '#f59e0b', 35);
    }
  }

  /**
   * Scatter a large feast across the pond
   */
  public scatterFeast(centerX?: number, centerY?: number) {
    const cx = centerX !== undefined ? centerX : this.width * 0.5;
    const cy = centerY !== undefined ? centerY : this.height * 0.5;

    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 180;
      this.pellets.push({
        id: Math.random().toString(36).substring(2, 9),
        x: Math.max(20, Math.min(this.width - 20, cx + Math.cos(angle) * dist)),
        y: Math.max(20, Math.min(this.height - 20, cy + Math.sin(angle) * dist)),
        size: 3.5 + Math.random() * 2.2,
        age: 0,
        maxAge: 600,
        amount: 1.0,
      });
    }

    this.addBadge(cx, cy - 20, '✨ 盛宴投喂！鱼群欢聚', '#fbbf24', 50);
  }

  /**
   * Add a floating text badge (e.g. "+成长", "✨ 幼鱼升级", "💕 诞下金鱼宝宝")
   */
  private addBadge(x: number, y: number, text: string, color: string, life: number = 45, size: number = 13) {
    this.floatingBadges.push({
      id: Math.random().toString(36).substring(2, 9),
      x,
      y,
      text,
      color,
      alpha: 1.0,
      life,
      maxLife: life,
      size,
    });
  }

  /**
   * Triggers startled evasion reflex when water drop hits near a fish
   */
  public startleNear(x: number, y: number, radius: number = 160): boolean {
    let anyStartled = false;
    for (const fish of this.fishList) {
      const dx = fish.x - x;
      const dy = fish.y - y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        const escapeAngle = Math.atan2(dy, dx);
        fish.targetX = fish.x + Math.cos(escapeAngle) * 450;
        fish.targetY = fish.y + Math.sin(escapeAngle) * 450;
        fish.speed = fish.maxSpeed;
        fish.fearTimer = 45;
        anyStartled = true;
      }
    }
    return anyStartled;
  }

  /**
   * Directly births a baby Koi fry (e.g. via UI action or natural breeding)
   */
  public spawnBabyNear(parent?: KoiFish): KoiFish | null {
    if (this.fishList.length >= this.maxFishLimit) return null;

    const varieties: KoiVariety[] = ['kohaku', 'sanke', 'yamabuki', 'tancho', 'asagi'];
    const variety = parent ? parent.variety : varieties[Math.floor(Math.random() * varieties.length)];
    const spawnX = parent ? parent.x - Math.cos(parent.angle) * 32 : this.width * (0.3 + Math.random() * 0.4);
    const spawnY = parent ? parent.y - Math.sin(parent.angle) * 32 : this.height * (0.3 + Math.random() * 0.4);
    const generation = parent ? parent.generation + 1 : 2;

    const baby = this.createFish(variety, 'baby', spawnX, spawnY, generation);
    baby.justGrownTimer = 70; // sparkling golden arrival aura
    this.fishList.push(baby);

    waterAudio.playBabyBirthChime();

    const notifText = parent
      ? `🍼 恭喜！锦鲤妈妈诞下了第 ${baby.generation} 代小金鱼宝宝！`
      : `🍼 恭喜！池塘迎来了一条可爱的小金鱼宝宝！`;

    this.addBadge(spawnX, spawnY - 18, '💕 诞生宝宝！', '#f472b6', 55, 14);

    this.onNotification?.({
      id: Math.random().toString(36).substring(2, 9),
      text: notifText,
      type: 'birth',
      timestamp: Date.now(),
    });

    this.onBabyBorn?.(baby, parent || baby);
    return baby;
  }

  /**
   * Updates fish AI, nutrition digestion, continuous growth, and natural breeding
   */
  public update(timeScale: number = 1.0): { x: number; y: number; strength: number }[] {
    const wakeRipples: { x: number; y: number; strength: number }[] = [];

    // 1. Update food pellets
    for (let i = this.pellets.length - 1; i >= 0; i--) {
      const pellet = this.pellets[i];
      pellet.age += timeScale;
      if (pellet.age >= pellet.maxAge || pellet.amount <= 0.02) {
        this.pellets.splice(i, 1);
      }
    }

    // 2. Update floating text badges
    for (let i = this.floatingBadges.length - 1; i >= 0; i--) {
      const b = this.floatingBadges[i];
      b.life -= timeScale;
      b.y -= 0.65 * timeScale; // float gently upward
      b.alpha = Math.max(0, b.life / b.maxLife);
      if (b.life <= 0) {
        this.floatingBadges.splice(i, 1);
      }
    }

    const newBabies: KoiFish[] = [];

    // 3. Update each fish
    for (const fish of this.fishList) {
      // Cooldown & timers
      if (fish.fearTimer > 0) {
        fish.fearTimer -= timeScale;
        if (fish.fearTimer <= 0) {
          fish.speed = fish.baseSpeed;
        }
      } else {
        fish.speed = fish.baseSpeed * (0.85 + Math.sin(fish.swimPhase * 0.5) * 0.25);
      }

      if (fish.breedCooldown > 0) {
        fish.breedCooldown -= timeScale;
      }
      if (fish.justGrownTimer && fish.justGrownTimer > 0) {
        fish.justGrownTimer -= timeScale;
      }
      if (fish.justBredTimer && fish.justBredTimer > 0) {
        fish.justBredTimer -= timeScale;
      }

      // Smooth real-time physical growth interpolation towards target length
      if (Math.abs(fish.length - fish.targetLength) > 0.05) {
        fish.length += (fish.targetLength - fish.length) * 0.08 * timeScale;
      }

      // Check for nearby food pellets
      let nearestPellet: FishFoodPellet | null = null;
      let minPelletDist = 320;

      if (this.pellets.length > 0 && fish.fearTimer <= 0) {
        for (const pellet of this.pellets) {
          const pdx = pellet.x - fish.x;
          const pdy = pellet.y - fish.y;
          const pdist = Math.sqrt(pdx * pdx + pdy * pdy);
          if (pdist < minPelletDist) {
            minPelletDist = pdist;
            nearestPellet = pellet;
          }
        }
      }

      // If food detected, eagerly swim towards it
      if (nearestPellet) {
        fish.targetX = nearestPellet.x;
        fish.targetY = nearestPellet.y;
        fish.speed = Math.min(fish.maxSpeed * 0.9, fish.baseSpeed * 1.55);

        // Nibble & Eat Food
        if (minPelletDist < 22) {
          const bite = Math.min(nearestPellet.amount, 0.045 * timeScale);
          nearestPellet.amount = Math.max(0, nearestPellet.amount - bite);
          fish.foodEaten += bite;

          // DIRECT VISIBLE GROWTH: every bite physically stretches and fattens the fish!
          if (fish.stage === 'baby') {
            fish.targetLength += bite * 20; // babies grow rapidly!
          } else if (fish.stage === 'young') {
            fish.targetLength += bite * 10;
          } else if (fish.stage === 'adult') {
            fish.targetLength += bite * 6;
          } else if (fish.stage === 'giant') {
            fish.targetLength += bite * 3;
          }

          fish.growthProgress = Math.min(1.0, fish.foodEaten / fish.foodToGrow);

          // Audio & Nibble water ripples
          if (Math.random() < 0.22) {
            waterAudio.playNibble();
            const headX = fish.x + Math.cos(fish.angle) * (fish.length * 0.35);
            const headY = fish.y + Math.sin(fish.angle) * (fish.length * 0.35);
            wakeRipples.push({
              x: headX,
              y: headY,
              strength: 0.22,
            });

            // Occasional bite badge
            if (Math.random() < 0.35) {
              this.addBadge(headX, headY - 8, '+成长', '#34d399', 24, 11);
            }
          }

          // === GROWTH STAGE UPGRADES (吃饱长大) ===
          // 1. Baby -> Young Koi (requires ~0.35 food)
          if (fish.stage === 'baby' && fish.foodEaten >= fish.foodToGrow) {
            fish.stage = 'young';
            fish.targetLength = 52 + Math.random() * 5;
            fish.baseSpeed = 1.35;
            fish.foodEaten = 0;
            fish.foodToGrow = 0.85;
            fish.growthProgress = 0;
            fish.justGrownTimer = 80;
            waterAudio.playGrowthSparkle();

            this.addBadge(fish.x, fish.y - 18, '✨ 升级为幼鱼！', '#fbbf24', 55, 13);
            this.onNotification?.({
              id: Math.random().toString(36).substring(2, 9),
              text: '🎉 金鱼宝宝吃饱长大啦！蜕变为成长期幼鱼！',
              type: 'growth',
              timestamp: Date.now(),
            });

            this.onFishGrown?.(fish, 'young');
            wakeRipples.push({ x: fish.x, y: fish.y, strength: 0.55 });
          }
          // 2. Young -> Adult Koi (requires ~0.85 food)
          else if (fish.stage === 'young' && fish.foodEaten >= fish.foodToGrow) {
            fish.stage = 'adult';
            fish.targetLength = 75 + Math.random() * 6;
            fish.baseSpeed = 1.15;
            fish.foodEaten = 0;
            fish.foodToGrow = 1.6;
            fish.growthProgress = 0;
            fish.breedCooldown = 150;
            fish.justGrownTimer = 90;
            waterAudio.playGrowthSparkle();

            this.addBadge(fish.x, fish.y - 20, '🎏 长成成年锦鲤！', '#f97316', 55, 14);
            this.onNotification?.({
              id: Math.random().toString(36).substring(2, 9),
              text: '🎏 幼鱼吃饱长大为成年锦鲤！拥有了繁殖后代的能力！',
              type: 'growth',
              timestamp: Date.now(),
            });

            this.onFishGrown?.(fish, 'adult');
            wakeRipples.push({ x: fish.x, y: fish.y, strength: 0.7 });
          }
          // 3. Adult -> Magnificent Giant Koi (requires ~1.6 food)
          else if (fish.stage === 'adult' && fish.foodEaten >= fish.foodToGrow) {
            fish.stage = 'giant';
            fish.targetLength = 100 + Math.random() * 8;
            fish.baseSpeed = 0.96;
            fish.foodEaten = 0;
            fish.foodToGrow = 2.0;
            fish.growthProgress = 0;
            fish.justGrownTimer = 100;
            waterAudio.playGrowthSparkle();

            this.addBadge(fish.x, fish.y - 22, '👑 蜕变为锦鲤鱼王！', '#eab308', 60, 15);
            this.onNotification?.({
              id: Math.random().toString(36).substring(2, 9),
              text: '👑 成年锦鲤吃饱蜕变为【巨型锦鲤王】！身姿修长威仪，金光闪耀！',
              type: 'growth',
              timestamp: Date.now(),
            });

            this.onFishGrown?.(fish, 'giant');
            wakeRipples.push({ x: fish.x, y: fish.y, strength: 0.85 });
          }
        }
      } else if (fish.fearTimer <= 0) {
        // Natural wandering behavior
        const tdx = fish.targetX - fish.x;
        const tdy = fish.targetY - fish.y;
        const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

        const margin = 80;
        const isNearBorder =
          fish.x < margin ||
          fish.x > this.width - margin ||
          fish.y < margin ||
          fish.y > this.height - margin;

        if (tdist < 60 || isNearBorder || Math.random() < 0.008) {
          const wanderAngle = Math.random() * Math.PI * 2;
          const wanderDist = 180 + Math.random() * 260;
          let nx = fish.x + Math.cos(wanderAngle) * wanderDist;
          let ny = fish.y + Math.sin(wanderAngle) * wanderDist;

          nx = Math.max(margin + 20, Math.min(this.width - margin - 20, nx));
          ny = Math.max(margin + 20, Math.min(this.height - margin - 20, ny));

          fish.targetX = nx;
          fish.targetY = ny;
        }
      }

      // Smooth steering rotation towards target
      const targetAngle = Math.atan2(fish.targetY - fish.y, fish.targetX - fish.x);
      let angleDiff = targetAngle - fish.angle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      const turnSpeed = (fish.fearTimer > 0 ? 0.08 : 0.038) * timeScale;
      fish.angle += angleDiff * turnSpeed;

      // Move forward
      const currentSpeed = fish.speed * timeScale;
      fish.x += Math.cos(fish.angle) * currentSpeed;
      fish.y += Math.sin(fish.angle) * currentSpeed;

      // Update tail and fin swim phases (babies have high-frequency flutter)
      const freqMultiplier = fish.stage === 'baby' ? 1.75 : fish.stage === 'giant' ? 0.78 : 1.0;
      const swimFreq = 0.09 * (fish.speed / fish.baseSpeed) * freqMultiplier * timeScale;
      fish.swimPhase += swimFreq;
      fish.finPhase += swimFreq * 1.5;

      // Propagate undulation down the 10 spine joints
      const numJoints = fish.jointAngles.length;
      let prevAngle = fish.angle;
      const waveAmp = fish.fearTimer > 0 ? 0.38 : 0.22;

      for (let j = 0; j < numJoints; j++) {
        const jointProgress = (j + 1) / numJoints;
        const targetJointAngle =
          fish.angle + Math.sin(fish.swimPhase - j * 0.45) * waveAmp * jointProgress;
        fish.jointAngles[j] += (targetJointAngle - fish.jointAngles[j]) * 0.35 * timeScale;
        prevAngle = fish.jointAngles[j];
      }

      // Swimming wake ripple at tail tip
      if ((fish.fearTimer > 0 && Math.random() < 0.3) || Math.random() < 0.03) {
        const tailX = fish.x - Math.cos(prevAngle) * (fish.length * 0.7);
        const tailY = fish.y - Math.sin(prevAngle) * (fish.length * 0.7);
        wakeRipples.push({
          x: tailX,
          y: tailY,
          strength: fish.fearTimer > 0 ? 0.35 : 0.18,
        });
      }

      // === NATURAL BREEDING / GIVING BIRTH TO BABY KOI (生小宝宝) ===
      // Mature adult/giant fish with full belly of food will reproduce!
      const isMature = fish.stage === 'adult' || fish.stage === 'giant';
      const requiredFoodToBreed = fish.stage === 'giant' ? 0.5 : 0.7;

      if (
        isMature &&
        fish.foodEaten >= requiredFoodToBreed &&
        fish.breedCooldown <= 0 &&
        this.fishList.length + newBabies.length < this.maxFishLimit
      ) {
        // Find potential courtship partner or spontaneous well-fed birth
        let mate: KoiFish | null = null;
        for (const other of this.fishList) {
          if (other.id !== fish.id && (other.stage === 'adult' || other.stage === 'giant')) {
            const mdx = other.x - fish.x;
            const mdy = other.y - fish.y;
            const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mdist < 65) {
              mate = other;
              break;
            }
          }
        }

        // Courtship or full-belly birth!
        if (mate || fish.foodEaten >= requiredFoodToBreed * 1.35) {
          fish.breedCooldown = 420; // ~7-9 seconds cooldown
          fish.justBredTimer = 65;
          if (mate) mate.breedCooldown = 420;

          // Deduct nutrition spent on reproduction
          fish.foodEaten = 0;
          fish.growthProgress = 0;

          // Inherit variety from parents
          const varieties: KoiVariety[] = ['kohaku', 'sanke', 'yamabuki', 'tancho', 'asagi'];
          const babyVariety = mate && Math.random() < 0.5 ? mate.variety : fish.variety;

          const birthX = fish.x - Math.cos(fish.angle) * 30;
          const birthY = fish.y - Math.sin(fish.angle) * 30;

          const baby = this.createFish(babyVariety, 'baby', birthX, birthY, fish.generation + 1);
          baby.justGrownTimer = 70;
          newBabies.push(baby);

          // Giant koi occasionally birth twins!
          if (fish.stage === 'giant' && this.fishList.length + newBabies.length < this.maxFishLimit) {
            const twinVariety = varieties[Math.floor(Math.random() * varieties.length)];
            const twin = this.createFish(twinVariety, 'baby', birthX + 12, birthY - 8, fish.generation + 1);
            twin.justGrownTimer = 70;
            newBabies.push(twin);
          }

          waterAudio.playBabyBirthChime();

          this.addBadge(birthX, birthY - 18, '💕 诞下金鱼宝宝！', '#f472b6', 60, 14);
          this.onNotification?.({
            id: Math.random().toString(36).substring(2, 9),
            text: `🍼 锦鲤妈妈吃饱后顺利诞下了第 ${baby.generation} 代可爱金鱼宝宝！`,
            type: 'birth',
            timestamp: Date.now(),
          });

          this.onBabyBorn?.(baby, fish);

          // Joyous birth ripples!
          wakeRipples.push({ x: birthX, y: birthY, strength: 0.65 });
          wakeRipples.push({ x: birthX + 8, y: birthY - 6, strength: 0.45 });
        }
      }
    }

    // Add newly born baby fish to active population
    if (newBabies.length > 0) {
      this.fishList.push(...newBabies);
    }

    return wakeRipples;
  }

  /**
   * Renders Koi fish, shadows, and growth/birth effects onto 2D canvas
   */
  public render(ctx: CanvasRenderingContext2D, targetWidth: number, targetHeight: number) {
    const scaleX = Math.max(0.1, targetWidth / this.width);
    const scaleY = Math.max(0.1, targetHeight / this.height);

    // Render food pellets first
    for (const pellet of this.pellets) {
      if (pellet.amount <= 0.02) continue;
      const px = pellet.x * scaleX;
      const py = pellet.y * scaleY;
      const pr = Math.max(0.2, pellet.size * Math.max(0, pellet.amount) * scaleX);
      const alpha = Math.min(1.0, (1.0 - pellet.age / pellet.maxAge) * 1.2);

      // Pellet shadow
      ctx.beginPath();
      this.safeEllipse(ctx, px + 4, py + 5, pr * 1.1, pr * 0.6);
      ctx.fillStyle = `rgba(10, 20, 25, ${alpha * 0.3})`;
      ctx.fill();

      // Pellet floating body
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 115, 45, ${alpha})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(px - pr * 0.3, py - pr * 0.3, pr * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(235, 180, 110, ${alpha * 0.9})`;
      ctx.fill();
    }

    // Two-pass rendering:
    // Pass 1: Draw soft directional shadows for all fish
    for (const fish of this.fishList) {
      this.drawFishShadow(ctx, fish, scaleX, scaleY);
    }

    // Pass 2: Draw realistic fish bodies with markings, fins, and growth auras
    for (const fish of this.fishList) {
      this.drawFishBody(ctx, fish, scaleX, scaleY);
    }

    // Pass 3: Draw floating text badges ("+成长", "💕 诞生宝宝", etc.)
    for (const b of this.floatingBadges) {
      const bx = b.x * scaleX;
      const by = b.y * scaleY;
      ctx.save();
      ctx.font = `bold ${Math.max(10, Math.round(b.size * scaleX))}px system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = b.color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 4;
      ctx.globalAlpha = b.alpha;
      ctx.fillText(b.text, bx, by);
      ctx.restore();
    }
  }

  private drawFishShadow(
    ctx: CanvasRenderingContext2D,
    fish: KoiFish,
    scaleX: number,
    scaleY: number
  ) {
    const shadowDist = 28 * fish.depth;
    const sx = (fish.x + this.lightDirection[0] * shadowDist) * scaleX;
    const sy = (fish.y + this.lightDirection[1] * shadowDist) * scaleY;
    const shadowAlpha = (fish.stage === 'baby' ? 0.16 : 0.28) * (1.0 - fish.depth * 0.4);
    const len = fish.length * scaleX;
    const width = fish.length * 0.24 * scaleX;

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(fish.angle);

    ctx.beginPath();
    this.safeEllipse(ctx, 0, 0, len * 0.45, width * 0.9);
    ctx.fillStyle = `rgba(10, 18, 25, ${shadowAlpha})`;
    ctx.filter = `blur(${Math.max(2, 6 * fish.depth)}px)`;
    ctx.fill();
    ctx.filter = 'none';

    ctx.restore();
  }

  private drawFishBody(
    ctx: CanvasRenderingContext2D,
    fish: KoiFish,
    scaleX: number,
    scaleY: number
  ) {
    const fx = fish.x * scaleX;
    const fy = fish.y * scaleY;
    const len = Math.max(12, fish.length * scaleX);
    const halfLen = len * 0.5;
    // Plump fullness factor: well-fed fish has a slightly rounder, plumper body!
    const fullness = 1.0 + Math.min(0.2, fish.foodEaten * 0.12);
    const maxBodyW = len * 0.25 * fullness;

    ctx.save();
    ctx.translate(fx, fy);
    ctx.rotate(fish.angle);

    // Compute spine points based on joints
    const points: { x: number; y: number; w: number; angle: number }[] = [];
    let curX = halfLen * 0.7; // head tip
    let curY = 0;
    const segLen = len / 11;

    points.push({ x: curX, y: curY, w: maxBodyW * 0.4, angle: 0 });

    for (let i = 0; i < 10; i++) {
      const relAngle = fish.jointAngles[i] - fish.angle;
      curX -= Math.cos(relAngle) * segLen;
      curY -= Math.sin(relAngle) * segLen;

      let w = maxBodyW;
      const t = i / 10;
      if (t < 0.25) {
        w = maxBodyW * (0.6 + (t / 0.25) * 0.4);
      } else {
        w = maxBodyW * (1.0 - Math.pow((t - 0.25) / 0.75, 1.4) * 0.82);
      }

      points.push({ x: curX, y: curY, w: Math.max(0.5, w), angle: relAngle });
    }

    // 1. Draw Pectoral Fins
    const finFlutter = Math.sin(fish.finPhase) * 0.25;
    const finBase = points[2];
    ctx.save();
    ctx.translate(finBase.x, finBase.y);

    ctx.save();
    ctx.rotate(Math.PI * 0.65 + finFlutter);
    this.drawPectoralFin(ctx, len * 0.35, fish.variety, fish.stage === 'baby');
    ctx.restore();

    ctx.save();
    ctx.rotate(-Math.PI * 0.65 - finFlutter);
    this.drawPectoralFin(ctx, len * 0.35, fish.variety, fish.stage === 'baby');
    ctx.restore();
    ctx.restore();

    // 2. Draw Caudal Tail Fin
    const tailTip = points[points.length - 1];
    ctx.save();
    ctx.translate(tailTip.x, tailTip.y);
    ctx.rotate(tailTip.angle);
    this.drawTailFin(ctx, len * 0.48, fish.swimPhase, fish.variety, fish.stage === 'baby');
    ctx.restore();

    // 3. Draw Main Fish Body
    const leftCurve: { x: number; y: number }[] = [];
    const rightCurve: { x: number; y: number }[] = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const normalAngle = p.angle + Math.PI / 2;
      leftCurve.push({
        x: p.x + Math.cos(normalAngle) * p.w,
        y: p.y + Math.sin(normalAngle) * p.w,
      });
      rightCurve.push({
        x: p.x - Math.cos(normalAngle) * p.w,
        y: p.y - Math.sin(normalAngle) * p.w,
      });
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 0; i < leftCurve.length; i++) {
      ctx.lineTo(leftCurve[i].x, leftCurve[i].y);
    }
    ctx.lineTo(tailTip.x, tailTip.y);
    for (let i = rightCurve.length - 1; i >= 0; i--) {
      ctx.lineTo(rightCurve[i].x, rightCurve[i].y);
    }
    ctx.closePath();

    const bodyGrad = ctx.createLinearGradient(points[0].x, 0, tailTip.x, 0);
    this.applyBodyColors(bodyGrad, fish.variety, fish.stage === 'baby');
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // 4. Draw Authentic Nishikigoi Pattern Markings
    this.drawKoiMarkings(ctx, points, fish.variety, len);

    // 5. Dorsal Spine 3D Highlight
    ctx.beginPath();
    ctx.moveTo(points[1].x, points[1].y);
    for (let i = 2; i < points.length - 2; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = fish.stage === 'giant' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = Math.max(0.5, maxBodyW * 0.28);
    ctx.lineCap = 'round';
    ctx.stroke();

    // Eyes
    const eyeP = points[1];
    const eyeDist = eyeP.w * 0.72;
    const eyeR = fish.stage === 'baby' ? 2.6 * scaleX : 2.2 * scaleX; // cute bigger eyes for baby
    for (const dir of [1, -1]) {
      const ex = eyeP.x + Math.cos(eyeP.angle + (Math.PI / 2) * dir) * eyeDist;
      const ey = eyeP.y + Math.sin(eyeP.angle + (Math.PI / 2) * dir) * eyeDist;
      ctx.beginPath();
      ctx.arc(ex, ey, Math.max(0.5, eyeR), 0, Math.PI * 2);
      ctx.fillStyle = '#0a1015';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ex - 0.5, ey - 0.5, Math.max(0.3, eyeR * 0.42), 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fill();
    }

    // 6. Growth Sparkle Halo Effect (when just grown)
    if (fish.justGrownTimer && fish.justGrownTimer > 0) {
      const gAlpha = fish.justGrownTimer / 80;
      ctx.save();
      ctx.beginPath();
      this.safeEllipse(ctx, 0, 0, len * 0.6, maxBodyW * 1.6);
      ctx.strokeStyle = `rgba(251, 191, 36, ${gAlpha * 0.85})`;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Sparkle star
      const starX = halfLen * 0.4;
      ctx.fillStyle = `rgba(255, 255, 255, ${gAlpha})`;
      ctx.font = '10px sans-serif';
      ctx.fillText('✨', starX, -maxBodyW * 1.2);
      ctx.restore();
    }

    // 7. Birth Celebration Aura (when just bred a baby)
    if (fish.justBredTimer && fish.justBredTimer > 0) {
      const bAlpha = fish.justBredTimer / 50;
      ctx.save();
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(1, len * 0.75), 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(244, 114, 182, ${bAlpha * 0.75})`; // Soft pink aura
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = `rgba(244, 114, 182, ${bAlpha})`;
      ctx.font = '10px sans-serif';
      ctx.fillText('❤️', 0, -maxBodyW * 1.3);
      ctx.restore();
    }

    // 8. Moonlit Phosphorescent Rim Glow (at deep night)
    if (this.nightGlow > 0.08) {
      ctx.save();
      ctx.beginPath();
      this.safeEllipse(ctx, 0, 0, len * 0.52, maxBodyW * 1.15);
      ctx.strokeStyle = `rgba(180, 225, 255, ${0.32 * this.nightGlow})`;
      ctx.lineWidth = Math.max(1.2, len * 0.035);
      ctx.shadowColor = 'rgba(147, 197, 253, 0.7)';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  private applyBodyColors(grad: CanvasGradient, variety: KoiVariety, isBaby: boolean = false) {
    if (variety === 'yamabuki') {
      grad.addColorStop(0, isBaby ? '#fef08a' : '#fcd34d');
      grad.addColorStop(0.4, isBaby ? '#fde047' : '#f59e0b');
      grad.addColorStop(1, '#d97706');
    } else if (variety === 'asagi') {
      grad.addColorStop(0, '#f1f5f9');
      grad.addColorStop(0.3, isBaby ? '#94a3b8' : '#64748b');
      grad.addColorStop(1, '#334155');
    } else {
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#f8fafc');
      grad.addColorStop(1, isBaby ? '#f1f5f9' : '#e2e8f0');
    }
  }

  private drawKoiMarkings(
    ctx: CanvasRenderingContext2D,
    points: { x: number; y: number; w: number; angle: number }[],
    variety: KoiVariety,
    len: number
  ) {
    ctx.save();

    if (variety === 'tancho') {
      const headP = points[1];
      ctx.beginPath();
      ctx.arc(headP.x + len * 0.04, headP.y, Math.max(0.1, headP.w * 0.7), 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
    } else if (variety === 'kohaku' || variety === 'sanke') {
      ctx.fillStyle = '#ef4444';
      const p1 = points[1];
      const p2 = points[3];
      ctx.beginPath();
      this.safeEllipse(
        ctx,
        (p1.x + p2.x) * 0.5,
        (p1.y + p2.y) * 0.5,
        len * 0.14,
        p1.w * 0.75
      );
      ctx.fill();

      const p3 = points[4];
      const p4 = points[6];
      ctx.beginPath();
      this.safeEllipse(
        ctx,
        (p3.x + p4.x) * 0.5,
        (p3.y + p4.y) * 0.5,
        len * 0.16,
        p3.w * 0.7,
        0.1
      );
      ctx.fill();

      const p5 = points[7];
      ctx.beginPath();
      this.safeEllipse(ctx, p5.x, p5.y, len * 0.1, p5.w * 0.65, -0.1);
      ctx.fill();

      if (variety === 'sanke') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        this.safeEllipse(
          ctx,
          points[3].x - 3,
          points[3].y + 4,
          len * 0.04,
          points[3].w * 0.35,
          0.3
        );
        ctx.fill();

        ctx.beginPath();
        this.safeEllipse(
          ctx,
          points[5].x + 4,
          points[5].y - 3,
          len * 0.05,
          points[5].w * 0.4,
          -0.2
        );
        ctx.fill();
      }
    } else if (variety === 'asagi') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.75)';
      const p1 = points[2];
      ctx.beginPath();
      this.safeEllipse(ctx, p1.x, p1.y, len * 0.18, p1.w * 0.85);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawPectoralFin(
    ctx: CanvasRenderingContext2D,
    size: number,
    variety: KoiVariety,
    isBaby: boolean = false
  ) {
    const s = Math.max(1, size);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(s * 0.5, s * 0.3, s * 0.9, s * 0.15, s, 0);
    ctx.bezierCurveTo(s * 0.8, -s * 0.25, s * 0.4, -s * 0.3, 0, 0);
    ctx.closePath();

    const finGrad = ctx.createLinearGradient(0, 0, s, 0);
    if (variety === 'yamabuki') {
      finGrad.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
      finGrad.addColorStop(1, 'rgba(252, 211, 77, 0.3)');
    } else {
      finGrad.addColorStop(0, isBaby ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.85)');
      finGrad.addColorStop(1, 'rgba(255, 255, 255, 0.25)');
    }
    ctx.fillStyle = finGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 0.7;
    for (let r = 0.3; r <= 0.8; r += 0.25) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s * r, Math.sin(r * 5) * s * 0.15);
      ctx.stroke();
    }
  }

  private drawTailFin(
    ctx: CanvasRenderingContext2D,
    size: number,
    swimPhase: number,
    variety: KoiVariety,
    isBaby: boolean = false
  ) {
    const s = Math.max(1, size);
    const sway = Math.sin(swimPhase) * s * 0.18;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-s * 0.4, -s * 0.35 + sway * 0.5, -s * 0.85, -s * 0.5 + sway, -s, -s * 0.35 + sway);
    ctx.bezierCurveTo(-s * 0.7, sway * 0.3, -s * 0.7, sway * 0.3, -s, s * 0.35 + sway);
    ctx.bezierCurveTo(-s * 0.85, s * 0.5 + sway, -s * 0.4, s * 0.35 + sway * 0.5, 0, 0);
    ctx.closePath();

    const tailGrad = ctx.createLinearGradient(0, 0, -s, 0);
    if (variety === 'yamabuki') {
      tailGrad.addColorStop(0, 'rgba(245, 158, 11, 0.85)');
      tailGrad.addColorStop(1, 'rgba(252, 211, 77, 0.2)');
    } else {
      tailGrad.addColorStop(0, isBaby ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.9)');
      tailGrad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
    }
    ctx.fillStyle = tailGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 0.8;
    for (let angle = -0.3; angle <= 0.3; angle += 0.15) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-s * 0.9, angle * s + sway);
      ctx.stroke();
    }
  }
}
