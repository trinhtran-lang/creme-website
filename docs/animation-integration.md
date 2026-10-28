# CRÈME — Later Video Integration (Phase B only)

**Do not implement this document during the initial website build.** This file is preparation for a subsequent user instruction after a generated MP4 is added to `assets/video/`.

## Goal
Replace the fixed still-image background with one fixed full-screen cinematic **video** layer, preserving the same nav and all storefront overlay behavior. The video should not autoplay through time: its visible frame must depend on **page scroll position**. Scrolling down advances, scrolling up reverses, and stopping holds the corresponding video time. Continue using the still `hero-bg.jpg` as poster/fallback, particularly for reduced-motion.

## Suggested robust approach
1. First inspect the user's actual video (duration, dimensions, codec, first/last frame) and test browser seeking.
2. Keep an accessible fallback and `muted`, `playsinline`, `preload` appropriately.
3. Derive a normalized scroll progress from actual page geometry. Map scroll positions to `video.currentTime` with monotonic segment calibration so reveals align with sections. Avoid free-running playback.
4. Keep scroll seeks from overwhelming the decoder; consider web-optimized intraframe or short-GOP encode only after measured testing and with permission to transform a working copy.
5. Test reverse scrolling, pause/hold, navigation links, resize, mobile browser policies, and interactions when cart/modal locks page scroll.
6. Keep hero/video bright. Use **localized darker panels**, not a full-viewport color filter. Retain hover clearance and opacity values from `docs/brand-kit.md`.
7. Run regression for carousel, ingredients modal, basket pickup/delivery threshold, wholesale/event forms, About and all section entrance animations.

## Media generation is separate
Higgsfield, Google Flow or CapCut are possible sources. Do not assert that a connector automatically downloads an MP4 into the local workspace: verify the actual output path and manually obtain the file if necessary. Video generation/connector setup is not part of Phase A or the automatic Phase B coding task unless explicitly requested.
