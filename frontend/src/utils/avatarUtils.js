/**
 * Safely formats name prop for Avatar component to prevent .trim() errors
 * @param {any} name - The name value to format
 * @param {string} fallback - Fallback value if name is invalid (default: 'User')
 * @returns {string} Safe name string for Avatar component
 */
export const safeAvatarName = (name, fallback = 'User') => {
  // Check if name exists and is a string
  if (name && typeof name === 'string') {
    const trimmed = name.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }
  
  // Handle other data types
  if (name && typeof name === 'object') {
    // If it's an object, try to extract name properties
    const extracted = name.full_name || name.username || name.name;
    if (extracted && typeof extracted === 'string') {
      const trimmed = extracted.trim();
      return trimmed.length > 0 ? trimmed : fallback;
    }
  }
  
  // Return fallback for null, undefined, numbers, etc.
  return fallback;
}; 