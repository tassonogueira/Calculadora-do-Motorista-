import { useState, useEffect, useRef } from 'react';
import { 
  Car as CarIcon, 
  Settings, 
  MapPin, 
  TrendingUp, 
  Clock, 
  Wallet, 
  AlertTriangle, 
  Mic, 
  History as HistoryIcon, 
  ChevronRight, 
  ChevronLeft,
  Fuel, 
  CarFront, 
  CheckCircle2,
  Play,
  Square,
  RefreshCw,
  PlusCircle,
  Calculator,
  Target,
  FileText,
  X,
  Calendar as CalendarIcon,
  Info,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processVoiceCommand } from './services/voice-commands';
import type { VoiceCommandResult } from './models/voice-analysis';
import { CITIES, INITIAL_CARS, TAXAS, PRECOS, MAINTENANCE_THRESHOLDS, HOLIDAYS_2026 } from './constants';
import { FixedExpenses, Journey, MaintenanceStatus, Car, HistoryEntry } from './types';

type ActiveView = 'dashboard' | 'simulation' | 'goals' | 'history' | 'settings' | 'report';

// Helpers
const formatCurrency = (value: number) => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

const maskCurrencyInput = (value: string) => {
  let raw = value.replace(/\D/g, '');
  if (!raw) return 'R$ 0,00';
  let num = parseInt(raw) / 100;
  return formatCurrency(num);
};

const parseCurrencyToNumber = (value: string) => {
  return parseFloat(value.replace(/\D/g, '')) / 100 || 0;
};

const CurrencyInput = ({ value, onChange, className, autoFocus, placeholder }: any) => {
  const [displayValue, setDisplayValue] = useState(formatCurrency(value));

  useEffect(() => {
    setDisplayValue(formatCurrency(value));
  }, [value]);

  return (
    <input
      type="text"
      inputMode="numeric"
      className={className}
      autoFocus={autoFocus}
      placeholder={placeholder}
      value={displayValue}
      onFocus={(e) => {
        // Move cursor to the end
        const val = e.target.value;
        e.target.value = '';
        e.target.value = val;
      }}
      onChange={(e) => {
        const raw = e.target.value;
        const num = parseCurrencyToNumber(raw);
        setDisplayValue(maskCurrencyInput(raw));
        onChange(num);
      }}
    />
  );
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Subcomponente: Calendário Interativo para Planejamento
const WorkCalendar = ({ selected, onToggle, holidays, workedDays, onViewReport }: { 
  selected: string[], 
  onToggle: (d: string) => void, 
  holidays: string[],
  workedDays: string[],
  onViewReport: (d: string) => void
}) => {
  const [viewDate, setViewDate] = useState(new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const todayStr = new Date().toISOString().split('T')[0];
  
  const changeMonth = (offset: number) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const monthName = viewDate.toLocaleString('pt-BR', { month: 'long' });

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(<div key={`empty-${i}`} />);
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().split('T')[0];
    const isSelected = selected.includes(dateStr);
    const isHoliday = holidays.includes(dateStr);
    const isWorked = workedDays.includes(dateStr);
    const isPast = dateStr < todayStr;
    const isToday = dateStr === todayStr;
    const dayOfWeek = date.getDay();
    const isSunday = dayOfWeek === 0;
    
    cells.push(
      <button 
        key={d} 
        disabled={isPast && !isWorked}
        onClick={() => isWorked ? onViewReport(dateStr) : onToggle(dateStr)}
        className={`w-full aspect-square text-[9px] font-bold rounded-lg flex flex-col items-center justify-center border transition-all relative ${
          isWorked 
            ? 'bg-red-50 border-red-200 text-red-600 shadow-sm ring-1 ring-red-100' 
            : (isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-gray-50 border-gray-100 text-gray-500 hover:border-blue-200')
        } ${isHoliday ? 'border-orange-300' : ''} ${isSunday && !isSelected && !isWorked ? 'text-red-400' : ''} ${isPast && !isWorked ? 'opacity-30 cursor-not-allowed grayscale' : ''} ${isToday ? 'ring-2 ring-blue-400 ring-offset-1' : ''}`}
      >
        <span className="text-[7px] font-black uppercase opacity-60">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][dayOfWeek]}
        </span>
        <span className="text-sm">{d}</span>
        {isHoliday && <div className={`w-1 h-1 rounded-full mt-0.5 ${isSelected ? 'bg-white' : 'bg-orange-400'}`} />}
        {isWorked && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft size={16} className="text-gray-400" />
        </button>
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{monthName} {year}</p>
        <button onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
};

export default function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [isSetupDone, setIsSetupDone] = useState(() => localStorage.getItem('setup_done') === 'true');
  const [isSessionConfirmed, setIsSessionConfirmed] = useState(false);
  const [expandedDetail, setExpandedDetail] = useState<string | null>(null);

  // --- Persistent State ---
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('driver_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Motorista',
      car: INITIAL_CARS[0],
      city: CITIES[0],
      platform: 'Uber' as 'Uber' | '99',
      category: 'X' as 'X' | 'Comfort' | 'Black',
      fuelPrice: 5.80,
      includeWear: true,
      experience: 'intermediario',
      preferredSchedule: 'pico'
    };
  });

  const [customCars, setCustomCars] = useState<Car[]>(() => {
    const saved = localStorage.getItem('custom_cars');
    return saved ? JSON.parse(saved) : [];
  });

  const [fixedExpenses, setFixedExpenses] = useState<FixedExpenses>(() => {
    const saved = localStorage.getItem('fixed_expenses');
    return saved ? JSON.parse(saved) : { aluguel: 0, parcela: 0, seguro: 0, outros: 0 };
  });

  const [journey, setJourney] = useState<Journey>(() => {
    const saved = localStorage.getItem('current_journey');
    return saved ? JSON.parse(saved) : {
      active: false,
      isPaused: false,
      startTime: null,
      endTime: null,
      lastPauseTime: null,
      totalPausedTime: 0,
      baseKm: 0,
      currentKm: 0,
      earnings: 0,
      targetDaily: 250,
    };
  });

  const [maintenance, setMaintenance] = useState<MaintenanceStatus>(() => {
    const saved = localStorage.getItem('maintenance_status');
    return saved ? JSON.parse(saved) : {
      lastOilChangeKm: 0,
      nextOilChangeKm: 10000,
      lastTireCheckKm: 0,
      nextTireCheckKm: 30000,
    };
  });

  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    const saved = localStorage.getItem('driver_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedReport, setSelectedReport] = useState<HistoryEntry | null>(null);
  const [isEndingJourney, setIsEndingJourney] = useState(false);
  const [finalEarningsInput, setFinalEarningsInput] = useState('');

  // Simulation State
  const [simHours, setSimHours] = useState(8);
  const [simGoal, setSimGoal] = useState(250);
  const [simPeriod, setSimPeriod] = useState<'diaria' | 'semanal' | 'mensal' | 'ciclo'>('diaria');
  const [effortPercent, setEffortPercent] = useState<number>(70);

  const [commandResult, setCommandResult] = useState<VoiceCommandResult | null>(null);
  const [schedulePlan, setSchedulePlan] = useState(() => {
    const saved = localStorage.getItem('schedule_plan');
    return saved ? JSON.parse(saved) : { pattern: 'todos', customDays: [] as string[] };
  });
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceInput, setVoiceInput] = useState("");
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef("");
  const [isAddingCar, setIsAddingCar] = useState(false);

  // --- Effects ---
  useEffect(() => {
    let watchId: number;
    if (journey.active && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setJourney(prev => {
            if (!prev.active) return prev;
            let kmToAdd = 0;
            if (prev.lastLat !== undefined && prev.lastLon !== undefined) {
              kmToAdd = calculateDistance(prev.lastLat, prev.lastLon, latitude, longitude);
            }
            // Small threshold to avoid GPS "drift" distance
            const DISTANCE_THRESHOLD = 0.05; // 50 meters
            const finalKm = kmToAdd > DISTANCE_THRESHOLD ? prev.currentKm + kmToAdd : prev.currentKm;
            
            return {
              ...prev,
              currentKm: finalKm,
              lastLat: latitude,
              lastLon: longitude
            };
          });
        },
        (err) => console.error("Erro GPS:", err),
        { enableHighAccuracy: true }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [journey.active]);

  useEffect(() => localStorage.setItem('driver_profile', JSON.stringify(profile)), [profile]);
  useEffect(() => localStorage.setItem('custom_cars', JSON.stringify(customCars)), [customCars]);
  useEffect(() => localStorage.setItem('fixed_expenses', JSON.stringify(fixedExpenses)), [fixedExpenses]);
  useEffect(() => localStorage.setItem('current_journey', JSON.stringify(journey)), [journey]);
  useEffect(() => localStorage.setItem('maintenance_status', JSON.stringify(maintenance)), [maintenance]);
  useEffect(() => localStorage.setItem('driver_history', JSON.stringify(history)), [history]);
  useEffect(() => localStorage.setItem('schedule_plan', JSON.stringify(schedulePlan)), [schedulePlan]);

  // --- Helpers ---
  const getWorkDaysCount = () => {
    if (schedulePlan.pattern === 'personalizado') {
      return schedulePlan.customDays.length || 1;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay(); // 0 is Sunday, 6 is Saturday
      const isHoliday = HOLIDAYS_2026.includes(dateStr);
      
      if (schedulePlan.pattern === 'todos') {
        count++;
      } else if (schedulePlan.pattern === 'uteis') {
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday) count++;
      } else if (schedulePlan.pattern === 'exceto-domingo') {
        if (dayOfWeek !== 0) count++;
      } else if (schedulePlan.pattern === 'fds') {
        if (dayOfWeek === 0 || dayOfWeek === 6) count++;
      }
    }
    return count || 1;
  };

  const allCars = [...INITIAL_CARS, ...customCars];
  const workingDaysInMonth = getWorkDaysCount();
  const totalFixedDaily = (fixedExpenses.aluguel + fixedExpenses.parcela + fixedExpenses.seguro + fixedExpenses.outros) / 30;
  const fixedDailyForPlan = (fixedExpenses.aluguel + fixedExpenses.parcela + fixedExpenses.seguro + fixedExpenses.outros) / workingDaysInMonth;
  const wearPerKm = profile.includeWear ? { popular: 0.12, suv: 0.16, premium: 0.20 }[profile.car.tipo as 'popular' | 'suv' | 'premium'] || 0.12 : 0;
  const costPerKm = (profile.fuelPrice / profile.car.consumo) + wearPerKm;

  const getElapsedHours = () => {
    if (!journey.startTime || !journey.active) return 0;
    const now = journey.isPaused && journey.lastPauseTime ? new Date(journey.lastPauseTime).getTime() : Date.now();
    const elapsed = now - new Date(journey.startTime).getTime() - (journey.totalPausedTime || 0);
    return Math.max(0, elapsed / 3600000);
  };

  const getTimeRemaining = () => {
    const elapsedHours = getElapsedHours();
    const hours = Math.floor(elapsedHours);
    const mins = Math.floor((elapsedHours % 1) * 60);
    return `${hours}h ${mins}m`;
  };

  const calculateFullReport = (p: typeof profile, h: number, customFixed?: number) => {
    const city = p.city;
    const precos = PRECOS[p.platform][p.category];
    const taxa = TAXAS[p.platform][p.category];
    const fixedDaily = customFixed !== undefined ? customFixed : totalFixedDaily;
    
    const kmRodados = city.velocidade * h;
    const minutosParados = h * 60 * 0.20;
    const fBruto = (precos.base + (kmRodados * precos.km) + (minutosParados * precos.minuto)) * city.demanda;
    const vTaxa = fBruto * taxa;
    const fLiquido = fBruto - vTaxa;
    const cComb = (kmRodados / p.car.consumo) * p.fuelPrice;
    const cWear = p.includeWear ? kmRodados * wearPerKm : 0;
    const cTotal = cComb + cWear;
    const lLiquido = fLiquido - cTotal - fixedDaily;

    return {
      fBruto, vTaxa, fLiquido, cComb, cWear, cTotal, lLiquido, kmRodados,
      lHora: lLiquido / h,
      lKm: lLiquido / kmRodados,
      cKm: cTotal / kmRodados,
      minKm: (cTotal / (1 - taxa)) / kmRodados
    };
  };

  const activeHours = journey.active ? (getElapsedHours() > 0.1 ? getElapsedHours() : simHours) : simHours;
  const report = calculateFullReport(profile, activeHours);
  
  const planResults = (() => {
    let daysInPeriod = 1;
    if (simPeriod === 'semanal') daysInPeriod = Math.max(1, Math.round(workingDaysInMonth / 4.3));
    else if (simPeriod === 'mensal' || simPeriod === 'ciclo') daysInPeriod = workingDaysInMonth;
    
    const dailyTarget = simGoal / daysInPeriod;
    // For planning, we work with the distributed fixed cost
    const planReport = calculateFullReport(profile, 8, fixedDailyForPlan);
    const neededHours = dailyTarget / planReport.lHora;
    const isFeasible = neededHours <= 12;
    const potentialMaxDaily = planReport.lHora * 12;
    const achievementPercent = (dailyTarget / potentialMaxDaily) * 100;
    
    // Detailed breakdown for the goal
    const targetReport = calculateFullReport(profile, neededHours > 0 ? neededHours : 0.001, fixedDailyForPlan);

    // Effort-based calculation (as per user request)
    const effortProfit = (effortPercent / 100) * potentialMaxDaily;
    const isUnderGoal = effortProfit < dailyTarget;

    return {
      dailyTarget,
      neededHours,
      isFeasible,
      potentialMaxDaily,
      achievementPercent, // required percent for the goal
      effortPercent,      // current user selection
      effortProfit,      // what user earns at this percent
      isUnderGoal,
      daysInPeriod,
      // Detalhamento diário
      fBruto: targetReport.fBruto,
      lLiquido: targetReport.lLiquido,
      cComb: targetReport.cComb,
      cWear: targetReport.cWear,
      vTaxa: targetReport.vTaxa,
      fixed: fixedDailyForPlan
    };
  })();

  const journeyNet = (() => {
    const km = journey.currentKm - journey.baseKm;
    const varCost = km * costPerKm;
    const tax = TAXAS[profile.platform][profile.category];
    const net = (journey.earnings * (1 - tax)) - varCost - (journey.active ? totalFixedDaily : 0);
    return net;
  })();

  // --- Handlers ---
  const handleStartJourney = () => {
    if (journey.active) return;
    setJourney(prev => ({ 
      ...prev, 
      active: true, 
      isPaused: false,
      startTime: new Date().toISOString(), 
      lastPauseTime: null,
      totalPausedTime: 0,
      baseKm: journey.currentKm,
      targetDaily: planResults.dailyTarget
    }));
  };

  const handlePauseJourney = () => {
    if (!journey.active || journey.isPaused) return;
    setJourney(prev => ({
      ...prev,
      isPaused: true,
      lastPauseTime: new Date().toISOString()
    }));
  };

  const handleResumeJourney = () => {
    if (!journey.active || !journey.isPaused || !journey.lastPauseTime) return;
    const pauseDuration = Date.now() - new Date(journey.lastPauseTime).getTime();
    setJourney(prev => ({
      ...prev,
      isPaused: false,
      lastPauseTime: null,
      totalPausedTime: (prev.totalPausedTime || 0) + pauseDuration
    }));
  };

  const handleEndJourney = () => {
    setIsEndingJourney(true);
    setFinalEarningsInput(journey.earnings.toString());
  };

  const confirmEndJourney = () => {
    const manualEarnings = parseFloat(finalEarningsInput) || 0;
    const kmDriven = journey.currentKm - journey.baseKm;
    const hoursStr = getTimeRemaining();
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    
    // Calcula lucro real do dia baseado no faturado
    const taxa = TAXAS[profile.platform][profile.category];
    const fLiquido = manualEarnings * (1 - taxa);
    const cComb = (kmDriven / profile.car.consumo) * profile.fuelPrice;
    const cWear = profile.includeWear ? kmDriven * { popular: 0.12, suv: 0.16, premium: 0.20 }[profile.car.tipo as any] || 0.12 : 0;
    const proRataFixed = fixedDailyForPlan;
    const realProfit = fLiquido - cComb - cWear - proRataFixed;
    
    const isGoalMet = manualEarnings >= journey.targetDaily;

    const newEntry: HistoryEntry = {
      id: Math.random().toString(36).substring(7),
      date: date.toLocaleString(),
      dateStr: dateStr,
      earnings: manualEarnings,
      profit: realProfit,
      km: kmDriven,
      hours: hoursStr,
      car: profile.car.nome,
      goal: journey.targetDaily,
      goalMet: isGoalMet
    };

    setHistory([newEntry, ...history]);
    setJourney(prev => ({ 
      ...prev, 
      active: false, 
      earnings: 0, 
      baseKm: prev.currentKm,
      lastLat: undefined,
      lastLon: undefined
    }));
    setIsEndingJourney(false);
    setFinalEarningsInput('');
    setActiveView('history');
  };

  const handleUpdateKm = () => {
    const input = prompt("Informe o KM atual:", journey.currentKm.toString());
    if (input) {
      const val = parseFloat(input);
      setJourney(prev => ({ ...prev, currentKm: val }));
      if (val >= maintenance.nextOilChangeKm) alert("Troca de Óleo Vencida!");
    }
  };

  const handleAddCar = (e: any) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newCar: Car = {
      nome: fd.get('nome') as string,
      consumo: parseFloat(fd.get('consumo') as string),
      tipo: fd.get('tipo') as any,
      categoria: fd.get('categoria') as string
    };
    setCustomCars([...customCars, newCar]);
    setIsAddingCar(false);
  };

  const handleConfirmSetup = () => {
    if (!profile.name.trim() || profile.name === 'Motorista') {
      alert("Por favor, informe seu nome para continuar.");
      return;
    }
    localStorage.setItem('setup_done', 'true');
    setIsSetupDone(true);
    setIsSessionConfirmed(true);
    setActiveView('dashboard');
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.1; 
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = async (textOverride?: string) => {
    const textToProcess = textOverride || voiceInput;
    if (!textToProcess.trim()) return;

    setIsAnalyzing(true);
    const result = await processVoiceCommand(textToProcess, {
      carName: profile.car.nome,
      consumptionKmPerL: profile.car.consumo,
      fuelPrice: profile.fuelPrice,
      variableCostPerKm: costPerKm,
      fixedCostDaily: totalFixedDaily,
      platform: profile.platform,
      category: profile.category,
      taxPercent: TAXAS[profile.platform][profile.category]
    });
    setIsAnalyzing(false);

    if (result) {
      setCommandResult(result);
      if (result.refinedTranscript) {
        setVoiceInput(result.refinedTranscript);
      }

      if (result.action === 'start') {
        handleStartJourney();
        speak("Jornada iniciada. Vamos faturar, boa sorte!");
      } else if (result.action === 'stop') {
        handleEndJourney();
        speak("Jornada encerrada. Descanso merecido, até amanhã!");
      }
    } else {
      speak("Comando não reconhecido, tente reformular.");
    }
    if (!textOverride) setVoiceInput("");
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceInput("Aperte e fale...");
      transcriptRef.current = "";
    };

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      // Deduplicação básica: remove palavras repetidas em sequência (erro comum de STT)
      const cleaned = transcript.replace(/\b(\w+)\s+\1\b/gi, '$1').trim();
      
      setVoiceInput(cleaned);
      transcriptRef.current = cleaned;
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      if (event.error === 'not-allowed') {
        alert("Acesso ao microfone negado. Por favor, verifique as permissões do seu navegador.");
      }
      setIsRecording(false);
      setVoiceInput("");
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      if (transcriptRef.current && transcriptRef.current !== "Aperte e fale...") {
        handleAiVoiceInput(transcriptRef.current);
      }
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const applySchedulePreset = (preset: string) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const newDays: string[] = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isHoliday = HOLIDAYS_2026.includes(dateStr);
      
      if (preset === 'todos') newDays.push(dateStr);
      else if (preset === 'uteis' && dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday) newDays.push(dateStr);
      else if (preset === 'seg-sab' && dayOfWeek !== 0) newDays.push(dateStr);
      else if (preset === 'fds' && (dayOfWeek === 0 || dayOfWeek === 6)) newDays.push(dateStr);
    }
    setSchedulePlan({ pattern: preset, customDays: newDays });
  };

  const renderNavButton = (view: ActiveView, icon: any, label: string) => {
    const isActive = activeView === view;
    return (
      <button 
        onClick={() => setActiveView(view)}
        className={`flex flex-col items-center gap-1 transition-all ${isActive ? 'text-blue-600' : 'text-gray-400 hover:text-blue-500'}`}
      >
        <motion.div
           animate={{ y: isActive ? -8 : 0 }}
           transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          {icon}
        </motion.div>
        <span className="text-[10px] font-bold uppercase tracking-tighter">{label}</span>
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 pb-24 font-sans">
      {/* Header */}
      <header className="bg-white px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg overflow-hidden font-black text-xs">
               {profile.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight text-gray-900 truncate max-w-[120px]">Olá, {profile.name}</h1>
              <p className="text-[9px] text-gray-400 font-mono tracking-widest uppercase">Driver Finance Pro</p>
            </div>
          </div>
        <div className="flex items-center gap-3">
          {journey.active && <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />}
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${journey.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
            {journey.active ? 'AO VIVO' : 'OFFLINE'}
          </span>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-6">
        
        {!isSetupDone ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 py-8">
            <div className="text-center space-y-2 mb-8">
              <h2 className="text-3xl font-black text-gray-900">Bem-vindo!</h2>
              <p className="text-gray-500 font-medium">Configure seu perfil base para começar.</p>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 space-y-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Seu Nome</label>
                  <input 
                    type="text" className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-transparent focus:border-blue-500 outline-none transition-all"
                    placeholder="Como podemos te chamar?"
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Seu Veículo Principal</label>
                  <select 
                    className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-transparent focus:border-blue-500 outline-none transition-all"
                    value={profile.car.nome}
                    onChange={e => setProfile({...profile, car: allCars.find(c => c.nome === e.target.value)!})}
                  >
                    {allCars.map(c => <option key={c.nome} value={c.nome}>{c.nome} ({c.consumo}km/L)</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Cidade Base</label>
                      <select 
                        className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-transparent focus:border-blue-500 outline-none transition-all"
                        value={profile.city.nome}
                        onChange={e => setProfile({...profile, city: CITIES.find(c => c.nome === e.target.value)!})}
                      >
                        {CITIES.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
                      </select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Preço Combustível</label>
                      <CurrencyInput
                        className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-transparent focus:border-blue-500 outline-none transition-all"
                        value={profile.fuelPrice}
                        onChange={(val: number) => setProfile({...profile, fuelPrice: val})}
                      />
                   </div>
                </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Aluguel / Parcela Mensal (R$)</label>
                    <CurrencyInput
                      className="w-full bg-gray-50 p-4 rounded-2xl font-bold border border-transparent focus:border-blue-500 outline-none transition-all"
                      value={fixedExpenses.aluguel + fixedExpenses.parcela + fixedExpenses.seguro + fixedExpenses.outros}
                      onChange={(val: number) => setFixedExpenses({...fixedExpenses, aluguel: val, parcela: 0, seguro: 0, outros: 0})}
                    />
                  </div>
              </div>

              <button 
                onClick={handleConfirmSetup}
                className="w-full bg-blue-600 text-white p-5 rounded-2xl font-black text-lg shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
              >
                CONFIRMAR E COMEÇAR <ChevronRight size={20} />
              </button>
            </div>
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
          {/* DASHBOARD VIEW */}
          {activeView === 'dashboard' && (
            <motion.div key="dash" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
              
              <div className="bg-white p-6 rounded-3xl shadow-xl shadow-gray-100 border border-blue-50">
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Saldo Líquido</p>
                      <h2 className={`text-2xl font-black ${journeyNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(journeyNet)}</h2>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">Meta Diária</p>
                      <h2 className="text-2xl font-black text-blue-600 truncate">{formatCurrency(journey.active ? journey.targetDaily : planResults.dailyTarget)}</h2>
                    </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                       <p className="text-[9px] font-bold text-gray-400 uppercase leading-none">Progresso da Meta</p>
                       <p className="text-lg font-black text-orange-500 leading-none">{Math.round((journeyNet / (journey.active ? journey.targetDaily : planResults.dailyTarget)) * 100)}%</p>
                       <p className="text-[8px] font-bold text-gray-400 uppercase mt-0.5">
                         {getTimeRemaining()} de {(journey.active ? (journey.targetDaily / (calculateFullReport(profile, 8, fixedDailyForPlan).lHora || 1)) : planResults.neededHours).toFixed(1)}h (Alvo)
                       </p>
                    </div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Tempo Online: <span className="text-gray-900">{getTimeRemaining()}</span></p>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden border border-gray-50">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${Math.min(100, (journeyNet / (journey.active ? journey.targetDaily : planResults.dailyTarget)) * 100)}%` }} 
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-600" 
                    />
                  </div>
                </div>
              </div>

              {!journey.active && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                      <Target size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-80 leading-none">Próxima Jornada</p>
                      <p className="text-sm font-black">Meta: R$ {planResults.dailyTarget.toFixed(0)} Brutos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase opacity-80 leading-none">Horas Estimadas</p>
                    <p className="text-sm font-black">{planResults.neededHours.toFixed(1)}h</p>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={journey.active ? handleEndJourney : handleStartJourney}
                    className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-bold transition-all ${journey.active ? 'bg-red-50 text-red-600' : 'bg-green-600 text-white shadow-lg shadow-green-100'}`}
                  >
                    {journey.active ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                    {journey.active ? 'ENCERRAR' : 'INICIAR'}
                  </button>
                  {journey.active && (
                    <button 
                      onClick={journey.isPaused ? handleResumeJourney : handlePauseJourney}
                      className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all ${journey.isPaused ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-orange-500 border-orange-200'}`}
                    >
                      {journey.isPaused ? <Play size={14} /> : <Clock size={14} />}
                      {journey.isPaused ? 'RETOMAR' : 'PAUSAR'}
                    </button>
                  )}
                </div>
                <button onClick={handleUpdateKm} className="p-4 bg-white border border-gray-100 rounded-2xl flex flex-col items-center gap-2 font-bold text-gray-600 hover:bg-gray-50 h-full justify-center">
                  <MapPin size={20} /> ATUALIZAR KM
                </button>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-gray-100 flex flex-col items-center justify-center space-y-6 relative overflow-hidden">
                <div className="absolute top-4 left-6 flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                  <Mic size={12} className="text-blue-500" /> Assistente Ativo
                </div>
                
                <div className="relative flex items-center justify-center w-32 h-32">
                  <AnimatePresence>
                    {isRecording && (
                      <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.5, opacity: 0.2 }}
                        exit={{ scale: 2, opacity: 0 }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-red-400 rounded-full"
                      />
                    )}
                  </AnimatePresence>
                  
                  <button 
                    onMouseDown={startVoiceRecognition}
                    onMouseUp={stopVoiceRecognition}
                    onTouchStart={(e) => { e.preventDefault(); startVoiceRecognition(); }}
                    onTouchEnd={(e) => { e.preventDefault(); stopVoiceRecognition(); }}
                    className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-2xl ${
                      isRecording ? 'bg-red-600 scale-110 shadow-red-200' : 'bg-blue-600 shadow-blue-200 hover:scale-105'
                    }`}
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="text-white animate-spin" size={40} />
                    ) : (
                      <Mic className="text-white" size={40} />
                    )}
                  </button>
                </div>

                <div className="text-center space-y-1">
                  <p className="text-xs font-black text-gray-800 uppercase tracking-tight">
                    {isAnalyzing ? "Processando sua voz..." : (isRecording ? "Pode falar, estou ouvindo!" : "Segure para falar")}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium">Analise corridas ou mude seu status</p>
                </div>

                {commandResult && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }} 
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="w-full relative pt-4 border-t border-gray-50"
                  >
                    <button 
                      onClick={() => setCommandResult(null)}
                      className="absolute top-2 right-0 p-1 bg-gray-100 text-gray-400 rounded-lg hover:text-red-500 transition-colors z-20"
                    >
                      <X size={14} />
                    </button>

                    {commandResult.type === "ride" && (
                       <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Comando: {commandResult.refinedTranscript}</p>
                          <div className="flex justify-between font-bold text-blue-900"><span>{formatCurrency(commandResult.value || 0)} • {commandResult.distance}km</span> <span className="text-xs uppercase">{formatCurrency((commandResult.value || 0)/(commandResult.distance || 1))}/km</span></div>
                          <div className={`text-xs font-bold p-2 rounded text-center ${(commandResult.value || 0)/(commandResult.distance || 1) >= 2.5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {(commandResult.value || 0/commandResult.distance || 1) >= 2.5 ? '✅ RECOMENDADO: ALTA RENTABILIDADE' : '⚠️ BAIXA RENTABILIDADE'}
                          </div>
                       </div>
                    )}
                    {commandResult.type === 'status' && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-bold text-center border border-green-100 uppercase">
                        Comando: {commandResult.refinedTranscript || (commandResult.action === 'start' ? 'Iniciar' : 'Encerrar')}
                      </motion.div>
                    )}
                    {commandResult.type === 'query' && commandResult.assistantResponse && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-orange-50 text-orange-700 rounded-2xl text-sm font-bold border border-orange-100 italic">
                        {commandResult.assistantResponse}
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* SIMULATION VIEW */}
          {activeView === 'simulation' && (
            <motion.div key="sim" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setActiveView('dashboard')} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm"><ChevronLeft size={20}/></button>
                <h2 className="font-bold text-xl">Simulação</h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-6">
                <div className="flex items-center justify-between"><h2 className="font-bold">Calculadora de Simulação</h2> <button onClick={() => setActiveView('report')} className="text-blue-600 text-xs font-bold underline">Relatório Full</button></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Horas Trabalho</label>
                    <input 
                      type="number" 
                      step="0.1"
                      className="w-full bg-gray-50 p-3 rounded-xl border border-transparent focus:border-blue-500 outline-none font-bold" 
                      value={isNaN(simHours) ? '' : simHours} 
                      onChange={e => setSimHours(parseFloat(e.target.value))} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Preço Combustível</label>
                    <CurrencyInput
                      className="w-full bg-gray-50 p-3 rounded-xl border border-transparent focus:border-blue-500 outline-none font-bold"
                      value={profile.fuelPrice}
                      onChange={(val: number) => setProfile({...profile, fuelPrice: val})}
                    />
                  </div>
                </div>
                 <div className="p-4 bg-blue-600 rounded-2xl text-white">
                   <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-[10px] opacity-70 uppercase font-bold">Faturamento Est.</p><p className="text-xl font-black">{formatCurrency(report.fBruto)}</p></div>
                      <div><p className="text-[10px] opacity-70 uppercase font-bold">Lucro Líquido</p><p className="text-xl font-black">{formatCurrency(report.lLiquido)}</p></div>
                   </div>
                   <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-[11px]">
                     <p>Lucro/Hora: <b>{formatCurrency(report.lHora)}</b></p>
                     <p>Custo/KM: <b>{formatCurrency(report.cTotal/report.kmRodados)}/km</b></p>
                   </div>
                 </div>
                <div className="text-center"><button onClick={() => { setHistory([{ date: 'Simulação ' + new Date().toLocaleTimeString(), earnings: report.fBruto, profit: report.lLiquido, km: report.kmRodados, hours: simHours + 'h', car: profile.car.nome }, ...history]); alert("Salvo no Histórico!"); }} className="text-sm font-bold text-blue-600">Salvar nos Registros</button></div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm">Dashboard Comparativo</h3>
                <div className="space-y-2">
                  {allCars.filter(c => c.categoria === profile.category).map(c => {
                    const l = calculateFullReport({...profile, car: c}, simHours).lLiquido;
                    return (
                      <div key={c.nome} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div><p className="text-xs font-bold">{c.nome}</p><p className="text-[10px] text-gray-400">{c.consumo} km/L</p></div>
                        <div className="text-right"><p className="text-sm font-bold text-green-600">{formatCurrency(l)}</p><p className="text-[9px] text-gray-400">Total jornada</p></div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* GOALS VIEW - PLANO DE AÇÃO */}
          {activeView === 'goals' && (
            <motion.div key="goals" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setActiveView('dashboard')} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm"><ChevronLeft size={20}/></button>
                <h2 className="font-bold text-xl">Plano de Ação</h2>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-sm uppercase tracking-widest text-gray-500">1. Sua Meta</h2>
                  <Target size={18} className="text-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Valor Alvo (R$)</label>
                    <CurrencyInput
                      className="w-full bg-gray-50 p-3 rounded-xl border border-transparent focus:border-blue-500 outline-none font-bold"
                      value={simGoal}
                      onChange={(val: number) => setSimGoal(val)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Tipo de Meta</label>
                    <select className="w-full bg-gray-50 p-3 rounded-xl font-bold" value={simPeriod} onChange={e => setSimPeriod(e.target.value as any)}>
                      <option value="diaria">Meta p/ Dia</option>
                      <option value="semanal">Meta p/ Semana</option>
                      <option value="mensal">Meta p/ Mês</option>
                      <option value="ciclo">Ciclo (30 dias)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-sm uppercase tracking-widest text-gray-500">2. Escala de Trabalho</h2>
                  <CalendarIcon size={18} className="text-blue-500" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'uteis', label: 'Úteis' },
                      { id: 'seg-sab', label: 'Seg-Sáb' },
                      { id: 'fds', label: 'FDS' },
                      { id: 'personalizado', label: 'Livre' }
                    ].map(p => (
                      <button 
                        key={p.id}
                        onClick={() => applySchedulePreset(p.id)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border ${
                          schedulePlan.pattern === p.id ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-50 border-gray-100 text-gray-400'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                    <button 
                      onClick={() => setSchedulePlan({ pattern: 'personalizado', customDays: [] })}
                      className="px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-all border bg-red-50 border-red-100 text-red-500 hover:bg-red-100"
                    >
                      Limpar
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex justify-between items-center mb-4 px-2">
                      <div className="flex items-center gap-1">
                         <div className="w-2 h-2 bg-orange-400 rounded-full" />
                         <span className="text-[9px] font-bold text-gray-400 uppercase">Feriados</span>
                      </div>
                    </div>
                    <WorkCalendar 
                      selected={schedulePlan.customDays} 
                      holidays={HOLIDAYS_2026}
                      workedDays={history.map(h => h.dateStr)}
                      onViewReport={(d) => setSelectedReport(history.find(h => h.dateStr === d) || null)}
                      onToggle={(day) => {
                        const next = schedulePlan.customDays.includes(day) 
                          ? schedulePlan.customDays.filter(d => d !== day)
                          : [...schedulePlan.customDays, day];
                        setSchedulePlan({ pattern: 'personalizado', customDays: next });
                      }}
                    />
                    <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                       <span className="text-[10px] font-bold text-gray-400 uppercase">Dias Ativos</span>
                       <span className="text-sm font-black text-blue-600">{workingDaysInMonth} Dias</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-blue-100 shadow-xl shadow-blue-50 space-y-6">
                <div className="flex items-center justify-between">
                   <h2 className="font-bold text-sm uppercase tracking-widest text-blue-800">3. Plano de Viabilidade</h2>
                   <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${planResults.isFeasible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {planResults.isFeasible ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      <span className="text-[10px] font-black uppercase">{planResults.isFeasible ? 'Possível' : 'Crítico'}</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Clock size={40} /></div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Horas p/ Dia</p>
                      <p className={`text-2xl font-black ${planResults.isFeasible ? 'text-gray-800' : 'text-red-500'}`}>
                        {planResults.neededHours > 24 ? '+24' : planResults.neededHours.toFixed(1)}h
                      </p>
                      <p className="text-[9px] text-gray-400 font-medium leading-none">Jornada Necessária</p>
                   </div>
                   <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={40} /></div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Alvo Diário</p>
                      <p className="text-2xl font-black text-blue-600">{formatCurrency(planResults.dailyTarget)}</p>
                      <p className="text-[9px] text-gray-400 font-medium leading-none">Nos {planResults.daysInPeriod} dias ativos</p>
                   </div>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-500">
                       <span>Esforço: {effortPercent}% ({(effortPercent * 0.12).toFixed(1)}h/dia)</span>
                       <span>Máximo: 12h/dia</span>
                    </div>
                    <div className="relative h-6 flex items-center">
                       <div className="absolute inset-0 h-3 my-auto bg-gray-100 rounded-full border border-gray-50 overflow-hidden">
                         <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(effortPercent, 100)}%` }}
                            className={`h-full transition-all duration-300 ${planResults.isUnderGoal ? 'bg-orange-500' : 'bg-green-500'}`} 
                         />
                         {/* Marker for required effort */}
                         <div 
                           className="absolute top-0 bottom-0 w-0.5 bg-blue-600 z-10"
                           style={{ left: `${(planResults.neededHours / 12) * 100}%` }}
                         />
                       </div>
                       <input 
                         type="range" 
                         min="1" 
                         max="100"
                         step="1"
                         value={effortPercent}
                         onChange={(e) => setEffortPercent(parseFloat(e.target.value))}
                         className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                       />
                       <div 
                         className={`absolute w-5 h-5 bg-white border-2 rounded-full shadow-md z-0 pointer-events-none transition-all duration-300 ${planResults.isUnderGoal ? 'border-orange-500' : 'border-green-500'}`}
                         style={{ left: `calc(${Math.min(effortPercent, 100)}% - 10px)` }}
                       />
                    </div>
                    
                    <div className={`p-4 rounded-2xl border transition-all ${planResults.isUnderGoal ? 'bg-orange-50 border-orange-100' : 'bg-green-50 border-green-100'}`}>
                       <div className="flex justify-between items-center mb-1">
                         <p className="text-[10px] font-bold uppercase opacity-60">
                           {effortPercent * 0.12 > planResults.neededHours 
                             ? `Trabalhando ${(effortPercent * 0.12 - planResults.neededHours).toFixed(1)}h a mais que o plano`
                             : effortPercent * 0.12 < planResults.neededHours 
                               ? `Faltando ${(planResults.neededHours - effortPercent * 0.12).toFixed(1)}h para a meta`
                               : "Esforço exato do plano"}
                         </p>
                         <p className={`text-sm font-black ${planResults.isUnderGoal ? 'text-orange-600' : 'text-green-600'}`}>
                            {formatCurrency(planResults.effortProfit)} / dia
                         </p>
                       </div>
                      <p className="text-[11px] font-medium text-gray-600 leading-tight">
                        {planResults.isUnderGoal 
                          ? `⚠️ Atenção: Com este esforço, você ficará ${formatCurrency(planResults.dailyTarget - planResults.effortProfit)} abaixo da sua meta diária de ${formatCurrency(planResults.dailyTarget)}.`
                          : `✅ Ótimo! Você superará sua meta diária em ${formatCurrency(planResults.effortProfit - planResults.dailyTarget)}.`
                        }
                      </p>
                   </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                   <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Detalhamento por Dia de Trabalho</h4>
                   <div className="grid grid-cols-1 gap-y-2">
                      <div className="flex justify-between items-center text-[11px] pb-1 border-b border-gray-100">
                         <span className="text-gray-500">Faturamento Bruto Necessário:</span>
                         <span className="font-bold text-gray-800">{formatCurrency(planResults.fBruto)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                         <span className="text-gray-500">Taxas Aplicativos ({profile.platform}):</span>
                         <span className="font-bold text-red-400">- {formatCurrency(planResults.vTaxa)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                         <span className="text-gray-500">Gasolina Estimada:</span>
                         <span className="font-bold text-red-500">- {formatCurrency(planResults.cComb)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                         <span className="text-gray-500">Fundo Manutenção ({profile.car.tipo}):</span>
                         <span className="font-bold text-orange-500">- {formatCurrency(planResults.cWear)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                         <span className="text-gray-500">Despesas Fixas Distribuídas:</span>
                         <span className="font-bold text-red-600">- {formatCurrency(planResults.fixed)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px] pt-1 border-t border-gray-300">
                         <span className="font-bold text-gray-800">Lucro Líquido Almejado:</span>
                         <span className="font-black text-green-600">{formatCurrency(planResults.lLiquido)}</span>
                      </div>
                   </div>
                   <div className="mt-2 p-2 bg-blue-50 rounded-lg text-center border border-blue-100">
                      <p className="text-[10px] text-blue-700 font-bold uppercase leading-tight">
                         Para sobrar {formatCurrency(planResults.dailyTarget)} limpo, <br/>
                         fature <span className="text-sm font-black underline">{formatCurrency(planResults.fBruto)} brutos</span> no dia.
                      </p>
                   </div>
                </div>

                {!planResults.isFeasible && (
                   <div className="flex gap-2 p-3 bg-red-50 text-red-800 rounded-xl text-[10px] font-bold leading-tight border border-red-100">
                      <Info size={14} className="flex-shrink-0" />
                      <div>
                        Para atingir esta meta você precisaria de mais que 12h diárias. Reduza a meta ou selecione mais dias no calendário.
                      </div>
                   </div>
                )}

                <div className="pt-4 border-t border-gray-100">
                   <p className="text-[10px] text-gray-400 font-medium italic flex items-start gap-2">
                      <TrendingUp size={12} className="text-blue-500 flex-shrink-0" />
                      <span>{profile.preferredSchedule === 'pico' 
                        ? "Estratégia: Divida a jornada em turnos de pico p/ maximizar o ganho/hora." 
                        : "Dica: Considere dias de feriado (com pontos laranja) pois a demanda costuma ser maior."}</span>
                   </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* HISTORY VIEW */}
          {activeView === 'history' && (
             <motion.div key="hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setActiveView('dashboard')} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm"><ChevronLeft size={20}/></button>
                  <h2 className="font-bold text-xl">Histórico</h2>
                </div>
                <div className="flex items-center justify-between"><h2 className="font-bold text-sm text-gray-400 uppercase tracking-widest">Sessões Recentes</h2> <button onClick={() => setHistory([])} className="text-red-500 text-xs flex items-center gap-1"><Trash2 size={12} /> Limpar</button></div>
                <div className="space-y-4">
                {history.map((h, i) => (
                  <div 
                    key={h.id || i} 
                    onClick={() => setSelectedReport(h)}
                    className="bg-white p-4 rounded-2xl border border-gray-100 flex justify-between items-center transition-all hover:border-blue-200 active:scale-[0.98] cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${h.goalMet ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                          {h.goalMet ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                       </div>
                       <div>
                         <p className="text-[10px] text-gray-400 font-bold uppercase leading-none mb-1">{h.date}</p>
                         <h4 className="font-bold text-gray-800 text-xs">{h.car} • {h.hours}</h4>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className={`text-sm font-black ${h.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>{formatCurrency(Number(h.profit))}</p>
                       <p className="text-[9px] text-gray-400 font-bold uppercase tracking-tight">{h.km.toFixed(1)} KM</p>
                    </div>
                  </div>
                ))}
                </div>
                {history.length === 0 && <div className="py-20 text-center text-gray-400 italic">Nenhum registro encontrado.</div>}
             </motion.div>
          )}

          {/* SETTINGS VIEW */}
          {activeView === 'settings' && (
            <motion.div key="settings" className="space-y-6">
              <div className="flex items-center gap-4 mb-2">
                <button onClick={() => setActiveView('dashboard')} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm"><ChevronLeft size={20}/></button>
                <h2 className="font-bold text-xl">Ajustes</h2>
              </div>
              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-6">
                <div className="flex justify-between items-center">
                   <h2 className="font-bold">Meu Perfil de Trabalho</h2>
                   <button onClick={() => setActiveView('dashboard')} className="px-4 py-2 bg-green-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-green-100">SALVAR</button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase">Seu Nome</label>
                    <input 
                      type="text" className="w-full bg-gray-50 p-3 rounded-xl border border-transparent focus:border-blue-500 outline-none"
                      value={profile.name}
                      onChange={e => setProfile({...profile, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1 shadow-sm p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <label className="text-[10px] font-bold text-blue-400 uppercase">Gasto Fixo Mensal Estimado (R$)</label>
                    <CurrencyInput
                      className="w-full bg-transparent p-1 font-bold text-blue-900 border-none outline-none text-xl"
                      value={fixedExpenses.aluguel + fixedExpenses.parcela + fixedExpenses.seguro + fixedExpenses.outros}
                      onChange={(val: number) => setFixedExpenses({...fixedExpenses, aluguel: val, parcela: 0, seguro: 0, outros: 0})}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-400 uppercase">Plataforma Principal</label>
                       <select className="w-full bg-gray-50 p-3 rounded-xl font-bold" value={profile.platform} onChange={e => setProfile({...profile, platform: e.target.value as 'Uber' | '99'})}>
                         <option value="Uber">Uber</option>
                         <option value="99">99 App</option>
                       </select>
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-bold text-gray-400 uppercase">Categoria</label>
                       <select className="w-full bg-gray-50 p-3 rounded-xl font-bold" value={profile.category} onChange={e => setProfile({...profile, category: e.target.value as 'X' | 'Comfort' | 'Black'})}>
                         <option value="X">X / Pop</option>
                         <option value="Comfort">Comfort / Top</option>
                         <option value="Black">Black</option>
                       </select>
                     </div>
                  </div>
                  <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase">Seu Carro Atual</label>
                    <div className="flex gap-2">
                       <select className="flex-1 bg-gray-50 p-3 rounded-xl font-bold" value={profile.car.nome} onChange={e => setProfile({...profile, car: allCars.find(c => c.nome === e.target.value)!})}>
                          {allCars.map(c => <option key={c.nome} value={c.nome}>{c.nome} ({c.consumo}km/L)</option>)}
                       </select>
                       <button onClick={() => setIsAddingCar(true)} className="p-3 bg-blue-100 text-blue-600 rounded-xl"><PlusCircle size={20}/></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                     <input type="checkbox" checked={profile.includeWear} onChange={e => setProfile({...profile, includeWear: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                     <label className="text-sm font-bold text-gray-700">Incluir custos de manutenção/desgaste (Recomendado)</label>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-gray-100 space-y-4">
                <h3 className="font-bold text-sm">Estado de Manutenção</h3>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[9px] text-gray-400 font-bold">KM PRÓX. ÓLEO</p><p className="font-bold">{maintenance.nextOilChangeKm} km</p></div>
                   <div className="p-3 bg-gray-50 rounded-xl"><p className="text-[9px] text-gray-400 font-bold">KM PRÓX. PNEUS</p><p className="font-bold">{maintenance.nextTireCheckKm} km</p></div>
                </div>
              </div>
            </motion.div>
          )}

          {/* REPORT VIEW */}
          {activeView === 'report' && (
            <motion.div key="report" className="space-y-6">
               <div className="flex items-center gap-4 mb-2">
                  <button onClick={() => setActiveView('simulation')} className="p-2 bg-white rounded-xl border border-gray-100 shadow-sm text-blue-600"><ChevronLeft size={20}/></button>
                  <h2 className="font-bold text-xl">Relatório Detalhado</h2>
               </div>
               <div className="bg-blue-600 text-white p-8 rounded-3xl shadow-xl space-y-6">
                  <div className="flex items-center justify-between border-b border-white/20 pb-4">
                     <div>
                        <h2 className="text-xl font-black">RESUMO FINANCEIRO</h2>
                        <p className="text-[10px] text-blue-200 mt-1 uppercase font-bold tracking-wider">
                           {journey.active ? `Baseado na Jornada Atual (${activeHours.toFixed(1)}h)` : `Simulação (${simHours}h de Trabalho)`}
                        </p>
                     </div>
                     <button 
                        onClick={() => {
                           const shareText = `💰 RELATÓRIO MOTORISTA PRO\n\n📌 Resumo do Dia:\n- Faturamento: ${formatCurrency(report.fBruto)}\n- Custos Operacionais: ${formatCurrency(report.vTaxa + report.cTotal)}\n- Lucro Líquido: ${formatCurrency(report.lLiquido)}\n\n🏁 Meta do Plano de Ação: ${planResults.isUnderGoal ? '⚠️ Em progresso' : '✅ Meta Superada!'}\n\nGerado por Driver Defense Pro`;
                           if (navigator.share) {
                              navigator.share({ title: 'Meu Relatório Financeiro', text: shareText });
                           } else {
                              alert("Copiado para área de transferência:\n\n" + shareText);
                              navigator.clipboard.writeText(shareText);
                           }
                        }}
                        className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all text-white flex items-center gap-2"
                     >
                        <PlusCircle size={20} />
                        <span className="text-[10px] font-bold uppercase">Exportar</span>
                     </button>
                  </div>
                  <div className="space-y-4">
                     {/* Gross Revenue */}
                     <div className="space-y-2">
                        <div className="flex justify-between border-b border-white/10 pb-2 cursor-pointer select-none" onClick={() => setExpandedDetail(expandedDetail === 'fBruto' ? null : 'fBruto')}>
                           <span>Faturamento Bruto</span> <b>{formatCurrency(report.fBruto)}</b>
                        </div>
                        {expandedDetail === 'fBruto' && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-[10px] bg-white/10 p-3 rounded-xl space-y-1">
                              <p>KM Estimado: {profile.city.velocidade}km/h * {activeHours.toFixed(1)}h = {report.kmRodados.toFixed(1)}km</p>
                              <p>Cálculo: (Base + (KM * PreçoKM) + (Minutos * PreçoMin)) * Demanda</p>
                           </motion.div>
                        )}
                     </div>

                     {/* Platform Fee */}
                     <div className="space-y-2">
                        <div className="flex justify-between border-b border-white/10 pb-2 text-red-200 cursor-pointer select-none" onClick={() => setExpandedDetail(expandedDetail === 'vTaxa' ? null : 'vTaxa')}>
                           <span>Taxa {profile.platform}</span> <b>- {formatCurrency(report.vTaxa)}</b>
                        </div>
                        {expandedDetail === 'vTaxa' && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-[10px] bg-white/10 p-3 rounded-xl space-y-1">
                              <p>Categoria: {profile.category} ({TAXAS[profile.platform][profile.category]*100}%)</p>
                              <p>Cálculo: {formatCurrency(report.fBruto)} * {TAXAS[profile.platform][profile.category]}</p>
                           </motion.div>
                        )}
                     </div>

                     {/* Net Revenue */}
                     <div className="flex justify-between border-b border-white/10 pb-2"><span>Faturamento Líquido</span> <b>{formatCurrency(report.fLiquido)}</b></div>
                     
                     {/* Fuel Cost */}
                     <div className="space-y-2">
                        <div className="flex justify-between border-b border-white/10 pb-2 text-red-200 cursor-pointer select-none" onClick={() => setExpandedDetail(expandedDetail === 'cComb' ? null : 'cComb')}>
                           <span>Custo Combustível</span> <b>{formatCurrency(report.cComb)}</b>
                        </div>
                        {expandedDetail === 'cComb' && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-[10px] bg-white/10 p-3 rounded-xl space-y-1">
                              <p>Veículo: {profile.car.nome} ({profile.car.consumo} km/L)</p>
                              <p>Gasolina: {formatCurrency(profile.fuelPrice)}/L</p>
                              <p>Distância: {report.kmRodados.toFixed(1)}km</p>
                              <p className="font-bold border-t border-white/10 pt-1 mt-1">Cálculo: ({report.kmRodados.toFixed(1)} / {profile.car.consumo}) * {profile.fuelPrice}</p>
                           </motion.div>
                        )}
                     </div>

                     {/* Wear Cost */}
                     <div className="space-y-2">
                        <div className="flex justify-between border-b border-white/10 pb-2 text-red-200 cursor-pointer select-none" onClick={() => setExpandedDetail(expandedDetail === 'cWear' ? null : 'cWear')}>
                           <span>Custo Desgaste</span> <b>{formatCurrency(report.cWear)}</b>
                        </div>
                        {expandedDetail === 'cWear' && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-[10px] bg-white/10 p-3 rounded-xl space-y-1">
                              <p>Categoria do Carro: {profile.car.tipo}</p>
                              <p>Custo/KM estimado: {formatCurrency(wearPerKm)}/km</p>
                              <p>Cálculo: {report.kmRodados.toFixed(1)}km * {formatCurrency(wearPerKm)}</p>
                           </motion.div>
                        )}
                     </div>

                     {/* Fixed Expenses */}
                     <div className="space-y-2">
                        <div className="flex justify-between border-b border-white/10 pb-2 text-red-200 cursor-pointer select-none" onClick={() => setExpandedDetail(expandedDetail === 'fFix' ? null : 'fFix')}>
                           <span>Desp. Fixas (Proporcional)</span> <b>{formatCurrency(totalFixedDaily)}</b>
                        </div>
                        {expandedDetail === 'fFix' && (
                           <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="text-[10px] bg-white/10 p-3 rounded-xl space-y-1">
                              <p>Total Mensal: {formatCurrency(fixedExpenses.aluguel + fixedExpenses.parcela + fixedExpenses.seguro + fixedExpenses.outros)}</p>
                              <p>Cálculo: Total / 30 dias</p>
                           </motion.div>
                        )}
                     </div>

                     <div className="pt-4 flex justify-between text-2xl font-black"><span>LUCRO REAL</span> <span className="text-green-300">{formatCurrency(report.lLiquido)}</span></div>
                  </div>

                  <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                     <h4 className="text-[10px] font-bold text-blue-300 uppercase tracking-widest text-center">Resumo de Rendimento</h4>
                     <div className="grid grid-cols-1 gap-1 text-[11px] text-blue-50">
                        <div className="flex justify-between"><span>Bruto Necessário:</span> <span className="font-bold underline">{formatCurrency(report.fBruto)}</span></div>
                        <div className="flex justify-between"><span>Gasolina:</span> <span className="text-red-300">{formatCurrency(report.cComb)}</span></div>
                        <div className="flex justify-between"><span>Manutenção:</span> <span className="text-orange-300">{formatCurrency(report.cWear)}</span></div>
                        <div className="flex justify-between"><span>Custos Fixos:</span> <span className="text-red-300">{formatCurrency(totalFixedDaily)}</span></div>
                        <p className="mt-2 text-[10px] text-center italic border-t border-white/10 pt-2 text-gray-400">
                           Para sobrar <span className="text-green-300 font-bold">R$ {report.lLiquido.toFixed(0)}</span> limpo, <br/> fature <span className="text-white font-bold underline">R$ {report.fBruto.toFixed(0)} Brutos</span>.
                        </p>
                     </div>
                  </div>
               </div>
               <div className="bg-white p-6 rounded-3xl border border-gray-100">
                  <h4 className="text-xs font-bold text-gray-400 mb-4 uppercase">Análise de Viabilidade por KM</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Custo Real por KM</p>
                        <p className="font-black text-red-600 text-lg">{formatCurrency(report.cKm)}/km</p>
                     </div>
                     <div className="p-3 bg-gray-50 rounded-xl">
                        <p className="text-[9px] text-gray-400 font-bold uppercase mb-1">Lucro por KM</p>
                        <p className="font-black text-green-600 text-lg">{formatCurrency(report.lKm)}/km</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${report.lKm >= report.cKm ? 'bg-green-500' : 'bg-red-500'}`} style={{width: `${Math.min((report.lKm / (report.cKm + 0.5)) * 100, 100)}%`}} />
                     </div>
                     <span className="text-sm font-black text-gray-700">{formatCurrency(report.lKm)}/km</span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">Valor mínimo p/ não ter prejuízo: <b>{formatCurrency(report.minKm)}/km</b></p>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
        )}

      </main>

      {/* Startup Confirmation Modal */}
      {isSetupDone && !isSessionConfirmed && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl border border-blue-50">
             <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
               <CarIcon size={32} />
             </div>
             <h3 className="text-xl font-black text-center mb-2">Confirmar Dados Atuais?</h3>
             <p className="text-gray-500 text-center text-sm mb-8">Olá, {profile.name}! Verifique se os dados do seu veículo e custos ainda estão corretos antes de iniciar sua jornada.</p>
             
             <div className="space-y-3 mb-8">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Nome</span>
                  <span className="text-sm font-bold text-gray-700">{profile.name}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Veículo</span>
                  <span className="text-sm font-bold text-gray-700">{profile.car.nome}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                     <span className="text-[10px] font-bold text-gray-400 uppercase">App</span>
                     <span className="text-[10px] font-bold text-blue-600">{profile.platform}</span>
                   </div>
                   <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                     <span className="text-[10px] font-bold text-gray-400 uppercase">Cat.</span>
                     <span className="text-[10px] font-bold text-blue-600">{profile.category}</span>
                   </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[10px] font-bold text-gray-400 uppercase">Combustível</span>
                  <span className="text-sm font-bold text-gray-700">{formatCurrency(profile.fuelPrice)}/L</span>
                </div>
             </div>

             <div className="space-y-3">
                <button 
                  onClick={() => setIsSessionConfirmed(true)}
                  className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-50"
                >
                  Confirmar e Ir para Dashboard
                </button>
                <button 
                  onClick={() => { setIsSessionConfirmed(true); setActiveView('settings'); }}
                  className="w-full bg-gray-100 text-gray-600 p-4 rounded-2xl font-bold hover:bg-gray-200 transition-colors"
                >
                  Editar Configurações
                </button>
             </div>
          </motion.div>
        </div>
      )}

      {/* Add Car Modal */}
      {isAddingCar && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold mb-4">Adicionar Carro</h3>
              <form onSubmit={handleAddCar} className="space-y-4">
                <input name="nome" placeholder="Nome (Ex: Argo 1.0)" className="w-full p-3 bg-gray-50 rounded-xl" required />
                <input name="consumo" type="number" step="0.1" placeholder="Consumo KM/L" className="w-full p-3 bg-gray-50 rounded-xl" required />
                <select name="tipo" className="w-full p-3 bg-gray-50 rounded-xl" required>
                  <option value="popular">Popular</option>
                  <option value="suv">SUV</option>
                  <option value="premium">Premium</option>
                </select>
                <select name="categoria" className="w-full p-3 bg-gray-50 rounded-xl" required>
                  <option value="X">X / Pop</option>
                  <option value="Comfort">Comfort</option>
                  <option value="Black">Black</option>
                </select>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-blue-600 text-white p-3 rounded-xl font-bold">Salvar</button>
                  <button type="button" onClick={() => setIsAddingCar(false)} className="px-6 bg-gray-100 text-gray-600 rounded-xl font-bold">Cancelar</button>
                </div>
              </form>
           </motion.div>
        </div>
      )}

      {/* Bottom Nav */}
      {isSetupDone && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-around z-50 rounded-t-3xl shadow-2xl">
          {renderNavButton('dashboard', <MapPin size={22} />, 'Dash')}
          {renderNavButton('simulation', <Calculator size={22} />, 'Simular')}
          {renderNavButton('goals', <Target size={22} />, 'Plano')}
          {renderNavButton('history', <HistoryIcon size={22} />, 'Histórico')}
          {renderNavButton('settings', <Settings size={22} />, 'Ajustes')}
        </nav>
      )}

      {/* MODAL: Encerramento de Jornada */}
      <AnimatePresence>
        {isEndingJourney && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Wallet size={32} />
              </div>
              <h3 className="text-xl font-black text-center mb-2">Finalizar Jornada</h3>
              <p className="text-gray-500 text-center text-sm mb-6">Informe o faturamento total bruto registrado nos aplicativos hoje.</p>
              
              <div className="space-y-4 mb-8">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Faturamento Bruto (R$)</label>
                  <CurrencyInput
                    autoFocus
                    className="w-full bg-gray-50 p-4 rounded-2xl font-black text-2xl text-blue-600 border-2 border-transparent focus:border-blue-500 outline-none text-center"
                    value={parseFloat(finalEarningsInput) || 0}
                    onChange={(val: number) => setFinalEarningsInput(val.toString())}
                  />
                </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-800 uppercase">Sua Meta Diária</span>
                    <span className="text-sm font-black text-blue-800 font-mono">{formatCurrency(journey.targetDaily)}</span>
                  </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={confirmEndJourney}
                  className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black shadow-lg shadow-blue-100 active:scale-95 transition-all"
                >
                  FINALIZAR
                </button>
                <button 
                  onClick={() => setIsEndingJourney(false)}
                  className="px-6 bg-gray-100 text-gray-500 p-4 rounded-2xl font-bold"
                >
                  VOLTAR
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: Relatório de Dia Trabalhado (Calendário) */}
      <AnimatePresence>
        {selectedReport && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl relative">
              <button 
                onClick={() => setSelectedReport(null)}
                className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                 <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedReport.goalMet ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {selectedReport.goalMet ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                 </div>
                 <div>
                    <h3 className="font-black text-lg leading-none">Resumo do Dia</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{selectedReport.dateStr}</p>
                 </div>
              </div>

              <div className="space-y-4">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                       <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Bruto</p>
                       <p className="text-sm font-black">{formatCurrency(selectedReport.earnings)}</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                       <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Lucro Real</p>
                       <p className={`text-sm font-black ${selectedReport.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {formatCurrency(selectedReport.profit)}
                       </p>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                       <span>Distância:</span>
                       <b className="text-gray-800">{selectedReport.km.toFixed(1)} km</b>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                       <span>Horas:</span>
                       <b className="text-gray-800">{selectedReport.hours}</b>
                    </div>
                    <div className="flex justify-between text-[11px] font-medium text-gray-500">
                       <span>Veículo:</span>
                       <b className="text-gray-800">{selectedReport.car}</b>
                    </div>
                 </div>

                 <div className={`mt-4 p-4 rounded-2xl border flex items-center justify-between ${selectedReport.goalMet ? 'bg-green-50 border-green-100 text-green-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                    <div className="space-y-0.5">
                       <p className="text-[9px] font-black uppercase opacity-60">Status da Meta</p>
                       <p className="text-xs font-bold">{selectedReport.goalMet ? 'Meta Superada!' : 'Meta não Atingida'}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-[9px] font-black uppercase opacity-60">Alvo</p>
                       <p className="text-xs font-black">R$ {selectedReport.goal.toFixed(0)}</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setSelectedReport(null)}
                className="w-full mt-8 bg-gray-900 text-white p-4 rounded-2xl font-black shadow-lg"
              >
                FECHAR
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
