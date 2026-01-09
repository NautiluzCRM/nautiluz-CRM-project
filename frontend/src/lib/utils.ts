import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatPhone = (value: string) => {
  if (!value) return "";
  
  // Remove tudo que não é número
  let v = value.replace(/\D/g, "");
  
  // Limita a 11 dígitos (DDD + 9 números)
  if (v.length > 11) v = v.slice(0, 11);
  
  // Aplica a máscara (XX) XXXXX-XXXX
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  
  return v;
};