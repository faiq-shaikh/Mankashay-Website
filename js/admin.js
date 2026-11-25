/**
 * Mankashay - Admin Dashboard Logic
 * Handles Authentication, Inquiries Management, Products Management, and Events Management
 */

(function () {
  'use strict';

  // State management
  let allInquiries = [];
  let allProducts = [];
  let allEvents = [];
  let currentTab = 'inquiries'; // 'inquiries' | 'products' | 'events'
  let currentUser = null;
  let isDemoMode = false;

  // Mock seed data for instant preview if Supabase is offline or not configured
  const mockInquiries = [
    {
      id: 'mock-1',
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      type: 'preservation',
      name: 'Ayesha Khan',
      email: 'ayesha.k@example.com',
      phone: '0300-1234567',
      product_interest: 'Bridal Garland Keepsake Frame',
      message: 'Hi! I had my Nikkah last week in Karachi and preserved the rose garlands in cool dark space. Can I ship them to Jamshoro for casting in a 6x6 resin block?',
      source_page: '/custom-orders.html',
      status: 'new'
    },
    {
      id: 'mock-2',
      created_at: new Date(Date.now() - 3600000 * 18).toISOString(),
      type: 'custom_order',
      name: 'Bilal Ahmed',
      email: 'bilal.ahmed@example.com',
      phone: '0333-9876543',
      product_interest: 'Botanical Letter Keychain (Initial B)',
      message: 'Looking for 3 letter keychains with gold foil and white baby breath flowers for graduation gifts. Deliver to Lahore.',
      source_page: '/shop.html',
      status: 'contacted'
    },
    {
      id: 'mock-3',
      created_at: new Date(Date.now() - 3600000 * 72).toISOString(),
      type: 'workshop',
      name: 'Sana Tariq',
      email: 'sana.tariq@muet.edu.pk',
      phone: '0321-4567890',
      product_interest: 'Workshop: Hands-On Resin Art Workshop',
      message: 'Would love to register 2 seats for the upcoming weekend workshop at BIC MUET. Please share payment details.',
      source_page: '/workshops.html',
      status: 'closed'
    }
  ];

  // DOM Elements
  const authSection = document.getElementById('admin-auth-section');
  const dashboardSection = document.getElementById('admin-dashboard-section');
  const loginForm = document.getElementById('admin-login-form');
  const loginError = document.getElementById('admin-login-error');
  const adminUserEmail = document.getElementById('admin-user-email');
  const btnSignOut = document.getElementById('btn-sign-out');
  const demoBanner = document.getElementById('demo-mode-banner');

  // Check if Supabase client is available
  function isSupabaseConfigured() {
    return (
      typeof supabaseClient !== 'undefined' &&
      supabaseClient !== null &&
      typeof SUPABASE_URL !== 'undefined' &&
      !SUPABASE_URL.includes('YOUR_PROJECT_ID')
    );
  }

  // Check existing session
  async function checkSession() {
    if (!isSupabaseConfigured()) {
      showDemoBanner(true);
      // Allow previewing dashboard
      return;
    }

    try {
      const { data: { session }, error } = await supabaseClient.auth.getSession();
      if (session && session.user) {
        currentUser = session.user;
        showDashboard();
      } else {
        showLogin();
      }
    } catch (err) {
      console.warn('[Admin] Auth check error:', err);
      showLogin();
    }
  }

  function showLogin() {
    if (authSection) authSection.style.display = 'block';
    if (dashboardSection) dashboardSection.style.display = 'none';
  }

  function showDashboard() {
    if (authSection) authSection.style.display = 'none';
    if (dashboardSection) dashboardSection.style.display = 'block';
    if (adminUserEmail) {
      adminUserEmail.textContent = currentUser ? currentUser.email : 'demo-admin@mankashay.com';
    }
    loadData();
  }

  function showDemoBanner(show) {
    if (demoBanner) {
      demoBanner.style.display = show ? 'block' : 'none';
    }
  }

  // --- LOGIN HANDLER ---
  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      loginError.style.display = 'none';

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!isSupabaseConfigured()) {
        // Fallback for immediate preview if keys aren't set
        isDemoMode = true;
        currentUser = { email: email || 'demo-admin@mankashay.com' };
        showToast('Entering Dashboard Preview Mode (Supabase keys not configured yet)', 'info');
        showDashboard();
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Verifying...';

      try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;

        currentUser = data.user;
        showDashboard();
        showToast('Welcome back, Admin!', 'success');
      } catch (err) {
        console.error('[Admin] Login error:', err);
        loginError.textContent = err.message || 'Invalid credentials or user not found. Ensure user exists in Supabase Auth.';
        loginError.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Dashboard';
      }
    });
  }

  // Demo bypass button (for testing when no keys entered yet)
  const btnDemoPreview = document.getElementById('btn-demo-preview');
  if (btnDemoPreview) {
    btnDemoPreview.addEventListener('click', function () {
      isDemoMode = true;
      currentUser = { email: 'preview-admin@mankashay.com' };
      showDashboard();
    });
  }

  // --- SIGN OUT HANDLER ---
  if (btnSignOut) {
    btnSignOut.addEventListener('click', async function () {
      if (isSupabaseConfigured()) {
        await supabaseClient.auth.signOut();
      }
      currentUser = null;
      isDemoMode = false;
      showLogin();
      showToast('Signed out successfully.', 'info');
    });
  }

  // --- LOAD ALL DATA ---
  async function loadData() {
    await Promise.all([
      fetchInquiries(),
      fetchProducts(),
      fetchEvents()
    ]);
    renderStats();
    renderInquiries();
    renderProducts();
    renderEvents();
  }

  // --- 1. INQUIRIES MANAGEMENT ---
  async function fetchInquiries() {
    if (!isSupabaseConfigured() || isDemoMode) {
      allInquiries = [...mockInquiries];
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      allInquiries = data || [];
    } catch (err) {
      console.error('[Admin] Fetch inquiries error:', err);
      allInquiries = [...mockInquiries];
      showToast('Using local inquiries data.', 'info');
    }
  }

  function renderStats() {
    const total = allInquiries.length;
    const countNew = allInquiries.filter((i) => i.status === 'new').length;
    const countContacted = allInquiries.filter((i) => i.status === 'contacted').length;
    const countClosed = allInquiries.filter((i) => i.status === 'closed').length;

    const elTotal = document.getElementById('stat-total');
    const elNew = document.getElementById('stat-new');
    const elContacted = document.getElementById('stat-contacted');
    const elClosed = document.getElementById('stat-closed');

    if (elTotal) elTotal.textContent = total;
    if (elNew) elNew.textContent = countNew;
    if (elContacted) elContacted.textContent = countContacted;
    if (elClosed) elClosed.textContent = countClosed;
  }

  function renderInquiries() {
    const tbody = document.getElementById('inquiries-table-body');
    if (!tbody) return;

    const searchQuery = (document.getElementById('inquiries-search')?.value || '').toLowerCase().trim();
    const filterStatus = document.getElementById('inquiries-filter-status')?.value || 'all';
    const filterType = document.getElementById('inquiries-filter-type')?.value || 'all';

    const filtered = allInquiries.filter((inq) => {
      const matchesSearch =
        inq.name.toLowerCase().includes(searchQuery) ||
        inq.email.toLowerCase().includes(searchQuery) ||
        (inq.phone && inq.phone.toLowerCase().includes(searchQuery)) ||
        inq.message.toLowerCase().includes(searchQuery) ||
        (inq.product_interest && inq.product_interest.toLowerCase().includes(searchQuery));

      const matchesStatus = filterStatus === 'all' || inq.status === filterStatus;
      const matchesType = filterType === 'all' || inq.type === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
            No inquiries match your current filters.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered
      .map((inq) => {
        const dateStr = new Date(inq.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        const typeLabel =
          inq.type === 'custom_order'
            ? 'Custom Art'
            : inq.type === 'preservation'
            ? 'Preservation'
            : inq.type === 'workshop'
            ? 'Workshop'
            : 'Contact';

        return `
          <tr data-id="${inq.id}">
            <td style="white-space: nowrap; font-size: 0.8rem; color: var(--text-muted);">${dateStr}</td>
            <td>
              <strong>${escapeHtml(inq.name)}</strong>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(inq.email)}</div>
              ${inq.phone ? `<div style="font-size: 0.78rem; color: var(--accent-rose);">${escapeHtml(inq.phone)}</div>` : ''}
            </td>
            <td>
              <span class="badge-status" style="background: var(--bg-peach); color: var(--primary-plum);">
                ${typeLabel}
              </span>
              ${inq.product_interest ? `<div style="font-size: 0.78rem; margin-top: 4px; font-weight: 500;">${escapeHtml(inq.product_interest)}</div>` : ''}
            </td>
            <td style="max-width: 280px; font-size: 0.84rem; line-height: 1.4;">
              ${escapeHtml(inq.message)}
            </td>
            <td>
              <select class="status-select" data-inquiry-id="${inq.id}">
                <option value="new" ${inq.status === 'new' ? 'selected' : ''}>New</option>
                <option value="contacted" ${inq.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                <option value="closed" ${inq.status === 'closed' ? 'selected' : ''}>Closed</option>
              </select>
            </td>
            <td>
              <a href="mailto:${encodeURIComponent(inq.email)}?subject=${encodeURIComponent('Mankashay: In response to your inquiry')}&body=${encodeURIComponent('Hi ' + inq.name + ',\n\nThank you for reaching out to Mankashay!')}" 
                 class="btn btn-outline-rose btn-sm" style="font-size: 0.76rem; padding: 0.35rem 0.75rem; min-height: 32px;" title="Reply via Email">
                Email
              </a>
            </td>
            <td>
              <button class="btn-icon-action btn-delete-inquiry" data-inquiry-id="${inq.id}" title="Delete inquiry">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    // Attach row events
    tbody.querySelectorAll('.status-select').forEach((select) => {
      select.addEventListener('change', async function () {
        const id = this.dataset.inquiryId;
        const newStatus = this.value;
        await updateInquiryStatus(id, newStatus);
      });
    });

    tbody.querySelectorAll('.btn-delete-inquiry').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const id = this.dataset.inquiryId;
        if (confirm('Are you sure you want to delete this inquiry?')) {
          await deleteInquiry(id);
        }
      });
    });
  }

  async function updateInquiryStatus(id, newStatus) {
    if (isSupabaseConfigured() && !isDemoMode) {
      try {
        const { error } = await supabaseClient
          .from('inquiries')
          .update({ status: newStatus })
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error('[Admin] Update status error:', err);
        showToast('Error updating status in Supabase.', 'error');
        return;
      }
    }

    const item = allInquiries.find((i) => i.id === id);
    if (item) item.status = newStatus;
    renderStats();
    showToast('Inquiry status updated to ' + newStatus, 'success');
  }

  async function deleteInquiry(id) {
    if (isSupabaseConfigured() && !isDemoMode) {
      try {
        const { error } = await supabaseClient
          .from('inquiries')
          .delete()
          .eq('id', id);

        if (error) throw error;
      } catch (err) {
        console.error('[Admin] Delete inquiry error:', err);
        showToast('Error deleting inquiry.', 'error');
        return;
      }
    }

    allInquiries = allInquiries.filter((i) => i.id !== id);
    renderStats();
    renderInquiries();
    showToast('Inquiry deleted.', 'info');
  }

  // --- 2. PRODUCTS MANAGEMENT ---
  const defaultProducts = [
    {
      id: 'p-1',
      name: 'Rose Petal Teardrop Pendant',
      price: 1850,
      quantity: 8,
      category: 'pendants',
      image_url: 'assets/images/pendant-rose-petal.webp',
      description: 'Handcrafted teardrop pendant encasing deep crimson dried rose petals with subtle 18k gold foil flecks. Finished with an 18-inch gold-plated stainless steel chain.',
      is_active: true,
      sort_order: 1
    },
    {
      id: 'p-2',
      name: 'Forget-Me-Not Oval Pendant',
      price: 2100,
      quantity: 5,
      category: 'pendants',
      image_url: 'assets/images/pendant-forgetmenot.webp',
      description: 'Delicate sky-blue forget-me-not blossoms suspended in high-clarity UV-resistant resin with a vintage filigree bronze bezel.',
      is_active: true,
      sort_order: 2
    },
    {
      id: 'p-3',
      name: 'Botanical Letter Keychain',
      price: 1200,
      quantity: 14,
      category: 'keychains',
      image_url: 'assets/images/keychain-goldflake.webp',
      description: 'Personalized resin initial keychain with dried white gypsophila (baby\'s breath) and golden leaf accents. Includes alloy keyring and tassel.',
      is_active: true,
      sort_order: 3
    },
    {
      id: 'p-4',
      name: 'Dried Daisy Bar Keychain',
      price: 1350,
      quantity: 6,
      category: 'keychains',
      image_url: 'assets/images/keychain-daisy.webp',
      description: 'Sleek geometric resin bar featuring an intact miniature dried wild daisy. Durable and waterproof.',
      is_active: true,
      sort_order: 4
    },
    {
      id: 'p-5',
      name: 'Bridal Garland Keepsake Frame',
      price: 8500,
      quantity: 2,
      category: 'preservations',
      image_url: 'assets/images/preservation-bridal-frame.webp',
      description: 'Everlasting custom preservation of your Nikkah or wedding floral garland in a solid 6x6" resin block.',
      is_active: true,
      sort_order: 5
    },
    {
      id: 'p-6',
      name: 'Rose Petal Keepsake Heart',
      price: 4200,
      quantity: 4,
      category: 'preservations',
      image_url: 'assets/images/preservation-anniversary-heart.webp',
      description: 'Freestanding resin heart preserving precious anniversary or milestone petals with delicate pearl shimmer.',
      is_active: true,
      sort_order: 6
    },
    {
      id: 'p-7',
      name: 'Coastal Bloom Resin Vanity Tray',
      price: 5400,
      quantity: 3,
      category: 'other',
      image_url: 'assets/images/art-ocean-tray.webp',
      description: 'Handmade decorative tray with genuine dried lavender, rose petals, and shimmering mica waves with brass handles.',
      is_active: true,
      sort_order: 7
    },
    {
      id: 'p-8',
      name: 'Botanical Floral Bookmark',
      price: 950,
      quantity: 10,
      category: 'other',
      image_url: 'assets/images/art-floral-bookmark.webp',
      description: 'Slim and ultra-durable resin bookmark with hand-pressed wild blooms and a hand-tied blush silk tassel.',
      is_active: true,
      sort_order: 8
    }
  ];

  function persistProductsDemo() {
    if (!isSupabaseConfigured() || isDemoMode) {
      try {
        localStorage.setItem('mankashay_admin_products', JSON.stringify(allProducts));
      } catch (e) {
        console.warn('[Admin] LocalStorage save error:', e);
      }
    }
  }

  async function fetchProducts() {
    const savedDemo = localStorage.getItem('mankashay_admin_products');
    if (!isSupabaseConfigured() || isDemoMode) {
      if (savedDemo) {
        try {
          allProducts = JSON.parse(savedDemo);
          return;
        } catch (e) {
          console.warn('[Admin] Error reading stored products:', e);
        }
      }
      allProducts = [...defaultProducts];
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      allProducts = data && data.length > 0 ? data : [...defaultProducts];
    } catch (err) {
      console.warn('[Admin] Fetch products error:', err);
      if (savedDemo) {
        try {
          allProducts = JSON.parse(savedDemo);
          return;
        } catch (e) {}
      }
      allProducts = [...defaultProducts];
    }
  }

  function renderProducts() {
    const tbody = document.getElementById('products-table-body');
    if (!tbody) return;

    const searchQuery = (document.getElementById('products-search')?.value || '').toLowerCase().trim();
    const filterCat = document.getElementById('products-filter-category')?.value || 'all';
    const filterStock = document.getElementById('products-filter-stock')?.value || 'all';
    const filterStatus = document.getElementById('products-filter-status')?.value || 'all';

    const filtered = allProducts.filter((p) => {
      const pName = (p.name || '').toLowerCase();
      const pCat = (p.category || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();

      const matchesSearch = !searchQuery || pName.includes(searchQuery) || pCat.includes(searchQuery) || pDesc.includes(searchQuery);
      const matchesCat = filterCat === 'all' || p.category === filterCat;
      
      const qty = p.quantity !== undefined && p.quantity !== null ? Number(p.quantity) : 1;
      let matchesStock = true;
      if (filterStock === 'in_stock') matchesStock = qty > 3;
      else if (filterStock === 'low_stock') matchesStock = qty > 0 && qty <= 3;
      else if (filterStock === 'out_stock') matchesStock = qty <= 0;

      let matchesStatus = true;
      if (filterStatus === 'active') matchesStatus = !!p.is_active;
      else if (filterStatus === 'hidden') matchesStatus = !p.is_active;

      return matchesSearch && matchesCat && matchesStock && matchesStatus;
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No products match your current filters.</td></tr>';
      return;
    }

    tbody.innerHTML = filtered
      .map((p) => {
        const qty = p.quantity !== undefined && p.quantity !== null ? Number(p.quantity) : 0;
        let stockBadge = '';
        if (qty > 3) {
          stockBadge = `<span class="badge-stock in-stock"><span style="width: 6px; height: 6px; border-radius: 50%; background: #137333;"></span>${qty} in stock</span>`;
        } else if (qty > 0) {
          stockBadge = `<span class="badge-stock low-stock"><span style="width: 6px; height: 6px; border-radius: 50%; background: #8F5B00;"></span>Low (${qty})</span>`;
        } else {
          stockBadge = `<span class="badge-stock out-stock"><span style="width: 6px; height: 6px; border-radius: 50%; background: #C0264D;"></span>Out of stock (0)</span>`;
        }

        const catDisplay = p.category === 'other' ? 'Custom Art' : p.category;

        return `
          <tr data-id="${p.id}">
            <td>
              <img src="${p.image_url || 'assets/images/pendant-rose-petal.webp'}" alt="${escapeHtml(p.name)}" 
                   onerror="this.onerror=null; this.src='assets/images/pendant-rose-petal.webp';"
                   style="width: 46px; height: 46px; object-fit: cover; border-radius: 6px; border: 1px solid var(--border-card); display: block;">
            </td>
            <td style="max-width: 240px;">
              <strong style="color: var(--text-dark); display: block; line-height: 1.25;">${escapeHtml(p.name)}</strong>
              <div style="font-size: 0.74rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-rose); margin-top: 2px;">
                ${escapeHtml(catDisplay)}
              </div>
              ${p.description ? `<div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px;">${escapeHtml(p.description)}</div>` : ''}
            </td>
            <td style="white-space: nowrap; font-weight: 600; color: var(--primary-plum);">
              ${p.price !== null && p.price !== undefined ? 'Rs. ' + Number(p.price).toLocaleString() : '<span style="color: var(--text-muted); font-weight: 400;">Inquire</span>'}
            </td>
            <td>
              ${stockBadge}
            </td>
            <td>
              <button class="btn btn-sm ${p.is_active ? 'btn-primary' : 'btn-secondary'} btn-toggle-product" 
                      data-id="${p.id}" style="min-height: 32px; font-size: 0.75rem; padding: 0.3rem 0.65rem;" title="Click to toggle visibility">
                ${p.is_active ? 'Active' : 'Hidden'}
              </button>
            </td>
            <td style="text-align: right; white-space: nowrap;">
              <div style="display: inline-flex; align-items: center; gap: 0.4rem;">
                <button class="btn-icon-edit btn-edit-product" data-id="${p.id}" title="Edit product attributes (image, price, stock quantity, etc.)">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  <span>Edit</span>
                </button>
                <button class="btn-icon-action btn-delete-product" data-id="${p.id}" title="Delete Product">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    // Attach row events
    tbody.querySelectorAll('.btn-edit-product').forEach((btn) => {
      btn.addEventListener('click', function () {
        const id = this.dataset.id;
        openEditProductModal(id);
      });
    });

    tbody.querySelectorAll('.btn-toggle-product').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const id = this.dataset.id;
        const prod = allProducts.find((p) => p.id === id);
        if (prod) {
          await toggleProductActive(id, !prod.is_active);
        }
      });
    });

    tbody.querySelectorAll('.btn-delete-product').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const id = this.dataset.id;
        const prod = allProducts.find((p) => p.id === id);
        const name = prod ? prod.name : 'this product';
        if (confirm(`Are you sure you want to delete "${name}" from the catalog?`)) {
          await deleteProduct(id);
        }
      });
    });
  }

  // Open Edit Product Modal with filled attributes
  function openEditProductModal(id) {
    const prod = allProducts.find((p) => p.id === id);
    if (!prod) {
      showToast('Product not found.', 'error');
      return;
    }

    const modal = document.getElementById('edit-product-modal');
    if (!modal) return;

    document.getElementById('edit-prod-id').value = prod.id || '';
    document.getElementById('edit-prod-name').value = prod.name || '';
    document.getElementById('edit-prod-price').value = prod.price !== null && prod.price !== undefined ? prod.price : '';
    document.getElementById('edit-prod-qty').value = prod.quantity !== undefined && prod.quantity !== null ? prod.quantity : 1;
    document.getElementById('edit-prod-cat').value = prod.category || 'pendants';
    document.getElementById('edit-prod-status').value = prod.is_active ? 'true' : 'false';
    document.getElementById('edit-prod-image').value = prod.image_url || '';
    document.getElementById('edit-prod-desc').value = prod.description || '';
    document.getElementById('edit-prod-sort').value = prod.sort_order !== undefined ? prod.sort_order : 1;

    // Reset helper controls
    const presetSelect = document.getElementById('edit-prod-image-preset');
    if (presetSelect) presetSelect.value = '';
    const fileLabel = document.getElementById('edit-prod-file-name');
    if (fileLabel) fileLabel.textContent = '';
    const fileInput = document.getElementById('edit-prod-file-input');
    if (fileInput) fileInput.value = '';

    // Update live preview
    const preview = document.getElementById('edit-prod-preview');
    if (preview) {
      preview.src = prod.image_url || 'assets/images/pendant-rose-petal.webp';
      preview.onerror = function () {
        this.src = 'assets/images/pendant-rose-petal.webp';
      };
    }

    if (window.openModal) {
      window.openModal('edit-product-modal');
    }
  }

  async function toggleProductActive(id, newStatus) {
    if (isSupabaseConfigured() && !isDemoMode) {
      try {
        const { error } = await supabaseClient.from('products').update({ is_active: newStatus }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        showToast('Error updating product status in Supabase', 'error');
        return;
      }
    }
    const p = allProducts.find((item) => item.id === id);
    if (p) p.is_active = newStatus;
    persistProductsDemo();
    renderProducts();
    showToast(`Product visibility updated to ${newStatus ? 'Active' : 'Hidden'}`, 'success');
  }

  async function deleteProduct(id) {
    if (isSupabaseConfigured() && !isDemoMode) {
      try {
        const { error } = await supabaseClient.from('products').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        showToast('Error deleting product from Supabase', 'error');
        return;
      }
    }
    allProducts = allProducts.filter((p) => p.id !== id);
    persistProductsDemo();
    renderProducts();
    showToast('Product removed from catalog', 'info');
  }

  // --- EDIT PRODUCT FORM SUBMIT ---
  const editProductForm = document.getElementById('edit-product-form');
  if (editProductForm) {
    editProductForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const id = document.getElementById('edit-prod-id').value;
      const name = document.getElementById('edit-prod-name').value.trim();
      const priceRaw = document.getElementById('edit-prod-price').value;
      const price = priceRaw !== '' ? parseFloat(priceRaw) : null;
      const qtyRaw = document.getElementById('edit-prod-qty').value;
      const quantity = qtyRaw !== '' ? parseInt(qtyRaw, 10) : 0;
      const category = document.getElementById('edit-prod-cat').value;
      const is_active = document.getElementById('edit-prod-status').value === 'true';
      const image_url = document.getElementById('edit-prod-image').value.trim() || 'assets/images/pendant-rose-petal.webp';
      const description = document.getElementById('edit-prod-desc').value.trim();
      const sort_order = parseInt(document.getElementById('edit-prod-sort').value, 10) || 0;

      if (!name) {
        showToast('Product name is required.', 'error');
        return;
      }

      const saveBtn = document.getElementById('btn-save-product-edit');
      if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving Changes...';
      }

      const updatedFields = {
        name,
        price,
        quantity,
        category,
        is_active,
        image_url,
        description,
        sort_order
      };

      if (isSupabaseConfigured() && !isDemoMode) {
        try {
          const { error } = await supabaseClient
            .from('products')
            .update(updatedFields)
            .eq('id', id);

          if (error) {
            // Handle scenario if remote database doesn't have quantity column yet
            if (error.message && error.message.toLowerCase().includes('quantity')) {
              console.warn('[Admin] Remote Supabase table does not have quantity column yet. Retrying without quantity.');
              const { quantity: _, ...fallbackFields } = updatedFields;
              const retry = await supabaseClient.from('products').update(fallbackFields).eq('id', id);
              if (retry.error) throw retry.error;
            } else {
              throw error;
            }
          }
        } catch (err) {
          console.error('[Admin] Update product error:', err);
          showToast('Failed to save to Supabase: ' + err.message, 'error');
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
          }
          return;
        }
      }

      // Update in local state
      const idx = allProducts.findIndex((p) => p.id === id);
      if (idx !== -1) {
        allProducts[idx] = { ...allProducts[idx], ...updatedFields };
      }
      persistProductsDemo();

      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Changes';
      }

      if (window.closeModal) {
        window.closeModal('edit-product-modal');
      }

      renderProducts();
      showToast(`Product "${name}" updated successfully!`, 'success');
    });
  }

  // --- ADD PRODUCT FORM SUBMIT ---
  const addProductForm = document.getElementById('add-product-form');
  if (addProductForm) {
    addProductForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const name = document.getElementById('new-prod-name').value.trim();
      const priceRaw = document.getElementById('new-prod-price').value;
      const price = priceRaw !== '' ? parseFloat(priceRaw) : null;
      const qtyRaw = document.getElementById('new-prod-qty').value;
      const quantity = qtyRaw !== '' ? parseInt(qtyRaw, 10) : 1;
      const category = document.getElementById('new-prod-cat').value;
      const imageUrl = document.getElementById('new-prod-image').value.trim() || 'assets/images/pendant-rose-petal.webp';
      const description = document.getElementById('new-prod-desc').value.trim();
      const sortRaw = document.getElementById('new-prod-sort')?.value;
      const sort_order = sortRaw !== '' && sortRaw !== undefined ? parseInt(sortRaw, 10) : allProducts.length + 1;

      const newProd = {
        name,
        price,
        quantity,
        category,
        image_url: imageUrl,
        description,
        is_active: true,
        sort_order
      };

      if (isSupabaseConfigured() && !isDemoMode) {
        try {
          let { data, error } = await supabaseClient.from('products').insert([newProd]).select();
          if (error && error.message && error.message.toLowerCase().includes('quantity')) {
            console.warn('[Admin] Remote Supabase table missing quantity column. Inserting without quantity.');
            const { quantity: _, ...fallbackProd } = newProd;
            const retry = await supabaseClient.from('products').insert([fallbackProd]).select();
            data = retry.data;
            error = retry.error;
          }
          if (error) throw error;
          if (data && data[0]) {
            allProducts.push({ ...newProd, ...data[0] });
          }
        } catch (err) {
          showToast('Error saving product to Supabase: ' + err.message, 'error');
          return;
        }
      } else {
        newProd.id = 'p-' + Date.now();
        allProducts.push(newProd);
      }

      persistProductsDemo();
      addProductForm.reset();

      // Reset add form preview & presets
      const addPreview = document.getElementById('new-prod-preview');
      if (addPreview) addPreview.src = 'assets/images/pendant-rose-petal.webp';
      const addFileName = document.getElementById('new-prod-file-name');
      if (addFileName) addFileName.textContent = '';

      renderProducts();
      showToast(`Product "${name}" added to catalog!`, 'success');
    });
  }

  // --- IMAGE PREVIEW & PRESET CONTROLS INITIALIZATION ---
  function initImageControls() {
    // 1. Edit Modal Image Controls
    const editImgInput = document.getElementById('edit-prod-image');
    const editPresetSelect = document.getElementById('edit-prod-image-preset');
    const editFileInput = document.getElementById('edit-prod-file-input');
    const editFileName = document.getElementById('edit-prod-file-name');
    const editPreview = document.getElementById('edit-prod-preview');

    if (editImgInput && editPreview) {
      editImgInput.addEventListener('input', function () {
        editPreview.src = this.value.trim() || 'assets/images/pendant-rose-petal.webp';
      });
      editPreview.onerror = function () {
        this.src = 'assets/images/pendant-rose-petal.webp';
      };
    }

    if (editPresetSelect && editImgInput && editPreview) {
      editPresetSelect.addEventListener('change', function () {
        if (this.value) {
          editImgInput.value = this.value;
          editPreview.src = this.value;
          if (editFileName) editFileName.textContent = '';
        }
      });
    }

    if (editFileInput && editImgInput && editPreview) {
      editFileInput.addEventListener('change', function () {
        const file = this.files && this.files[0];
        if (file) {
          if (editFileName) editFileName.textContent = file.name;
          const reader = new FileReader();
          reader.onload = function (evt) {
            editImgInput.value = evt.target.result;
            editPreview.src = evt.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    // 2. Add Form Image Controls
    const addImgInput = document.getElementById('new-prod-image');
    const addPresetSelect = document.getElementById('new-prod-image-preset');
    const addFileInput = document.getElementById('new-prod-file-input');
    const addFileName = document.getElementById('new-prod-file-name');
    const addPreview = document.getElementById('new-prod-preview');

    if (addImgInput && addPreview) {
      addImgInput.addEventListener('input', function () {
        addPreview.src = this.value.trim() || 'assets/images/pendant-rose-petal.webp';
      });
      addPreview.onerror = function () {
        this.src = 'assets/images/pendant-rose-petal.webp';
      };
    }

    if (addPresetSelect && addImgInput && addPreview) {
      addPresetSelect.addEventListener('change', function () {
        if (this.value) {
          addImgInput.value = this.value;
          addPreview.src = this.value;
          if (addFileName) addFileName.textContent = '';
        }
      });
    }

    if (addFileInput && addImgInput && addPreview) {
      addFileInput.addEventListener('change', function () {
        const file = this.files && this.files[0];
        if (file) {
          if (addFileName) addFileName.textContent = file.name;
          const reader = new FileReader();
          reader.onload = function (evt) {
            addImgInput.value = evt.target.result;
            addPreview.src = evt.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }

  // --- 3. EVENTS MANAGEMENT ---
  const defaultEvents = [
    {
      id: 'e-1',
      title: 'Hands-On Resin Art Workshop: Beginner Essentials',
      event_date: '2026-11-20',
      venue: 'BIC MUET Innovation Hall, Jamshoro',
      is_upcoming: true
    },
    {
      id: 'e-2',
      title: 'Floral Preservation Masterclass: Garlands to Keepsakes',
      event_date: '2026-12-05',
      venue: 'Karachi Creative Hub / Online',
      is_upcoming: true
    }
  ];

  async function fetchEvents() {
    if (!isSupabaseConfigured() || isDemoMode) {
      allEvents = [...defaultEvents];
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      allEvents = data && data.length > 0 ? data : [...defaultEvents];
    } catch (err) {
      console.warn('[Admin] Fetch events error:', err);
      allEvents = [...defaultEvents];
    }
  }

  function renderEvents() {
    const tbody = document.getElementById('events-table-body');
    if (!tbody) return;

    if (allEvents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem;">No workshops scheduled.</td></tr>';
      return;
    }

    tbody.innerHTML = allEvents
      .map((ev) => `
        <tr>
          <td><strong>${escapeHtml(ev.title)}</strong></td>
          <td>${ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'TBA'}</td>
          <td>${escapeHtml(ev.venue || 'MUET Jamshoro')}</td>
          <td>
            <button class="btn btn-sm ${ev.is_upcoming ? 'btn-primary' : 'btn-secondary'} btn-toggle-event" 
                    data-id="${ev.id}" style="min-height: 32px; font-size: 0.76rem;">
              ${ev.is_upcoming ? 'Upcoming (Visible)' : 'Past / Hidden'}
            </button>
          </td>
          <td>
            <button class="btn-icon-action btn-delete-event" data-id="${ev.id}" title="Delete Workshop">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </td>
        </tr>
      `)
      .join('');

    tbody.querySelectorAll('.btn-toggle-event').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const id = this.dataset.id;
        const ev = allEvents.find((e) => e.id === id);
        if (ev) {
          await toggleEventStatus(id, !ev.is_upcoming);
        }
      });
    });

    tbody.querySelectorAll('.btn-delete-event').forEach((btn) => {
      btn.addEventListener('click', async function () {
        const id = this.dataset.id;
        if (confirm('Delete this workshop event?')) {
          await deleteEvent(id);
        }
      });
    });
  }

  async function toggleEventStatus(id, newStatus) {
    if (isSupabaseConfigured() && !isDemoMode) {
      try {
        const { error } = await supabaseClient.from('events').update({ is_upcoming: newStatus }).eq('id', id);
        if (error) throw error;
      } catch (err) {
        showToast('Error updating event status', 'error');
        return;
      }
    }
    const ev = allEvents.find((item) => item.id === id);
    if (ev) ev.is_upcoming = newStatus;
    renderEvents();
    showToast('Workshop status updated', 'success');
  }

  async function deleteEvent(id) {
    if (isSupabaseConfigured() && !isDemoMode) {
      try {
        const { error } = await supabaseClient.from('events').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        showToast('Error deleting event', 'error');
        return;
      }
    }
    allEvents = allEvents.filter((ev) => ev.id !== id);
    renderEvents();
    showToast('Event removed', 'info');
  }

  // Add Event Form
  const addEventForm = document.getElementById('add-event-form');
  if (addEventForm) {
    addEventForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      const title = document.getElementById('new-event-title').value.trim();
      const date = document.getElementById('new-event-date').value;
      const venue = document.getElementById('new-event-venue').value.trim();
      const description = document.getElementById('new-event-desc').value.trim();

      const newEv = {
        title,
        event_date: date || null,
        venue,
        description,
        image_url: 'assets/images/workshop-resin-basics.webp',
        is_upcoming: true
      };

      if (isSupabaseConfigured() && !isDemoMode) {
        try {
          const { data, error } = await supabaseClient.from('events').insert([newEv]).select();
          if (error) throw error;
          if (data && data[0]) allEvents.push(data[0]);
        } catch (err) {
          showToast('Error creating event in Supabase: ' + err.message, 'error');
          return;
        }
      } else {
        newEv.id = 'e-' + Date.now();
        allEvents.push(newEv);
      }

      addEventForm.reset();
      renderEvents();
      showToast('Workshop event created!', 'success');
    });
  }

  // --- FILTER & SEARCH EVENT LISTENERS ---
  const searchInput = document.getElementById('inquiries-search');
  if (searchInput) {
    searchInput.addEventListener('input', renderInquiries);
  }
  const filterStatusEl = document.getElementById('inquiries-filter-status');
  if (filterStatusEl) {
    filterStatusEl.addEventListener('change', renderInquiries);
  }
  const filterTypeEl = document.getElementById('inquiries-filter-type');
  if (filterTypeEl) {
    filterTypeEl.addEventListener('change', renderInquiries);
  }

  // Products Search & Filter Listeners
  const prodSearchInput = document.getElementById('products-search');
  if (prodSearchInput) {
    prodSearchInput.addEventListener('input', renderProducts);
  }
  const prodFilterCatEl = document.getElementById('products-filter-category');
  if (prodFilterCatEl) {
    prodFilterCatEl.addEventListener('change', renderProducts);
  }
  const prodFilterStockEl = document.getElementById('products-filter-stock');
  if (prodFilterStockEl) {
    prodFilterStockEl.addEventListener('change', renderProducts);
  }
  const prodFilterStatusEl = document.getElementById('products-filter-status');
  if (prodFilterStatusEl) {
    prodFilterStatusEl.addEventListener('change', renderProducts);
  }

  // --- ADMIN TABS ---
  const tabButtons = document.querySelectorAll('.admin-tab-btn');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      const target = this.dataset.tab;
      currentTab = target;

      tabButtons.forEach((b) => b.classList.remove('active'));
      this.classList.add('active');

      document.querySelectorAll('.admin-tab-content').forEach((sec) => {
        sec.style.display = 'none';
      });

      const activeContent = document.getElementById(`tab-content-${target}`);
      if (activeContent) activeContent.style.display = 'block';
    });
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // BOOTSTRAP
  document.addEventListener('DOMContentLoaded', function () {
    initImageControls();
    checkSession();
  });
})();
