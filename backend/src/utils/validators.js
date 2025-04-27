const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  // For login validation, we only check if the password is at least 6 characters
  // This is a basic check to ensure the password isn't empty or too short
  return password && password.length >= 6;
};

module.exports = {
  validateEmail,
  validatePassword
};
