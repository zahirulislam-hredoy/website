/* =========================================================
   WHITE Design Solutions — Main JavaScript
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollReveal();
  initSmoothScroll();
  initNavbarHideOnScroll();
  initPortfolioFilters();
  initFlipbook();
  initLightbox();
});

/* ── Mobile Navigation ── */
function initNavigation() {
  const toggle = document.querySelector('.navbar__toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileLinks = mobileMenu.querySelectorAll('a');

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
  });

  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      mobileMenu.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/* ── Scroll Reveal (Intersection Observer) ── */
function initScrollReveal() {
  // If GSAP and ScrollTrigger are loaded and this is the homepage, bypass for custom motion design
  if (window.gsap && window.ScrollTrigger && document.querySelector('#home')) {
    return;
  }

  const revealElements = document.querySelectorAll('.reveal');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.1,
      rootMargin: '0px 0px -40px 0px',
    }
  );

  revealElements.forEach((el) => observer.observe(el));
}

/* ── Smooth Scroll for Anchor Links ── */
function initSmoothScroll() {
  // If GSAP and ScrollTrigger are active on the homepage, let Lenis handle smooth scrolls
  if (window.gsap && window.ScrollTrigger && document.querySelector('#home')) {
    return;
  }

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.navbar').offsetHeight;
        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth',
        });
      }
    });
  });
}

/* ── Hide Navbar on Scroll Down, Show on Scroll Up ── */
function initNavbarHideOnScroll() {
  const navbar = document.querySelector('.navbar');
  let lastScrollY = window.scrollY;
  let ticking = false;

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > lastScrollY && currentScrollY > 100) {
          navbar.classList.add('hidden-nav');
        } else {
          navbar.classList.remove('hidden-nav');
        }

        lastScrollY = currentScrollY;
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ── Portfolio Filters ── */
function initPortfolioFilters() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (!filterBtns.length) return;

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const category = btn.dataset.category;
      updateFlipbook(category);
    });
  });
}

function updateFlipbook(category) {
  const container = document.getElementById('flipbook-container');
  if (!container) return;

  if (category === 'all') {
    loadFlipbook('assets/portfolio.dat');
  } else if (category === 'residences') {
    loadFlipbook('assets/residences.dat');
  } else if (category === 'interiors') {
    loadFlipbook('assets/interiors.dat');
  }
}

let pdfDoc = null;
let allPages = {};
let pdfAspectRatio = 1.414; // Default fallback aspect ratio

function loadFlipbook(url) {
  const flipbookContainer = document.getElementById('flipbook');
  if (!flipbookContainer) return;

  if (pdfDoc && pdfDoc._pdfInfo.src.url === url) return;

  flipbookContainer.innerHTML = '';

  pdfjsLib.getDocument({
    url: url,
    disableRange: true,
    disableStream: true
  }).promise.then(async (pdf) => {
    pdfDoc = pdf;
    const totalPages = pdf.numPages;
    document.getElementById('page-total').textContent = totalPages;

    const scale = 2.0;
    let firstPageWidth = 0;
    let firstPageHeight = 0;

    allPages[url] = [];

    for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: scale });

      if (pageNum === 1) {
        firstPageWidth = viewport.width;
        firstPageHeight = viewport.height;
        pdfAspectRatio = viewport.height / viewport.width; // Dynamically calculate aspect ratio (height / width)
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: ctx,
        viewport: viewport
      };

      await page.render(renderContext).promise;

      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.appendChild(canvas);
      flipbookContainer.appendChild(pageDiv);
      allPages[url].push(pageDiv.cloneNode(true));
    }

    document.getElementById('page-current').textContent = '1';
    initPageFlip();
  }).catch(error => {
    console.error('Error loading PDF:', error);
    flipbookContainer.innerHTML = `<p style="color:red; text-align:center; padding: 20px;">Error loading: ${error.message || error}</p>`;
  });
}

let pageFlipInstance = null;

function initPageFlip() {
  const flipbookContainer = document.getElementById('flipbook');
  const containerWidth = flipbookContainer.parentElement.clientWidth;
  const isMobile = window.innerWidth < 768;
  const navHeight = document.querySelector('.navbar')?.offsetHeight || 80;

  // Calculate maximum spacing inside the viewport height to prevent vertical scrolling (accounting for navbar, headers, titles, and buttons)
  const maxAvailableHeight = window.innerHeight - navHeight - 360; 
  const maxAvailableWidth = containerWidth;
  const aspect = pdfAspectRatio; // Dynamically calculate aspect ratio (Height / Width)

  let displayPageWidth;
  let displayPageHeight;

  if (isMobile) {
    displayPageWidth = window.innerWidth * 0.88;
    displayPageHeight = displayPageWidth * aspect;
  } else {
    // For desktop double-page display, make sure both double-width and height fit on screen
    const maxWidthPage = maxAvailableWidth * 0.46; // Horizontal margin
    const maxHeightPage = maxAvailableHeight / aspect; // Vertical margin
    
    displayPageWidth = Math.min(maxWidthPage, maxHeightPage, 500); // Cap width at 500px per page
    displayPageHeight = displayPageWidth * aspect;
  }

  if (pageFlipInstance) {
    pageFlipInstance.destroy();
  }

  pageFlipInstance = new St.PageFlip(flipbookContainer, {
    width: displayPageWidth,
    height: displayPageHeight,
    size: "stretch",
    showCover: true,
    minWidth: 150,
    maxWidth: 1000,
    minHeight: 200,
    maxHeight: 1400,
    drawShadow: true,
    flippingTime: 1000,
    usePortrait: true,
    startZIndex: 0,
    maxShadowOpacity: 0.5,
    showPageCorners: true,
    disableFlipByClick: false
  });

  pageFlipInstance.loadFromHTML(document.querySelectorAll('.page'));

  document.getElementById('btn-prev').onclick = () => pageFlipInstance.flipPrev();
  document.getElementById('btn-next').onclick = () => pageFlipInstance.flipNext();

  pageFlipInstance.on('flip', (e) => {
    const pageNum = typeof e === 'number' ? e : e.data;
    document.getElementById('page-current').textContent = pageNum + 1;
  });

  // Debounced window resize handler to rescale the flipbook automatically
  if (!window.hasFlipbookResizeListener) {
    window.hasFlipbookResizeListener = true;
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (document.getElementById('flipbook')) {
          initPageFlip();
        }
      }, 250);
    });
  }
}

/* ── Flipbook Initialization (legacy, kept for fallback) ── */
function initFlipbook() {
  const flipbookContainer = document.getElementById('flipbook');
  if (!flipbookContainer) return;

  loadFlipbook('assets/portfolio.dat');
}

/* ── Lightbox for Plans & Gallery Images ── */
function initLightbox() {
  const targetElements = document.querySelectorAll('.plan-card, .gallery-item');
  if (targetElements.length === 0) return;

  // Create lightbox markup dynamically if not present
  let lightbox = document.querySelector('.lightbox');
  if (!lightbox) {
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.innerHTML = `
      <button class="lightbox__close" aria-label="Close lightbox">&times;</button>
      <div class="lightbox__content">
        <img class="lightbox__image" src="" alt="" />
      </div>
      <div class="lightbox__caption"></div>
    `;
    document.body.appendChild(lightbox);
  }

  const lightboxImg = lightbox.querySelector('.lightbox__image');
  const lightboxCaption = lightbox.querySelector('.lightbox__caption');
  const closeBtn = lightbox.querySelector('.lightbox__close');

  // Open lightbox
  targetElements.forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const img = el.querySelector('img');
      if (!img) return;

      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || 'Project Image';

      // Determine caption
      let captionText = '';
      const planTitle = el.querySelector('h3');
      if (planTitle) {
        captionText = planTitle.textContent;
      } else {
        captionText = img.alt || 'Project Detail';
      }
      lightboxCaption.textContent = captionText;

      lightbox.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });

  // Close handlers
  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    // Clear src after fade out to avoid flash of old image next time
    setTimeout(() => {
      if (!lightbox.classList.contains('active')) {
        lightboxImg.src = '';
      }
    }, 400);
  };

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox || e.target.classList.contains('lightbox__content')) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });
}

