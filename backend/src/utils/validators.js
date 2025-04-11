const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // Check if password is at least 8 characters long
  if (password.length < 8) return false;
  
  // Check if password contains at least one uppercase letter
  if (!/[A-Z]/.test(password)) return false;
  
  // Check if password contains at least one lowercase letter
  if (!/[a-z]/.test(password)) return false;
  
  // Check if password contains at least one number
  if (!/[0-9]/.test(password)) return false;
  
  // Check if password contains at least one special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
  
  return true;
};

module.exports = {
  validateEmail,
  validatePassword
};
