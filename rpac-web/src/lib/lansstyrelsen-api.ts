/**
 * Länsstyrelsen API Integration
 * Provides access to official Swedish county authority data and resources
 */

export interface LansstyrelseLinksByCounty {
  mainPage: string;
  openData: string;
  crisisInfo: string;
  environment: string;
  nature: string;
}

/**
 * Get county-specific Länsstyrelsen links (ONLY verified working links)
 * Each county has its own Länsstyrelsen with dedicated pages
 * Only includes links confirmed to work across all counties
 */
export function getLansstyrelsenLinks(county: string): LansstyrelseLinksByCounty {
  // Normalize county name to lowercase for URL
  const countySlug = normalizeCountyForUrl(county);
  
  return {
    mainPage: `https://www.lansstyrelsen.se/${countySlug}/`, // ✅ Verified working
    openData: '', // Removed - 404 error
    crisisInfo: '', // Removed - 404 error
    environment: '', // Removed - 404 error
    nature: '' // Removed - 404 error
  };
}

/**
 * Normalize county names to URL-friendly format
 * Based on actual Länsstyrelsen URL structure
 * Handles case-insensitive input
 */
function normalizeCountyForUrl(county: string): string {
  // Normalize input by capitalizing first letter
  const normalizedCounty = county.charAt(0).toUpperCase() + county.slice(1).toLowerCase();
  
  const countyMap: Record<string, string> = {
    'Stockholm': 'stockholm',
    'Uppsala': 'uppsala',
    'Södermanland': 'sodermanland',
    'Östergötland': 'ostergotland',
    'Jönköping': 'jonkoping',
    'Kronoberg': 'kronoberg',
    'Kalmar': 'kalmar',
    'Gotland': 'gotland',
    'Blekinge': 'blekinge',
    'Skåne': 'skane',
    'Halland': 'halland',
    'Västra götaland': 'vastra-gotaland',
    'Värmland': 'varmland',
    'Örebro': 'orebro',
    'Västmanland': 'vastmanland',
    'Dalarna': 'dalarna',
    'Gävleborg': 'gavleborg',
    'Västernorrland': 'vasternorrland',
    'Jämtland': 'jamtland',
    'Västerbotten': 'vasterbotten',
    'Norrbotten': 'norrbotten'
  };

  return countyMap[normalizedCounty] || 'kronoberg';
}

/**
 * Get display name for county in Swedish (proper possessive form)
 * Handles case-insensitive input and normalizes to proper Swedish county name
 */
export function getCountyDisplayName(county: string): string {
  // Normalize input by capitalizing first letter
  const normalizedCounty = county.charAt(0).toUpperCase() + county.slice(1).toLowerCase();
  
  const displayNames: Record<string, string> = {
    'Stockholm': 'Stockholms län',
    'Uppsala': 'Uppsala län',
    'Södermanland': 'Södermanlands län',
    'Östergötland': 'Östergötlands län',
    'Jönköping': 'Jönköpings län',
    'Kronoberg': 'Kronobergs län',
    'Kalmar': 'Kalmar län',
    'Gotland': 'Gotlands län',
    'Blekinge': 'Blekinge län',
    'Skåne': 'Skåne län',
    'Halland': 'Hallands län',
    'Västra götaland': 'Västra Götalands län',
    'Värmland': 'Värmlands län',
    'Örebro': 'Örebro län',
    'Västmanland': 'Västmanlands län',
    'Dalarna': 'Dalarnas län',
    'Gävleborg': 'Gävleborgs län',
    'Västernorrland': 'Västernorrlands län',
    'Jämtland': 'Jämtlands län',
    'Västerbotten': 'Västerbottens län',
    'Norrbotten': 'Norrbottens län'
  };

  return displayNames[normalizedCounty] || `${normalizedCounty}s län`;
}

/**
 * Get official Swedish crisis information links
 */
export function getOfficialCrisisLinks() {
  return {
    krisinformation: {
      name: 'Krisinformation.se',
      url: 'https://www.krisinformation.se',
      description: 'Officiell nationell kanal för krisinformation'
    },
    msb: {
      name: 'MSB - Myndigheten för samhällsskydd och beredskap',
      url: 'https://www.msb.se',
      description: 'Nationell krisberedskapsmyndighet'
    },
    smhi: {
      name: 'SMHI Vädervarningar',
      url: 'https://www.smhi.se/vader/varningar',
      description: 'Aktuella vädervarningar och prognoser'
    },
    vma: {
      name: 'VMA - Viktigt Meddelande till Allmänheten',
      url: 'https://www.krisinformation.se/detta-kan-handa/storningar-i-samhallet/viktigt-meddelande-till-allmanheten-vma',
      description: 'Information om nationella varningssystem'
    }
  };
}

/**
 * Get available open data categories from Länsstyrelsen
 */
export function getAvailableOpenDataCategories() {
  return [
    {
      id: 'geodata',
      name: 'Geodata och kartor',
      description: 'Geografiska dataset och kartmaterial',
      icon: '🗺️'
    },
    {
      id: 'environment',
      name: 'Miljö och natur',
      description: 'Naturvård, skyddade områden och miljöövervakning',
      icon: '🌲'
    },
    {
      id: 'water',
      name: 'Vatten och fiske',
      description: 'Vatteninformation, vattenkvalitet och fiskedata',
      icon: '💧'
    },
    {
      id: 'wildlife',
      name: 'Vilt och jakt',
      description: 'Viltstatistik och jakttider',
      icon: '🦌'
    },
    {
      id: 'agriculture',
      name: 'Jordbruk och landsbygd',
      description: 'Lantbruksinformation och landsbygdsutveckling',
      icon: '🌾'
    },
    {
      id: 'crisis',
      name: 'Krisberedskap',
      description: 'Regional krisberedskap och säkerhet',
      icon: '🚨'
    }
  ];
}

/**
 * Check if Länsstyrelsen data is available (placeholder for future API integration)
 * Currently returns false as we're linking to websites rather than consuming APIs
 */
export async function checkLansstyrelsenDataAvailability(_county: string): Promise<boolean> {
  // Future: Implement actual API availability check
  // For now, we provide links to official websites
  return false;
}

