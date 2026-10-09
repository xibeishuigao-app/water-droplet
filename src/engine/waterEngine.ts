/**
 * High-Performance Water Wave Ripple Engine
 * Features:
 * - 2D Physical Wave Equation simulation with sub-pixel interpolation
 * - Absorbing boundary layers (preventing unnatural harsh reflections)
 * - WebGL rendering pipeline with normal maps, refraction, chromatic aberration,
 *   specular lighting, caustics, and Fresnel reflections
 * - Canvas 2D fallback renderer for extreme environment resilience
 */

import { WaterPhysicsParams } from '../types/water';

export class WaterSimulationEngine {
  private width: number;
  private height: number;
  private gridWidth: number = 256;
  private gridHeight: number = 256;
  private size: number;

  private bufferA: Float32Array;
  private bufferB: Float32Array;
  private currentBuffer: Float32Array;
  private previousBuffer: Float32Array;

  // WebGL context & resources
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private heightTexture: WebGLTexture | null = null;
  private bgTexture: WebGLTexture | null = null;
  private heightByteData: Uint8Array;
  private isWebGLSupported: boolean = false;

  // 2D Fallback context
  private ctx2d: CanvasRenderingContext2D | null = null;
  private bgImageCanvas: HTMLCanvasElement | null = null;
  private bgImageData: ImageData | null = null;

  // Parameters
  private params: WaterPhysicsParams;
  private lightDirection: [number, number, number] = [0.3, 0.7, 0.8];
  private tintColor: [number, number, number] = [0.08, 0.35, 0.5];
  private skyColor: [number, number, number] = [0.85, 0.92, 1.0];
  private specularColor: [number, number, number] = [1.0, 1.0, 1.0];

  constructor(
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    params: WaterPhysicsParams
  ) {
    this.width = width;
    this.height = height;
    this.params = { ...params };

    // Responsive simulation grid: maintain aspect ratio while keeping computational load constant
    const aspect = width / height;
    if (aspect >= 1) {
      this.gridWidth = 256;
      this.gridHeight = Math.max(128, Math.round(256 / aspect));
    } else {
      this.gridHeight = 256;
      this.gridWidth = Math.max(128, Math.round(256 * aspect));
    }

    this.size = this.gridWidth * this.gridHeight;
    this.bufferA = new Float32Array(this.size);
    this.bufferB = new Float32Array(this.size);
    this.currentBuffer = this.bufferA;
    this.previousBuffer = this.bufferB;
    this.heightByteData = new Uint8Array(this.size);

    this.initWebGL(canvas);
    if (!this.isWebGLSupported) {
      this.init2D(canvas);
    }
  }

  public updateDimensions(width: number, height: number) {
    this.width = width;
    this.height = height;
  }

  public setParams(newParams: Partial<WaterPhysicsParams>) {
    this.params = { ...this.params, ...newParams };
  }

  public setLighting(
    lightDir: [number, number, number],
    tint: [number, number, number],
    sky: [number, number, number],
    specular?: [number, number, number]
  ) {
    this.lightDirection = lightDir;
    this.tintColor = tint;
    this.skyColor = sky;
    if (specular) {
      this.specularColor = specular;
    }
  }

  private initWebGL(canvas: HTMLCanvasElement) {
    try {
      const gl = canvas.getContext('webgl', {
        alpha: false,
        depth: false,
        antialias: false,
        preserveDrawingBuffer: false,
      }) as WebGLRenderingContext | null;

      if (!gl) {
        this.isWebGLSupported = false;
        return;
      }

      this.gl = gl;

      // Vertex shader for full-screen quad
      const vsSource = `
        attribute vec2 a_position;
        varying vec2 v_uv;
        void main() {
          v_uv = (a_position + 1.0) * 0.5;
          v_uv.y = 1.0 - v_uv.y; // Flip Y for image orientation
          gl_Position = vec4(a_position, 0.0, 1.0);
        }
      `;

      // Fragment shader for wave normals, refraction, caustics, and specular highlights
      const fsSource = `
        precision highp float;
        varying vec2 v_uv;
        uniform sampler2D u_bg;
        uniform sampler2D u_height;
        uniform vec2 u_gridRes;
        uniform float u_refraction;
        uniform float u_specular;
        uniform float u_caustic;
        uniform float u_chromatic;
        uniform float u_clarity;
        uniform vec3 u_lightDir;
        uniform vec3 u_tint;
        uniform vec3 u_sky;
        uniform vec3 u_specularColor;

        void main() {
          vec2 dx = vec2(1.0 / u_gridRes.x, 0.0);
          vec2 dy = vec2(0.0, 1.0 / u_gridRes.y);

          // Sample heightfield (0.5 is zero water elevation)
          float hC = (texture2D(u_height, v_uv).r - 0.5) * 2.0;
          float hL = (texture2D(u_height, v_uv - dx).r - 0.5) * 2.0;
          float hR = (texture2D(u_height, v_uv + dx).r - 0.5) * 2.0;
          float hD = (texture2D(u_height, v_uv - dy).r - 0.5) * 2.0;
          float hU = (texture2D(u_height, v_uv + dy).r - 0.5) * 2.0;

          // Surface normal from spatial gradients
          float bump = 3.2;
          vec3 normal = normalize(vec3((hL - hR) * bump, (hD - hU) * bump, 1.0));

          // Physical optical refraction with chromatic dispersion
          vec2 refrOffset = normal.xy * u_refraction;
          float chrom = u_chromatic;

          float colR = texture2D(u_bg, clamp(v_uv + refrOffset * (1.0 - chrom), 0.0, 1.0)).r;
          float colG = texture2D(u_bg, clamp(v_uv + refrOffset, 0.0, 1.0)).g;
          float colB = texture2D(u_bg, clamp(v_uv + refrOffset * (1.0 + chrom), 0.0, 1.0)).b;
          vec3 refrColor = vec3(colR, colG, colB);

          // Caustic light concentration from water curvature (Laplacian)
          float laplacian = (hL + hR + hD + hU - 4.0 * hC);
          float caustic = clamp(1.0 + laplacian * u_caustic * 4.5, 0.6, 2.2);
          refrColor *= caustic;

          // Sun specular glint (Blinn-Phong)
          vec3 light = normalize(u_lightDir);
          vec3 view = vec3(0.0, 0.0, 1.0);
          vec3 halfVec = normalize(light + view);
          float NdotH = max(0.0, dot(normal, halfVec));
          float spec = pow(NdotH, 48.0) * u_specular * 1.5;

          // Fresnel reflection coefficient (Schlick's approximation)
          float NdotV = max(0.0, dot(normal, view));
          float fresnel = 0.04 + 0.96 * pow(1.0 - NdotV, 5.0);

          // Deep water absorption tint
          vec3 water = mix(refrColor, u_tint, (1.0 - u_clarity) * 0.35);

          // Final composite: refracted seabed + sky reflection + sun glint with environmental specular tint
          vec3 finalColor = mix(water, u_sky, fresnel * 0.35) + u_specularColor * spec;

          gl_FragColor = vec4(finalColor, 1.0);
        }
      `;

      const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
      const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
      if (!vs || !fs) {
        this.isWebGLSupported = false;
        return;
      }

      const program = gl.createProgram();
      if (!program) return;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('WebGL link error', gl.getProgramInfoLog(program));
        this.isWebGLSupported = false;
        return;
      }

      this.program = program;
      gl.useProgram(program);

      // Full screen quad buffer
      const posBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
      const quadVertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);

      const posLoc = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(posLoc);
      gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

      // Create textures
      this.heightTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.heightTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      this.bgTexture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.bgTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      // Initialize with solid 1x1 fallback pixel so texture unit 1 is immediately valid
      const dummyPixel = new Uint8Array([12, 60, 85, 255]);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, dummyPixel);

      this.isWebGLSupported = true;
    } catch {
      this.isWebGLSupported = false;
    }
  }

  private compileShader(type: number, src: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type);
    if (!shader) return null;
    this.gl.shaderSource(shader, src);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  private init2D(canvas: HTMLCanvasElement) {
    this.ctx2d = canvas.getContext('2d');
  }

  /**
   * Set the background seabed/pond image
   */
  public setBackgroundImage(image: HTMLImageElement) {
    if (this.isWebGLSupported && this.gl && this.bgTexture) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.bgTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      try {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          image
        );
      } catch (err) {
        console.warn('WebGL texImage2D failed', err);
      }
    }

    // Prepare 2D Canvas fallback
    const off = document.createElement('canvas');
    off.width = this.width || 600;
    off.height = this.height || 400;
    const offCtx = off.getContext('2d');
    if (offCtx) {
      try {
        offCtx.drawImage(image, 0, 0, off.width, off.height);
        this.bgImageCanvas = off;
        this.bgImageData = offCtx.getImageData(0, 0, off.width, off.height);
      } catch {
        // Fallback for tainted canvas
      }
    }
  }

  /**
   * Updates dynamic background (e.g. background with animated swimming Koi fish)
   */
  public updateDynamicBackground(canvas: HTMLCanvasElement) {
    if (this.isWebGLSupported && this.gl && this.bgTexture) {
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.bgTexture);
      try {
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          gl.RGBA,
          gl.RGBA,
          gl.UNSIGNED_BYTE,
          canvas
        );
      } catch {
        // WebGL upload fallback
      }
    }
    if (this.ctx2d) {
      this.bgImageCanvas = canvas;
    }
  }

  /**
   * Reset wave buffers to calm state
   */
  public clearDisturbances() {
    this.bufferA.fill(0);
    this.bufferB.fill(0);
    this.heightByteData.fill(128);
  }

  /**
   * Add a drop / touch disturbance at normalized coordinates (0..1)
   */
  public addDisturbance(normX: number, normY: number, radiusRatio: number = 1.0, strengthRatio: number = 1.0) {
    const cx = Math.floor(normX * this.gridWidth);
    const cy = Math.floor(normY * this.gridHeight);

    const baseRadius = this.params.dropRadius * radiusRatio;
    const radius = Math.max(1.5, Math.min(18, baseRadius));
    const rInt = Math.ceil(radius * 2);
    const rSq = radius * radius;
    const strength = this.params.dropStrength * strengthRatio * 240;

    const minX = Math.max(1, cx - rInt);
    const maxX = Math.min(this.gridWidth - 2, cx + rInt);
    const minY = Math.max(1, cy - rInt);
    const maxY = Math.min(this.gridHeight - 2, cy + rInt);

    for (let y = minY; y <= maxY; y++) {
      const dy = y - cy;
      const dySq = dy * dy;
      const rowOffset = y * this.gridWidth;

      for (let x = minX; x <= maxX; x++) {
        const dx = x - cx;
        const distSq = dx * dx + dySq;
        if (distSq <= rSq) {
          // Smooth cosine bell curve distribution
          const factor = Math.cos((Math.sqrt(distSq) / radius) * (Math.PI / 2));
          this.currentBuffer[rowOffset + x] -= strength * factor;
        }
      }
    }
  }

  /**
   * Step physical wave equation simulation
   */
  public stepPhysics(timeScale: number = 1.0) {
    const gw = this.gridWidth;
    const gh = this.gridHeight;
    const curr = this.currentBuffer;
    const prev = this.previousBuffer;
    // Bound damping and speed strictly to safe numerical regime
    const safeDamping = Math.min(0.996, Math.max(0.95, this.params.damping));
    const damping = Math.pow(safeDamping, timeScale);
    const speed = Math.min(0.97, Math.max(0.5, this.params.waveSpeed));

    // 2D discrete wave propagation with absorbing boundaries
    for (let y = 1; y < gh - 1; y++) {
      const row = y * gw;
      const rowUp = row - gw;
      const rowDown = row + gw;

      // Soft damping near edges to absorb wave energy smoothly
      const edgeYDist = Math.min(y, gh - 1 - y);
      const edgeYDamp = edgeYDist < 12 ? (edgeYDist / 12) : 1.0;

      for (let x = 1; x < gw - 1; x++) {
        const idx = row + x;
        const edgeXDist = Math.min(x, gw - 1 - x);
        const edgeXDamp = edgeXDist < 12 ? (edgeXDist / 12) : 1.0;
        const localDamping = damping * (0.94 + 0.06 * Math.min(edgeXDamp, edgeYDamp));

        // 4-point cross Laplacian
        const ortho = (curr[idx - 1] + curr[idx + 1] + curr[rowUp + x] + curr[rowDown + x]) * 0.25;

        // Discrete wave propagation: h(t+1) = (2 * ortho - h(t-1)) * damping
        let val = ((ortho * 2.0) - prev[idx]) * localDamping;

        // Strict protection against NaN or numerical divergence
        if (isNaN(val) || !isFinite(val)) {
          val = 0;
        } else if (val > 180) {
          val = 180;
        } else if (val < -180) {
          val = -180;
        }

        prev[idx] = val * speed + curr[idx] * (1.0 - speed);
      }
    }

    // Ping-pong buffer swap
    this.currentBuffer = prev;
    this.previousBuffer = curr;
  }

  /**
   * Render the water surface
   */
  public render() {
    if (this.isWebGLSupported && this.gl && this.program) {
      this.renderWebGL();
    } else if (this.ctx2d) {
      this.render2DFallback();
    }
  }

  private renderWebGL() {
    const gl = this.gl!;
    gl.viewport(0, 0, this.width, this.height);

    // Pack height values into unsigned byte texture (0..255, where 128 is calm surface)
    const len = this.size;
    const curr = this.currentBuffer;
    const byteData = this.heightByteData;

    for (let i = 0; i < len; i++) {
      // Map [-128..128] to [0..255]
      const h = curr[i];
      const byteVal = 128 + Math.max(-127, Math.min(127, Math.round(h * 0.4)));
      byteData[i] = isNaN(byteVal) ? 128 : byteVal;
    }

    // Upload heightmap to GPU on Texture Unit 0
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.heightTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.LUMINANCE,
      this.gridWidth,
      this.gridHeight,
      0,
      gl.LUMINANCE,
      gl.UNSIGNED_BYTE,
      byteData
    );

    // Ensure background texture is active on Texture Unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.bgTexture);

    gl.useProgram(this.program!);

    // Set Uniforms
    const uBg = gl.getUniformLocation(this.program!, 'u_bg');
    const uHeight = gl.getUniformLocation(this.program!, 'u_height');
    const uGridRes = gl.getUniformLocation(this.program!, 'u_gridRes');
    const uRefr = gl.getUniformLocation(this.program!, 'u_refraction');
    const uSpec = gl.getUniformLocation(this.program!, 'u_specular');
    const uCaust = gl.getUniformLocation(this.program!, 'u_caustic');
    const uChrom = gl.getUniformLocation(this.program!, 'u_chromatic');
    const uClarity = gl.getUniformLocation(this.program!, 'u_clarity');
    const uLight = gl.getUniformLocation(this.program!, 'u_lightDir');
    const uTint = gl.getUniformLocation(this.program!, 'u_tint');
    const uSky = gl.getUniformLocation(this.program!, 'u_sky');
    const uSpecColor = gl.getUniformLocation(this.program!, 'u_specularColor');

    gl.uniform1i(uHeight, 0);
    gl.uniform1i(uBg, 1);
    gl.uniform2f(uGridRes, this.gridWidth, this.gridHeight);
    gl.uniform1f(uRefr, this.params.refractionStrength);
    gl.uniform1f(uSpec, this.params.specularIntensity);
    gl.uniform1f(uCaust, this.params.causticStrength);
    gl.uniform1f(uChrom, this.params.chromaticAberration);
    gl.uniform1f(uClarity, this.params.waterClarity);
    gl.uniform3f(uLight, this.lightDirection[0], this.lightDirection[1], this.lightDirection[2]);
    gl.uniform3f(uTint, this.tintColor[0], this.tintColor[1], this.tintColor[2]);
    gl.uniform3f(uSky, this.skyColor[0], this.skyColor[1], this.skyColor[2]);
    gl.uniform3f(uSpecColor, this.specularColor[0], this.specularColor[1], this.specularColor[2]);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private render2DFallback() {
    const ctx = this.ctx2d!;
    if (this.bgImageCanvas) {
      ctx.drawImage(this.bgImageCanvas, 0, 0, this.width, this.height);
    } else {
      ctx.fillStyle = '#0a2540';
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  public dispose() {
    if (this.gl) {
      if (this.heightTexture) this.gl.deleteTexture(this.heightTexture);
      if (this.bgTexture) this.gl.deleteTexture(this.bgTexture);
      if (this.program) this.gl.deleteProgram(this.program);
    }
  }
}
