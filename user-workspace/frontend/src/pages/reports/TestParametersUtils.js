/**
 * Utility functions for test parameters validation and formatting
 */

/**
 * Check if value is within normal range
 * @param {string} paramName - Parameter name
 * @param {string|number} value - Parameter value
 * @param {string} referenceRange - Reference range string
 * @param {string} patientGender - Patient gender (male, female, other)
 * @param {string|number} patientAge - Patient age
 * @returns {boolean} - True if value is within normal range
 */
export const isValueNormal = (paramName, value, referenceRange, patientGender, patientAge) => {
  // Blood Group doesn't have a normal/abnormal range for highlighting
  if (paramName === "Blood Group") {
    return true;
  }

  if (!value || !referenceRange) return true;

  // Handle special string-based parameters with select options
  const dropdownParams = {
    "Blood Group": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
    "SERUM FOR HBsAg TEST": ["POSITIVE", "NEGATIVE"],
    "HIV I": ["REACTIVE", "NON REACTIVE"],
    "HIV II": ["REACTIVE", "NON REACTIVE"],
    "RESULT": ["POSITIVE", "NEGATIVE"]
  };

  // Handle special string-based parameters with select options
  // For HIV I, HIV II, and RESULT, "reactive", "positive", or "present" are always abnormal.
  if (paramName === "HIV I" || paramName === "HIV II" || paramName === "RESULT") {
    const currentValue = value.toString().toLowerCase().trim();
    const isAbnormalText = currentValue === 'reactive' || currentValue === 'positive' || currentValue === 'present';
    console.log(`Checking abnormal text param: ${paramName}, value: ${currentValue}, isAbnormal: ${isAbnormalText}`);
    return !isAbnormalText; // Return false if it's an abnormal text value
  }

  if (Object.prototype.hasOwnProperty.call(dropdownParams, paramName)) {
    const normalValue = referenceRange.toLowerCase().trim();
    const currentValue = value.toString().toLowerCase().trim();
    console.log(`Checking dropdown param: ${paramName}, value: ${currentValue}, normal: ${normalValue}`);
    return currentValue === normalValue; // For other dropdowns, match the reference range
  }

  // Convert value to number (remove commas if present)
  const numValue = parseFloat(value.toString().replace(/,/g, ''));
  if (isNaN(numValue)) return true; // If value is not a number, consider it normal

  // Normalize patientAge to number if possible
  const ageNum = typeof patientAge === 'string' ? parseInt(patientAge, 10) : patientAge;

  // Trim referenceRange to avoid whitespace issues
  const trimmedRange = referenceRange.trim();

  // Special handling for SERUM ALK.PHOSPHATASE reference range with Adults and Children
  if (trimmedRange.includes('Adults') && trimmedRange.includes('Children')) {
    const adultsMatch = trimmedRange.match(/Adults\s*(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    const childrenMatch = trimmedRange.match(/Children\s*(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (adultsMatch && childrenMatch) {
      const adultsMin = parseFloat(adultsMatch[1]);
      const adultsMax = parseFloat(adultsMatch[2]);
      const childrenMin = parseFloat(childrenMatch[1]);
      const childrenMax = parseFloat(childrenMatch[2]);
      if (typeof ageNum === 'number' && !isNaN(ageNum)) {
        if (ageNum >= 18) {
          return numValue >= adultsMin && numValue <= adultsMax;
        } else {
          return numValue >= childrenMin && numValue <= childrenMax;
        }
      } else {
        return (numValue >= adultsMin && numValue <= adultsMax) || (numValue >= childrenMin && numValue <= childrenMax);
      }
    }
  }

  // Handle gender-specific ranges like "M - 13.5 - 18.0\nF - 11.5 - 16.4" or "M -00 -08mm , F- 00-20 mm"
  // Regex breakdown:
  // Male:\s*(\d+\.?\d*)\s*-\s*(\d+\.?\d*) - Captures Male min and max
  // .*\n? - Matches any characters (like units) and optional newline
  // Female:\s*(\d+\.?\d*)\s*-\s*(\d+\.?\d*) - Captures Female min and max
  const genderMatch = trimmedRange.match(/Male:\s*(\d+\.?\d*)\s*-\s*(\d+\.?\d*).*\n?Female:\s*(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/i);
  if (genderMatch) {
    // Groups are 1-based index
    const maleMin = parseFloat(genderMatch[1]);
    const maleMax = parseFloat(genderMatch[2]);
    const femaleMin = parseFloat(genderMatch[3]);
    const femaleMax = parseFloat(genderMatch[4]);
    
    console.log(`Gender match - Male range: ${maleMin}-${maleMax}, Female range: ${femaleMin}-${femaleMax}`);
    
    // Use the appropriate range based on patient gender
    if (patientGender === 'male' && !isNaN(maleMin) && !isNaN(maleMax)) {
      return numValue >= maleMin && numValue <= maleMax;
    } else if (patientGender === 'female' && !isNaN(femaleMin) && !isNaN(femaleMax)) {
      return numValue >= femaleMin && numValue <= femaleMax;
    } else {
      // If gender is not specified or is 'other', use the wider range
      const minValue = Math.min(maleMin, femaleMin);
      const maxValue = Math.max(maleMax, femaleMax);
      
      if (!isNaN(minValue) && !isNaN(maxValue)) {
        return numValue >= minValue && numValue <= maxValue;
      }
    }
  }

  // Specific check for CRP: "N -less than 6 mg/lt" means abnormal if >= 6
  if (paramName === "SERUM FOR C - REACTIVE PROTEINS" && trimmedRange.toLowerCase().includes("less than 6")) {
      const max = 6;
      console.log(`Specific CRP check - Max: ${max}, Value: ${numValue}`);
      const result = numValue < max; // Normal if strictly less than 6
      console.log(`Is value normal? ${result}`);
      return result;
  }
  
  // Clean the reference range by removing commas
  const cleanRange = trimmedRange.replace(/,/g, '');
  
  // Handle numeric ranges like "10-20", "10–20", "10 - 20", or "10 -- 20"
  const numericMatch = cleanRange.match(/(\d+\.?\d*)\s*(?:–|--|-)\s*(\d+\.?\d*)/);
  if (numericMatch) {
    const min = parseFloat(numericMatch[1]);
    const max = parseFloat(numericMatch[2]);
    
    console.log(`Numeric match - Range: ${min}-${max}, Value: ${numValue}`);
    
    if (!isNaN(min) && !isNaN(max)) {
      const result = numValue >= min && numValue <= max;
      console.log(`Is value normal? ${result}`);
      return result;
    }
  }
  
  // Handle "Up to X" format (e.g., "Upto 140 mg%")
  const upToMatch = cleanRange.match(/Up\s*to\s+(\d+\.?\d*)/i); // Made space optional after Up
  if (upToMatch) {
    const max = parseFloat(upToMatch[1]);
    console.log(`UpTo match for "${paramName}" - Max: ${max}, Value: ${numValue}`);
    if (!isNaN(max)) {
      const result = numValue <= max;
      console.log(`Is value normal? ${result}`);
      return result;
    }
  }
  
  // Handle ranges with < or > symbols like "<5" or ">10"
  const lessThanMatch = cleanRange.match(/\s*<\s*(\d+\.?\d*)/);
  if (lessThanMatch) {
    const max = parseFloat(lessThanMatch[1]);
    
    if (!isNaN(max)) {
      return numValue < max;
    }
  }
  
  const greaterThanMatch = cleanRange.match(/\s*>\s*(\d+\.?\d*)/);
  if (greaterThanMatch) {
    const min = parseFloat(greaterThanMatch[1]);
    
    if (!isNaN(min)) {
      return numValue > min;
    }
  }

  // Handle generic "less than X" text format (should be after specific checks)
  const lessThanTextMatch = cleanRange.match(/less\s+than\s+(\d+\.?\d*)/i);
  if (lessThanTextMatch) {
      const max = parseFloat(lessThanTextMatch[1]);
      if (!isNaN(max)) {
          console.log(`Generic Less Than Text match - Max: ${max}, Value: ${numValue}`);
          const result = numValue < max;
          console.log(`Is value normal? ${result}`);
          return result;
      }
  }
  
  // Debug log for unmatched reference ranges
  console.log(`Unmatched reference range format for "${paramName}":`, referenceRange);
  return true; // Default to normal if range format is not recognized
};

/**
 * Get row background color based on value
 * @param {string} paramName - Parameter name
 * @param {string|number} value - Parameter value
 * @param {string} referenceRange - Reference range string
 * @param {string} patientGender - Patient gender (male, female, other)
 * @param {string|number} patientAge - Patient age
 * @returns {string} - CSS class for row background
 */
export const getRowBackgroundColor = (paramName, value, referenceRange, patientGender, patientAge) => {
  if (!value || !referenceRange) return '';

  return isValueNormal(paramName, value, referenceRange, patientGender, patientAge)
    ? ''
    : 'bg-red-100 text-red-700 font-medium'; // Adjusted highlight style
};

// Export dropdown parameters for reuse
export const dropdownParams = {
  "Blood Group": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
  "SERUM FOR HBsAg TEST": ["POSITIVE", "NEGATIVE"],
  "HIV I": ["REACTIVE", "NON REACTIVE"],
  "HIV II": ["REACTIVE", "NON REACTIVE"],
  "RESULT": ["POSITIVE", "NEGATIVE"]
};
