// src/hooks/useGeolocation.ts
// Hook para rastrear posição, velocidade e distância
// Criado: 2022-10-05

import { useState, useEffect, useRef } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  speed: number | null;        // velocidade em m/s (pode ser null)
  currentSpeedKmh: number;   // convertido para km/h
  maxSpeedKmh: number;      // máxima da sessão
  accuracy: number | null;
  error: string | null;
}

export const useGeolocation = (active: boolean) => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    speed: null,
    currentSpeedKmh: 0,
    maxSpeedKmh: 0,
    accuracy: null,
    error: null,
  });

  const watchIdRef = useRef<number | null>(null);
  const maxSpeedRef = useRef<number>(0);

  useEffect(() => {
    if (!active || !navigator.geolocation) {
      if (!navigator.geolocation) {
        setState(prev => ({ ...prev, error: "Geolocalização não suportada" }));
      }
      return;
    }

    // Reseta velocidade máxima ao iniciar
    maxSpeedRef.current = 0;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, speed, accuracy } = position.coords;

        // Converte speed (m/s) para km/h (speed pode ser null em alguns dispositivos)
        const speedKmh = speed !== null ? speed * 3.6 : 0;

        // Atualiza velocidade máxima
        if (speedKmh > maxSpeedRef.current) {
          maxSpeedRef.current = speedKmh;
        }

        setState({
          latitude,
          longitude,
          speed,
          currentSpeedKmh: speedKmh,
          maxSpeedKmh: maxSpeedRef.current,
          accuracy,
          error: null,
        });
      },
      (err) => {
        setState(prev => ({
          ...prev,
          error: `Erro de geolocalização: ${err.message}`
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [active]);

  return state;
};
