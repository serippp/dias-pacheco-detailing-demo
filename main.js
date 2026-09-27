const body = document.body;
const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const preloader = document.querySelector('.preloader');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const videos = [...document.querySelectorAll('video[autoplay]')];
let lockedScrollY = 0;

const finishLoading = () => {
  if (!preloader || preloader.classList.contains('is-hidden')) return;
  preloader.classList.add('is-hidden');
  window.setTimeout(() => preloader.remove(), 700);
};

window.addEventListener('load', () => window.setTimeout(finishLoading, reducedMotion ? 0 : 700), { once: true });
window.setTimeout(finishLoading, 2400);

const attemptPlayback = async (video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');

  try {
    const attempt = video.play();
    if (attempt) await attempt;
    video.parentElement?.classList.remove('playback-failed');
  } catch {
    video.parentElement?.classList.add('playback-failed');
    const holdFirstFrame = () => {
      try {
        video.currentTime = Math.min(.05, Number.isFinite(video.duration) ? video.duration : .05);
      } catch {
        // O fundo escuro do contentor mantém o fallback limpo se o seek for bloqueado.
      }
    };
    if (video.readyState >= 1) holdFirstFrame();
    else video.addEventListener('loadedmetadata', holdFirstFrame, { once: true });
  }
};

const startVideos = () => videos.forEach(attemptPlayback);
document.addEventListener('DOMContentLoaded', startVideos, { once: true });
window.addEventListener('load', startVideos, { once: true });
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) videos.filter((video) => video.paused).forEach(attemptPlayback);
});
videos.forEach((video) => {
  video.addEventListener('playing', () => video.parentElement?.classList.remove('playback-failed'));
  video.addEventListener('error', () => video.parentElement?.classList.add('playback-failed'));
});

const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 24);
updateHeader();
window.addEventListener('scroll', updateHeader, { passive: true });

const lockPageScroll = () => {
  lockedScrollY = window.scrollY;
  body.style.top = `-${lockedScrollY}px`;
  root.classList.add('menu-open');
  body.classList.add('menu-open');
};

const unlockPageScroll = () => {
  if (!body.classList.contains('menu-open')) return;
  root.classList.remove('menu-open');
  body.classList.remove('menu-open');
  body.style.top = '';
  window.scrollTo(0, lockedScrollY);
};

const closeMenu = () => {
  navigation?.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir menu');
  unlockPageScroll();
};

menuButton?.addEventListener('click', () => {
  const opening = menuButton.getAttribute('aria-expanded') !== 'true';
  navigation?.classList.toggle('open', opening);
  menuButton.setAttribute('aria-expanded', String(opening));
  menuButton.setAttribute('aria-label', opening ? 'Fechar menu' : 'Abrir menu');
  if (opening) lockPageScroll();
  else unlockPageScroll();
});

navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 992 && navigation?.classList.contains('open')) closeMenu();
});

document.querySelectorAll('.service-list details').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.service-list details[open]').forEach((other) => {
      if (other !== item) other.removeAttribute('open');
    });
  });
});

document.querySelectorAll('.faq-list details').forEach((item) => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-list details[open]').forEach((other) => {
      if (other !== item) other.removeAttribute('open');
    });
  });
});

const revealItems = document.querySelectorAll('.reveal:not(.visible)');
if (reducedMotion || !('IntersectionObserver' in window)) {
  revealItems.forEach((item) => item.classList.add('visible'));
} else {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  revealItems.forEach((item) => observer.observe(item));
}

document.querySelectorAll('[data-year]').forEach((item) => {
  item.textContent = new Date().getFullYear();
});
