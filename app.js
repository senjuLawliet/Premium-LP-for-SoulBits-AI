/* ============================================
   SOULBITS — APP.JS
   All animations, mouse tracking, theme toggle,
   tab switching, magnetic dock, auth logic
   ============================================ */

(function() {
  'use strict';

  // ============================================
  // 1. INTERACTIVE CONSTELLATION NETWORK (Canvas)
  // ============================================
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let mouseX = 0, mouseY = 0;
  let targetX = 0, targetY = 0;
  let nodes = [];
  const NODE_COUNT = 150;
  const CONNECTION_DIST = 130;
  const MOUSE_RADIUS = 200;

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Node {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 1;
      this.vx = (Math.random() - 0.5) * 0.25;
      this.vy = (Math.random() - 0.5) * 0.25;
      this.baseOpacity = Math.random() * 0.4 + 0.15;
      this.opacity = this.baseOpacity;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;

      // Wrap around edges
      if (this.x < -20) this.x = canvas.width + 20;
      if (this.x > canvas.width + 20) this.x = -20;
      if (this.y < -20) this.y = canvas.height + 20;
      if (this.y > canvas.height + 20) this.y = -20;

      // Gentle ambient drift
      this.vx += (Math.random() - 0.5) * 0.002;
      this.vy += (Math.random() - 0.5) * 0.002;
      this.vx *= 0.995;
      this.vy *= 0.995;
    }
    reactToMouse(mx, my) {
      const dx = this.x - mx;
      const dy = this.y - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_RADIUS) {
        const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
        // Gentle push away
        if (dist > 1) {
          this.x += (dx / dist) * force * 2;
          this.y += (dy / dist) * force * 2;
        }
        this.opacity = this.baseOpacity + force * 0.6;
      } else {
        this.opacity += (this.baseOpacity - this.opacity) * 0.03;
      }
    }
  }

  for (let i = 0; i < NODE_COUNT; i++) {
    nodes.push(new Node());
  }

  // Mouse Glow DOM element
  const mouseGlow = document.getElementById('mouseGlow');

  // Track mouse
  document.addEventListener('mousemove', (e) => {
    targetX = e.clientX;
    targetY = e.clientY;
  });

  // Lerp easing
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function getThemeColors() {
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    if (isDark) {
      return {
        nodeFill: '200, 195, 220',
        lineStroke: '200, 195, 220',
        nodeOpacityBase: 0.5,
        lineOpacityBase: 0.06,
        glowRadius: 200
      };
    } else {
      return {
        nodeFill: '40, 40, 40',
        lineStroke: '40, 40, 40',
        nodeOpacityBase: 0.12,
        lineOpacityBase: 0.04,
        glowRadius: 200
      };
    }
  }

  // Main animation loop
  function animate() {
    // Smooth mouse follow with lerp
    mouseX = lerp(mouseX, targetX, 0.06);
    mouseY = lerp(mouseY, targetY, 0.06);

    // Update glow DOM element
    if (mouseGlow) {
      mouseGlow.style.transform = `translate(${mouseX - 250}px, ${mouseY - 250}px)`;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = getThemeColors();

    // Update all nodes
    for (const node of nodes) {
      node.update();
      node.reactToMouse(mouseX, mouseY);
    }

    // Draw connections between nearby nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < CONNECTION_DIST) {
          // Check if near mouse to brighten
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const mdX = midX - mouseX;
          const mdY = midY - mouseY;
          const mouseDist = Math.sqrt(mdX * mdX + mdY * mdY);

          const distFactor = 1 - dist / CONNECTION_DIST;
          let mouseFactor = 0;
          if (mouseDist < MOUSE_RADIUS) {
            mouseFactor = (1 - mouseDist / MOUSE_RADIUS) * 0.5;
          }

          const opacity = Math.min(distFactor * colors.lineOpacityBase + mouseFactor * 0.3, 0.35);
          if (opacity > 0.005) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${colors.lineStroke}, ${opacity})`;
            ctx.lineWidth = 0.5 + mouseFactor * 1.5;
            ctx.stroke();
          }
        }
      }
    }

    // Draw nodes
    for (const node of nodes) {
      const dx = node.x - mouseX;
      const dy = node.y - mouseY;
      const mouseDist = Math.sqrt(dx * dx + dy * dy);
      let mouseBright = 0;
      if (mouseDist < MOUSE_RADIUS) {
        mouseBright = (1 - mouseDist / MOUSE_RADIUS) * 0.8;
      }
      const finalOpacity = Math.min(node.opacity * colors.nodeOpacityBase + mouseBright * 0.4, 0.8);
      const finalSize = node.size + mouseBright * 2;

      // Outer glow circle for nodes near mouse
      if (mouseBright > 0.1) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, finalSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colors.nodeFill}, ${mouseBright * 0.08})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, finalSize, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${colors.nodeFill}, ${finalOpacity})`;
      ctx.fill();
    }

    requestAnimationFrame(animate);
  }

  animate();


  // ============================================
  // 2. THEME TOGGLE
  // ============================================
  const themeToggle = document.getElementById('themeToggle');
  const sunIcon = themeToggle.querySelector('.sun-icon');
  const moonIcon = themeToggle.querySelector('.moon-icon');
  const html = document.documentElement;

  function getPreferredTheme() {
    const saved = localStorage.getItem('soulbits-theme');
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function setTheme(theme) {
    html.setAttribute('data-theme', theme);
    localStorage.setItem('soulbits-theme', theme);
    if (theme === 'light') {
      sunIcon.style.display = 'none';
      moonIcon.style.display = 'block';
    } else {
      sunIcon.style.display = 'block';
      moonIcon.style.display = 'none';
    }
  }

  // Init theme
  setTheme(getPreferredTheme());

  themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem('soulbits-theme')) {
      setTheme(e.matches ? 'light' : 'dark');
    }
  });


  // ============================================
  // 3. TAB SWITCHING (Cosmic Dock)
  // ============================================
  const dockBtns = document.querySelectorAll('.dock-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  function switchTab(tabId) {
    // Hide all tabs
    tabContents.forEach(tc => tc.classList.remove('active'));

    // Show target tab
    const target = document.getElementById(`tab-${tabId}`);
    if (target) {
      target.classList.add('active');
    }

    // Update dock buttons
    dockBtns.forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector(`.dock-btn[data-tab="${tabId}"]`);
    if (activeBtn) activeBtn.classList.add('active');
  }

  dockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });


  // ============================================
  // 4. MAGNETIC DOCK (Fish-eye + Pull)
  // ============================================
  const dockContainer = document.getElementById('dockContainer');
  const dockBtnsAll = dockContainer.querySelectorAll('.dock-btn, .nav-auth-btn');

  dockContainer.addEventListener('mousemove', (e) => {
    const rect = dockContainer.getBoundingClientRect();
    const mouseRelX = e.clientX - rect.left;
    const mouseRelY = e.clientY - rect.top;
    const centerY = rect.height / 2;

    dockBtnsAll.forEach((btn, index) => {
      const btnRect = btn.getBoundingClientRect();
      const btnCenterX = btnRect.left - rect.left + btnRect.width / 2;
      const btnCenterY = btnRect.top - rect.top + btnRect.height / 2;
      const dx = mouseRelX - btnCenterX;
      const dy = mouseRelY - btnCenterY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Magnetic pull
      const pullRadius = 160;
      if (dist < pullRadius) {
        const strength = (1 - dist / pullRadius) * 0.3;
        const moveX = dx * strength;
        const moveY = dy * strength;
        btn.style.transform = `translate(${moveX}px, ${moveY}px)`;
      } else {
        btn.style.transform = 'translate(0, 0)';
      }

      // Fish-eye scaling
      const fishEyeRadius = 200;
      let scale = 1;
      if (dist < fishEyeRadius) {
        const factor = 1 - dist / fishEyeRadius;
        scale = 1 + factor * 0.15;
      }
      btn.style.setProperty('--dock-scale', scale);
      // Apply scale using transform if not being magnetically pulled
      if (dist >= pullRadius) {
        btn.style.transform = `scale(${scale})`;
      } else {
        // Already being translated, combine
        const pullStrength = (1 - dist / pullRadius) * 0.3;
        const moveX = dx * pullStrength;
        const moveY = dy * pullStrength;
        btn.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
      }
    });
  });

  dockContainer.addEventListener('mouseleave', () => {
    dockBtnsAll.forEach(btn => {
      btn.style.transform = 'scale(1) translate(0, 0)';
    });
  });


  // ============================================
  // 5. INTERSECTION OBSERVER (Reveal Animations)
  // ============================================
  const revealElements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  revealElements.forEach(el => observer.observe(el));


  // ============================================
  // 6. AUTH MODAL
  // ============================================
  const authBtn = document.getElementById('authBtn');
  const authOverlay = document.getElementById('authOverlay');
  const authSignIn = document.getElementById('authSignIn');
  const authSignUp = document.getElementById('authSignUp');

  window.switchAuthState = function(state) {
    if (state === 'signup') {
      authSignIn.style.display = 'none';
      authSignUp.style.display = 'block';
    } else {
      authSignIn.style.display = 'block';
      authSignUp.style.display = 'none';
    }
  };

  authBtn.addEventListener('click', () => {
    authOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  });

  authOverlay.addEventListener('click', (e) => {
    if (e.target === authOverlay) {
      closeAuth();
    }
  });

  function closeAuth() {
    authOverlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && authOverlay.classList.contains('open')) {
      closeAuth();
    }
  });


  // ============================================
  // 7. PASSWORD TOGGLE
  // ============================================
  window.togglePassword = function(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
    input.setAttribute('type', type);

    // Toggle eye icon
    const svg = btn.querySelector('svg');
    if (type === 'text') {
      svg.innerHTML = `
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
      `;
    } else {
      svg.innerHTML = `
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      `;
    }
  };


  // ============================================
  // 8. PRICING TOGGLE (Monthly / Yearly)
  // ============================================
  const pricingToggle = document.getElementById('pricingToggle');
  const toggleLabels = document.querySelectorAll('.toggle-label');

  if (pricingToggle) {
    pricingToggle.addEventListener('click', () => {
      pricingToggle.classList.toggle('yearly');
      const isYearly = pricingToggle.classList.contains('yearly');

      toggleLabels.forEach(label => {
        const period = label.getAttribute('data-period');
        if (isYearly && period === 'yearly') {
          label.classList.add('active');
        } else if (!isYearly && period === 'monthly') {
          label.classList.add('active');
        } else {
          label.classList.remove('active');
        }
      });

      // Update prices
      const priceLight = document.getElementById('price-light');
      if (priceLight) {
        priceLight.textContent = isYearly ? '$0' : '$0';
      }
    });

    toggleLabels.forEach(label => {
      label.addEventListener('click', () => {
        const period = label.getAttribute('data-period');
        if (period === 'yearly') {
          pricingToggle.classList.add('yearly');
        } else {
          pricingToggle.classList.remove('yearly');
        }

        toggleLabels.forEach(l => l.classList.remove('active'));
        label.classList.add('active');

        const priceLight = document.getElementById('price-light');
        if (priceLight) {
          priceLight.textContent = period === 'yearly' ? '$0' : '$0';
        }
      });
    });
  }


  // ============================================
  // 9. MODEL FILTERING (Cloud tab)
  // ============================================
  const filterChips = document.querySelectorAll('.filter-chip');
  const modelCards = document.querySelectorAll('.model-card');

  if (filterChips.length > 0) {
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        // Update active chip
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const filter = chip.getAttribute('data-filter');

        modelCards.forEach(card => {
          if (filter === 'all') {
            card.style.display = '';
          } else {
            const category = card.getAttribute('data-category');
            if (category === filter) {
              card.style.display = '';
            } else {
              card.style.display = 'none';
            }
          }
        });

        // Update model count
        const visibleCount = document.querySelectorAll('.model-card[style*="display: none"]').length === modelCards.length && filter !== 'all'
          ? 0
          : filter === 'all'
            ? modelCards.length
            : document.querySelectorAll(`.model-card[data-category="${filter}"]`).length;

        const countEl = document.querySelector('.model-count');
        if (countEl) {
          countEl.textContent = `${visibleCount} models`;
        }
      });
    });
  }


  // ============================================
  // 10. RATE LIMIT SELECTOR
  // ============================================
  const rateOptions = document.querySelectorAll('.rate-option');

  rateOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      rateOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
  });


  // ============================================
  // 11. DOC CARD HOVER GLOW (handled by CSS)
  // ============================================

  // ============================================
  // 12. STAR DUST TRAIL (Light Blue Neon Particles)
  // ============================================
  const stardustCanvas = document.getElementById('stardust-canvas');
  const sdCtx = stardustCanvas.getContext('2d');
  let sdParticles = [];

  function resizeStardust() {
    stardustCanvas.width = window.innerWidth;
    stardustCanvas.height = window.innerHeight;
  }
  resizeStardust();
  window.addEventListener('resize', resizeStardust);

  // Track mouse for stardust (reuse targetX/targetY from main loop)
  let sdMouseX = 0, sdMouseY = 0;
  document.addEventListener('mousemove', (e) => {
    sdMouseX = e.clientX;
    sdMouseY = e.clientY;
  });

  class StarDust {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 1.2;
      this.speedY = (Math.random() - 0.5) * 1.2 - 0.5; // slight upward drift
      this.life = 1;
      this.decay = Math.random() * 0.015 + 0.008;
      this.sparkle = Math.random() * 0.5 + 0.5;
      this.rotation = Math.random() * Math.PI * 2;
      this.shape = Math.random() > 0.6 ? 'star' : 'circle'; // mix of stars and circles
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;
      this.speedX *= 0.98;
      this.speedY *= 0.98;
      this.life -= this.decay;
      this.size *= 0.995;
      this.rotation += 0.02;
    }
    draw(ctx) {
      if (this.life <= 0) return;
      const alpha = this.life * this.sparkle;
      // Neon cyan / light blue glow
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);

      // Outer glow
      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.size * 4);
      gradient.addColorStop(0, `rgba(0, 210, 255, ${alpha * 0.6})`);
      gradient.addColorStop(0.5, `rgba(0, 210, 255, ${alpha * 0.2})`);
      gradient.addColorStop(1, `rgba(0, 210, 255, 0)`);

      ctx.beginPath();
      ctx.arc(0, 0, this.size * 4, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Core particle
      ctx.beginPath();
      if (this.shape === 'star') {
        // 4-point star
        for (let i = 0; i < 8; i++) {
          const angle = (i * Math.PI) / 4;
          const r = i % 2 === 0 ? this.size : this.size * 0.4;
          const px = Math.cos(angle) * r;
          const py = Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else {
        ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      }

      ctx.fillStyle = `rgba(0, 210, 255, ${alpha * 0.9})`;
      ctx.fill();

      // Bright core
      ctx.beginPath();
      ctx.arc(0, 0, this.size * 0.4, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
      ctx.fill();

      ctx.restore();
    }
  }

  let spawnCounter = 0;
  function animateStardust() {
    sdCtx.clearRect(0, 0, stardustCanvas.width, stardustCanvas.height);

    // Spawn new particles at cursor position
    spawnCounter++;
    const spawnRate = 3; // particles per frame
    if (sdMouseX > 0 && sdMouseY > 0) {
      for (let i = 0; i < spawnRate; i++) {
        const offsetX = (Math.random() - 0.5) * 6;
        const offsetY = (Math.random() - 0.5) * 6;
        sdParticles.push(new StarDust(sdMouseX + offsetX, sdMouseY + offsetY));
      }
    }

    // Update and draw
    for (let i = sdParticles.length - 1; i >= 0; i--) {
      const p = sdParticles[i];
      p.update();
      if (p.life <= 0 || p.size < 0.1) {
        sdParticles.splice(i, 1);
        continue;
      }
      p.draw(sdCtx);
    }

    // Limit particle count
    if (sdParticles.length > 500) {
      sdParticles.splice(0, sdParticles.length - 500);
    }

    requestAnimationFrame(animateStardust);
  }

  animateStardust();


  // ============================================
  // 13. "GET STARTED FREE" → OPENS AUTH MODAL
  // ============================================
  const getStartedBtns = document.querySelectorAll('.btn-primary');
  getStartedBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      authOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    });
  });


  // ============================================
  // 14. SMOOTH DOCK SCROLL ON MOBILE
  // ============================================
  const cosmicDock = document.getElementById('cosmicDock');
  if (cosmicDock && 'ontouchstart' in window) {
    let isScrolling = false;
    let startX, scrollLeft;

    cosmicDock.addEventListener('touchstart', (e) => {
      isScrolling = true;
      startX = e.touches[0].pageX - cosmicDock.offsetLeft;
      scrollLeft = cosmicDock.scrollLeft;
    });

    cosmicDock.addEventListener('touchmove', (e) => {
      if (!isScrolling) return;
      const x = e.touches[0].pageX - cosmicDock.offsetLeft;
      const walk = (x - startX) * 2;
      cosmicDock.scrollLeft = scrollLeft - walk;
    });

    cosmicDock.addEventListener('touchend', () => {
      isScrolling = false;
    });
  }

})();
