import { Car, City } from "./types";

// Criado em: 2022-09-10
// Lista de cidades atendidas
export const CITIES: City[] = [
  { nome: "Camaçari", velocidade: 25, demanda: 1.0 },
  { nome: "Porto Alegre", velocidade: 22, demanda: 1.15 },
  { nome: "São Paulo", velocidade: 18, demanda: 1.40 },
  { nome: "Rio de Janeiro", velocidade: 20, demanda: 1.30 }
];

export const INITIAL_CARS: Car[] = [
  { nome: "Onix 1.0", consumo: 13.5, tipo: "popular", categoria: "X" },
  { nome: "Kwid", consumo: 14.0, tipo: "popular", categoria: "X" },
  { nome: "Mobi", consumo: 13.8, tipo: "popular", categoria: "X" },
  { nome: "Ka", consumo: 13.2, tipo: "popular", categoria: "X" },
  { nome: "HB20", consumo: 12.0, tipo: "popular", categoria: "Comfort" },
  { nome: "Onix Plus", consumo: 13.0, tipo: "popular", categoria: "Comfort" },
  { nome: "Virtus", consumo: 12.5, tipo: "popular", categoria: "Comfort" },
  { nome: "Polo", consumo: 12.8, tipo: "popular", categoria: "Comfort" },
  { nome: "Nivus Black", consumo: 12.5, tipo: "suv", categoria: "Black" },
  { nome: "Corolla Cross", consumo: 10.5, tipo: "suv", categoria: "Black" },
  { nome: "Civic", consumo: 11.0, tipo: "premium", categoria: "Black" },
  { nome: "Jetta", consumo: 10.8, tipo: "premium", categoria: "Black" }
];

export const TAXAS = {
  Uber: { X: 0.27, Comfort: 0.25, Black: 0.20 },
  "99": { X: 0.22, Comfort: 0.20, Black: 0.18 }
} as const;

export const PRECOS = {
  Uber: {
    X: { base: 3.50, km: 1.80, minuto: 0.25, nome: "Uber X" },
    Comfort: { base: 4.50, km: 2.20, minuto: 0.30, nome: "Uber Comfort" },
    Black: { base: 7.00, km: 3.50, minuto: 0.50, nome: "Uber Black" }
  },
  "99": {
    X: { base: 3.20, km: 1.60, minuto: 0.22, nome: "99 Pop" },
    Comfort: { base: 4.00, km: 2.00, minuto: 0.28, nome: "99 Top" },
    Black: { base: 6.50, km: 3.20, minuto: 0.45, nome: "99 Black" }
  }
} as const;

export const MAINTENANCE_THRESHOLDS = {
  OIL_CHANGE: 10000,
  TIRE_CHECK: 30000,
};

export const HOLIDAYS_2026 = [
  "2026-01-01", // Ano Novo
  "2026-02-16", // Carnaval
  "2026-02-17", // Carnaval
  "2026-04-03", // Sexta Santa
  "2026-04-21", // Tiradentes
  "2026-05-01", // Dia do Trabalho
  "2026-06-04", // Corpus Christi
  "2026-09-07", // Independência
  "2026-10-12", // Aparecida
  "2026-11-02", // Finados
  "2026-11-15", // República
  "2026-11-20", // Consciência Negra
  "2026-12-25", // Natal
];
