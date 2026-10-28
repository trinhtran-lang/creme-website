/* CRÈME — scroll-controlled background video (Phase B).
 *
 * The video never free-runs: its currentTime is derived from vertical scroll position.
 * Scrolling down advances, scrolling up reverses, and stopping holds the frame.
 * The still assets/hero/hero-bg.jpg (on .page-bg) stays visible until the first frame is
 * ready, and remains the background if the video fails or reduced motion is requested.
 */
(() => {
  'use strict';

  /* ======================================================================
   * TIMING — edit here to retime the animation against the page.
   *
   * Each anchor pins a video time (seconds) to a scroll position; scroll between
   * anchors is mapped linearly. Anchors are measured from live page geometry, so
   * they follow layout changes at any viewport size.
   *   'start'   → top of the page (scrollY = 0)
   *   '#id'     → scroll position where that section's top sits just under the nav
   *               (the same place the nav links land)
   *   'end'     → bottom of the page (maximum scroll)
   * time: 'end' means the last frame of the video.
   *
   * Source timeline (Hero_Animation_Video.mp4, 8.2 s @ 30 fps):
   *   0–4.5 s  orbit and close-up of the laminated layers
   *   ~5 s     whole croissant again
   *   5.5–6.5 s croissant separates
   *   7–8.2 s  custard pull / reveal
   * ====================================================================== */
  const TIMELINE = [
    { anchor: 'start',      time: 0 },    // clean hero: the floating croissant
    { anchor: '#filling',   time: 2.2 },  // orbit into the close-up while the products arrive
    { anchor: '#wholesale', time: 5.2 },  // whole croissant; separation starts with wholesale/events
    { anchor: '#about',     time: 6.8 },  // custard starts to stretch as About CRÈME arrives
    { anchor: 'end',        time: 'end' } // final frame only at the very bottom of the page
  ];

  /* Derived all-intra (every frame a keyframe) H.264 copies made from the original by
   * tools/encode-scrub-video.swift. The original Hero_Animation_Video.mp4 is kept untouched;
   * it has a keyframe only every ~30 frames, which makes reverse scrubbing stutter. */
  const SOURCES = {
    small: 'assets/video/hero-scrub-720.mp4',
    large: 'assets/video/hero-scrub-1080.mp4'
  };
  const LARGE_MIN_PIXELS = 1400; // use 1080p when viewport width × devicePixelRatio exceeds this
  const FPS = 30;
  const SMOOTHING = 0.22;        // 0–1 share of the remaining distance covered per animation frame; 1 = no easing
  const LOAD_TIMEOUT_MS = 15000; // give up and keep the still image if metadata never arrives

  const video = document.getElementById('bgVideo');
  if (!video) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) { video.remove(); return; } // the still image is the reduced-motion experience

  let duration = 0;
  let anchors = [];     // [{ y, t }] in scroll pixels → seconds, monotonic
  let target = 0;       // time wanted by the current scroll position
  let shown = 0;        // eased time we are moving toward the target
  let lastSought = -1;  // last time we asked the decoder for
  let rafId = 0;
  let ready = false;
  let failed = false;

  const halfFrame = 0.5 / FPS;
  const quantize = (t) => Math.round(t * FPS) / FPS;
  const lastFrameTime = () => Math.max(0, duration - 1 / FPS);

  /* ---------- Scroll → time mapping ---------- */
  function navOffset() {
    return parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  }

  function measure() {
    const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const offset = navOffset();
    let prevY = 0;
    let prevT = 0;
    anchors = TIMELINE.map(({ anchor, time }) => {
      let y;
      if (anchor === 'start') y = 0;
      else if (anchor === 'end') y = maxScroll;
      else {
        const el = document.querySelector(anchor);
        y = el ? el.getBoundingClientRect().top + window.scrollY - offset : prevY;
      }
      const t = time === 'end' ? lastFrameTime() : Math.min(time, lastFrameTime());
      // Keep both axes monotonic so the mapping can never jump backwards
      y = Math.min(Math.max(y, prevY), maxScroll);
      prevY = y;
      prevT = Math.max(t, prevT);
      return { y, t: prevT };
    });
  }

  function timeForScroll(y) {
    if (!anchors.length) return 0;
    if (y <= anchors[0].y) return anchors[0].t;
    for (let i = 1; i < anchors.length; i++) {
      const a = anchors[i - 1];
      const b = anchors[i];
      if (y <= b.y) {
        const span = b.y - a.y;
        return span <= 0 ? b.t : a.t + ((y - a.y) / span) * (b.t - a.t);
      }
    }
    return anchors[anchors.length - 1].t;
  }

  /* ---------- Seeking ---------- */
  // One seek in flight at a time; the next is issued from 'seeked' or the next frame.
  function step() {
    rafId = 0;
    if (failed || !duration) return;

    shown += (target - shown) * SMOOTHING;
    if (Math.abs(target - shown) < halfFrame) shown = target;

    const want = quantize(shown);
    if (!video.seeking && Math.abs(want - lastSought) >= halfFrame) {
      lastSought = want;
      video.currentTime = want;
    }
    if (shown !== target || video.seeking) rafId = requestAnimationFrame(step);
  }

  function schedule() {
    if (!rafId) rafId = requestAnimationFrame(step);
  }

  function onScroll() {
    if (!duration) return;
    target = timeForScroll(window.scrollY);
    schedule();
  }

  // Jump straight to the right frame (first load, resize, page restore) without easing
  function syncNow() {
    if (!duration) return;
    measure();
    target = shown = timeForScroll(window.scrollY);
    lastSought = -1;
    schedule();
  }

  /* ---------- Lifecycle ---------- */
  function fail() {
    if (failed) return;
    failed = true;
    cancelAnimationFrame(rafId);
    video.classList.remove('is-ready');
    video.removeAttribute('src');
    video.load(); // release the network request; the still image stays visible
  }

  function pickSource() {
    const px = window.innerWidth * (window.devicePixelRatio || 1);
    return px > LARGE_MIN_PIXELS ? SOURCES.large : SOURCES.small;
  }

  function init() {
    const timeout = setTimeout(() => { if (!duration) fail(); }, LOAD_TIMEOUT_MS);

    video.addEventListener('loadedmetadata', () => {
      clearTimeout(timeout);
      if (!Number.isFinite(video.duration) || video.duration <= 0) { fail(); return; }
      duration = video.duration;
      // Some mobile browsers only decode frames after a play() call; prime once, then hold.
      const primed = video.play();
      if (primed && primed.then) primed.then(() => { video.pause(); syncNow(); }, syncNow);
      else { video.pause(); syncNow(); }
    });

    video.addEventListener('seeked', () => {
      if (!ready && !failed) {
        ready = true;
        video.classList.add('is-ready');
      }
      schedule(); // continue toward the latest target if scrolling moved on
    });

    // Never let the background run on its own (media keys, OS controls, autoplay policies)
    video.addEventListener('play', () => { if (duration) video.pause(); });
    video.addEventListener('ended', () => video.pause());
    video.addEventListener('error', fail);

    window.addEventListener('scroll', onScroll, { passive: true });

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(syncNow, 120);
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    // Section heights change as product images and fonts load
    if ('ResizeObserver' in window) new ResizeObserver(onResize).observe(document.body);

    // Back/forward cache restore and returning to the tab: re-pin the frame to the scroll position
    window.addEventListener('pageshow', (e) => { if (e.persisted) syncNow(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) syncNow(); });

    reducedMotion.addEventListener?.('change', (e) => { if (e.matches) { fail(); video.remove(); } });

    video.preload = 'auto';
    video.src = pickSource();
    video.load();
  }

  init();
})();
