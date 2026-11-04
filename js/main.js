/**
 * Mankashay - Main Client UI, Menu & Animation Scripts
 * Brand Tagline: "Art that lasts forever"
 */

(function () {
  'use strict';

  // --- 1. DYNAMIC COPYRIGHT YEAR ---
  function initCopyrightYear() {
    const yearEl = document.getElementById('current-year');
    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  // --- 2. MOBILE NAVIGATION MENU ---
  function initMobileMenu() {
    const toggleBtn = document.querySelector('.menu-toggle');
    const mainNav = document.querySelector('.main-nav');
    const backdrop = document.querySelector('.mobile-nav-backdrop');

    if (!toggleBtn || !mainNav) return;

    function openMenu() {
      toggleBtn.setAttribute('aria-expanded', 'true');
      mainNav.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      toggleBtn.setAttribute('aria-expanded', 'false');
      mainNav.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-open');
      document.body.style.overflow = '';
    }

    toggleBtn.addEventListener('click', function () {
      const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (backdrop) {
      backdrop.addEventListener('click', closeMenu);
    }

    // Close when clicking any nav link
    const navLinks = mainNav.querySelectorAll('.nav-link, .btn');
    navLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('is-open')) {
        closeMenu();
      }
    });

    // Close mobile drawer if window expands beyond mobile/tablet breakpoint (e.g. window snapped/resized)
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024 && mainNav.classList.contains('is-open')) {
        closeMenu();
      }
    }, { passive: true });
  }

  // --- 3. HEADER SCROLL EFFECT ---
  function initHeaderScroll() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    function onScroll() {
      if (window.scrollY > 20) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // --- 4. GENTLE SCROLL-REVEAL ANIMATIONS (IntersectionObserver) ---
  function initScrollReveals() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealElements = document.querySelectorAll('.fade-in-up');

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        threshold: 0.12,
        rootMargin: '0px 0px -40px 0px',
      }
    );

    revealElements.forEach((el) => observer.observe(el));
  }

  // --- 5. MODAL MANAGEMENT (Inquiry modal & alerts) ---
  window.openModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('is-active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // Autofocus first input or close button
    const focusable = modal.querySelector('input:not([type="hidden"]), select, textarea, button');
    if (focusable) focusable.focus();
  };

  window.closeModal = function (modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('is-active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  function initModals() {
    const modals = document.querySelectorAll('.modal-overlay');
    modals.forEach((modal) => {
      // Close on clicking backdrop outside dialog
      modal.addEventListener('click', function (e) {
        if (e.target === modal) {
          closeModal(modal.id);
        }
      });

      // Close buttons inside modal
      const closeButtons = modal.querySelectorAll('[data-close-modal]');
      closeButtons.forEach((btn) => {
        btn.addEventListener('click', function () {
          closeModal(modal.id);
        });
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.is-active');
        if (activeModal) {
          closeModal(activeModal.id);
        }
      }
    });
  }

  // --- 6. TOAST NOTIFICATIONS ---
  window.showToast = function (message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText =
        'position: fixed; bottom: 24px; right: 24px; z-index: 9999; display: flex; flex-direction: column; gap: 8px; max-width: 90vw; width: 360px; pointer-events: none;';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    const bg =
      type === 'success'
        ? '#1A5F3E'
        : type === 'error'
        ? '#8C1D3A'
        : '#8A3556';

    toast.style.cssText = `
      background: ${bg};
      color: #FFFFFF;
      padding: 12px 18px;
      border-radius: 8px;
      font-size: 0.88rem;
      box-shadow: 0 8px 24px rgba(0,0,0,0.18);
      pointer-events: auto;
      transform: translateY(20px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    toast.textContent = message;
    container.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.transform = 'translateY(0)';
      toast.style.opacity = '1';
    });

    setTimeout(() => {
      toast.style.transform = 'translateY(10px)';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4500);
  };

  // --- DOM READY BOOTSTRAP ---
  document.addEventListener('DOMContentLoaded', function () {
    initCopyrightYear();
    initMobileMenu();
    initHeaderScroll();
    initScrollReveals();
    initModals();
  });
})();
