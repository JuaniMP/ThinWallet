export function validateAmount(value: number | string): string {
  const n = Number(value);
  if (!value && value !== 0) return "El monto es requerido";
  if (isNaN(n) || n <= 0) return "El monto debe ser un número positivo";
  if (n > 1_000_000_000) return "El monto es demasiado alto";
  return "";
}

export function validateDescription(value: string): string {
  if (!value?.trim()) return "La descripción es requerida";
  if (value.trim().length < 2) return "La descripción debe tener al menos 2 caracteres";
  if (value.trim().length > 200) return "La descripción no puede superar 200 caracteres";
  return "";
}

export function validateDate(value: string): string {
  if (!value) return "La fecha es requerida";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "La fecha no es válida";
  return "";
}

export function validateCurrency(value: string): string {
  const valid = ["COP", "USD", "EUR", "GBP", "MXN", "BRL", "ARS", "PEN", "CLP"];
  if (!value) return "La moneda es requerida";
  if (!valid.includes(value.toUpperCase())) return "Moneda no soportada";
  return "";
}

export function validateName(value: string, field = "Campo"): string {
  if (!value?.trim()) return `${field} es requerido`;
  if (value.trim().length < 2) return `${field} debe tener al menos 2 caracteres`;
  if (value.trim().length > 100) return `${field} no puede superar 100 caracteres`;
  return "";
}

export function validateUsername(value: string): string {
  if (!value?.trim()) return "El nombre de usuario es requerido";
  if (value.length < 3) return "Mínimo 3 caracteres";
  if (value.length > 50) return "Máximo 50 caracteres";
  if (!/^[a-zA-Z0-9_.-]+$/.test(value)) return "Solo letras, números, _ . -";
  return "";
}

export function validateEmail(value: string): string {
  if (!value?.trim()) return "El correo es requerido";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Correo no válido";
  return "";
}

export function validatePassword(value: string): string {
  if (!value) return "La contraseña es requerida";
  if (value.length < 8) return "Mínimo 8 caracteres";
  if (!/[A-Z]/.test(value)) return "Debe contener al menos una mayúscula";
  if (!/[0-9]/.test(value)) return "Debe contener al menos un número";
  return "";
}
