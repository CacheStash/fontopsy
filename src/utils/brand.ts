export interface BrandConfig {
  name: string;
  url: string;
  favicon: string;
  displayDomain: string;
}

export const getBrandConfig = (): BrandConfig => {
  if (typeof window === 'undefined') {
    return {
      name: 'Subqi Studio',
      url: 'https://subqi.com',
      favicon: '/favicon-subqi.png',
      displayDomain: 'subqi.com',
    };
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

  // Default to Subqi Studio (fontopsy.subqi.com or localhost)
  return {
    name: 'Subqi Studio',
    url: 'https://subqi.com',
    favicon: '/favicon-subqi.png',
    displayDomain: 'subqi.com',
  };
};

export const applyBrandFavicon = (brand: BrandConfig) => {
  if (typeof document === 'undefined') return;
  try {
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.type = 'image/png';
    link.href = brand.favicon;
    document.title = `FONTOPSY • Font Inspector & Layers Tester by ${brand.name}`;
  } catch (err) {
    console.warn('Failed to apply brand favicon', err);
  }
};
