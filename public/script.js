(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  /* Topo: fundo ao rolar + barra de progresso */
  const topbar = document.querySelector('[data-topbar]');
  const progress = document.querySelector('.progress span');
  let ticking = false;
  const onScroll = () => {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    topbar?.classList.toggle('is-scrolled', y > 20);
    progress?.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  /* Entrada das seções ao rolar */
  const revealItems = document.querySelectorAll('[data-reveal]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealItems.forEach((el) => el.classList.add('is-visible'));
  } else {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealItems.forEach((el) => revealObserver.observe(el));
  }

  /* Luz verde que segue o mouse nos cards */
  document.querySelectorAll('[data-spotlight]').forEach((card) => {
    card.addEventListener('pointermove', (event) => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
      card.style.setProperty('--my', `${event.clientY - rect.top}px`);
    });
  });

  /* Timecode do visor (25 quadros por segundo) */
  const timecode = document.querySelector('[data-timecode]');
  if (timecode && !reduceMotion) {
    const start = performance.now() - 754000; // começa em 00:12:34
    setInterval(() => {
      const ms = performance.now() - start;
      const s = Math.floor(ms / 1000);
      const frame = Math.floor(ms / 40) % 25;
      timecode.textContent = `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frame)}`;
    }, 40);
  }

  /* Vídeo do case: carrega o YouTube ao clicar (preencha data-youtube no HTML) */
  document.querySelectorAll('[data-youtube]').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.youtube.trim();
      if (!id) return;
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
      iframe.title = button.getAttribute('aria-label') || 'Vídeo da cobertura';
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
      iframe.allowFullscreen = true;
      button.replaceChildren(iframe);
      button.style.cursor = 'default';
    }, { once: false });
  });

  /* CTA fixo no celular: aparece depois da abertura e some no formulário e no rodapé */
  const stickyCta = document.querySelector('.sticky-cta');
  if (stickyCta && 'IntersectionObserver' in window) {
    const targets = [
      document.querySelector('[data-hero-cta]'),
      document.getElementById('proposta'),
      document.querySelector('.footer'),
    ].filter(Boolean);
    const visible = new Set();
    const ctaObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      stickyCta.classList.toggle('is-hidden', visible.size > 0);
    });
    targets.forEach((target) => ctaObserver.observe(target));
  } else if (stickyCta) {
    stickyCta.classList.remove('is-hidden');
  }

  const form = document.getElementById('form-proposta');
  if (!form) return;

  /* Data "a definir" */
  const dateInput = document.getElementById('data');
  const dateTbd = document.getElementById('data-tbd');
  dateTbd.addEventListener('change', () => {
    dateInput.disabled = dateTbd.checked;
    dateInput.required = !dateTbd.checked;
    if (dateTbd.checked) dateInput.value = '';
    else dateInput.focus();
  });

  /* Máscara de WhatsApp: (11) 90000-0000 */
  const phone = document.getElementById('whatsapp');
  phone.addEventListener('input', () => {
    const d = phone.value.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 2) phone.value = d.length ? `(${d}` : '';
    else if (d.length <= 6) phone.value = `(${d.slice(0, 2)}) ${d.slice(2)}`;
    else if (d.length <= 10) phone.value = `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    else phone.value = `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  });

  /* UTMs da URL para os campos ocultos */
  const params = new URLSearchParams(window.location.search);
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((key) => {
    const field = form.elements.namedItem(key);
    if (field && params.has(key)) field.value = params.get(key);
  });

  /* Envio */
  const success = document.getElementById('form-sucesso');
  const error = form.querySelector('.form__error');
  const submit = form.querySelector('[type="submit"]');
  const submitLabel = submit.querySelector('[data-submit-label]');
  const submitText = submitLabel.textContent;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    submit.disabled = true;
    submitLabel.textContent = 'Enviando…';

    try {
      const endpoint = form.dataset.endpoint;
      if (endpoint) {
        const response = await fetch(endpoint, { method: 'POST', body: new FormData(form) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
      }
      form.hidden = true;
      success.hidden = false;
      success.focus();
    } catch (err) {
      error.hidden = false;
      submit.disabled = false;
      submitLabel.textContent = submitText;
    }
  });
})();
