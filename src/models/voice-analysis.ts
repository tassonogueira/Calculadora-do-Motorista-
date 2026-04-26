export interface VoiceAnalysis {
  type: string;
  refinedTranscript?: string;
  assistantResponse?: string;
  distance?: number;
  value?: number;
  destination?: string;
  action?: string;
}
