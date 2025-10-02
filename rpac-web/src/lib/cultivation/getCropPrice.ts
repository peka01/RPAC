export const getCropPrice = (cropName: string): number => {
  const cropPrices: Record<string, number> = {
    'Potatis': 2,
    'Morötter': 1,
    'Kål': 3,
    'Lökar': 0.5,
    'Tomater': 5,
    'Gurka': 4,
    'Sallat': 2,
    'Spinat': 1,
    'Bönor': 3,
    'Ärtor': 2,
    'Rädisor': 1,
    'Rotselleri': 4,
    'Lök': 0.5,
    'Sallad': 2,
    'Rödbeta': 2,
    'Morot': 1,
    'Salladslök': 1,
    'Tomat': 5,
    'Paprika': 4
  };
  return cropPrices[cropName] || 2; // Default price if crop not found
};
