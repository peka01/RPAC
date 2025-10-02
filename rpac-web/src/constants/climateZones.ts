export const countyToClimateZone: Record<string, 'Götaland' | 'Svealand' | 'Norrland'> = {
  'stockholm': 'Svealand',
  'uppsala': 'Svealand', 
  'sodermanland': 'Svealand',
  'ostergotland': 'Götaland',
  'jonkoping': 'Götaland',
  'kronoberg': 'Götaland',
  'kalmar': 'Götaland',
  'blekinge': 'Götaland',
  'skane': 'Götaland',
  'halland': 'Götaland',
  'vastra_gotaland': 'Götaland',
  'varmland': 'Svealand',
  'orebro': 'Svealand',
  'vastmanland': 'Svealand',
  'dalarna': 'Svealand',
  'gavleborg': 'Svealand',
  'vasternorrland': 'Norrland',
  'jamtland': 'Norrland',
  'vasterbotten': 'Norrland',
  'norrbotten': 'Norrland'
};

export const getClimateZoneFromCounty = (county: string): 'Götaland' | 'Svealand' | 'Norrland' => {
  return countyToClimateZone[county] || 'Svealand';
};

