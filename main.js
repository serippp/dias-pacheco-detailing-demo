const body = document.body;
const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const heroVideo = document.querySelector('.hero-video');
const processVideo = document.querySelector('.process-video');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let lockedScrollY = 0;

const configureVideo = (video) => {
  if (!video) return;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.loop = true;
  video.controls = false;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.removeAttribute('controls');
};

const playVideo = async (video) => {
  if (!video) return;
  configureVideo(video);
  try {
    await video.play();
  } catch {
    // O poster permanece visível quando o browser bloqueia autoplay.
  }
};

const bindVideoPoster = (video) => {
  if (!video) return;
  video.addEventListener('playing', () => video.parentElement?.classList.add('video-live'));
  video.addEventListener('error', () => video.parentElement?.classList.remove('video-live'));
};

bindVideoPoster(heroVideo);
bindVideoPoster(processVideo);

const startHero = () => playVideo(heroVideo);
document.addEventListener('DOMContentLoaded', startHero, { once: true });
window.addEventListener('pageshow', startHero);

let processPrepared = false;
let processNear = false;

const prepareProcessVideo = () => {
  if (!processVideo || processPrepared) return;
  const source = processVideo.querySelector('source[data-src]');
  if (!source) return;
  source.src = source.dataset.src;
  source.removeAttribute('data-src');
  processPrepared = true;
  processVideo.load();
  processVideo.addEventListener('canplay', () => {
    if (processNear) playVideo(processVideo);
  }, { once: true });
};

if (processVideo && 'IntersectionObserver' in window) {
  const videoObserver = new IntersectionObserver(([entry]) => {
    processNear = entry.isIntersecting;
    if (processNear) {
      prepareProcessVideo();
      if (processVideo.readyState >= 2) playVideo(processVideo);
    } else if (processPrepared && !processVideo.paused) {
      processVideo.pause();
    }
  }, { rootMargin: '500px 0px', threshold: 0.01 });
  videoObserver.observe(processVideo.parentElement);
} else if (processVideo) {
  processNear = true;
  prepareProcessVideo();
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  playVideo(heroVideo);
  if (processNear && processPrepared) playVideo(processVideo);
});

const finishLoading = () => {
  if (body.classList.contains('loaded')) return;
  body.classList.remove('is-loading');
  body.classList.add('loaded');
};

document.addEventListener('DOMContentLoaded', () => window.setTimeout(finishLoading, reducedMotion ? 0 : 620), { once: true });
window.setTimeout(finishLoading, 1000);

const setMenu = (open) => {
  menuButton?.setAttribute('aria-expanded', String(open));
  menuButton?.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
  navigation?.classList.toggle('open', open);
  navigation?.setAttribute('aria-hidden', String(!open && window.innerWidth <= 864));

  if (open) {
    lockedScrollY = window.scrollY;
    body.style.top = `-${lockedScrollY}px`;
    body.classList.add('menu-open');
  } else if (body.classList.contains('menu-open')) {
    body.classList.remove('menu-open');
    body.style.top = '';
    window.scrollTo(0, lockedScrollY);
  }
};

setMenu(false);
menuButton?.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 864 && body.classList.contains('menu-open')) setMenu(false);
});

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

document.querySelectorAll('.service-item, .faq-list details').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    const group = item.classList.contains('service-item') ? '.service-item[open]' : '.faq-list details[open]';
    document.querySelectorAll(group).forEach((other) => {
      if (other !== item) other.removeAttribute('open');
    });
  });
});

const revealItems = document.querySelectorAll('.reveal');
if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('visible'));
} else {
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -7% 0px' });
  revealItems.forEach((item) => revealObserver.observe(item));
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = new Date().getFullYear();
});
