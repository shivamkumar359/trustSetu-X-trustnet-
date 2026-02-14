/**
 * TrustSetu X TrustNet — Frontend behavior
 * Smooth scroll, navbar, modals, form validation, scroll-to-top, fade-in
 */

(function () {
  'use strict';

  const NAV_SCROLL_THRESHOLD = 40;
  const SCROLL_TOP_THRESHOLD = 400;
  const FADE_IN_ROOT_MARGIN = '0px 0px -60px 0px';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  const navbar = $('#navbar');
  const navToggle = $('#nav-toggle');
  const navLinks = $('#nav-links');
  const scrollTopBtn = $('#scroll-top');
  const modalOverlay = $('#modal-overlay');
  const modal = $('#modal');
  const modalTitle = $('#modal-title');
  const modalDesc = $('#modal-desc');
  const modalPlaceholder = $('#modal-placeholder');
  const modalClose = $('#modal-close');
  const contactForm = $('#contact-form');
  const formSuccess = $('#form-success');

  // Tool Data Configuration
  const toolData = {
    'image-verification': {
      title: 'Image Verification Tool',
      desc: 'Upload images to verify authenticity and integrity. Supports PNG, JPG, WebP.'
    },
    'trust-score': {
      title: 'Trust Score Calculator',
      desc: 'Compute a structured trust score from your inputs (e.g. verification results, history, source).'
    },
    'risk-analysis': {
      title: 'Risk Analysis Module',
      desc: 'Assess and categorize risk using configurable criteria. Inputs are evaluated against your rules.'
    },
    'report-generator': {
      title: 'Report Generator',
      desc: 'Generate structured reports from verification and analysis results.'
    }
  };

  /* =========================================
     1. Navigation & Scroll Logic
     ========================================= */

  function initSmoothScroll() {
    $$('a[href^="#"]').forEach((a) => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = $(id);
      if (!target) return;
      a.addEventListener('click', (e) => {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (navLinks.classList.contains('open')) {
          navToggle.setAttribute('aria-expanded', 'false');
          navLinks.classList.remove('open');
        }
      });
    });
  }

  function initNavbarScroll() {
    function updateNavbar() {
      if (window.scrollY > NAV_SCROLL_THRESHOLD) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }
    window.addEventListener('scroll', updateNavbar, { passive: true });
    updateNavbar();
  }

  function initMobileMenu() {
    if (!navToggle || !navLinks) return;
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open);
      navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('.nav-links a').forEach((a) => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  function initScrollToTop() {
    function updateScrollTopVisibility() {
      if (window.scrollY > SCROLL_TOP_THRESHOLD) {
        scrollTopBtn.removeAttribute('hidden');
      } else {
        scrollTopBtn.setAttribute('hidden', '');
      }
    }
    window.addEventListener('scroll', updateScrollTopVisibility, { passive: true });
    updateScrollTopVisibility();
    scrollTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initFadeIn() {
    const elements = $$('.fade-in');
    if (!elements.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { rootMargin: FADE_IN_ROOT_MARGIN, threshold: 0.05 }
    );
    elements.forEach((el) => observer.observe(el));
  }

  /* =========================================
     2. Modal & File Upload Logic
     ========================================= */

  function openModal(toolId) {
    const data = toolData[toolId];
    if (!data) return;
    modalTitle.textContent = data.title;
    modalDesc.textContent = data.desc;

    // --- Dynamic Content Injection ---
    if (toolId === 'image-verification') {
      // Inject the Drag & Drop Interface
      modalPlaceholder.innerHTML = `
        <div class="modal-import">
          <input type="file" id="modal-image-input" accept="image/png, image/jpeg, image/webp" hidden>
          
          <div class="upload-zone" id="upload-zone">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
            <div class="upload-text">Click to upload or drag image here</div>
            <div class="upload-hint">PNG, JPG, WebP. Max 10 MB.</div>
          </div>

          <div class="modal-import-error" id="modal-import-error" role="alert"></div>
          
          <div class="file-previews" id="file-previews"></div>

          <button type="button" class="btn btn-primary modal-process-btn" id="modal-process-btn" disabled>
            Verify Image Integrity
          </button>
        </div>`;
      
      // Initialize the listeners for this specific HTML
      initImageImport();
    } else {
      modalPlaceholder.innerHTML = '<p>Placeholder interface — connect to your backend or demo flow here.</p>';
    }

    modalOverlay.classList.add('open');
    modalOverlay.setAttribute('aria-hidden', 'false');
    modal.setAttribute('aria-labelledby', 'modal-title');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB limit

  function initImageImport() {
    const input = $('#modal-image-input');
    const dropZone = $('#upload-zone');
    const previewContainer = $('#file-previews');
    const processBtn = $('#modal-process-btn');
    const errorEl = $('#modal-import-error');

    if (!input || !dropZone) return;

    let selectedFile = null;

    // Click to Open File Dialog
    dropZone.addEventListener('click', () => input.click());

    // Drag & Drop Handlers
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'), false);
    });

    dropZone.addEventListener('drop', handleDrop, false);
    input.addEventListener('change', (e) => handleFiles(e.target.files));

    function handleDrop(e) {
      const dt = e.dataTransfer;
      const files = dt.files;
      handleFiles(files);
    }

    function handleFiles(files) {
      errorEl.textContent = '';
      if (!files || files.length === 0) return;

      const file = files[0]; // Process only the first file for this tool

      // 1. Validate File Type
      if (!file.type.startsWith('image/')) {
        errorEl.textContent = 'Error: Only image files are allowed.';
        return;
      }

      // 2. Validate File Size (10MB)
      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        errorEl.textContent = `Error: "${file.name}" exceeds the 10 MB limit.`;
        return;
      }

      selectedFile = file;
      renderPreview(file);
      processBtn.disabled = false;
    }

    function renderPreview(file) {
      previewContainer.innerHTML = ''; 
      
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = function() {
        const div = document.createElement('div');
        div.className = 'preview-item';
        div.innerHTML = `
          <img src="${reader.result}" class="preview-thumb" alt="Preview">
          <div class="preview-info">
            <div class="preview-name">${file.name}</div>
            <div class="preview-size">${formatFileSize(file.size)}</div>
          </div>
          <button type="button" class="remove-file" aria-label="Remove">&times;</button>
        `;
        
        // Remove file handler
        div.querySelector('.remove-file').addEventListener('click', (e) => {
          e.stopPropagation();
          selectedFile = null;
          previewContainer.innerHTML = '';
          input.value = ''; // Clear input
          processBtn.disabled = true;
        });

        previewContainer.appendChild(div);
      }
    }

    // Process/Send Button Click
    processBtn.addEventListener('click', async () => {
      if (!selectedFile) return;

      // UI Loading State
      processBtn.classList.add('loading');
      processBtn.textContent = 'Processing...';
      processBtn.disabled = true;

      // --- BACKEND INTEGRATION POINT ---
      const formData = new FormData();
      formData.append('image', selectedFile); 

      try {
        // Simulate network delay (2 seconds)
        // In production, remove the timeout and use the fetch code below.
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        /* // REAL BACKEND CALL:
        const response = await fetch('YOUR_API_ENDPOINT_HERE', {
            method: 'POST',
            body: formData
        });
        if (!response.ok) throw new Error('Verification failed');
        const result = await response.json();
        */

        // Success Feedback
        previewContainer.innerHTML = `
          <div style="background: rgba(47, 163, 107, 0.1); border: 1px solid var(--color-trust-green); border-radius: 8px; padding: 1rem; text-align: center;">
            <div style="color: var(--color-trust-green); font-weight: 600; margin-bottom: 0.5rem;">
              ✓ Verification Complete
            </div>
            <p style="font-size: 0.9rem; color: var(--color-text); margin: 0;">
              Image "${selectedFile.name}" has been verified.<br>
              <span style="font-size: 0.85rem; color: #666;">Integrity Score: <strong>98/100</strong></span>
            </p>
          </div>
        `;
        selectedFile = null;
        input.value = '';
        
      } catch (error) {
        console.error(error);
        errorEl.textContent = 'Connection error. Please try again.';
        processBtn.disabled = false; // Re-enable so they can try again
      } finally {
        processBtn.classList.remove('loading');
        if (selectedFile) processBtn.textContent = 'Verify Image Integrity'; // Reset text if failed
        else processBtn.textContent = 'Verify Image Integrity';
      }
    });
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function closeModal() {
    modalOverlay.classList.remove('open');
    modalOverlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function initModals() {
    $$('.tool-card').forEach((btn) => {
      btn.addEventListener('click', () => {
        const toolId = btn.getAttribute('data-tool');
        if (toolId) openModal(toolId);
      });
    });
    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeModal();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modalOverlay.classList.contains('open')) closeModal();
    });
  }

  /* =========================================
     3. Form Validation
     ========================================= */

  function validateForm() {
    const name = $('#contact-name');
    const email = $('#contact-email');
    const message = $('#contact-message');
    const errName = $('#error-name');
    const errEmail = $('#error-email');
    const errMessage = $('#error-message');

    errName.textContent = '';
    errEmail.textContent = '';
    errMessage.textContent = '';

    let valid = true;
    const trim = (v) => (v && typeof v === 'string' ? v.trim() : '');

    if (!trim(name.value)) {
      errName.textContent = 'Please enter your name.';
      valid = false;
    }
    if (!trim(email.value)) {
      errEmail.textContent = 'Please enter your email.';
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      errEmail.textContent = 'Please enter a valid email address.';
      valid = false;
    }
    if (!trim(message.value)) {
      errMessage.textContent = 'Please enter a message.';
      valid = false;
    }

    return valid;
  }

  function initContactForm() {
    if (!contactForm) return;
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      formSuccess.hidden = true;
      if (!validateForm()) return;
      formSuccess.hidden = false;
      contactForm.reset();
      $('#error-name').textContent = '';
      $('#error-email').textContent = '';
      $('#error-message').textContent = '';
    });
  }

  /* =========================================
     4. Initialization
     ========================================= */

  function init() {
    initSmoothScroll();
    initNavbarScroll();
    initMobileMenu();
    initScrollToTop();
    initFadeIn();
    initModals();
    initContactForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
