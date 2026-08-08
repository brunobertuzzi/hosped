declare module 'three' {
  export class Scene {
    add(object: any): void;
  }
  export class PerspectiveCamera {
    constructor(fov?: number, aspect?: number, near?: number, far?: number);
    position: { set(x: number, y: number, z: number): void; x: number; y: number; z: number };
    aspect: number;
    updateProjectionMatrix(): void;
    lookAt(x: number, y: number, z: number): void;
  }
  export class WebGLRenderer {
    constructor(parameters?: any);
    domElement: HTMLCanvasElement;
    setPixelRatio(value: number): void;
    setSize(width: number, height: number): void;
    render(scene: any, camera: any): void;
    dispose(): void;
  }
  export class AmbientLight {
    constructor(color?: any, intensity?: number);
  }
  export class PointLight {
    constructor(color?: any, intensity?: number, distance?: number);
    position: { set(x: number, y: number, z: number): void; x: number; y: number; z: number };
  }
  export class BufferGeometry {
    setAttribute(name: string, attribute: any): void;
    attributes: { [key: string]: any };
    dispose(): void;
  }
  export class BufferAttribute {
    constructor(array: ArrayLike<number>, itemSize: number);
    array: ArrayLike<number>;
    needsUpdate: boolean;
  }
  export class CanvasTexture {
    constructor(canvas: HTMLCanvasElement);
  }
  export const AdditiveBlending: any;
  export class PointsMaterial {
    constructor(parameters?: any);
    dispose(): void;
  }
  export class Points {
    constructor(geometry?: any, material?: any);
    position: { y: number };
    rotation: { y: number };
  }
  export class TorusKnotGeometry {
    constructor(radius?: number, tube?: number, tubularSegments?: number, radialSegments?: number);
    dispose(): void;
  }
  export class MeshStandardMaterial {
    constructor(parameters?: any);
    dispose(): void;
  }
  export class Mesh {
    constructor(geometry?: any, material?: any);
    position: { set(x: number, y: number, z: number): void; y: number };
    rotation: { x: number; y: number; z: number };
    add(object: any): void;
  }
  export class IcosahedronGeometry {
    constructor(radius?: number, detail?: number);
    dispose(): void;
  }
  export class MeshPhysicalMaterial {
    constructor(parameters?: any);
    dispose(): void;
  }
  export class MeshBasicMaterial {
    constructor(parameters?: any);
    dispose(): void;
  }
  export class Color {
    constructor(color?: any);
    r: number;
    g: number;
    b: number;
    clone(): Color;
    lerp(color: Color, alpha: number): Color;
  }
  export class Clock {
    getElapsedTime(): number;
  }
}
