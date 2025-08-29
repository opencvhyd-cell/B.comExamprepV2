/**
 * Utility functions for user-related operations
 */

/**
 * Generates initials from a user's name
 * @param name - The user's full name
 * @returns The initials (e.g., "JS" for "John Smith")
 */
export function generateUserInitials(name: string): string {
  if (!name || typeof name !== 'string') {
    return '?';
  }
  
  // Split the name into words and get the first letter of each
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word name - return first letter
    return words[0].charAt(0).toUpperCase();
  } else if (words.length >= 2) {
    // Multiple words - return first letter of first and last word
    const firstInitial = words[0].charAt(0).toUpperCase();
    const lastInitial = words[words.length - 1].charAt(0).toUpperCase();
    return firstInitial + lastInitial;
  }
  
  return '?';
}

/**
 * Generates a single initial from the first word of a name
 * @param name - The user's full name
 * @returns The first letter of the first word (e.g., "J" for "John Smith")
 */
export function generateSingleInitial(name: string): string {
  if (!name || typeof name !== 'string') {
    return '?';
  }
  
  const firstWord = name.trim().split(/\s+/)[0];
  return firstWord.charAt(0).toUpperCase();
}

/**
 * Gets a shortened display name for UI purposes
 * @param name - The user's full name
 * @param maxLength - Maximum length before truncating
 * @returns Shortened name or initials if too long
 */
export function getDisplayName(name: string, maxLength: number = 20): string {
  if (!name || typeof name !== 'string') {
    return 'User';
  }
  
  if (name.length <= maxLength) {
    return name;
  }
  
  // If name is too long, return initials
  return generateUserInitials(name);
}
