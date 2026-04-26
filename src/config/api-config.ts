// src/config/api-config.ts
// Configurações de API para o motorista
// Criado: 2022-10-20

// Configurar a base URL da API
export const API_BASE_URL = process.env.VITE_API_URL || "http://localhost:3001/api";

// Tempo limite para requisições
export const API_TIMEOUT = 10000; // 10 segundos

// Headers padrão
export const API_HEADERS = {
  "Content-Type": "application/json",
  "Accept": "application/json",
};
