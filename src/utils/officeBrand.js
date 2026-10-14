import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import habibLogo from '../assets/offices/habib-logo.png';

// Offices that show their own logo and name instead of the product brand
// (sidebar and login page), keyed by the office's name in the `offices`
// table (lowercase).
const OFFICE_BRANDS = {
  adeeb: {
    name: 'HABIB City Design',
    tagline: 'משרד הנדסה ועיצוב פנים',
    logo: habibLogo,
  },
};

// The login page shows before we know the user's office, so it uses the
// brand of the last office that signed in on this device.
const LAST_BRAND_KEY = 'last_office_brand';
const DEFAULT_TITLE = document.title;

export function getRememberedBrand() {
  try {
    return OFFICE_BRANDS[localStorage.getItem(LAST_BRAND_KEY)] || null;
  } catch {
    return null; // storage unavailable
  }
}

// The signed-in user's office brand, or null for offices without one.
export function useOfficeBrand(officeId) {
  const [brandKey, setBrandKey] = useState(null);

  useEffect(() => {
    if (!officeId) { setBrandKey(null); return; }
    let active = true;
    supabase.from('offices').select('name').eq('id', officeId).maybeSingle().then(({ data }) => {
      if (!active) return;
      const key = data?.name?.trim().toLowerCase() || '';
      setBrandKey(key);
      try {
        if (OFFICE_BRANDS[key]) localStorage.setItem(LAST_BRAND_KEY, key);
        else localStorage.removeItem(LAST_BRAND_KEY);
      } catch { /* storage unavailable — login page just stays generic */ }
    });
    return () => { active = false; };
  }, [officeId]);

  const brand = OFFICE_BRANDS[brandKey] || null;

  useEffect(() => {
    document.title = brand ? `${brand.name} · ניהול משרד` : DEFAULT_TITLE;
  }, [brand]);

  return brand;
}
