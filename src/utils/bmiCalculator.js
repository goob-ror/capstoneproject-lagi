/**
 * Calculate BMI (Body Mass Index / Indeks Massa Tubuh)
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {number|null} BMI value or null if invalid inputs
 */
export const calculateBMI = (weight, height) => {
  if (!weight || !height || weight <= 0 || height <= 0) {
    return null;
  }
  
  // Convert height from cm to meters
  const heightInMeters = height / 100;
  
  // BMI = weight (kg) / height² (m²)
  const bmi = weight / (heightInMeters * heightInMeters);
  
  return Math.round(bmi * 10) / 10; // Round to 1 decimal place
};

/**
 * Get BMI category based on BMI value
 * @param {number} bmi - BMI value
 * @returns {string} BMI category
 */
export const getBMICategory = (bmi) => {
  if (!bmi || bmi <= 0) {
    return '-';
  }
  
  if (bmi < 18.5) {
    return 'Kurus';
  } else if (bmi >= 18.5 && bmi <= 24.9) {
    return 'Normal';
  } else if (bmi >= 25 && bmi <= 29.9) {
    return 'Gemuk';
  } else {
    return 'Obese';
  }
};

/**
 * Get BMI category color for styling
 * @param {string} category - BMI category
 * @returns {string} Color class name
 */
export const getBMICategoryColor = (category) => {
  switch (category) {
    case 'Kurus':
      return 'bmi-underweight';
    case 'Normal':
      return 'bmi-normal';
    case 'Gemuk':
      return 'bmi-overweight';
    case 'Obese':
      return 'bmi-obese';
    default:
      return '';
  }
};
