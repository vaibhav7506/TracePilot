"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/** Read a `--token` CSS variable (space-separated RGB) as a THREE.Color. */
function cssColor(varName: string, fallback: string): THREE.Color {
  if (typeof window === "undefined") return new THREE.Color(fallback);
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const parts = raw.split(/\s+/).map(Number);
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    const [r, g, b] = parts as [number, number, number];
    return new THREE.Color(r / 255, g / 255, b / 255);
  }
  return new THREE.Color(fallback);
}

type Node = { pos: THREE.Vector3; mesh: THREE.Mesh; neighbors: number[] };

/**
 * Signature visual: an autonomous browser agent (the ruby pulse) discovering a
 * site's route graph — hopping node to node along edges, lighting each route as
 * it's visited. Ambient, slow, and theme-aware.
 */
export default function AgentScene() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = mountRef.current;
    if (!currentContainer) return;
    const container: HTMLDivElement = currentContainer;

    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = new THREE.Scene();
    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 0, 13);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: window.devicePixelRatio <= 1.5,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Palette (re-read on theme change).
    let nodeColor = cssColor("--muted-foreground", "#9a9188");
    let edgeColor = cssColor("--border", "#302b27");
    let agentColor = cssColor("--primary", "#be3e50");

    // --- Graph layout: a loose, hand-placed route map ---------------------
    const layout: Array<[number, number, number]> = [
      [-6.2, 2.4, 0],
      [-3.6, 3.4, -1],
      [-4.2, -1.4, 0.6],
      [-1.2, 0.6, 0],
      [-0.4, -3.0, -0.8],
      [1.8, 2.8, 0.4],
      [2.4, -1.2, 0],
      [4.8, 1.0, -0.6],
      [5.4, -2.4, 0.5],
      [3.0, 4.0, -1.2],
      [-2.0, -3.6, 0.3],
    ];
    const edges: Array<[number, number]> = [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 3],
      [2, 10],
      [3, 4],
      [3, 5],
      [4, 6],
      [4, 10],
      [5, 6],
      [5, 9],
      [6, 7],
      [6, 8],
      [7, 8],
      [7, 9],
      [9, 5],
    ];

    const group = new THREE.Group();
    scene.add(group);

    const nodeGeo = new THREE.SphereGeometry(0.13, 20, 20);
    const nodes: Node[] = layout.map(([x, y, z]) => {
      const mat = new THREE.MeshBasicMaterial({ color: nodeColor });
      const mesh = new THREE.Mesh(nodeGeo, mat);
      mesh.position.set(x, y, z);
      group.add(mesh);
      return { pos: mesh.position, mesh, neighbors: [] };
    });

    for (const [a, b] of edges) {
      nodes[a]?.neighbors.push(b);
      nodes[b]?.neighbors.push(a);
    }

    // Edge lines.
    const edgePositions: number[] = [];
    for (const [a, b] of edges) {
      const na = nodes[a];
      const nb = nodes[b];
      if (!na || !nb) continue;
      edgePositions.push(na.pos.x, na.pos.y, na.pos.z, nb.pos.x, nb.pos.y, nb.pos.z);
    }
    const edgeGeo = new THREE.BufferGeometry();
    edgeGeo.setAttribute("position", new THREE.Float32BufferAttribute(edgePositions, 3));
    const edgeMat = new THREE.LineBasicMaterial({
      color: edgeColor,
      transparent: true,
      opacity: 0.5,
    });
    const edgeLines = new THREE.LineSegments(edgeGeo, edgeMat);
    group.add(edgeLines);

    // The agent + its glow halo.
    const agentGeo = new THREE.SphereGeometry(0.2, 24, 24);
    const agentMat = new THREE.MeshBasicMaterial({ color: agentColor });
    const agent = new THREE.Mesh(agentGeo, agentMat);
    group.add(agent);

    const haloGeo = new THREE.SphereGeometry(0.42, 24, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: agentColor,
      transparent: true,
      opacity: 0.18,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    agent.add(halo);

    // Expanding ring emitted when a node is visited.
    const ringGeo = new THREE.RingGeometry(0.16, 0.2, 32);
    const pulses: Array<{ mesh: THREE.Mesh; t: number }> = [];

    // --- Agent traversal state -------------------------------------------
    let fromIndex = 0;
    let toIndex = nodes[0]?.neighbors[0] ?? 1;
    let progress = 0;
    const speed = 0.55;

    function emitPulse(at: THREE.Vector3) {
      const mat = new THREE.MeshBasicMaterial({
        color: agentColor,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeo, mat);
      ring.position.copy(at);
      group.add(ring);
      pulses.push({ mesh: ring, t: 0 });
    }

    function pickNext(current: number, previous: number): number {
      const options = nodes[current]?.neighbors ?? [];
      const forward = options.filter((n) => n !== previous);
      const pool = forward.length > 0 ? forward : options;
      if (pool.length === 0) return current;
      const choice = pool[Math.floor(Math.random() * pool.length)];
      return choice ?? current;
    }

    // Pointer parallax.
    let targetRotX = 0;
    let targetRotY = 0;
    function onPointerMove(event: PointerEvent) {
      const rect = container.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      targetRotY = nx * 0.4;
      targetRotX = ny * 0.25;
    }
    if (!prefersReduced) container.addEventListener("pointermove", onPointerMove);

    const clock = new THREE.Clock();
    let raf = 0;
    let disposed = false;

    function renderStatic() {
      const start = nodes[fromIndex]?.pos ?? new THREE.Vector3();
      agent.position.copy(start);
      renderer.render(scene, camera);
    }

    function onVisibilityChange() {
      if (prefersReduced || disposed) return;
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else {
        clock.getDelta();
        animate();
      }
    }

    function animate() {
      if (disposed) return;
      raf = requestAnimationFrame(animate);
      const delta = Math.min(clock.getDelta(), 0.05);

      progress += delta * speed;
      const from = nodes[fromIndex]?.pos;
      const to = nodes[toIndex]?.pos;
      if (from && to) {
        const eased =
          progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        agent.position.lerpVectors(from, to, Math.min(eased, 1));
      }

      if (progress >= 1) {
        progress = 0;
        const previous = fromIndex;
        fromIndex = toIndex;
        toIndex = pickNext(fromIndex, previous);
        const visited = nodes[fromIndex];
        if (visited) {
          emitPulse(visited.pos);
          (visited.mesh.material as THREE.MeshBasicMaterial).color.copy(agentColor);
        }
      }

      // Fade node colors back toward the resting color.
      for (const node of nodes) {
        const mat = node.mesh.material as THREE.MeshBasicMaterial;
        mat.color.lerp(nodeColor, delta * 1.2);
      }

      // Animate + retire pulses.
      for (let i = pulses.length - 1; i >= 0; i--) {
        const pulse = pulses[i];
        if (!pulse) continue;
        pulse.t += delta * 1.6;
        const scale = 1 + pulse.t * 5;
        pulse.mesh.scale.set(scale, scale, scale);
        (pulse.mesh.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 - pulse.t * 0.7);
        pulse.mesh.lookAt(camera.position);
        if (pulse.t >= 1) {
          group.remove(pulse.mesh);
          (pulse.mesh.material as THREE.Material).dispose();
          pulses.splice(i, 1);
        }
      }

      const pulseScale = 1 + Math.sin(clock.elapsedTime * 3) * 0.12;
      halo.scale.setScalar(pulseScale);

      group.rotation.y += (targetRotY - group.rotation.y) * 0.05;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.05;
      group.rotation.y += 0.0006;

      renderer.render(scene, camera);
    }

    function applyTheme() {
      nodeColor = cssColor("--muted-foreground", "#9a9188");
      edgeColor = cssColor("--border", "#302b27");
      agentColor = cssColor("--primary", "#be3e50");
      edgeMat.color.copy(edgeColor);
      agentMat.color.copy(agentColor);
      haloMat.color.copy(agentColor);
      if (prefersReduced) renderStatic();
    }

    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    function onResize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      if (prefersReduced) renderStatic();
    }
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(container);
    document.addEventListener("visibilitychange", onVisibilityChange);

    if (prefersReduced) {
      renderStatic();
    } else {
      animate();
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      container.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      themeObserver.disconnect();
      resizeObserver.disconnect();
      renderer.dispose();
      nodeGeo.dispose();
      edgeGeo.dispose();
      agentGeo.dispose();
      haloGeo.dispose();
      ringGeo.dispose();
      edgeMat.dispose();
      agentMat.dispose();
      haloMat.dispose();
      for (const node of nodes) (node.mesh.material as THREE.Material).dispose();
      for (const pulse of pulses) (pulse.mesh.material as THREE.Material).dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="h-full w-full" aria-hidden />;
}
