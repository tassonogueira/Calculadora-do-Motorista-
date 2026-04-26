// src/utils/validation.ts
// Validações de domínio para motoristas
// Criado: 2022-10-15

import { z } from "zod";

// Schema para validação de entrada de jornada
export const journeySchema = z.object({
  earnings: z.number().min(0, "Valor não pode ser negativo"),
  km: z.number().min(0).max(1000, "KM excede limite diário"),
  hours: z.string().regex(/^\d{1,2}h \d{1,2}m$/, "Formato inválido"),
  car: z.string().min(1, "Carro obrigatório"),
});

export type JourneyInput = z.infer<typeof journeySchema>;

// Sanitização básica de texto
export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // remove tags HTML
    .trim()
    .substring(0, 500); // limite de tamanho
};

// Validar se valor monetário é razoável
export const isValidCurrency = (value: number, min = 0, max = 10000): boolean => {
  return !isNaN(value) && value >= min && value <= max;
};

// Validar se KM é razoável para uma jornada
export const isValidKm = (km: number): boolean => {
  return !isNaN(km) && km >= 0 && km <= 1000;
};
