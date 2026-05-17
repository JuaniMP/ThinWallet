/**
 * Validadores reutilizables para formularios
 */

// Validación de monto: no puede ser negativo ni cero
export function isValidAmount(amount: number): boolean {
  return amount > 0 && !isNaN(amount);
}

// Validación de monto con mensaje
export function validateAmount(amount: number): string | null {
  if (amount === null || amount === undefined || amount === 0) {
    return "El monto es requerido";
  }
  if (amount < 0) {
    return "El monto no puede ser negativo";
  }
  if (!isFinite(amount)) {
    return "El monto debe ser un número válido";
  }
  return null;
}

// Validación de fecha: no puede ser en el futuro
export function isValidDate(date: string | Date): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return !isNaN(d.getTime()) && d <= new Date();
}

// Validación de fecha con mensaje
export function validateDate(date: string | Date): string | null {
  if (!date) {
    return "La fecha es requerida";
  }
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return "La fecha no es válida";
  }
  if (d > new Date()) {
    return "La fecha no puede ser en el futuro";
  }
  return null;
}

// Validación de nombre de usuario
export function isValidUsername(username: string): boolean {
  const trimmed = username.trim();
  // 3-20 caracteres, solo letras, números, guiones, guiones bajos
  const regex = /^[a-zA-Z0-9_-]{3,20}$/;
  return regex.test(trimmed);
}

// Validación de nombre de usuario con mensaje
export function validateUsername(username: string): string | null {
  if (!username || !username.trim()) {
    return "El nombre de usuario es requerido";
  }
  const trimmed = username.trim();
  if (trimmed.length < 3) {
    return "El nombre de usuario debe tener al menos 3 caracteres";
  }
  if (trimmed.length > 20) {
    return "El nombre de usuario no puede exceder 20 caracteres";
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return "El nombre de usuario solo puede contener letras, números, guiones y guiones bajos";
  }
  return null;
}

// Validación de moneda
export function isValidCurrency(currency: string): boolean {
  const validCurrencies = ["COP", "USD", "EUR"];
  return validCurrencies.includes(currency.toUpperCase());
}

// Validación de moneda con mensaje
export function validateCurrency(currency: string): string | null {
  if (!currency) {
    return "La moneda es requerida";
  }
  if (!isValidCurrency(currency)) {
    return "Moneda no válida";
  }
  return null;
}

// Validación de email
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Validación de email con mensaje
export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return "El correo es requerido";
  }
  if (!isValidEmail(email)) {
    return "El correo no es válido";
  }
  return null;
}

// Validación de contraseña fuerte
export function isStrongPassword(password: string): boolean {
  // Mínimo 8 caracteres, al menos una mayúscula, una minúscula, un número y un carácter especial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
}

// Validación de contraseña con mensaje detallado
export function validatePassword(password: string): string | null {
  if (!password) {
    return "La contraseña es requerida";
  }
  if (password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe contener al menos una letra minúscula";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe contener al menos una letra mayúscula";
  }
  if (!/\d/.test(password)) {
    return "La contraseña debe contener al menos un número";
  }
  if (!/[@$!%*?&]/.test(password)) {
    return "La contraseña debe contener al menos un carácter especial (@$!%*?&)";
  }
  return null;
}

// Validación de nombres/apellidos
export function validateName(name: string, fieldName: string = "Nombre"): string | null {
  if (!name || !name.trim()) {
    return `${fieldName} es requerido`;
  }
  if (name.trim().length < 2) {
    return `${fieldName} debe tener al menos 2 caracteres`;
  }
  if (name.trim().length > 50) {
    return `${fieldName} no puede exceder 50 caracteres`;
  }
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s'-]+$/.test(name.trim())) {
    return `${fieldName} solo puede contener letras, espacios, guiones y apóstrofes`;
  }
  return null;
}

// Validación de descripción/nombre de transacción
export function validateDescription(
  description: string,
  minLength: number = 3,
  maxLength: number = 100
): string | null {
  if (!description || !description.trim()) {
    return "La descripción es requerida";
  }
  if (description.trim().length < minLength) {
    return `La descripción debe tener al menos ${minLength} caracteres`;
  }
  if (description.trim().length > maxLength) {
    return `La descripción no puede exceder ${maxLength} caracteres`;
  }
  return null;}
