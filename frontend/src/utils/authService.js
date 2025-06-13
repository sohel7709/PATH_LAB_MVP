// frontend/src/utils/authService.js

/**
 * A simple service to hold a global reference to the logout handler
 * provided by AuthContext. This allows non-React modules (like API interceptors)
 * to trigger the logout logic defined within the React context.
 */

let logoutHandler = null;

/**
 * Sets the global logout handler. This should be called by AuthProvider
 * when it mounts, passing its forceLogoutWithPrompt function.
 * @param {function} handler - The logout function from AuthContext.
 */
export const setAuthLogoutHandler = (handler) => {
  logoutHandler = handler;
};

/**
 * Retrieves the global logout handler. This can be called by API interceptors
 * or other services to trigger a logout.
 * @returns {function | null} The logout function, or null if not set.
 */
export const getAuthLogoutHandler = () => {
  if (!logoutHandler) {
    console.warn(
      'getAuthLogoutHandler was called before setAuthLogoutHandler. ' +
      'Ensure AuthProvider sets the handler. Logout may not function correctly from interceptors.'
    );
  }
  return logoutHandler;
};
