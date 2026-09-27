(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  document.documentElement.classList.add('js');

  // Loader: 3 s poprvé, při dalším otevření v session jen krátce
  const loader = document.getElementById('loader');
  let seen = false;
  try { seen = sessionStorage.getItem('rm-loaded') === '1'; sessionStorage.setItem('rm-loaded', '1'); } catch (e) {}
  const loaderMs = reduced ? 0 : (seen ? 400 : 3000);
  document.body.classList.add('is-loading');
  setTimeout(() => {
    loader.classList.add('done');
    document.body.classList.remove('is-loading');
    startAnimations();
  }, loaderMs);

  // Nav po scrollu
  const nav = document.getElementById('nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > window.innerHeight * 0.6);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hero video: MP4 v src, nebo HLS v data-hls
  const video = document.getElementById('hero-video');
  const hls = video.dataset.hls;
  if (hls) {
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hls;
    } else {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js';
      s.onload = () => { if (window.Hls && Hls.isSupported()) { const h = new Hls(); h.loadSource(hls); h.attachMedia(video); } };
      document.head.appendChild(s);
    }
  }
  if (hls || video.getAttribute('src')) {
    video.addEventListener('playing', () => video.parentElement.classList.add('has-video'), { once: true });
  }

  // FAQ
  document.querySelectorAll('.faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
    });
  });

  // Prach v hero
  const canvas = document.getElementById('dust');
  if (canvas && !reduced) {
    const ctx = canvas.getContext('2d');
    let w, h, particles;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = isMobile ? 30 : 70;
      particles = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.4 + 0.3,
        vx: (Math.random() - 0.5) * 0.15, vy: -Math.random() * 0.25 - 0.05,
        a: Math.random() * 0.5 + 0.15,
      }));
    };
    resize();
    window.addEventListener('resize', resize);
    let visible = true;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(canvas);
    const tick = () => {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (const p of particles) {
          p.x += p.vx; p.y += p.vy;
          if (p.y < -5) { p.y = h + 5; p.x = Math.random() * w; }
          if (p.x < -5) p.x = w + 5; else if (p.x > w + 5) p.x = -5;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,255,255,${p.a})`; ctx.fill();
        }
      }
      requestAnimationFrame(tick);
    };
    tick();
  }

  function startAnimations() {
    const items = document.querySelectorAll('.reveal');
    if (reduced || !window.gsap || !window.ScrollTrigger) {
      items.forEach((el) => { el.style.opacity = 1; el.style.transform = 'none'; });
      return;
    }
    gsap.registerPlugin(ScrollTrigger);

    // Hero intro
    gsap.to('.hero .reveal', { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', stagger: 0.12 });

    // Sekce
    document.querySelectorAll('.section, .cta').forEach((section) => {
      const els = section.querySelectorAll('.reveal');
      if (!els.length) return;
      gsap.to(els, {
        opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 78%' },
      });
    });

    // Jemný parallax obrázků v postupu (jen desktop)
    if (!isMobile) {
      document.querySelectorAll('.step-img').forEach((img) => {
        gsap.fromTo(img, { yPercent: 6 }, {
          yPercent: -6, ease: 'none',
          scrollTrigger: { trigger: img, start: 'top bottom', end: 'bottom top', scrub: true },
        });
      });
    }
  }
})();
