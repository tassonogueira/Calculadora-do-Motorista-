// src/services/voice-commands.ts
// Processamento de comandos de voz para motoristas
// Criado: 2022-11-03

import { VoiceCommandResult, DriverContext } from "../models/voice-analysis";

export const processVoiceCommand = async (
  userInput: string,
  ctx?: DriverContext
): Promise<VoiceCommandResult | null> => {
  // Parser local imediato para comandos simples (latência zero)
  const txt = userInput.toLowerCase();

  if (txt.includes('iniciar jornada') || txt.includes('começar jornada') || txt.includes('iniciar agora')) {
    return { type: 'status', action: 'start', refinedTranscript: 'Iniciar Jornada' };
  }

  if (txt.includes('encerrar jornada') || txt.includes('parar jornada') || txt.includes('encerrar agora')) {
    return { type: 'status', action: 'stop', refinedTranscript: 'Encerrar Jornada' };
  }

  // TODO: tratar casos de erro de rede aqui
  if (txt.includes('iniciar')) {
    return { type: 'status', action: 'start', refinedTranscript: userInput };
  }
  if (txt.includes('parar') || txt.includes('encerrar')) {
    return { type: 'status', action: 'stop', refinedTranscript: userInput };
  }

  return null;
};
