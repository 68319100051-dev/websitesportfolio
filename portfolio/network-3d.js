const body = document.body;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const stage = document.querySelector('.network-3d-stage');
if (stage && body.classList.contains('portfolio-v2') && !reduced.matches) {
  let renderer;
  let canvas;
  try {
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js');
    canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { alpha: true, antialias: window.innerWidth > 700 });
    if (!context) throw new Error('WebGL2 unavailable');
    canvas.className = 'network-3d-scene';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.tabIndex = -1;
    stage.prepend(canvas);
    renderer = new THREE.WebGLRenderer({
      canvas, context, alpha: true, antialias: window.innerWidth > 700,
      powerPreference: 'low-power'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.z = 7.3;
    const rig = new THREE.Group();
    scene.add(rig);

    const ambient = new THREE.AmbientLight(0x5c90b5, 1.0);
    const key = new THREE.PointLight(0x63ffe0, 48, 12);
    const fill = new THREE.PointLight(0x7779ff, 35, 12);
    key.position.set(2.5, 2.6, 3.4);
    fill.position.set(-2.8, -1.4, 2.2);
    scene.add(ambient, key, fill);

    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.03, 1),
      new THREE.MeshStandardMaterial({
        color: 0x12384a, metalness: 0.72, roughness: 0.22,
        emissive: 0x0b7e77, emissiveIntensity: 0.28,
        flatShading: true
      })
    );
    rig.add(core);
    const coreEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(core.geometry),
      new THREE.LineBasicMaterial({ color: 0x7cfce5, transparent: true, opacity: 0.68 })
    );
    core.add(coreEdges);

    const inner = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.42, 1),
      new THREE.MeshBasicMaterial({ color: 0x6dfce0, transparent: true, opacity: 0.18 })
    );
    rig.add(inner);

    const rings = [];
    [
      { radius: 1.75, color: 0x59eacb, x: 0.58, y: 0.18 },
      { radius: 2.02, color: 0x8a9eff, x: -0.64, y: 0.76 },
      { radius: 2.23, color: 0x3b9fbc, x: 1.10, y: -0.32 }
    ].forEach(spec => {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(spec.radius, 0.012, 6, 96),
        new THREE.MeshBasicMaterial({ color: spec.color, transparent: true, opacity: 0.54 })
      );
      ring.rotation.set(spec.x, spec.y, 0);
      rig.add(ring);
      rings.push(ring);
    });

    const isMobile = window.innerWidth < 700;
    const count = isMobile ? 10 : 18;
    const nodes = [];
    const points = [];
    const nodeGeometry = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const nodeMaterials = [
      new THREE.MeshStandardMaterial({ color: 0x6af5df, metalness: 0.4, roughness: 0.27, emissive: 0x0e7b72, emissiveIntensity: 0.7 }),
      new THREE.MeshStandardMaterial({ color: 0x9baaff, metalness: 0.38, roughness: 0.3, emissive: 0x363985, emissiveIntensity: 0.55 })
    ];
    for (let index = 0; index < count; index++) {
      const angle = index * 2.39996323;
      const y = 1 - (index + 0.5) * 2 / count;
      const radius = Math.sqrt(1 - y * y) * 2.12;
      const position = new THREE.Vector3(
        Math.cos(angle) * radius,
        y * 1.84,
        Math.sin(angle) * radius
      );
      const node = new THREE.Mesh(nodeGeometry, nodeMaterials[index % 2]);
      node.position.copy(position);
      node.scale.setScalar(index % 5 === 0 ? 1.5 : 1);
      rig.add(node);
      nodes.push(node);
      points.push(position);
    }

    const links = [];
    points.forEach((point, index) => {
      const nearest = points.map((other, otherIndex) => ({
        otherIndex,
        distance: point.distanceToSquared(other)
      })).filter(item => item.otherIndex !== index)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 2);
      nearest.forEach(item => {
        if (item.otherIndex > index) links.push(point, points[item.otherIndex]);
      });
    });
    const linkMesh = new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(links),
      new THREE.LineBasicMaterial({ color: 0x6ad5d6, transparent: true, opacity: 0.31 })
    );
    rig.add(linkMesh);

    const dustPositions = new Float32Array((isMobile ? 32 : 64) * 3);
    for (let i = 0; i < dustPositions.length; i += 3) {
      const angle = i * 2.39996323;
      const radius = 2.6 + ((i * 7) % 13) / 13;
      dustPositions[i] = Math.cos(angle) * radius;
      dustPositions[i + 1] = Math.sin(angle * 1.7) * 2.4;
      dustPositions[i + 2] = Math.sin(angle) * radius * 0.7;
    }
    const dustGeometry = new THREE.BufferGeometry();
    dustGeometry.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dust = new THREE.Points(
      dustGeometry,
      new THREE.PointsMaterial({
        color: 0xb2fff0, size: 0.035, sizeAttenuation: true,
        transparent: true, opacity: 0.55, depthWrite: false
      })
    );
    rig.add(dust);

    const pointer = { x: 0, y: 0 };
    const home = stage.classList.contains('network-3d-stage');
    const resize = () => {
      const width = Math.max(stage.clientWidth, 1);
      const height = Math.max(stage.clientHeight, 1);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      rig.position.x = home && width > 700 ? 1.85 : (width > 900 ? 1.35 : 0);
      rig.position.y = home && width < 700 ? -0.55 : 0;
      rig.scale.setScalar(width < 700 ? (home ? 0.64 : 0.56) : Math.min(home ? 1.0 : 0.75, height / 550));
    };
    resize();
    window.addEventListener('resize', resize, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      window.addEventListener('pointermove', event => {
        pointer.x = (event.clientX / Math.max(window.innerWidth, 1) - 0.5) * 2;
        pointer.y = (event.clientY / Math.max(window.innerHeight, 1) - 0.5) * 2;
      }, { passive: true });
    }

    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0]?.isIntersecting ?? true;
      }, { rootMargin: '100px' }).observe(stage);
    }
    let lastFrame = 0;
    renderer.setAnimationLoop(time => {
      if (document.hidden || reduced.matches || !visible) return;
      if (time - lastFrame < (isMobile ? 33 : 22)) return;
      lastFrame = time;
      const seconds = time * 0.001;
      rig.rotation.y = seconds * 0.12 + pointer.x * 0.14;
      rig.rotation.x = Math.sin(seconds * 0.22) * 0.13 - pointer.y * 0.09;
      core.rotation.y = seconds * -0.18;
      core.rotation.z = seconds * 0.07;
      inner.rotation.y = seconds * 0.31;
      rings[0].rotation.z = seconds * 0.13;
      rings[1].rotation.z = seconds * -0.11;
      rings[2].rotation.y = -0.32 + seconds * 0.08;
      nodes.forEach((node, index) => {
        node.rotation.y = seconds * 0.42 + index;
        node.rotation.x = seconds * 0.25;
      });
      key.position.x = Math.cos(seconds * 0.65) * 2.8;
      key.position.y = Math.sin(seconds * 0.45) * 2.1;
      fill.position.y = Math.cos(seconds * 0.6) * 2.5;
      renderer.render(scene, camera);
    });
    body.classList.add('network-3d-active');
    document.dispatchEvent(new Event('network3dchange'));
    canvas.addEventListener('webglcontextlost', () => {
      body.classList.remove('network-3d-active');
      document.dispatchEvent(new Event('network3dchange'));
      renderer.setAnimationLoop(null);
    }, { once: true });
    reduced.addEventListener('change', event => {
      if (event.matches) {
        body.classList.remove('network-3d-active');
        document.dispatchEvent(new Event('network3dchange'));
        canvas.hidden = true;
      } else {
        canvas.hidden = false;
        body.classList.add('network-3d-active');
        document.dispatchEvent(new Event('network3dchange'));
      }
    });
  } catch {
    body.classList.remove('network-3d-active');
    document.dispatchEvent(new Event('network3dchange'));
    if (renderer) renderer.dispose();
    canvas?.remove();
  }
}
