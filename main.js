const body = document.body;
const root = document.documentElement;
const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('.main-nav');
const preloader = document.querySelector('.preloader');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const videos = [...document.querySelectorAll('video[autoplay]')];
const heroVideo = document.querySelector('.hero-video');
const secondaryVideo = document.querySelector('.secondary-video');
let lockedScrollY = 0;
let heroRetryCount = 0;
let heroRetryTimer;
let secondaryRetryCount = 0;
let secondaryRetryTimer;
let secondaryVideoPrepared = false;
let secondaryVideoIsNear = false;

const finishLoading = () => {
  if (!preloader || preloader.classList.contains('is-hidden')) return;
  preloader.classList.add('is-hidden');
  window.setTimeout(() => preloader.remove(), 700);
};

window.addEventListener('load', () => window.setTimeout(finishLoading, reducedMotion ? 0 : 700), { once: true });
window.setTimeout(finishLoading, 2400);

const attemptPlayback = async (video) => {
  if (!video) return;

  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.autoplay = true;
  video.loop = true;
  video.controls = false;
  video.setAttribute('muted', '');
  video.setAttribute('autoplay', '');
  video.setAttribute('loop', '');
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.removeAttribute('controls');

  video.disablePictureInPicture = true;
  video.setAttribute('disablepictureinpicture', '');
  video.setAttribute('controlslist', 'nodownload nofullscreen noremoteplayback');
  video.setAttribute('x-webkit-airplay', 'deny');

  try {
    const attempt = video.play();
    if (attempt) await attempt;
    video.parentElement?.classList.remove('playback-failed');
    video.parentElement?.classList.add('is-playing');
    if (video === heroVideo) {
      heroRetryCount = 0;
      window.clearTimeout(heroRetryTimer);
    } else if (video === secondaryVideo) {
      secondaryRetryCount = 0;
      window.clearTimeout(secondaryRetryTimer);
    }
  } catch {
    const retryDelays = [180, 650, 1400];
    if (video === heroVideo && heroRetryCount < retryDelays.length) {
      window.clearTimeout(heroRetryTimer);
      heroRetryTimer = window.setTimeout(() => attemptPlayback(video), retryDelays[heroRetryCount++]);
      return;
    }
    if (video === secondaryVideo && secondaryVideoIsNear && secondaryRetryCount < retryDelays.length) {
      window.clearTimeout(secondaryRetryTimer);
      secondaryRetryTimer = window.setTimeout(() => attemptPlayback(video), retryDelays[secondaryRetryCount++]);
      return;
    }

    video.parentElement?.classList.add('playback-failed');
    video.parentElement?.classList.remove('is-playing');
  }
};

const startHeroVideo = () => attemptPlayback(heroVideo);
document.addEventListener('DOMContentLoaded', startHeroVideo, { once: true });
window.addEventListener('load', startHeroVideo, { once: true });
window.addEventListener('pageshow', () => {
  attemptPlayback(heroVideo);
  if (secondaryVideoIsNear && secondaryVideoPrepared) attemptPlayback(secondaryVideo);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  if (heroVideo?.paused) attemptPlayback(heroVideo);
  if (secondaryVideoIsNear && secondaryVideoPrepared && secondaryVideo?.paused) attemptPlayback(secondaryVideo);
});
heroVideo?.addEventListener('loadeddata', () => {
  if (heroVideo.paused) attemptPlayback(heroVideo);
}, { once: true });
heroVideo?.addEventListener('canplay', () => {
  if (heroVideo.paused) attemptPlayback(heroVideo);
}, { once: true });
videos.forEach((video) => {
  video.addEventListener('playing', () => {
    video.parentElement?.classList.remove('playback-failed');
    video.parentElement?.classList.add('is-playing');
  });
  video.addEventListener('error', () => {
    video.parentElement?.classList.add('playback-failed');
    video.parentElement?.classList.remove('is-playing');
  });
});

const prepareSecondaryVideo = () => {
  if (!secondaryVideo || secondaryVideoPrepared) return;
  const source = secondaryVideo.querySelector('source[data-src]');
  if (!source) return;
  source.src = source.dataset.src;
  source.removeAttribute('data-src');
  secondaryVideoPrepared = true;
  secondaryVideo.load();
  secondaryVideo.addEventListener('canplay', () => {
    if (secondaryVideoIsNear) attemptPlayback(secondaryVideo);
  }, { once: true });
};

if (secondaryVideo) {
  if ('IntersectionObserver' in window) {
    const secondaryVideoObserver = new IntersectionObserver(([entry]) => {
      secondaryVideoIsNear = entry.isIntersecting;
      if (secondaryVideoIsNear) {
        prepareSecondaryVideo();
        if (secondaryVideoPrepared && secondaryVideo.readyState >= 2) attemptPlayback(secondaryVideo);
      } else if (secondaryVideoPrepared && !secondaryVideo.paused) {
        secondaryVideo.pause();
      }
    }, { rootMargin: '600px 0px', threshold: 0.01 });
    secondaryVideoObserver.observe(secondaryVideo.parentElement);
  } else {
    secondaryVideoIsNear = true;
    prepareSecondaryVideo();
  }
}

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
