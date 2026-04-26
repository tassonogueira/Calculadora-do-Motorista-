import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DriverContext {
  carName: string;
  consumptionKmPerL: number;
  fuelPrice: number;
  variableCostPerKm: number; // Combustível + Desgaste
  fixedCostDaily: number;
  platform: string;
  category: string;
  taxPercent: number;
}

export const analyzeAudioInput = async (userInput: string, ctx?: DriverContext) => {
  // Otimização: Parser local imediato para comandos simples (Zero Latência)
  const inputLower = userInput.toLowerCase();
  if (inputLower === 'iniciar jornada' || inputLower === 'começar jornada' || inputLower.includes('iniciar agora')) {
    return { type: 'status', action: 'start', refinedTranscript: 'Iniciar Jornada' };
  }
  if (inputLower === 'encerrar jornada' || inputLower === 'parar jornada' || inputLower.includes('encerrar agora')) {
    return { type: 'status', action: 'stop', refinedTranscript: 'Encerrar Jornada' };
  }

  const systemInstruction = `
    Você é um assistente especializado para motoristas de aplicativo (Uber/99).
    Sua tarefa é analisar comandos de voz e responder em JSON.
    
    CONTEXTO DO MOTORISTA ATUAL:
    ${ctx ? `
    - Carro: ${ctx.carName} (${ctx.consumptionKmPerL} km/l)
    - Plataforma: ${ctx.platform} (${ctx.category})
    - Custo Variável: R$ ${ctx.variableCostPerKm.toFixed(2)}/km
    - Custo Fixo: R$ ${ctx.fixedCostDaily.toFixed(2)}/dia
    ` : 'Dados padrão'}
    
    INTENÇÕES:
    1. "status": Iniciar/Parar jornada.
    2. "ride": Analisar rentabilidade de uma corrida.
    3. "query": Perguntas sobre lucros, custos e metas.

    RESPOSTAS:
    - Retorne SEMPRE JSON.
    - Se for "query", seja breve e direto na "assistantResponse".
  `;

  try {
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: 'user', parts: [{ text: systemInstruction + "\n\nComando do usuário: " + userInput }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            refinedTranscript: { type: Type.STRING },
            assistantResponse: { type: Type.STRING },
            distance: { type: Type.NUMBER },
            value: { type: Type.NUMBER },
            destination: { type: Type.STRING },
            action: { type: Type.STRING },
          },
          required: ['type']
        }
      }
    });

    return JSON.parse(result.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    // Fallback básico
    if (userInput.includes("iniciar")) return { type: 'status', action: 'start', refinedTranscript: userInput };
    if (userInput.includes("parar") || userInput.includes("encerrar")) return { type: 'status', action: 'stop', refinedTranscript: userInput };
    return null;
  }
};
