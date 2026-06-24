// Resolve a gender-specific reference range to a plain "min - max" range string.
// Supports both formats used across the templates:
//   - "Male: 4620 - 11500 U/L\nFemale: 3930 - 10800 U/L"
//   - "M - 13.5 - 18.0\nF - 11.5 - 16.4"  and  "M -00 -08mm , F- 00-20 mm"
// Returns the original range unchanged when no gender block is present, so it is
// safe to call on every reference range before the normal numeric parsing.
export const resolveGenderRange = (referenceRange, gender) => {
  if (!referenceRange) return referenceRange;
  const range = String(referenceRange);

  // The negated class is case-insensitive (with /i), so a preceding letter (as in
  // the "m" inside "feMale") will not be treated as the start of a gender token.
  const maleMatch = range.match(/(?:^|[^a-z])(?:male|m)\s*[-:]?\s*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/i);
  const femaleMatch = range.match(/(?:^|[^a-z])(?:female|f)\s*[-:]?\s*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/i);

  // Only treat the string as a gender range when BOTH sub-ranges are present.
  if (!maleMatch || !femaleMatch) return referenceRange;

  const maleMin = parseFloat(maleMatch[1]);
  const maleMax = parseFloat(maleMatch[2]);
  const femaleMin = parseFloat(femaleMatch[1]);
  const femaleMax = parseFloat(femaleMatch[2]);

  const g = String(gender || '').toLowerCase();
  if (g === 'male') return `${maleMin} - ${maleMax}`;
  if (g === 'female') return `${femaleMin} - ${femaleMax}`;
  // Unknown/other gender: fall back to the widest span so clearly abnormal values still flag.
  return `${Math.min(maleMin, femaleMin)} - ${Math.max(maleMax, femaleMax)}`;
};

// Function to check if a value is outside the reference range
export const isOutsideRange = (value, referenceRange, gender) => {
  if (!value || !referenceRange) return false;
  const cleanValue = value.toString().replace(/,/g, '');
  const cleanRange = resolveGenderRange(referenceRange, gender).toString().replace(/,/g, '');
  const numValue = parseFloat(cleanValue);
  if (isNaN(numValue)) return false;

  try {
    // Handle ranges like "10 - 20" or "10 – 20"
    if (cleanRange.includes('-') || cleanRange.includes('–')) {
      const separator = cleanRange.includes('-') ? '-' : '–';
      const [min, max] = cleanRange.split(separator).map(v => parseFloat(v.trim()));
      if (!isNaN(min) && !isNaN(max)) return numValue < min || numValue > max;
    } 
    // Handle ranges like "< 10" or "&lt; 10"
    else if (cleanRange.startsWith('&lt;')) {
      const max = parseFloat(cleanRange.substring(4).trim());
      return !isNaN(max) && numValue >= max;
    } else if (cleanRange.startsWith('<')) {
      const max = parseFloat(cleanRange.substring(1).trim());
      return !isNaN(max) && numValue >= max;
    } else if (cleanRange.startsWith('≤')) {
      const max = parseFloat(cleanRange.substring(1).trim());
      return !isNaN(max) && numValue > max;
    }
    // Handle ranges like "> 50" or "&gt; 50"
    else if (cleanRange.startsWith('&gt;')) {
      const min = parseFloat(cleanRange.substring(4).trim());
      return !isNaN(min) && numValue <= min;
    } else if (cleanRange.startsWith('>')) {
      const min = parseFloat(cleanRange.substring(1).trim());
      return !isNaN(min) && numValue <= min;
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
      }

  // If none of the above conditions match or an error occurs, assume not outside range
  return false;
};

// Resolve the flag to DISPLAY for a result row, gender-aware and resilient to
// stale stored flags. When the value is numeric and the (gender-resolved)
// reference range is parseable, the direction is recomputed from the range so
// historical reports saved with genderless flags still render correctly.
// Falls back to the stored flag for non-numeric results (e.g. POSITIVE/REACTIVE)
// and always preserves an explicit "critical" flag.
// Returns one of: 'critical' | 'high' | 'low' | 'normal'.
export const getDisplayFlag = (value, referenceRange, gender, storedFlag) => {
  if (storedFlag === 'critical') return 'critical';
  const direction = getRangeDirection(value, referenceRange, gender);
  if (direction) return direction; // numeric + parseable range → authoritative
  // Not numerically determinable (text result, unparseable range) → trust stored flag
  if (storedFlag === 'high' || storedFlag === 'low') return storedFlag;
  return 'normal';
};

// Returns 'high' | 'low' | 'normal' when the value is numeric and the
// gender-resolved range is parseable, otherwise null (caller should fall back).
export const getRangeDirection = (value, referenceRange, gender) => {
  if (value === null || value === undefined || value === '' || !referenceRange) return null;
  const numValue = parseFloat(value.toString().replace(/,/g, ''));
  if (isNaN(numValue)) return null;
  const cleanRange = resolveGenderRange(referenceRange, gender).toString().replace(/,/g, '');
  const r = cleanRange.toLowerCase();

  // min - max  (hyphen or en dash)
  const rangeMatch = cleanRange.match(/(-?\d+\.?\d*)\s*[-–]\s*(-?\d+\.?\d*)/);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      if (numValue < min) return 'low';
      if (numValue > max) return 'high';
      return 'normal';
    }
  }
  // upper-bound forms: "< X", "≤ X", "less than X", "up to X"
  let m = cleanRange.match(/(?:&lt;|<|≤)\s*(\d+\.?\d*)/) || r.match(/(?:less than|up\s*to)\s+(\d+\.?\d*)/);
  if (m) { const max = parseFloat(m[1]); if (!isNaN(max)) return numValue > max ? 'high' : 'normal'; }
  // lower-bound forms: "> X", "≥ X", "greater than X"
  m = cleanRange.match(/(?:&gt;|>|≥)\s*(\d+\.?\d*)/) || r.match(/greater than\s+(\d+\.?\d*)/);
  if (m) { const min = parseFloat(m[1]); if (!isNaN(min)) return numValue < min ? 'low' : 'normal'; }

  return null; // unparseable → caller falls back to stored flag
};
