-- ==============================================================================
-- MANKASHAY (Art that lasts forever) - Supabase Database Setup & Schema
-- Run this entire script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- ==============================================================================

-- 1. Create INQUIRIES Table
-- Stores contact form messages, custom order requests, preservation inquiries, and workshop signups
CREATE TABLE IF NOT EXISTS public.inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('contact', 'custom_order', 'preservation', 'workshop')),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    product_interest TEXT,
    message TEXT NOT NULL,
    source_page TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'closed')) NOT NULL
);

-- 2. Create PRODUCTS Table
-- Manages resin art catalog (pendants, keychains, flower preservations, and custom pieces)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC,
    quantity INTEGER DEFAULT 1 NOT NULL,
    image_url TEXT,
    category TEXT NOT NULL CHECK (category IN ('pendants', 'keychains', 'preservations', 'other')),
    is_active BOOLEAN DEFAULT true NOT NULL,
    sort_order INTEGER DEFAULT 0 NOT NULL
);

-- Migration if table already exists in an existing Supabase project:
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- 3. Create EVENTS Table
-- Manages workshops, exhibitions, and brand collaboration events
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE,
    venue TEXT,
    image_url TEXT,
    is_upcoming BOOLEAN DEFAULT true NOT NULL
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- INQUIRIES POLICIES
-- Anyone (public / anon) can submit an inquiry form
DROP POLICY IF EXISTS "Anon can insert inquiries" ON public.inquiries;
CREATE POLICY "Anon can insert inquiries"
    ON public.inquiries
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Authenticated admins can view, update, and delete inquiries
DROP POLICY IF EXISTS "Authenticated can view inquiries" ON public.inquiries;
CREATE POLICY "Authenticated can view inquiries"
    ON public.inquiries
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Authenticated can update inquiries" ON public.inquiries;
CREATE POLICY "Authenticated can update inquiries"
    ON public.inquiries
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated can delete inquiries" ON public.inquiries;
CREATE POLICY "Authenticated can delete inquiries"
    ON public.inquiries
    FOR DELETE
    TO authenticated
    USING (true);


-- PRODUCTS POLICIES
-- Public (anon) can only see active products
DROP POLICY IF EXISTS "Anon can view active products" ON public.products;
CREATE POLICY "Anon can view active products"
    ON public.products
    FOR SELECT
    TO anon
    USING (is_active = true);

-- Authenticated admins have full control of products
DROP POLICY IF EXISTS "Authenticated have full access to products" ON public.products;
CREATE POLICY "Authenticated have full access to products"
    ON public.products
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- EVENTS POLICIES
-- Public (anon) can only see upcoming events
DROP POLICY IF EXISTS "Anon can view upcoming events" ON public.events;
CREATE POLICY "Anon can view upcoming events"
    ON public.events
    FOR SELECT
    TO anon
    USING (is_upcoming = true);

-- Authenticated admins have full control of events
DROP POLICY IF EXISTS "Authenticated have full access to events" ON public.events;
CREATE POLICY "Authenticated have full access to events"
    ON public.events
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


-- ==============================================================================
-- SAMPLE SEED DATA
-- ==============================================================================

-- Insert initial sample products
INSERT INTO public.products (name, description, price, quantity, image_url, category, is_active, sort_order)
VALUES
    (
        'Rose Petal Teardrop Pendant',
        'Handcrafted teardrop pendant encasing deep crimson dried rose petals with subtle 18k gold foil flecks. Finished with an 18-inch gold-plated stainless steel chain.',
        1850,
        8,
        'assets/images/pendant-rose-petal.webp',
        'pendants',
        true,
        1
    ),
    (
        'Forget-Me-Not Oval Pendant',
        'Delicate sky-blue forget-me-not blossoms suspended in high-clarity UV-resistant resin with a vintage filigree bronze bezel.',
        2100,
        5,
        'assets/images/pendant-forgetmenot.webp',
        'pendants',
        true,
        2
    ),
    (
        'Botanical Monogram Letter Keychain',
        'Personalized resin initial keychain with dried white gypsophila (baby''s breath) and golden leaf accents. Includes premium alloy keyring and soft suede tassel.',
        1200,
        14,
        'assets/images/keychain-goldflake.webp',
        'keychains',
        true,
        3
    ),
    (
        'Dried Daisy Bar Keychain',
        'Crystal clear geometric resin bar with an intact miniature dried meadow daisy. Sturdy and water-resistant for daily keys.',
        1350,
        6,
        'assets/images/keychain-daisy.webp',
        'keychains',
        true,
        4
    ),
    (
        'Bridal Garland Keepsake Frame (6x6")',
        'Everlasting custom preservation of your Nikkah or wedding floral garland. Carefully freeze-dried and cast in premium high-gloss artist-grade resin block.',
        8500,
        2,
        'assets/images/preservation-bridal-frame.webp',
        'preservations',
        true,
        5
    ),
    (
        'Rose Petal Keepsake Heart',
        'Freestanding 3D resin heart infused with preserved rose petals and pearl shimmer, preserving sentimental memories for anniversaries or memorials.',
        4200,
        4,
        'assets/images/preservation-anniversary-heart.webp',
        'preservations',
        true,
        6
    ),
    (
        'Coastal Bloom Resin Vanity Tray',
        'Handmade decorative tray with genuine dried lavender, rose petals, and shimmering mica waves. Features polished brass side handles.',
        5400,
        3,
        'assets/images/art-ocean-tray.webp',
        'other',
        true,
        7
    ),
    (
        'Botanical Floral Bookmark',
        'Slim, flexible, and ultra-durable resin bookmark with hand-pressed wild blooms and a hand-tied blush silk tassel. A perfect gift for readers.',
        950,
        10,
        'assets/images/art-floral-bookmark.webp',
        'other',
        true,
        8
    )
ON CONFLICT DO NOTHING;

-- Insert initial sample events
INSERT INTO public.events (title, description, event_date, venue, image_url, is_upcoming)
VALUES
    (
        'Hands-On Resin Art Workshop: Beginner Essentials',
        'Join our master artist for an intimate 3-hour weekend masterclass. Learn safety, proper 2:1 epoxy mixing ratios, micro-bubble degassing, and creating your own custom floral pendant and keychain.',
        CURRENT_DATE + INTERVAL '18 days',
        'BIC MUET Innovation Hall, Jamshoro / Hyderabad',
        'assets/images/workshop-resin-basics.webp',
        true
    ),
    (
        'Floral Preservation Masterclass: Garlands to Keepsakes',
        'An intensive session on moisture removal techniques (silica sand desiccants), petal color retention, and multi-layer deep casting for bridal bouquets and Nikkah garlands.',
        CURRENT_DATE + INTERVAL '35 days',
        'Karachi Creative Hub & Online Live Interactive Stream',
        'assets/images/workshop-bridal-preservation.webp',
        true
    )
ON CONFLICT DO NOTHING;
