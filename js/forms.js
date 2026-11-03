/**
 * Mankashay - Form Validation & Submission Handler
 * Connects directly to Supabase table `inquiries` via CDN client with graceful offline fallback
 */

(function () {
  'use strict';

  // Email regex RFC 5322 compatible
  const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;

  // Validate an individual field
  function validateField(input) {
    const isRequired = input.hasAttribute('required');
    const val = input.value.trim();
    let isValid = true;
    let errorMsg = '';

    if (isRequired && !val) {
      isValid = false;
      errorMsg = 'This field is required.';
    } else if (input.type === 'email' && val) {
      if (!EMAIL_REGEX.test(val)) {
        isValid = false;
        errorMsg = 'Please enter a valid email address.';
      }
    } else if (input.type === 'tel' && val) {
      // Allow Pakistani phone formats (03XX-XXXXXXX, +923XXXXXXXXX, etc.)
      const cleaned = val.replace(/[\s\-\(\)]/g, '');
      if (cleaned.length < 10 || cleaned.length > 15) {
        isValid = false;
        errorMsg = 'Please enter a valid contact number.';
      }
    }

    // Toggle validation UI classes
    const errorEl = input.parentElement.querySelector('.form-error-msg');
    if (!isValid) {
      input.classList.add('is-invalid');
      if (errorEl) {
        errorEl.textContent = errorMsg;
        errorEl.style.display = 'block';
      }
    } else {
      input.classList.remove('is-invalid');
      if (errorEl) {
        errorEl.style.display = 'none';
      }
    }

    return isValid;
  }

  // Pre-fill fields from URL query params (e.g. ?product=... or ?type=...)
  function checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const productParam = urlParams.get('product') || urlParams.get('item');
    const typeParam = urlParams.get('type');

    if (productParam) {
      const productInputs = document.querySelectorAll('input[name="product_interest"], textarea[name="product_interest"]');
      productInputs.forEach((input) => {
        input.value = decodeURIComponent(productParam);
      });
    }

    if (typeParam) {
      const typeSelects = document.querySelectorAll('select[name="type"]');
      typeSelects.forEach((select) => {
        if ([...select.options].some((opt) => opt.value === typeParam)) {
          select.value = typeParam;
        }
      });
    }
  }

  // Attach submit handler to any Mankashay inquiry form
  function attachFormHandlers() {
    const forms = document.querySelectorAll('form[data-supabase-form]');

    forms.forEach((form) => {
      // Live inline validation on blur / input
      const inputs = form.querySelectorAll('input:not([type="hidden"]), select, textarea');
      inputs.forEach((input) => {
        input.addEventListener('blur', () => validateField(input));
        input.addEventListener('input', () => {
          if (input.classList.contains('is-invalid')) {
            validateField(input);
          }
        });
      });

      // Submit handler
      form.addEventListener('submit', async function (e) {
        e.preventDefault();

        // 1. Spam Honeypot Check
        const honeypot = form.querySelector('input[name="website_hp"]');
        if (honeypot && honeypot.value.trim() !== '') {
          console.warn('[Mankashay] Spam submission detected and blocked.');
          return;
        }

        // 2. Validate all inputs
        let isFormValid = true;
        inputs.forEach((input) => {
          if (!validateField(input)) {
            isFormValid = false;
          }
        });

        if (!isFormValid) {
          const firstInvalid = form.querySelector('.is-invalid');
          if (firstInvalid) firstInvalid.focus();
          return;
        }

        // 3. UI Status Elements
        const submitBtn = form.querySelector('button[type="submit"]');
        const alertBanner = form.querySelector('.form-alert') || createFormAlert(form);
        const originalBtnText = submitBtn.innerHTML;

        // Disable button & show spinner
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
          <svg class="spin-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"></path>
          </svg>
          Sending...
        `;

        alertBanner.className = 'form-alert';
        alertBanner.style.display = 'none';

        // 4. Gather payload
        const formData = new FormData(form);
        const payload = {
          type: formData.get('type') || 'contact',
          name: (formData.get('name') || '').trim(),
          email: (formData.get('email') || '').trim(),
          phone: (formData.get('phone') || '').trim() || null,
          product_interest: (formData.get('product_interest') || '').trim() || null,
          message: (formData.get('message') || '').trim(),
          source_page: window.location.pathname || 'direct',
          status: 'new'
        };

        try {
          // Check if Supabase client is live and authenticated
          const isSupabaseReady =
            typeof supabaseClient !== 'undefined' &&
            supabaseClient !== null &&
            typeof SUPABASE_URL !== 'undefined' &&
            !SUPABASE_URL.includes('YOUR_PROJECT_ID');

          if (isSupabaseReady) {
            // Save to Supabase 'inquiries' table
            const { data, error } = await supabaseClient.from('inquiries').insert([payload]);

            if (error) {
              throw error;
            }

            // Success in Supabase
            alertBanner.textContent = "Thank you! We'll get back to you soon. We craft every piece with love.";
            alertBanner.className = 'form-alert is-success';
            form.reset();
            if (typeof window.showToast === 'function') {
              window.showToast("Inquiry received! We'll reach out shortly.", 'success');
            }
          } else {
            // Friendly preview fallback mode
            console.info('[Mankashay] Supabase keys not detected. Form input validated successfully in preview mode:', payload);
            await new Promise((r) => setTimeout(r, 650)); // simulate nice network feel

            alertBanner.innerHTML = `
              <strong>Thank you, ${payload.name}! We'll get back to you soon.</strong><br>
              <small style="opacity: 0.85;">(Note: Preview Mode &mdash; form validated successfully. Add your Supabase keys to <code>js/supabase-config.js</code> to store in Postgres!)</small>
            `;
            alertBanner.className = 'form-alert is-success';
            form.reset();
            if (typeof window.showToast === 'function') {
              window.showToast("Preview inquiry sent successfully!", 'success');
            }
          }

          // If inside a modal, close modal after 3 seconds
          const modalParent = form.closest('.modal-overlay');
          if (modalParent) {
            setTimeout(() => {
              if (typeof window.closeModal === 'function') {
                window.closeModal(modalParent.id);
              }
            }, 3000);
          }
        } catch (err) {
          console.error('[Mankashay] Form submission error:', err);
          alertBanner.textContent = 'Oops! We could not send your message right now. Please try again or reach out directly on Instagram @mankashay_.';
          alertBanner.className = 'form-alert is-error';
          // User input is preserved on failure
        } finally {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      });
    });
  }

  function createFormAlert(form) {
    const alert = document.createElement('div');
    alert.className = 'form-alert';
    form.insertBefore(alert, form.firstChild);
    return alert;
  }

  // Shop inquiry trigger helper
  window.inquireAboutProduct = function (productName, category) {
    const modal = document.getElementById('inquiry-modal');
    if (!modal) {
      // Redirect to contact or custom orders if no modal on this page
      window.location.href = `custom-orders.html?product=${encodeURIComponent(productName)}&type=custom_order`;
      return;
    }

    const nameInput = modal.querySelector('input[name="product_interest"]');
    if (nameInput) {
      nameInput.value = productName;
    }
    const typeSelect = modal.querySelector('select[name="type"]');
    if (typeSelect) {
      if (category === 'preservations') {
        typeSelect.value = 'preservation';
      } else {
        typeSelect.value = 'custom_order';
      }
    }

    if (typeof window.openModal === 'function') {
      window.openModal('inquiry-modal');
    }
  };

  // Workshop registration trigger helper
  window.registerForWorkshop = function (workshopTitle) {
    const modal = document.getElementById('workshop-modal') || document.getElementById('inquiry-modal');
    if (!modal) {
      window.location.href = `contact.html?product=${encodeURIComponent('Workshop: ' + workshopTitle)}&type=workshop`;
      return;
    }

    const interestInput = modal.querySelector('input[name="product_interest"]');
    if (interestInput) {
      interestInput.value = 'Workshop: ' + workshopTitle;
    }
    const typeSelect = modal.querySelector('select[name="type"]');
    if (typeSelect) {
      typeSelect.value = 'workshop';
    }

    if (typeof window.openModal === 'function') {
      window.openModal(modal.id);
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    attachFormHandlers();
    checkUrlParams();
  });
})();
