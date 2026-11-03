# Mankashay &bull; Art that lasts forever

A minimal, aesthetic, fully responsive multi-page website with a Supabase (Postgres + Auth) backend for **Mankashay**, a handmade resin art and heirloom floral preservation business based at the **Business Incubation Center (BIC), Mehran University of Engineering and Technology (MUET)** in Jamshoro, Pakistan.

---

## 🌸 Brand Highlights & Tech Stack

- **Frontend:** Plain semantic HTML5, modern vanilla CSS with custom properties & design tokens, and vanilla JavaScript. Zero frameworks, zero build step, ultra-fast load time.
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL + Row-Level Security + Auth) via the `@supabase/supabase-js@2` CDN.
- **Design Identity:** Warm peach and cream backgrounds (`#F6DCCB`, `#FFF6EA`), deep plum (`#8A3556`), rose accent (`#D0587E`), and dusty pink (`#E8A3B8`). Typography combines *Cormorant Garamond* (headings) and *Plus Jakarta Sans* (body).
- **Core Product Lines:** Pendants, Keychains, Wedding Flower & Bridal Garland Preservations, Custom Art & Vanity Trays, and Hands-on Workshops.
- **Offline / Static Fallback:** If Supabase is not connected yet, the site gracefully falls back to curated static collections and validates inquiries in demo preview mode without breaking.

---

## 📁 Project Structure

```text
mankashay-website/
├── index.html                  # Homepage (Hero, Categories, Story snippet, Workshops teaser, Instagram strip)
├── shop.html                   # Shop Catalog (Category filter chips, dynamic/static products, quick inquiry modal)
├── custom-orders.html          # Custom Orders & Preservations (3-step process, options, full inquiry form)
├── workshops.html              # Workshops & Collabs (Dynamic/static event calendar, seat registration modal)
├── about.html                  # Brand Story, 5-stage handmade process, BIC MUET incubation highlight
├── contact.html                # Contact form, direct channels, shipping across Pakistan note
├── 404.html                    # Custom botanical 404 page
├── admin.html                  # Private admin dashboard (noindex, password auth, stat cards, inquiry manager)
├── css/
│   └── style.css               # Complete brand stylesheet, responsive design, animations & components
├── js/
│   ├── main.js                 # Mobile hamburger drawer, header scroll effect, scroll reveals, modal manager
│   ├── forms.js                # Form validation, honeypot spam guard, Supabase insert & offline fallback
│   ├── admin.js                # Admin auth, session check, stat counters, inquiry filter/status/delete, product/event CRUD
│   ├── supabase-config.js      # Real credentials (ignored in .gitignore)
│   └── supabase-config.example.js # Template credentials reference
├── assets/
│   ├── favicon.svg             # Scalable brand favicon (Plum "M" on Peach with lily botanical accent)
│   ├── favicon.png             # PNG favicon
│   └── images/
│       ├── logo.jpg / .webp    # Official Mankashay brand logo (150x150)
│       ├── hero.jpg / .webp    # Hero visual (1097x960)
│       └── [product/category placeholders] # Elegant WebP & JPG mockups ready for replacement
├── supabase-setup.sql          # Complete database schema, tables, RLS policies & sample seed rows
├── robots.txt                  # Public crawlers allowed, /admin.html disallowed
├── sitemap.xml                 # XML sitemap for SEO
├── .gitignore                  # Ignores js/supabase-config.js and system temp files
└── README.md                   # Setup, deployment and customization manual
```

---

## 🚀 Quick Start (Run Locally)

Because this is a pure static web application, you do **not** need Node, npm, or any build step. You only need a local HTTP server to run it cleanly.

### Option A: Using Python 3 (Already installed on your system)
Open your terminal in the project directory and run:
```bash
python3 -m http.server 8000
```
Then visit: **[http://localhost:8000](http://localhost:8000)**

### Option B: Using VS Code Live Server
1. Open the project folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and click **"Open with Live Server"**.

### Option C: Using npx serve (If Node is installed)
```bash
npx serve .
```

---

## 🗄️ Setting Up Supabase Backend

### 1. Create a Supabase Project
1. Go to [supabase.com](https://supabase.com) and log in or create a free account.
2. Click **New Project**, choose an organization, give your project a name (e.g. `mankashay-db`), and set a database password.
3. Choose the closest region (e.g., Singapore or Frankfurt).

### 2. Run the SQL Setup Script
1. In your Supabase Project Dashboard, click the **SQL Editor** icon on the left sidebar.
2. Click **New query**.
3. Copy the entire contents of `supabase-setup.sql` from this repository and paste it into the editor.
4. Click **Run** (or press Ctrl + Enter).
5. This creates:
   - Table `inquiries` (contact, custom order, preservation, and workshop requests)
   - Table `products` (active products, categories, pricing, images)
   - Table `events` (upcoming masterclasses and dates)
   - Complete Row-Level Security (RLS) policies allowing public anonymous submissions and read-only access to products/events, while reserving management to authenticated admins.
   - Initial sample seed rows.

### 3. Connect Frontend to Supabase
1. In your Supabase Dashboard, go to **Project Settings** (gear icon) &rarr; **API**.
2. Locate:
   - **Project URL** (e.g., `https://xyzcompany.supabase.co`)
   - **Project API keys** &rarr; `anon` / `public`
3. Open `js/supabase-config.js` in your editor:
   ```javascript
   const SUPABASE_URL = 'https://YOUR_ACTUAL_PROJECT_ID.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...YOUR_REAL_ANON_KEY';
   ```
4. Save the file. `js/supabase-config.js` is already in `.gitignore` so your keys are protected.

---

## 🔐 Admin Dashboard Setup (`admin.html`)

The admin dashboard is private and located at `/admin.html` (with `noindex, nofollow` meta tags).

### 1. Create Your Admin User in Supabase
1. In your Supabase Dashboard, navigate to **Authentication** &rarr; **Users**.
2. Click **Add User** &rarr; **Create User**.
3. Enter your admin email (e.g., `admin@mankashay.com`) and a strong password.
4. Toggle **Auto Confirm User?** to **ON** (so no email confirmation is required).
5. Click **Create User**.

### 2. Disable Public Sign-ups (Important!)
To ensure random visitors cannot sign up as admins:
1. In Supabase Dashboard, go to **Authentication** &rarr; **Providers** &rarr; **Email**.
2. Disable or uncheck **"Allow new users to sign up"**.
3. Click **Save**.

Now, only users you manually create in the Supabase Dashboard can sign in at `admin.html`.

### 3. Using the Dashboard
- Sign in with your email and password at `/admin.html`.
- **Inquiries Tab:** Search, filter by status (`new`, `contacted`, `closed`) and type (`preservation`, `custom_order`, `workshop`, `contact`). Change status inline or delete. Click "Email" to reply directly.
- **Products Tab:** View active catalog, add new products with price/category/image, toggle visibility on/off, or remove.
- **Workshops Tab:** Schedule upcoming workshops, set dates and venues, or toggle visibility.

---

## 🌐 Deployment Guide (Netlify or Vercel)

### Deploy to Netlify (Recommended - Free & Instant)
1. Push your repository to GitHub.
2. Log in to [Netlify](https://www.netlify.com/).
3. Click **Add new site** &rarr; **Import an existing project** &rarr; select your GitHub repo.
4. Configuration:
   - **Build command:** *(leave empty)*
   - **Publish directory:** `.` *(current directory / root)*
5. Click **Deploy Site**.
6. **Custom Domain:** Go to **Domain management** &rarr; **Add a custom domain** (e.g. `mankashay.com` or `mankashay.pk`). Configure your DNS CNAME / A records as prompted. Netlify automatically provisions free Let's Encrypt SSL.

### Deploy to Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** &rarr; **Project** &rarr; import your GitHub repo.
3. Framework Preset: **Other** (Root directory: `./`).
4. Click **Deploy**.
5. Go to **Settings** &rarr; **Domains** to connect your custom domain with free automatic SSL.

---

## 🎨 Asset Optimization Checklist

All images in `/assets/images/` are provided in modern **WebP** with fallback **JPG**, properly tagged with dimensions and `loading="lazy"` to guarantee fast initial paints and top Lighthouse performance.

### Files to replace when ready:
1. **Product & Artwork Photos:**
   - `assets/images/pendant-rose-petal.jpg` / `.webp` &rarr; High-res photo of Rose Petal Teardrop Pendant
   - `assets/images/pendant-forgetmenot.jpg` / `.webp` &rarr; High-res photo of Forget-Me-Not Pendant
   - `assets/images/keychain-goldflake.jpg` / `.webp` &rarr; High-res photo of Monogram Initial Keychain
   - `assets/images/keychain-daisy.jpg` / `.webp` &rarr; High-res photo of Daisy Bar Keychain
   - `assets/images/preservation-bridal-frame.jpg` / `.webp` &rarr; High-res photo of Bridal Nikkah Flower Frame
   - `assets/images/preservation-anniversary-heart.jpg` / `.webp` &rarr; High-res photo of Rose Petal Keepsake Heart
   - `assets/images/art-ocean-tray.jpg` / `.webp` &rarr; High-res photo of Ocean Vanity Tray
   - `assets/images/art-floral-bookmark.jpg` / `.webp` &rarr; High-res photo of Botanical Bookmark
2. **Studio & Workshop Photos:**
   - `assets/images/about-artisan.jpg` / `.webp` &rarr; Photo of your workspace / artisan crafting resin
   - `assets/images/about-bic-muet.jpg` / `.webp` &rarr; Photo at BIC MUET Jamshoro
   - `assets/images/workshop-resin-basics.jpg` / `.webp` &rarr; Workshop action photo
   - `assets/images/workshop-bridal-preservation.jpg` / `.webp` &rarr; Floral masterclass photo
3. **Contact Information:**
   - If using a specific WhatsApp business number or dedicated email other than `mankashay.art@gmail.com`, update the links in `index.html`, `contact.html`, and `js/supabase-config.js`.
4. **Supabase Credentials:**
   - Update `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `js/supabase-config.js`.

---

## 📋 Quality & Compliance Verification

- [x] Zero horizontal scrolling on all viewport sizes (320px mobile to 4K desktop).
- [x] Mobile menu (hamburger) with smooth open/close, backdrop, Escape key dismiss, and auto-close on link click.
- [x] Plum "M" on Peach favicon (`assets/favicon.svg` and `assets/favicon.png`) on every page.
- [x] Unique, descriptive `<title>` and `<meta name="description">` on all pages.
- [x] Semantic HTML5 structure with accessible skip links (`#main-content`).
- [x] Full keyboard navigation and visible focus rings meeting WCAG AA contrast standards.
- [x] Dynamic auto-updating copyright year.
- [x] Clickable email (`mailto:`) and Instagram links pointing to `https://instagram.com/mankashay_`.
- [x] Form spam protection via hidden honeypot.
- [x] Private admin dashboard at `/admin.html` with `noindex` tag, session checks, and full CRUD.
- [x] `sitemap.xml` and `robots.txt` disallowing `/admin.html`.

&copy; 2026 Mankashay &bull; Art that lasts forever.
