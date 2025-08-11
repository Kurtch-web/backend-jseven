export const validateEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const validatePhone = (phone: string) =>
  /^[\d+()\s-]{7,15}$/.test(phone); // simple global pattern
