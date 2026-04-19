export interface Car {
  nome: string;
  consumo: number;
  tipo: 'popular' | 'suv' | 'premium';
  categoria: string;
}

export interface City {
  nome: string;
  velocidade: number;
  demanda: number;
}

export interface FixedExpenses {
  aluguel: number;
  parcela: number;
  seguro: number;
  outros: number;
}

export interface Journey {
  active: boolean;
  startTime: string | null;
  endTime: string | null;
  baseKm: number;
  currentKm: number;
  earnings: number;
  targetDaily: number;
  lastLat?: number;
  lastLon?: number;
}

export interface HistoryEntry {
  id: string;
  date: string; // ISO string or Locale string
  dateStr: string; // YYYY-MM-DD
  earnings: number;
  profit: number;
  km: number;
  hours: string;
  car: string;
  goal: number;
  goalMet: boolean;
}

export interface RideAnalysis {
  distancia: number;
  tempo: number;
  valor: number;
  embarque: number;
  plataforma: string;
  categoria: string;
}

export interface MaintenanceStatus {
  lastOilChangeKm: number;
  nextOilChangeKm: number;
  lastTireCheckKm: number;
  nextTireCheckKm: number;
}
