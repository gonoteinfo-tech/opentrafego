// User Agent pools for realistic browser simulation
const DESKTOP_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 OPR/105.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
];

const MOBILE_USER_AGENTS = [
  'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/605.1.15',
  'Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/605.1.15'
];

// Refferer templates
const SEARCH_REFERRERS = [
  'https://www.google.com/',
  'https://www.google.com.br/',
  'https://www.bing.com/',
  'https://search.yahoo.com/',
  'https://duckduckgo.com/'
];

const SOCIAL_REFERRERS = [
  'https://www.facebook.com/',
  'https://t.co/', // Twitter shortener
  'https://www.instagram.com/',
  'https://www.linkedin.com/',
  'https://www.youtube.com/'
];

/**
 * Returns a random User Agent based on selected device percentages
 */
export function getRandomUserAgent(deviceType: 'desktop' | 'mobile'): string {
  const list = deviceType === 'desktop' ? DESKTOP_USER_AGENTS : MOBILE_USER_AGENTS;
  return list[Math.floor(Math.random() * list.length)];
}

/**
 * Generates a geotargeted IP address based on country, state or city preferences
 */
export function getGeotargetedIP(
  type: 'global' | 'country' | 'state' | 'city',
  country?: string,
  state?: string,
  city?: string
): string {
  // If global, choose a random country
  let selectedType = type;
  let selectedCountry = country;
  let selectedState = state;
  let selectedCity = city;

  if (selectedType === 'global') {
    const countries = ['BR', 'US', 'PT', 'ES', 'GB'];
    selectedCountry = countries[Math.floor(Math.random() * countries.length)];
    selectedType = 'country';
  }

  const randByte = () => Math.floor(Math.random() * 256);

  if (selectedType === 'state' && selectedState) {
    const stateToCities: Record<string, string[]> = {
      'GO': [
        'Goiânia', 'Anápolis', 'Aparecida de Goiânia', 'Rio Verde', 'Itumbiara',
        'Catalão', 'Jataí', 'Senador Canedo', 'Trindade', 'Formosa', 'Luziânia',
        'Valparaíso de Goiás', 'Caldas Novas', 'Ceres', 'Goianésia', 'Porangatu',
        'Mineiros', 'Pires do Rio', 'Inhumas', 'Jaraguá', 'Quirinópolis', 'Morrinhos', 'Cristalina'
      ],
      'SP': ['São Paulo', 'Campinas', 'Santos'],
      'RJ': ['Rio de Janeiro', 'Niterói'],
      'MG': ['Belo Horizonte', 'Uberlândia']
    };
    const cities = stateToCities[selectedState] || ['São Paulo'];
    selectedCity = cities[Math.floor(Math.random() * cities.length)];
    selectedType = 'city';
  }

  if (selectedType === 'city' && selectedCity) {
    const cityRanges: Record<string, string[]> = {
      'Goiânia': ['177.85.12', '186.232.40', '187.5.10'],
      'Anápolis': ['177.85.18', '186.232.65', '187.5.30'],
      'Aparecida de Goiânia': ['177.85.24', '186.232.70', '187.5.50'],
      'Rio Verde': ['177.85.32', '186.232.80', '187.5.60'],
      'Itumbiara': ['177.85.40', '186.232.85', '187.5.70'],
      'Catalão': ['177.85.48', '186.232.90', '187.5.80'],
      'Jataí': ['177.85.56', '186.232.95', '187.5.90'],
      'Senador Canedo': ['177.85.64', '186.232.100', '187.5.100'],
      'Trindade': ['177.85.72', '186.232.105', '187.5.110'],
      'Formosa': ['177.85.80', '186.232.120', '187.5.120'],
      'Luziânia': ['177.85.88', '186.232.125', '187.5.130'],
      'Valparaíso de Goiás': ['177.85.96', '186.232.130', '187.5.140'],
      'Caldas Novas': ['177.85.104', '186.232.135', '187.5.150'],
      'Ceres': ['177.85.112', '186.232.140', '187.5.160'],
      'Goianésia': ['177.85.120', '186.232.145', '187.5.170'],
      'Porangatu': ['177.85.128', '186.232.150', '187.5.180'],
      'Mineiros': ['177.85.136', '186.232.155', '187.5.190'],
      'Pires do Rio': ['177.85.144', '186.232.160', '187.5.200'],
      'Inhumas': ['177.85.152', '186.232.165', '187.5.210'],
      'Jaraguá': ['177.85.160', '186.232.170', '187.5.220'],
      'Quirinópolis': ['177.85.168', '186.232.175', '187.5.230'],
      'Morrinhos': ['177.85.176', '186.232.180', '187.5.240'],
      'Cristalina': ['177.85.184', '186.232.185', '187.5.250'],
      'Campinas': ['177.42.20', '186.220.15'],
      'Santos': ['177.42.30', '186.220.25'],
      'Brasília': ['200.142.10', '186.232.110', '177.200.15'],
      'São Paulo': ['200.204.5', '177.38.90', '201.24.44'],
      'Rio de Janeiro': ['200.156.40', '177.126.30', '187.32.15'],
      'Niterói': ['177.100.12', '189.120.45'],
      'Belo Horizonte': ['200.188.15', '177.95.80', '189.110.22'],
      'Uberlândia': ['177.150.80', '189.90.30']
    };
    const rangeList = cityRanges[selectedCity] || cityRanges['São Paulo'];
    const base = rangeList[Math.floor(Math.random() * rangeList.length)];
    return `${base}.${randByte()}`;
  }

  // Country based selection
  if (selectedCountry) {
    const countryRanges: Record<string, string[]> = {
      'BR': ['177', '179', '186', '189', '200.204', '201.24'],
      'US': ['72.14', '64.233.160', '8.8.8', '66.249', '208.80'],
      'PT': ['82.154', '194.65', '2.83'],
      'ES': ['80.58', '212.166', '88.6'],
      'GB': ['25', '62.253', '82.165']
    };
    const rangeList = countryRanges[selectedCountry] || countryRanges['BR'];
    const base = rangeList[Math.floor(Math.random() * rangeList.length)];
    
    // Check how many octets the base has
    const octets = base.split('.').length;
    if (octets === 3) return `${base}.${randByte()}`;
    if (octets === 2) return `${base}.${randByte()}.${randByte()}`;
    return `${base}.${randByte()}.${randByte()}.${randByte()}`;
  }

  // Fallback to random BR IP
  return `${[177, 179, 186, 200][Math.floor(Math.random() * 4)]}.${randByte()}.${randByte()}.${randByte()}`;
}

/**
 * Generates a random IP address (legacy wrapper)
 */
export function getRandomIP(): string {
  return getGeotargetedIP('global');
}

/**
 * Generates a realistic referrer URL based on config
 */
export function generateReferrer(
  type: 'direct' | 'search' | 'social' | 'custom',
  customList: string[] = [],
  keywords: string[] = []
): string {
  if (type === 'direct') return '';
  if (type === 'custom' && customList.length > 0) {
    return customList[Math.floor(Math.random() * customList.length)];
  }
  if (type === 'social') {
    return SOCIAL_REFERRERS[Math.floor(Math.random() * SOCIAL_REFERRERS.length)];
  }
  
  // Search engines with optional keywords
  const base = SEARCH_REFERRERS[Math.floor(Math.random() * SEARCH_REFERRERS.length)];
  if (keywords.length > 0 && (base.includes('google') || base.includes('bing'))) {
    const kw = encodeURIComponent(keywords[Math.floor(Math.random() * keywords.length)]);
    if (base.includes('google')) {
      return `${base}search?q=${kw}`;
    } else {
      return `${base}search?q=${kw}`;
    }
  }
  return base;
}

/**
 * Extracts GA4 (G-XXXXXXXXXX) or Universal Analytics (UA-XXXXX-Y) tags from HTML content
 */
export function extractAnalyticsId(html: string): { ga4Id: string | null; uaId: string | null } {
  const ga4Regex = /G-[A-Z0-9]{10}/g;
  const uaRegex = /UA-[0-9]+-[0-9]+/g;

  const ga4Matches = html.match(ga4Regex);
  const uaMatches = html.match(uaRegex);

  return {
    ga4Id: ga4Matches && ga4Matches.length > 0 ? ga4Matches[0] : null,
    uaId: uaMatches && uaMatches.length > 0 ? uaMatches[0] : null
  };
}

/**
 * Formats value as Currency (BRL)
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
}

/**
 * Formats large numbers for display (e.g. 15000 -> 15.000)
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('pt-BR').format(num);
}


