/**
 * 3D Falling Water Droplet & Worthington Jet Splash Overlay
 * Renders:
 * 1. Physical 3D falling teardrop water droplet with shadow projection and light glint
 * 2. Impact corona and splash flash
 * 3. Worthington Jet (vertical rebound liquid column with satellite rebound drop)
 * 4. Micro spray particles flying in 3D parabolic ballistic arcs
 */

import React, { useEffect, useRef } from 'react';
import {
  DayNightLighting,
  FallingDroplet,
  FishFoodPellet,
  FloatingMicroBead,
  ImpactRing,
  SplashCrown,
  SplashParticle,
  WorthingtonJet,
} from '../types/water';

interface DropletSplashLayerProps {
  droplets: FallingDroplet[];
  crowns: SplashCrown[];
  microBeads: FloatingMicroBead[];
  impactRings: ImpactRing[];
  jets: WorthingtonJet[];
  particles: SplashParticle[];
  pellets?: FishFoodPellet[];
  dayNightLighting?: DayNightLighting;
  width: number;
  height: number;
}

export const DropletSplashLayer: React.FC<DropletSplashLayerProps> = ({
  droplets,
  crowns,
  microBeads,
  impactRings,
  jets,
  particles,
  pellets = [],
  dayNightLighting,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 0. Environmental Day-Night Ambient Atmosphere Layer
    if (dayNightLighting) {
      const { phase, nightGlowAlpha, specularColor } = dayNightLighting;

      // Deep Night: Moonlit water surface aura & celestial floating micro-sparks
      if (nightGlowAlpha > 0.05) {
        ctx.save();
        // Subtle deep night vignette
        const nightGrad = ctx.createRadialGradient(
          width * 0.5,
          height * 0.5,
          Math.min(width, height) * 0.2,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.75
        );
        nightGrad.addColorStop(0, 'rgba(10, 25, 60, 0.0)');
        nightGrad.addColorStop(1, `rgba(4, 12, 32, ${0.45 * nightGlowAlpha})`);
        ctx.fillStyle = nightGrad;
        ctx.fillRect(0, 0, width, height);

        // Soft moonlit reflections (subtle silvery glistening stars across the surface)
        const now = performance.now() * 0.001;
        const starCount = 14;
        for (let s = 0; s < starCount; s++) {
          const sx = ((s * 137.5) % width);
          const sy = ((s * 223.1) % height);
          const twinkle = Math.sin(now * 1.8 + s * 1.5) * 0.5 + 0.5;
          const starAlpha = 0.25 * nightGlowAlpha * twinkle;
          if (starAlpha > 0.02) {
            ctx.beginPath();
            ctx.arc(sx, sy, 1.2 + twinkle * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(180, 225, 255, ${starAlpha})`;
            ctx.shadowColor = 'rgba(147, 197, 253, 0.8)';
            ctx.shadowBlur = 4;
            ctx.fill();
          }
        }
        ctx.restore();
      }

      // Dawn: Delicate soft morning mist glow
      if (phase === 'dawn') {
        ctx.save();
        const dawnGrad = ctx.createLinearGradient(0, 0, 0, height);
        dawnGrad.addColorStop(0, 'rgba(255, 220, 190, 0.08)');
        dawnGrad.addColorStop(0.5, 'rgba(255, 200, 160, 0.03)');
        dawnGrad.addColorStop(1, 'rgba(255, 240, 220, 0.0)');
        ctx.fillStyle = dawnGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // Sunset: Warm golden-rose twilight sheen
      if (phase === 'sunset') {
        ctx.save();
        const sunsetGrad = ctx.createLinearGradient(0, height, width, 0);
        sunsetGrad.addColorStop(0, 'rgba(235, 120, 70, 0.1)');
        sunsetGrad.addColorStop(0.5, 'rgba(200, 80, 120, 0.05)');
        sunsetGrad.addColorStop(1, 'rgba(160, 70, 160, 0.08)');
        ctx.fillStyle = sunsetGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }

    // 1. Draw Impact Rings (expanding glistening capillary waves)
    for (const ring of impactRings) {
      if (ring.alpha <= 0.01) continue;
      ctx.save();
      // Primary crest ring
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 255, 255, ${ring.alpha * 0.8})`;
      ctx.lineWidth = Math.max(1, (1.0 - ring.radius / ring.maxRadius) * 3.2);
      ctx.stroke();

      // Outer delicate capillary ripple
      ctx.beginPath();
      ctx.arc(ring.x, ring.y, ring.radius * 1.18, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(190, 235, 255, ${ring.alpha * 0.35})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
    }

    // 2. Draw 3D Splash Crowns (Milk-drop Splash Corona - 皇冠水冠)
    for (const crown of crowns) {
      if (crown.alpha <= 0.02 || crown.height <= 0.5) continue;
      const progress = crown.age / crown.maxAge;
      const curR = crown.radius;
      const curH = crown.height;
      const alpha = crown.alpha * Math.max(0, 1.0 - Math.pow(progress, 2.0));

      ctx.save();
      ctx.translate(crown.x, crown.y);

      // Crown liquid wall (trapezoidal bell curve flare)
      const wallGrad = ctx.createLinearGradient(0, 0, 0, -curH);
      wallGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
      wallGrad.addColorStop(0.4, `rgba(215, 245, 255, ${alpha * 0.65})`);
      wallGrad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.95})`);

      // Outer rim with scalloped cusps
      ctx.beginPath();
      const numSpikes = crown.spikes || 14;
      for (let i = 0; i <= numSpikes; i++) {
        const theta = (i / numSpikes) * Math.PI * 2;
        // Cusps peak and trough
        const cuspR = curR * (1.0 + 0.18 * Math.sin(theta * numSpikes * 0.5));
        const cx = Math.cos(theta) * cuspR;
        const cy = Math.sin(theta) * cuspR * 0.5 - curH; // perspective foreshortening
        if (i === 0) {
          ctx.moveTo(cx, cy);
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.fillStyle = wallGrad;
      ctx.fill();

      // Individual glistening cusp beads (Plateau-Rayleigh instability droplets on rim)
      for (let i = 0; i < numSpikes; i++) {
        const theta = (i / numSpikes) * Math.PI * 2;
        const cuspR = curR * 1.18;
        const bx = Math.cos(theta) * cuspR;
        const by = Math.sin(theta) * cuspR * 0.5 - curH;
        const beadR = Math.max(1.2, (1.0 - progress) * 2.4);

        ctx.beginPath();
        ctx.arc(bx, by, beadR, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.2})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(bx - beadR * 0.3, by - beadR * 0.3, beadR * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }

      ctx.restore();
    }

    // 3. Draw Worthington Jets (Liquid rebound column with satellite droplet)
    for (const jet of jets) {
      if (jet.age >= jet.maxAge || jet.height <= 0.5) continue;
      const progress = jet.age / jet.maxAge;
      const alpha = Math.max(0, 1.0 - Math.pow(progress, 2.2));
      const colW = jet.width * (1.0 - progress * 0.38);
      const colH = jet.height;

      ctx.save();
      const grad = ctx.createLinearGradient(jet.x, jet.y, jet.x, jet.y - colH);
      grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.9})`);
      grad.addColorStop(0.45, `rgba(215, 245, 255, ${alpha * 0.72})`);
      grad.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.98})`);

      ctx.beginPath();
      ctx.moveTo(jet.x - colW * 1.45, jet.y);
      ctx.quadraticCurveTo(jet.x - colW * 0.35, jet.y - colH * 0.5, jet.x - colW * 0.55, jet.y - colH);
      ctx.arc(jet.x, jet.y - colH, colW * 0.55, Math.PI, 0, false);
      ctx.quadraticCurveTo(jet.x + colW * 0.35, jet.y - colH * 0.5, jet.x + colW * 1.45, jet.y);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Specular highlight line along water column
      ctx.beginPath();
      ctx.moveTo(jet.x - colW * 0.22, jet.y - colH * 0.12);
      ctx.lineTo(jet.x - colW * 0.1, jet.y - colH * 0.92);
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
      ctx.lineWidth = Math.max(1, colW * 0.28);
      ctx.stroke();

      // Satellite rebound droplet bouncing above the column
      if (jet.satelliteDropY !== undefined && jet.satelliteDropY > 0) {
        const satY = jet.y - jet.satelliteDropY;
        const satR = Math.max(1.8, colW * 0.55);

        // Satellite droplet shadow on water
        ctx.beginPath();
        const satShadowAlpha = Math.max(0, 0.42 - (jet.satelliteDropY / 85) * 0.32);
        ctx.ellipse(jet.x, jet.y, Math.max(0.1, satR * 1.3), Math.max(0.1, satR * 0.65), 0, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(8, 22, 38, ${satShadowAlpha})`;
        ctx.fill();

        // Droplet body with radial water refraction
        const satGrad = ctx.createRadialGradient(
          jet.x - satR * 0.32,
          satY - satR * 0.32,
          satR * 0.1,
          jet.x,
          satY,
          satR
        );
        satGrad.addColorStop(0, '#ffffff');
        satGrad.addColorStop(0.4, `rgba(220, 245, 255, ${alpha * 0.95})`);
        satGrad.addColorStop(0.8, `rgba(165, 220, 250, ${alpha * 0.8})`);
        satGrad.addColorStop(1, `rgba(120, 190, 240, ${alpha * 0.65})`);

        ctx.beginPath();
        ctx.arc(jet.x, satY, satR, 0, Math.PI * 2);
        ctx.fillStyle = satGrad;
        ctx.fill();

        // Specular glint
        ctx.beginPath();
        ctx.arc(jet.x - satR * 0.35, satY - satR * 0.35, satR * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      }
      ctx.restore();
    }

    // 4. Draw Air-Cushion Floating Micro-Beads (水面跳跃滑行微水珠)
    for (const bead of microBeads) {
      if (bead.life <= 0) continue;
      const alpha = (bead.life / bead.maxLife) * bead.alpha;
      const br = bead.radius;

      ctx.save();
      // Contact shadow indentation on water meniscus
      ctx.beginPath();
      ctx.ellipse(bead.x, bead.y + br * 0.3, Math.max(0.1, br * 1.3), Math.max(0.1, br * 0.65), 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(10, 25, 40, ${alpha * 0.35})`;
      ctx.fill();

      // Floating bead
      const beadGrad = ctx.createRadialGradient(
        bead.x - br * 0.3,
        bead.y - br * 0.3,
        br * 0.1,
        bead.x,
        bead.y,
        br
      );
      beadGrad.addColorStop(0, '#ffffff');
      beadGrad.addColorStop(0.5, `rgba(215, 245, 255, ${alpha * 0.9})`);
      beadGrad.addColorStop(1, `rgba(140, 205, 245, ${alpha * 0.7})`);

      ctx.beginPath();
      ctx.arc(bead.x, bead.y, br, 0, Math.PI * 2);
      ctx.fillStyle = beadGrad;
      ctx.fill();

      // Sharp glistening crest point
      ctx.beginPath();
      ctx.arc(bead.x - br * 0.35, bead.y - br * 0.35, br * 0.35, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.restore();
    }

    // 5. Draw 3D Falling Droplets (with hydrodynamic surface tension oscillation)
    for (const drop of droplets) {
      if (drop.status !== 'falling' && drop.status !== 'rebound') continue;

      const alt = drop.altitude;
      const initialAlt = drop.initialAltitude || 200;
      const progress = 1.0 - Math.max(0, alt / initialAlt);
      const visualY = drop.y - alt;
      const r = drop.size;

      ctx.save();

      // Projected water surface shadow with caustic brightening halo around it
      const shadowAlpha = Math.min(0.48, 0.12 + progress * 0.38);
      const shadowRadiusX = r * (1.25 - (1.0 - progress) * 0.45);
      const shadowRadiusY = shadowRadiusX * 0.58;

      // Caustic ring halo
      if (alt < 70) {
        ctx.beginPath();
        ctx.ellipse(
          drop.x,
          drop.y,
          Math.max(0.1, shadowRadiusX * 1.35),
          Math.max(0.1, shadowRadiusY * 1.35),
          0,
          0,
          Math.PI * 2
        );
        ctx.strokeStyle = `rgba(255, 255, 255, ${(1.0 - alt / 70) * 0.45})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.ellipse(
        drop.x,
        drop.y,
        Math.max(0.1, shadowRadiusX),
        Math.max(0.1, shadowRadiusY),
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(4, 14, 28, ${shadowAlpha})`;
      ctx.fill();

      // Surface tension shape oscillation:
      // Real falling droplets oscillate between prolate (vertically elongated) and oblate (squashed)
      const osc = Math.sin(drop.oscillationPhase || 0) * 0.22;
      const elongation = Math.min(1.85, 1.0 + Math.abs(drop.velocityZ) * 0.038 + osc);
      const dropH = r * elongation;
      const dropW = r * (1.0 - osc * 0.5);

      // Realistic hydrodynamic teardrop path
      ctx.beginPath();
      ctx.moveTo(drop.x, visualY - dropH * 1.25); // Top apex
      ctx.bezierCurveTo(
        drop.x - dropW * 1.15,
        visualY - dropH * 0.35,
        drop.x - dropW * 1.15,
        visualY + dropH * 0.65,
        drop.x,
        visualY + dropH * 0.85
      );
      ctx.bezierCurveTo(
        drop.x + dropW * 1.15,
        visualY + dropH * 0.65,
        drop.x + dropW * 1.15,
        visualY - dropH * 0.35,
        drop.x,
        visualY - dropH * 1.25
      );
      ctx.closePath();

      // Refractive glass/water gradient
      const dropGrad = ctx.createRadialGradient(
        drop.x - dropW * 0.35,
        visualY - dropH * 0.22,
        r * 0.12,
        drop.x,
        visualY,
        r * 1.25
      );
      dropGrad.addColorStop(0, '#ffffff');
      dropGrad.addColorStop(0.3, 'rgba(240, 252, 255, 0.98)');
      dropGrad.addColorStop(0.65, 'rgba(180, 230, 255, 0.85)');
      dropGrad.addColorStop(0.95, 'rgba(125, 195, 240, 0.65)');
      dropGrad.addColorStop(1, 'rgba(90, 165, 220, 0.45)');

      ctx.fillStyle = dropGrad;
      ctx.fill();

      // Fresnel rim highlight
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.stroke();

      // Primary bright sun glint
      ctx.beginPath();
      ctx.arc(drop.x - dropW * 0.36, visualY - dropH * 0.45, r * 0.32, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();

      // Secondary soft sky reflection glint
      ctx.beginPath();
      ctx.arc(drop.x + dropW * 0.25, visualY + dropH * 0.3, r * 0.18, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fill();

      ctx.restore();
    }

    // 6. Draw Micro Spray Ballistic Particles
    for (const p of particles) {
      if (p.life <= 0) continue;
      const alpha = (p.life / p.maxLife) * p.alpha;
      const visualY = p.y - p.z;

      ctx.save();
      if (p.z > 2) {
        ctx.beginPath();
        ctx.ellipse(
          p.x,
          p.y,
          Math.max(0.1, p.radius * 0.85),
          Math.max(0.1, p.radius * 0.42),
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(8, 18, 32, ${alpha * 0.28})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(p.x, visualY, Math.max(0.1, p.radius), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(p.x - p.radius * 0.28, visualY - p.radius * 0.28, Math.max(0.1, p.radius * 0.42), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 1.3})`;
      ctx.fill();
      ctx.restore();
    }

    // 7. Draw Floating Food Pellets (if in feed mode)
    for (const pellet of pellets) {
      if (pellet.amount <= 0.02) continue;
      const alpha = Math.min(1.0, (1.0 - pellet.age / pellet.maxAge) * 1.2);
      const pr = Math.max(0.2, pellet.size * Math.max(0, pellet.amount));

      ctx.save();
      // Pellet floating shadow
      ctx.beginPath();
      ctx.ellipse(
        pellet.x + 3,
        pellet.y + 4,
        Math.max(0.1, pr * 1.2),
        Math.max(0.1, pr * 0.6),
        0,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = `rgba(10, 20, 28, ${alpha * 0.35})`;
      ctx.fill();

      // Pellet body
      ctx.beginPath();
      ctx.arc(pellet.x, pellet.y, pr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(185, 120, 50, ${alpha})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(pellet.x - pr * 0.3, pellet.y - pr * 0.3, pr * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(240, 190, 120, ${alpha * 0.95})`;
      ctx.fill();
      ctx.restore();
    }
  }, [droplets, crowns, microBeads, impactRings, jets, particles, pellets, dayNightLighting, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 pointer-events-none z-10"
    />
  );
};

