import React, { createContext, useContext, useState, ReactNode } from 'react';

export type RiskLevel = 'Low' | 'Medium' | 'High';

// Backend API response type
export interface AnalyzeResult {
  score: number;
  risk: RiskLevel;
  observations: string[];
  recommendations: string[];
  confidence: number;
  transcript: string;
}

// Full result including memory test data
export interface FullResult {
  patientId: string;
  timestamp: string;
  apiScore: number;
  memoryScore: number;
  combinedScore: number;
  risk: RiskLevel;
  observations: string[];
  challengeWords: string[];
  recalledWords: string[];
  recommendations: string[];
  confidence: number;
  transcript: string;
}

// Word bank for the memory challenge
const WORD_BANK = [
  'Apple', 'Train', 'Blue', 'River', 'Clock',
  'Garden', 'Pencil', 'Mountain', 'Chair', 'Sunset',
  'Bottle', 'Flower', 'Bridge', 'Candle', 'Mirror',
  'Ocean', 'Rabbit', 'Drum', 'Ladder', 'Silver',
  'Basket', 'Forest', 'Puppet', 'Window', 'Trumpet',
];

export function pickRandomWords(count: number = 3): string[] {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function calculateMemoryScore(
  challengeWords: string[],
  recalledInput: string
): { score: number; matched: string[] } {
  const normalizedChallenge = challengeWords.map(w => w.toLowerCase().trim());
  const recalledTokens = recalledInput
    .toLowerCase()
    .split(/[\s,;]+/)
    .map(t => t.trim())
    .filter(Boolean);

  const matched: string[] = [];
  for (const word of normalizedChallenge) {
    if (recalledTokens.includes(word)) {
      matched.push(word);
    }
  }

  const score = Math.round((matched.length / challengeWords.length) * 100);
  return { score, matched };
}

export function generatePatientId(): string {
  return `PAT-${Date.now()}`;
}

interface AppContextType {
  userId: string;
  setUserId: (id: string) => void;
  ensurePatientId: () => string;
  language: 'en' | 'hi';
  setLanguage: (lang: 'en' | 'hi') => void;
  latestResult: FullResult | null;
  setLatestResult: (result: FullResult | null) => void;
  challengeWords: string[];
  setChallengeWords: (words: string[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');
  const [latestResult, setLatestResult] = useState<FullResult | null>(null);
  const [challengeWords, setChallengeWords] = useState<string[]>(() => pickRandomWords(3));

  const ensurePatientId = () => {
    const trimmed = userId.trim();
    if (trimmed) return trimmed;

    const generatedId = generatePatientId();
    setUserId(generatedId);
    return generatedId;
  };

  return (
    <AppContext.Provider value={{
      userId, setUserId,
      ensurePatientId,
      language, setLanguage,
      latestResult, setLatestResult,
      challengeWords, setChallengeWords,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppStore must be used within AppProvider');
  return context;
}
