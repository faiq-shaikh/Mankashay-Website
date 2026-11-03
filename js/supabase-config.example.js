/**
 * Mankashay - Supabase Configuration Template
 * 
 * INSTRUCTIONS:
 * 1. Make a copy of this file named "supabase-config.js" in this same directory.
 * 2. Log in to your Supabase Dashboard: https://supabase.com/dashboard
 * 3. Select your project and navigate to Project Settings > API.
 * 4. Copy the "Project URL" into SUPABASE_URL below.
 * 5. Copy the "anon" public API key into SUPABASE_ANON_KEY below.
 * 6. Execute the SQL statements from "/supabase-setup.sql" in your Supabase SQL Editor.
 */

const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.YOUR_ANON_KEY_HERE';

// Global Supabase client instance (accessible in forms.js, admin.js, shop.js, etc.)
let supabaseClient = null;

(function initSupabase() {
  if (
    typeof window !== 'undefined' &&
    typeof window.supabase !== 'undefined' &&
    SUPABASE_URL &&
    !SUPABASE_URL.includes('YOUR_PROJECT_ID') &&
    SUPABASE_ANON_KEY &&
    !SUPABASE_ANON_KEY.includes('YOUR_ANON_KEY')
  ) {
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('[Mankashay] Supabase initialized successfully.');
    } catch (err) {
      console.error('[Mankashay] Error initializing Supabase client:', err);
    }
  } else {
    console.info('[Mankashay] Running in static preview mode. Supabase credentials pending configuration.');
  }
})();
