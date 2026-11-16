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

  // Hero: Vimeo na pozadí. Odkryje se, až se video skutečně přehrává (jinak zůstane přechod).
  const heroMedia = document.getElementById('hero-media');
  const heroId = heroMedia && heroMedia.dataset.vimeo;
  if (heroId && !reduced) {
    const startHero = () => {
      const f = document.createElement('iframe');
      f.src = 'https://player.vimeo.com/video/' + heroId + '?background=1&muted=1&autoplay=1&loop=1&dnt=1';
      f.allow = 'autoplay; fullscreen';
      f.setAttribute('tabindex', '-1');
      f.setAttribute('aria-hidden', 'true');
      f.title = 'Video na pozadí';
      const post = (msg) => f.contentWindow && f.contentWindow.postMessage(JSON.stringify(msg), 'https://player.vimeo.com');
      const onMsg = (e) => {
        if (e.origin !== 'https://player.vimeo.com' || e.source !== f.contentWindow) return;
        let d = e.data;
        try { if (typeof d === 'string') d = JSON.parse(d); } catch (err) { return; }
        if (d.event === 'ready') post({ method: 'addEventListener', value: 'playProgress' });
        if (d.event === 'playProgress') {
          heroMedia.classList.add('has-video');
          window.removeEventListener('message', onMsg);
        }
      };
      window.addEventListener('message', onMsg);
      heroMedia.appendChild(f);
    };
    setTimeout(startHero, loaderMs);
  }

  // Ukázky: klik na kartu otevře Vimeo v přehrávači na stránce
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    const frame = lightbox.querySelector('.lightbox-frame');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    let lastFocus = null;
    const close = () => {
      if (lightbox.hidden) return;
      lightbox.hidden = true;
      frame.innerHTML = '';
      document.body.classList.remove('lightbox-open');
      if (lastFocus) lastFocus.focus();
    };
    document.querySelectorAll('.card[data-vimeo]').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        lastFocus = card;
        const f = document.createElement('iframe');
        f.src = 'https://player.vimeo.com/video/' + card.dataset.vimeo + '?autoplay=1&title=0&byline=0&portrait=0&dnt=1';
        f.allow = 'autoplay; fullscreen; picture-in-picture';
        f.allowFullscreen = true;
        f.title = card.querySelector('h3').textContent;
        frame.appendChild(f);
        lightbox.hidden = false;
        document.body.classList.add('lightbox-open');
        closeBtn.focus();
      });
    });
    closeBtn.addEventListener('click', close);
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
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
