(function () {
  const canvas = document.getElementById('dot-grid-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width, height;
  let dots = [];

  // Konfigurasi sesuai dengan DotGrid React
  const dotSize = 5;
  const gap = 15;
  const baseColor = '#2F293A';
  const activeColor = '#5227FF'; 
  const proximity = 120;
  const shockRadius = 250;
  const shockStrength = 15; 
  
  // Fisika kustom untuk mereplikasi InertiaPlugin & Elastic secara mulus
  const springFactor = 0.08; // Kekuatan pegas untuk kembali ke asal
  const friction = 0.82;     // Gesekan, semakin rendah = semakin bouncy

  function hexToRgb(hex) {
    const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return { r: 0, g: 0, b: 0 };
    return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
  }
  const baseRgb = hexToRgb(baseColor);
  const activeRgb = hexToRgb(activeColor);

  let pointer = {
    x: -1000, y: -1000,
    vx: 0, vy: 0, speed: 0,
    lastTime: performance.now(),
    lastX: -1000, lastY: -1000,
  };

  function buildGrid() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const cell = dotSize + gap;
    const cols = Math.floor((width + gap) / cell);
    const rows = Math.floor((height + gap) / cell);

    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;
    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    dots = [];
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        dots.push({ 
          baseX: startX + x * cell, 
          baseY: startY + y * cell, 
          x: startX + x * cell, 
          y: startY + y * cell, 
          vx: 0, vy: 0 
        });
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, width, height);
    const proxSq = proximity * proximity;

    // Turunkan kecepatan kursor perlahan agar dorongan tidak tertahan saat kursor diam tiba-tiba
    pointer.speed *= 0.8;
    pointer.vx *= 0.8;
    pointer.vy *= 0.8;

    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];

      const dxPointer = dot.x - pointer.x;
      const dyPointer = dot.y - pointer.y;
      const dsq = dxPointer * dxPointer + dyPointer * dyPointer;

      // Dorongan mouse (Hover Inertia)
      if (pointer.speed > 1 && dsq < proxSq) {
        const dist = Math.sqrt(dsq) || 1;
        const falloff = 1 - (dist / proximity); 
        
        // Mendorong dot ke arah pergerakan kursor dengan mulus
        dot.vx += (pointer.vx * 0.05 * falloff);
        dot.vy += (pointer.vy * 0.05 * falloff);
      }

      // Fisika Pegas (Elastic Return)
      dot.vx += (dot.baseX - dot.x) * springFactor;
      dot.vy += (dot.baseY - dot.y) * springFactor;

      // Gesekan
      dot.vx *= friction;
      dot.vy *= friction;

      dot.x += dot.vx;
      dot.y += dot.vy;

      // Optimasi performa: jika sudah diam, paskan ke posisi asal
      if (Math.abs(dot.x - dot.baseX) < 0.1 && Math.abs(dot.y - dot.baseY) < 0.1 && Math.abs(dot.vx) < 0.1 && Math.abs(dot.vy) < 0.1) {
        dot.x = dot.baseX;
        dot.y = dot.baseY;
        dot.vx = 0;
        dot.vy = 0;
      }

      // Warna aktif berdasarkan kedekatan mouse
      let r = baseRgb.r, g = baseRgb.g, b = baseRgb.b;
      if (dsq <= proxSq) {
        const dist = Math.sqrt(dsq);
        const t = 1 - (dist / proximity);
        r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
        g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
        b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
      }

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(render);
  }

  // TANPA THROTTLE agar mouse tracking presisi dan mulus di layar 60fps/144fps
  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    const dt = Math.max(1, now - pointer.lastTime);
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const dx = mx - pointer.lastX;
    const dy = my - pointer.lastY;
    
    pointer.vx = (dx / dt) * 15; 
    pointer.vy = (dy / dt) * 15; 
    pointer.speed = Math.hypot(pointer.vx, pointer.vy);

    pointer.lastTime = now;
    pointer.lastX = mx;
    pointer.lastY = my;
    pointer.x = mx;
    pointer.y = my;
  });

  window.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i];
      const dx = dot.x - cx;
      const dy = dot.y - cy;
      const dist = Math.hypot(dx, dy);

      if (dist < shockRadius) {
        const falloff = Math.max(0, 1 - dist / shockRadius);
        // Dorongan shockwave menyebar dari pusat klik
        dot.vx += (dx / (dist || 1)) * shockStrength * falloff * 4;
        dot.vy += (dy / (dist || 1)) * shockStrength * falloff * 4;
      }
    }
  });

  window.addEventListener('resize', buildGrid);

  // Init
  buildGrid();
  render();
})();
