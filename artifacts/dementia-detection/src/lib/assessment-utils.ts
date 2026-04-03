import type { RiskLevel } from './store';

export function getRiskDescription(risk: RiskLevel): string {
  if (risk === 'High') {
    return 'The screening found several speech and memory markers that deserve prompt clinical follow-up.';
  }
  if (risk === 'Medium') {
    return 'The screening suggests mild cognitive changes that are worth monitoring and discussing with a clinician.';
  }
  return 'The screening did not detect strong warning signs, but regular monitoring is still a healthy habit.';
}

export function getScoreExplanation(score: number, recalledCount: number, totalWords: number, speechText: string): string {
  const wordCount = speechText.trim().split(/\s+/).filter(Boolean).length;
  
  if (score > 75 && recalledCount === totalWords) {
    return "User successfully recalled all words and provided structured, fluent responses.";
  }
  if (score >= 50) {
    return "Partial recall observed with moderate speech clarity and structured engagement.";
  }
  return "Limited recall and minimal verbal response detected, suggesting potential cognitive fatigue or difficulty.";
}

export interface ScoreFactors {
  memoryRecall: number;
  speechQuality: number;
  responseTime: number;
  consistency: number;
}

export function calculateClinicalScore(
  recalledCount: number,
  totalWords: number,
  speechText: string,
  durationSeconds: number
): { 
  total: number; 
  factors: ScoreFactors; 
  confidence: number; 
  explanation: string;
  dynamicObservations: string[];
} {
  // 1. Memory Score (40%)
  const memoryScore = (recalledCount / totalWords) * 100;
  
  // 2. Speech Quality (30%)
  const docWords = speechText.trim().split(/\s+/).filter(Boolean);
  const wordCount = docWords.length;
  const speechQuality = Math.min(100, (wordCount / 12) * 100); // 12+ words is good
  
  // 3. Response Time (15%)
  // Ideal range: 4s to 8s
  let timeScore = 100;
  if (durationSeconds < 4) timeScore = 70;
  if (durationSeconds > 10) timeScore = 60;
  if (durationSeconds < 2) timeScore = 40;
  
  // 4. Consistency (15%)
  const uniqueWords = new Set(docWords.map(w => w.toLowerCase()));
  const repetitionRatio = wordCount > 0 ? uniqueWords.size / wordCount : 1;
  const consistency = repetitionRatio * 100;

  const total = Math.round(
    (memoryScore * 0.40) +
    (speechQuality * 0.30) +
    (timeScore * 0.15) +
    (consistency * 0.15)
  );

  // Confidence based on data quality (0-100 format)
  let confidence = 85;
  if (wordCount < 5) confidence -= 30;
  if (wordCount > 15) confidence += 5;
  if (recalledCount === 0) confidence -= 10;
  confidence = Math.max(40, Math.min(98, confidence));

  // Dynamic Observations based on input
  const dynamicObservations: string[] = [];
  
  // Speech Clarity
  if (wordCount > 20) dynamicObservations.push("Speech Clarity: Good (Fluent length)");
  else if (wordCount >= 10) dynamicObservations.push("Speech Clarity: Moderate (Substantial response)");
  else dynamicObservations.push("Speech Clarity: Low (Limited verbal output)");

  // Sentence Structure
  const hasPunctuation = /[.!?]/.test(speechText);
  if (hasPunctuation && wordCount > 10) dynamicObservations.push("Sentence Structure: Good (Full narrative)");
  else if (wordCount > 5) dynamicObservations.push("Sentence Structure: Moderate (Basic phrases)");
  else dynamicObservations.push("Sentence Structure: Short (Fragmented or single words)");

  const explanation = getScoreExplanation(total, recalledCount, totalWords, speechText);

  return { 
    total, 
    factors: { memoryRecall: memoryScore, speechQuality, responseTime: timeScore, consistency }, 
    confidence, 
    explanation,
    dynamicObservations 
  };
}

export function getLifestyleRecommendations(score: number): string[] {
  if (score > 75) {
    return [
      'Maintain healthy cognitive habits through social engagement.',
      'Continue regular mental exercises like reading and puzzles.',
      'Protect brain health with consistent sleep and hydration.'
    ];
  }

  if (score >= 50) {
    return [
      'Consider increasing frequency of daily memory exercises.',
      'Engage in regular reading and active recall activities.',
      'Monitor cognitive trends across future screening sessions.'
    ];
  }

  return [
    'Consult a healthcare professional for a formal evaluation.',
    'Monitor cognitive changes regularly and track history.',
    'Engage with family and friends in structured conversations.'
  ];
}

export function getInsightSummary(observations: string[]): string {
  if (observations.length === 0) {
    return 'The analysis suggests your speech flow and structure were largely within standard parameters for this session.';
  }
  return observations[0]; // Use the first dynamic observation as summary
}

export function formatRiskBadgeLabel(risk: RiskLevel): string {
  if (risk === 'High') return 'High Risk';
  if (risk === 'Medium') return 'Moderate Risk';
  return 'Low Risk';
}
