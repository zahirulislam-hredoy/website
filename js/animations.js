/* =========================================================
   WHITE Design Solutions — GSAP & Lenis Animations
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Safe-guard: Check if GSAP, ScrollTrigger, and the home container are present
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || !document.querySelector('#home')) {
    // If not on homepage or GSAP is blocked, clean up loading class immediately
    document.documentElement.classList.remove('gsap-loading');
    return;
  }

  // Register ScrollTrigger plugin
  gsap.registerPlugin(ScrollTrigger);

  // Initialize animations
  initLenisSmoothScroll();
  initNavbarScrollState();
  initHeroAnimations();
  initOfferingsAnimations();
  initSelectedWorksAnimations();
  initPhilosophyParallax();
  initCTAAnimations();
  initAnchorScrolls();

  // Mark GSAP as active and remove loading class
  document.documentElement.classList.add('gsap-active');
  document.documentElement.classList.remove('gsap-loading');
});

let lenisInstance;

/**
 * Silky-smooth kinetic scroll using Lenis
 */
function initLenisSmoothScroll() {
  const mm = gsap.matchMedia();

  // Only enable smooth scrolling on desktop devices to preserve native mobile momentum
  mm.add("(min-width: 768px)", () => {
    lenisInstance = new Lenis({
      lerp: 0.1, // Smooth scrolling speed factor (higher value = faster scrolling response)
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Apple-like easeOutExpo
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      smoothTouch: false,
      infinite: false
    });

    // Update ScrollTrigger on every scroll tick
    lenisInstance.on('scroll', ScrollTrigger.update);

    // Standard native requestAnimationFrame loop for Lenis to prevent desync bugs
    function raf(time) {
      lenisInstance.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  });
}

/**
 * Handles transparent to blurred navbar scrolling
 */
function initNavbarScrollState() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  // Staggered entry of navbar from top
  gsap.fromTo(navbar, 
    { y: -100, opacity: 0 }, 
    { y: 0, opacity: 1, duration: 1.2, ease: "power4.out", delay: 0.2 }
  );

  // ScrollTrigger to toggle transparent/scrolled states
  ScrollTrigger.create({
    start: "top -50px",
    onEnter: () => navbar.classList.add('navbar--scrolled'),
    onLeaveBack: () => navbar.classList.remove('navbar--scrolled'),
  });
}

/**
 * Apple-style zoom & fade hero transitions
 */
function initHeroAnimations() {
  const hero = document.querySelector('#home');
  const bg = document.querySelector('.hero__bg');
  const overlay = document.querySelector('.hero__overlay');
  const content = document.querySelector('.hero__content');
  const title = document.querySelector('.hero__title');
  const subtitle = document.querySelector('.hero__subtitle');
  const buttons = document.querySelectorAll('.hero__actions .btn');

  if (!hero) return;

  // 1. Initial Page Load Animation
  const tlIntro = gsap.timeline({ defaults: { ease: "power4.out" } });

  tlIntro
    .fromTo(bg, 
      { scale: 1.15, filter: "brightness(0.3) blur(6px)" }, 
      { scale: 1.0, filter: "brightness(1) blur(0px)", duration: 2.2, ease: "power3.out" }
    )
    .fromTo([title, subtitle], 
      { y: 50, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.4, stagger: 0.15 }, 
      "-=1.6"
    )
    .fromTo(buttons, 
      { y: 30, opacity: 0 }, 
      { y: 0, opacity: 1, duration: 1.0, stagger: 0.1 }, 
      "-=0.9"
    );

  // 2. Scroll Scrub Zoom & Parallax
  const mm = gsap.matchMedia();

  mm.add("(min-width: 768px)", () => {
    const tlScrub = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true
      }
    });

    tlScrub
      .to(bg, { yPercent: 20, scale: 1.08, ease: "none" }, 0)
      .to(overlay, { backgroundColor: "rgba(21, 22, 22, 0.88)", ease: "none" }, 0)
      .to(content, { yPercent: -15, opacity: 0, scale: 0.95, ease: "none" }, 0);
  });

  mm.add("(max-width: 767px)", () => {
    // Simpler, lightweight scroll triggers for mobile performance
    const tlScrubMobile = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    tlScrubMobile
      .to(bg, { yPercent: 10, ease: "none" }, 0)
      .to(content, { yPercent: -10, opacity: 0, ease: "none" }, 0);
  });
}

/**
 * Parallax effect on dual offerings (Residences / Interiors)
 */
function initOfferingsAnimations() {
  const offerings = document.querySelectorAll('.offering');
  if (offerings.length === 0) return;

  offerings.forEach((offering) => {
    const img = offering.querySelector('.offering__image');
    const elements = offering.querySelectorAll('.offering__label, .offering__title');

    // Staggered slide up of title/label on scroll reveal
    gsap.fromTo(elements, 
      { y: 40, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        duration: 1.2, 
        stagger: 0.15, 
        ease: "power3.out",
        scrollTrigger: {
          trigger: offering,
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // Desktop image parallax scroll
    gsap.matchMedia().add("(min-width: 768px)", () => {
      gsap.fromTo(img, 
        { yPercent: -12 },
        {
          yPercent: 12,
          ease: "none",
          scrollTrigger: {
            trigger: offering,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });
  });
}

/**
 * Staggered project cards & section line drawing
 */
function initSelectedWorksAnimations() {
  const section = document.getElementById('projects');
  if (!section) return;

  const header = section.querySelector('.section-header');
  const cards = section.querySelectorAll('.project-card');

  // Draw the divider line dynamically on scroll
  if (header) {
    gsap.fromTo(header, 
      { "--section-line-scale": 0 },
      {
        "--section-line-scale": 1,
        ease: "none",
        scrollTrigger: {
          trigger: header,
          start: "top 95%",
          end: "top 70%",
          scrub: true
        }
      }
    );
  }

  // Stagger reveal project cards
  if (cards.length > 0) {
    gsap.fromTo(cards, 
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.4,
        ease: "power3.out",
        stagger: {
          amount: 0.5,
          grid: "auto",
          from: "start"
        },
        scrollTrigger: {
          trigger: section.querySelector('.projects-grid'),
          start: "top 85%",
          toggleActions: "play none none none"
        }
      }
    );

    // Desktop project image parallax
    gsap.matchMedia().add("(min-width: 768px)", () => {
      cards.forEach(card => {
        const img = card.querySelector('.project-card__image');
        if (img) {
          gsap.fromTo(img, 
            { yPercent: -6, scale: 1.05 },
            {
              yPercent: 6,
              scale: 1.05,
              ease: "none",
              scrollTrigger: {
                trigger: card,
                start: "top bottom",
                end: "bottom top",
                scrub: true
              }
            }
          );
        }
      });
    });
  }
}

/**
 * 3D Floating Collage Parallax in Material Study
 */
function initPhilosophyParallax() {
  const philosophy = document.getElementById('philosophy');
  if (!philosophy) return;

  const content = philosophy.querySelector('.philosophy__content');
  const items = philosophy.querySelectorAll('.philosophy__collage-item img');

  // Reveal philosophy text
  if (content) {
    const textElements = content.querySelectorAll('.philosophy__title, .philosophy__text');
    gsap.fromTo(textElements, 
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.4,
        stagger: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: philosophy,
          start: "top 75%",
          toggleActions: "play none none none"
        }
      }
    );
  }

  // 3D floating effect using staggered and opposite directional scroll parallax
  gsap.matchMedia().add("(min-width: 768px)", () => {
    // Array of start and end offsets to create organic overlapping movement
    const parallaxSchemes = [
      { startY: -15, endY: 15 },   // Item 1: drifts down
      { startY: 12, endY: -18 },   // Item 2: drifts up
      { startY: -22, endY: 12 },   // Item 3: drifts down faster
      { startY: -8, endY: 20 },    // Item 4: drifts down slower
      { startY: 18, endY: -12 },   // Item 5: drifts up
      { startY: -25, endY: 25 }    // Item 6: drifts down maximum
    ];

    items.forEach((item, index) => {
      const scheme = parallaxSchemes[index % parallaxSchemes.length];
      gsap.fromTo(item, 
        { yPercent: scheme.startY },
        {
          yPercent: scheme.endY,
          ease: "none",
          scrollTrigger: {
            trigger: philosophy,
            start: "top bottom",
            end: "bottom top",
            scrub: true
          }
        }
      );
    });
  });
}

/**
 * Dynamic CTA border drawing timeline
 */
function initCTAAnimations() {
  const ctaBox = document.querySelector('.cta-box');
  if (!ctaBox) return;

  const content = ctaBox.querySelectorAll('.cta-box__title, .cta-box__text, .btn');

  // Inject four absolute-positioned borders dynamically
  const borderSides = ['top', 'right', 'bottom', 'left'];
  borderSides.forEach(side => {
    const borderDiv = document.createElement('div');
    borderDiv.className = `cta-border cta-border--${side}`;
    ctaBox.appendChild(borderDiv);
  });

  const bTop = ctaBox.querySelector('.cta-border--top');
  const bRight = ctaBox.querySelector('.cta-border--right');
  const bBottom = ctaBox.querySelector('.cta-border--bottom');
  const bLeft = ctaBox.querySelector('.cta-border--left');

  // Create clockwise drawing timeline
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ctaBox,
      start: "top 85%",
      toggleActions: "play none none none"
    }
  });

  tl.to(bTop, { scaleX: 1, duration: 0.35, ease: "power1.inOut" })
    .to(bRight, { scaleY: 1, duration: 0.35, ease: "power1.inOut" }, "-=0.1")
    .to(bBottom, { scaleX: 1, duration: 0.35, ease: "power1.inOut" }, "-=0.1")
    .to(bLeft, { scaleY: 1, duration: 0.35, ease: "power1.inOut" }, "-=0.1")
    .fromTo(content, 
      { y: 35, opacity: 0 },
      { y: 0, opacity: 1, duration: 1.0, stagger: 0.15, ease: "power3.out" }, 
      "-=0.25"
    );
}

/**
 * Custom smooth scroll for anchor links using Lenis scrollTo
 */
function initAnchorScrolls() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target && lenisInstance) {
        e.preventDefault();
        const navHeight = document.querySelector('.navbar').offsetHeight;
        lenisInstance.scrollTo(target, {
          offset: -navHeight,
          duration: 1.2,
          immediate: false
        });
      }
    });
  });
}

