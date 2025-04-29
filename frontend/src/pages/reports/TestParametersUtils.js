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

  if (Object.prototype.hasOwnProperty.call(dropdownParams, paramName)) {
    const normalValue = referenceRange.toLowerCase().trim();
    const currentValue = value.toString().toLowerCase().trim();
    console.log(`Checking dropdown param: ${paramName}, value: ${currentValue}, normal: ${normalValue}`);
    return currentValue === normalValue;
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

  // Handle gender-specific ranges like "M: 13.5–18.0; F: 11.5–16.4"
  const genderMatch = trimmedRange.match(/M:\s*(\d+\.?\d*)[–-](\d+\.?\d*);\s*F:\s*(\d+\.?\d*)[–-](\d+\.?\d*)/);
  if (genderMatch) {
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
