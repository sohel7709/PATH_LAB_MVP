// Helper function to determine abnormal flag based on value and reference range
const getAbnormalFlag = (value, referenceRange, gender) => {
  if (value === null || value === undefined || value === '' || !referenceRange) return 'normal'; // Handle empty/null values

  const valueStr = String(value).toLowerCase().trim();
  const trimmedRange = String(referenceRange).trim();
  const rangeStr = trimmedRange.toLowerCase();

  // --- Handle Text-Based Comparisons FIRST ---
  const isNegativeRange = rangeStr.includes('non reactive') || rangeStr.includes('negative');
  const isPositiveValue = valueStr.includes('reactive') || valueStr.includes('positive');

  if (isNegativeRange && isPositiveValue) {
    return 'high'; // Flag as abnormal (high) if value is positive/reactive when range is negative/non-reactive
  }
  // Add more text comparisons here if needed (e.g., specific grades like '+', '++', etc.)

  // --- Handle Numeric Comparisons ---
  // Attempt to clean and parse the value
  let numValue = NaN;
  // Remove common units or symbols before parsing
  const cleanedValueStr = valueStr.replace(/,/g, '').replace(/<|>/g, '').trim();
  if (cleanedValueStr !== '') {
      numValue = parseFloat(cleanedValueStr);
  }

  // If it's not a number AFTER checking text comparisons, it's likely normal text (e.g., "Nil", "Trace")
  if (isNaN(numValue)) {
      // Exception: Check if value is explicitly 'absent' when range is 'absent'
      if (valueStr === 'absent' && rangeStr === 'absent') return 'normal';
      // Consider other specific text values that should be normal if needed
      // e.g., if value is 'negative' and range is 'negative'
      if (valueStr === 'negative' && rangeStr === 'negative') return 'normal';
      if (valueStr === 'non reactive' && rangeStr === 'non reactive') return 'normal';
      // If value is purely text and doesn't match specific abnormal conditions above, treat as normal
      if (/^[a-zA-Z\s]+$/.test(valueStr) && !isPositiveValue) return 'normal';
      // Default for unparseable non-numeric that wasn't caught above
      return 'normal';
  }

  // Handle gender-specific ranges like "M - 13.5 - 18.0\nF - 11.5 - 16.4" or "M -00 -08mm , F- 00-20 mm"
  // More robust regex to handle variations in spacing and separators
  const genderMatch = trimmedRange.match(/M\s*[-:]?\s*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*).*\n?.*?F\s*[-:]?\s*(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/i);
  if (genderMatch) {
    const maleMin = parseFloat(genderMatch[1]);
    const maleMax = parseFloat(genderMatch[2]);
    const femaleMin = parseFloat(genderMatch[3]);
    const femaleMax = parseFloat(genderMatch[4]);
    const currentGender = String(gender).toLowerCase(); // Ensure gender is lowercase

    if (currentGender === 'male' && !isNaN(maleMin) && !isNaN(maleMax)) {
      if (numValue < maleMin) return 'low';
      if (numValue > maleMax) return 'high';
      return 'normal';
    } else if (currentGender === 'female' && !isNaN(femaleMin) && !isNaN(femaleMax)) {
      if (numValue < femaleMin) return 'low';
      if (numValue > femaleMax) return 'high';
      return 'normal';
    } else { // If gender is other or not specified, check against the wider range if sensible
      const min = Math.min(maleMin, femaleMin);
      const max = Math.max(maleMax, femaleMax);
      if (!isNaN(min) && !isNaN(max)) {
        if (numValue < min) return 'low';
        if (numValue > max) return 'high';
        return 'normal';
      }
    }
  }

   // Specific check for CRP: "N -less than 6 mg/lt" means abnormal if >= 6
   if (trimmedRange.toLowerCase().includes("less than 6")) {
      const max = 6;
      if (numValue >= max) return 'high'; // Abnormal if >= 6
      return 'normal';
   }

  // Handle numeric ranges like "10-20", "10–20", "10 - 20", or "10 -- 20"
  // Regex to capture numbers separated by various dashes/spaces
  const numericMatch = trimmedRange.match(/(\d+\.?\d*)\s*(?:–|--|-)\s*(\d+\.?\d*)/);
  if (numericMatch) {
    const min = parseFloat(numericMatch[1]);
    const max = parseFloat(numericMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      if (numValue < min) return 'low';
      if (numValue > max) return 'high';
      return 'normal';
    }
  }

  // Handle "Up to X" format (e.g., "Upto 140 mg%")
  const upToMatch = trimmedRange.match(/(?:Up\s*to|upto)\s+(\d+\.?\d*)/i);
  if (upToMatch) {
    const max = parseFloat(upToMatch[1]);
    if (!isNaN(max)) {
      if (numValue > max) return 'high';
      return 'normal';
    }
  }

  // Handle ranges with < or > symbols like "<5" or ">10" or "< 5.0"
  const lessThanMatch = trimmedRange.match(/<\s*(\d+\.?\d*)/);
  if (lessThanMatch) {
    const max = parseFloat(lessThanMatch[1]);
    if (!isNaN(max)) {
      if (numValue >= max) return 'high'; // Abnormal if >= max
      return 'normal';
    }
  }

  const greaterThanMatch = trimmedRange.match(/>\s*(\d+\.?\d*)/);
  if (greaterThanMatch) {
    const min = parseFloat(greaterThanMatch[1]);
    if (!isNaN(min)) {
      if (numValue <= min) return 'low'; // Abnormal if <= min
      return 'normal';
    }
  }

  // Handle generic "less than X" text format (should be after specific checks)
  const lessThanTextMatch = trimmedRange.match(/less\s+than\s+(\d+\.?\d*)/i);
  if (lessThanTextMatch) {
      const max = parseFloat(lessThanTextMatch[1]);
      if (!isNaN(max)) {
          if (numValue >= max) return 'high'; // Abnormal if >= max
          return 'normal';
      }
  }

  // Handle single value threshold (e.g., "0" or "Negative") - assumes value must match exactly if range is single non-numeric
  if (isNaN(parseFloat(rangeStr)) && !numericMatch && !upToMatch && !lessThanMatch && !greaterThanMatch && !lessThanTextMatch && !genderMatch) {
      // If range is text like "Negative", value must match "Negative" (case-insensitive) to be normal
      if (valueStr === rangeStr) return 'normal';
      // If range is text and value doesn't match, consider it abnormal (e.g., range "Negative", value "Positive")
      // This needs careful consideration based on expected text ranges.
      // For now, let's assume if it doesn't match a simple text range, it might be abnormal.
      // However, this could incorrectly flag things. Let's default to normal if unsure.
      // return 'high'; // Or potentially 'abnormal' without direction
      return 'normal'; // Safer default
  }


  // Default to normal if no numeric or specific text abnormality detected after all checks
  return 'normal';
};

module.exports = {
  getAbnormalFlag,
};
