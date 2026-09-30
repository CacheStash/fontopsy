export interface BrandConfig {
  name: string;
  url: string;
  favicon: string;
  displayDomain: string;
}

export const getBrandConfig = (): BrandConfig | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const hostname = window.location.hostname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);
  const brandParam = searchParams.get('brand')?.toLowerCase();

  // Check if hosted on fontopsy.bombastype.com or previewed with ?brand=bombastype
  if (hostname.includes('bombastype') || brandParam === 'bombastype') {
    return {
      name: 'Bombastype',
      url: 'https://bombastype.com',
      favicon: '/favicon-bombastype.png',
      displayDomain: 'bombastype.com',
    };
  }

  // Check if hosted on fontopsy.subqi.com or previewed with ?brand=subqi
  if (hostname.includes('subqi') || brandParam === 'subqi') {
    return {
      name: 'Subqi Studio',
      url: 'https://subqi.com',
      favicon: '/favicon-subqi.png',
      displayDomain: 'subqi.com',
    };
  }

  // Offline / localhost / desktop: return null to preserve v1.1 badge and default styling
  return null;
};

export const applyBrandFavicon = (brand: BrandConfig | null) => {
  if (typeof document === 'undefined') return;
  try {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (brand) {
      link.type = 'image/png';
      link.href = brand.favicon;
      document.title = `FONTOPSY • Font Inspector & Layers Tester by ${brand.name}`;
    } else {
      link.type = 'image/svg+xml';
      link.href = '/favicon.svg';
      document.title = 'FONTOPSY v1.1 • Font Inspector & Layers Tester';
    }
  } catch (err) {
    console.warn('Failed to apply brand favicon', err);
  }
};
