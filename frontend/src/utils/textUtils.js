/**
 * Safely converts any value to a string for rendering in React components
 * Prevents "Objects are not valid as a React child" errors
 * @param {any} value - The value to convert to string
 * @param {string} fallback - Fallback string if value is invalid (default: '')
 * @returns {string} Safe string for rendering
 */
export const safeText = (value, fallback = '') => {
  // Handle null, undefined
  if (value == null) {
    return fallback;
  }
  
  // Handle strings
  if (typeof value === 'string') {
    return value;
  }
  
  // Handle numbers, booleans
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  // Handle objects - extract meaningful text
  if (typeof value === 'object') {
    // If it's an array, join with commas
    if (Array.isArray(value)) {
      return value.map(item => safeText(item)).join(', ');
    }
    
    // If it's a user-like object, extract name
    if (value.full_name || value.username || value.name) {
      return value.full_name || value.username || value.name;
    }
    
    // If it has a toString method that's not the default Object toString
    if (value.toString && value.toString !== Object.prototype.toString) {
      return value.toString();
    }
    
    // Last resort: return fallback for objects
    return fallback;
  }
  
  // Handle functions and other types
  return fallback;
};

/**
 * Safely extracts user display name from user object or string
 * @param {any} user - User object or username string
 * @param {string} fallback - Fallback if no valid name found
 * @returns {string} User display name
 */
export const safeUserName = (user, fallback = 'User') => {
  if (!user) return fallback;
  
  if (typeof user === 'string') {
    return user.trim() || fallback;
  }
  
  if (typeof user === 'object') {
    return user.full_name || user.username || user.name || fallback;
  }
  
  return fallback;
}; 