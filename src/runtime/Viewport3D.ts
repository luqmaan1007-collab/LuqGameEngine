import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export type Scene3DNode = {
  id?: string;
  name: string;
  kind: string;
  position?: { x?: number; y?: number; z?: number };
  scale?: { x?: number; y?: number; z?: number };
  color?: string;
  active?: boolean;
};

export class Viewport3D {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(55, 1, 0.1, 2000);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly controls: OrbitControls;
  private readonly content = new THREE.Group();
  private readonly meshes = new Map<string, THREE.Object3D>();
  private frame = 0;
  private readonly resizeObserver: ResizeObserver;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.scene.background = new THREE.Color('#101827');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.camera.position.set(8, 7, 10);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0.8, 0);
    this.scene.add(new THREE.HemisphereLight(0xc9ddff, 0x263247, 2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(6, 12, 8);
    sun.castShadow = true;
    this.scene.add(sun);
    this.scene.add(new THREE.GridHelper(100, 100, 0x526b8b, 0x26384e));
    this.scene.add(new THREE.AxesHelper(2));
    this.scene.add(this.content);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    window.addEventListener('resize', this.resize);
    this.resize();
    this.animate();
  }

  private resize = (): void => {
    const parent = this.canvas.parentElement ?? this.canvas;
    const width = Math.max(1, parent.clientWidth);
    const height = Math.max(1, parent.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  };

  private animate = (): void => {
    this.frame = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  addPrimitive(node: Scene3DNode): void {
    const geometry = this.geometry(node.kind);
    if (!geometry) return;
    const material = new THREE.MeshStandardMaterial({
      color: node.color ?? '#6da7ff',
      roughness: 0.72,
      metalness: 0.04
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = node.name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    const p = node.position ?? {};
    const s = node.scale ?? {};
    mesh.position.set(p.x ?? 0, p.y ?? 0.5, p.z ?? 0);
    mesh.scale.set(s.x ?? 1, s.y ?? 1, s.z ?? 1);
    mesh.userData.nodeId = node.id ?? crypto.randomUUID();
    mesh.userData.kind = node.kind;
    this.content.add(mesh);
    this.meshes.set(String(mesh.userData.nodeId), mesh);
  }

  loadNodes(nodes: Scene3DNode[]): void {
    this.clear();
    for (const node of nodes.slice(0, 3000)) {
      if (node.active === false) continue;
      this.addPrimitive(node);
    }
    this.controls.target.set(0, 0, 0);
  }

  clear(): void {
    for (const child of [...this.content.children]) {
      this.content.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        const material = child.material;
        if (Array.isArray(material)) material.forEach(item => item.dispose());
        else material.dispose();
      }
    }
    this.meshes.clear();
  }

  listNodes(): Scene3DNode[] {
    return [...this.meshes.values()].map(mesh => ({
      id: String(mesh.userData.nodeId),
      name: mesh.name,
      kind: String(mesh.userData.kind),
      position: { x: mesh.position.x, y: mesh.position.y, z: mesh.position.z },
      scale: { x: mesh.scale.x, y: mesh.scale.y, z: mesh.scale.z },
      color: '#' + (mesh.material as THREE.MeshStandardMaterial).color.getHexString(),
      active: true
    }));
  }

  dispose(): void {
    cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    window.removeEventListener('resize', this.resize);
    this.controls.dispose();
    this.clear();
    this.renderer.dispose();
  }

  private geometry(kind: string): THREE.BufferGeometry | undefined {
    switch (kind) {
      case 'box': return new THREE.BoxGeometry(1, 1, 1);
      case 'sphere': return new THREE.SphereGeometry(0.5, 24, 16);
      case 'cylinder': return new THREE.CylinderGeometry(0.5, 0.5, 1, 24);
      case 'plane': return new THREE.BoxGeometry(1, 0.05, 1);
      case 'sprite':
      case 'rect2d': return new THREE.PlaneGeometry(1, 1);
      default: return undefined;
    }
  }
}
