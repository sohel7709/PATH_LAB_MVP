// Function to check if a value is outside the reference range
export const isOutsideRange = (value, referenceRange) => {
  if (!value || !referenceRange) return false;
  const cleanValue = value.toString().replace(/,/g, '');
  const cleanRange = referenceRange.toString().replace(/,/g, '');
  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) return false;

  try {
    // Handle ranges like "10 - 20" or "10 – 20"
    if (cleanRange.includes('-') || cleanRange.includes('–')) {
      const separator = cleanRange.includes('-') ? '-' : '–';
      const [min, max] = cleanRange.split(separator).map(v => parseFloat(v.trim()));
      if (!isNaN(min) && !isNaN(max)) return numValue < min || numValue > max;
    } 
    // Handle ranges like "< 10" or "<= 10"
    else if (cleanRange.startsWith('<') || cleanRange.startsWith('<')) { // Check for both HTML entity and char
      const maxString = cleanRange.startsWith('<') ? cleanRange.substring(4) : cleanRange.substring(1);
      const max = parseFloat(maxString.trim());
      return !isNaN(max) && numValue >= max; // Abnormal if >= max
    } else if (cleanRange.startsWith('≤')) {
      const max = parseFloat(cleanRange.substring(1).trim());
      return !isNaN(max) && numValue > max; // Abnormal if > max
    } 
    // Handle ranges like "> 50" or ">= 50"
    else if (cleanRange.startsWith('>') || cleanRange.startsWith('>')) { // Check for both HTML entity and char
      const minString = cleanRange.startsWith('>') ? cleanRange.substring(4) : cleanRange.substring(1);
      const min = parseFloat(minString.trim());
      return !isNaN(min) && numValue <= min; // Abnormal if <= min
    } else if (cleanRange.startsWith('≥')) {
      const min = parseFloat(cleanRange.substring(1).trim());
      return !isNaN(min) && numValue < min; // Abnormal if < min
    } 
    // Handle text ranges
    else if (cleanRange.toLowerCase().includes('less than')) {
      const max = parseFloat(cleanRange.toLowerCase().replace('less than', '').trim());
      return !isNaN(max) && numValue >= max; // Abnormal if >= max
    } else if (cleanRange.toLowerCase().includes('greater than')) {
      const min = parseFloat(cleanRange.toLowerCase().replace('greater than', '').trim());
      return !isNaN(min) && numValue <= min; // Abnormal if <= min
    }
  } catch (error) {
    console.warn('Invalid reference range format:', referenceRange, error);
  }

  // If none of the above conditions match or an error occurs, assume not outside range
  return false;
};
