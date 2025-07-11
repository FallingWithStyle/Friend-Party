/**
 * Generates a random party code consisting of 4 uppercase letters and 2 digits
 * @returns A randomly generated party code
 */
export function generatePartyCode(): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Excluded similar-looking characters
  const numbers = '23456789'; // Excluded similar-looking numbers

  let code = '';

  // Generate 4 random letters
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }

  // Generate 2 random numbers
  for (let i = 0; i < 2; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
}