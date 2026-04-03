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

export function getScoreExplanation(score: number): string {
  if (score >= 70) {
    return 'A higher combined score suggests stronger speech fluency and short-term recall performance during this screening.';
  }
  if (score >= 40) {
    return 'A mid-range combined score suggests some areas looked steady while others may benefit from closer observation over time.';
  }
  return 'A lower combined score suggests more noticeable difficulty in recall or speech structure during this screening session.';
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
): { total: number; factors: ScoreFactors; confidence: number; explanation: string[] } {
  // 1. Memory Score (40%)
  const memoryScore = (recalledCount / totalWords) * 100;
  
  // 2. Speech Quality (30%)
  const docWords = speechText.trim().split(/\s+/).filter(Boolean);
  const speechQuality = Math.min(100, (docWords.length / 8) * 100); // 8+ words is good for 10s
  
  // 3. Response Time (15%)
  // Ideal range: 4s to 8s
  let timeScore = 100;
  if (durationSeconds < 4) timeScore = 60;
  if (durationSeconds > 8) timeScore = 80;
  if (durationSeconds < 2) timeScore = 30;
  
  // 4. Consistency (15%)
  const uniqueWords = new Set(docWords.map(w => w.toLowerCase()));
  const repetitionRatio = docWords.length > 0 ? uniqueWords.size / docWords.length : 1;
  const consistency = repetitionRatio * 100;

  const total = Math.round(
    (memoryScore * 0.40) +
    (speechQuality * 0.30) +
    (timeScore * 0.15) +
    (consistency * 0.15)
  );

  // Confidence based on input completeness
  let confidence = 85;
  if (docWords.length < 3) confidence -= 30;
  if (docWords.length > 15) confidence += 5;
  if (recalledCount === 0) confidence -= 10;
  confidence = Math.max(40, Math.min(98, confidence));

  const explanation = [
    `Memory recall: ${memoryScore >= 100 ? 'Excellent' : memoryScore >= 66 ? 'Good' : memoryScore >= 33 ? 'Partial' : 'Poor'} (${recalledCount}/${totalWords})`,
    `Speech clarity: ${speechQuality >= 80 ? 'High' : speechQuality >= 50 ? 'Moderate' : 'Low'}`,
    `Clinical confidence: ${confidence}%`
  ];

  return { total, factors: { memoryRecall: memoryScore, speechQuality, responseTime: timeScore, consistency }, confidence, explanation };
}

export function getLifestyleRecommendations(risk: RiskLevel): string[] {
  if (risk === 'High') {
    return [
      'Arrange a formal medical evaluation and bring these screening results to the visit.',
      'Build a consistent daily routine with sleep, hydration, medication review, and family support.',
      'Use memory aids like written prompts, alarms, and simplified task lists at home.',
    ];
  }

  if (risk === 'Medium') {
    return [
      'Repeat short memory and word-recall activities a few times each week.',
      'Prioritize sleep, regular walking, and meaningful social conversation every day.',
      'Track changes across future screenings so trends are easier to spot.',
    ];
  }

  return [
    'Keep the brain active with reading, conversation, games, and learning routines.',
    'Protect long-term cognitive health with exercise, sleep, and a balanced diet.',
    'Repeat screenings periodically to catch meaningful changes early.',
  ];
}

const INSIGHT_MAP: Record<string, string> = {
  'Low vocabulary diversity': 'Your speech used a limited range of unique words, which is a common indicator sometimes seen in early cognitive changes.',
  'Reduced vocabulary diversity': 'A slightly narrower range of vocabulary was detected during the speech sample.',
  'High word repetition rate': 'Frequent word repetition was noticed, which can occasionally signal difficulties with word-finding or flow.',
  'Moderate word repetition': 'Some instances of repeating words or phrases were detected in the analysis.',
  'Very short, fragmented sentences': 'Speech consisted of very brief, disconnected phrases rather than complete narrative sentences.',
  'Short sentence structure': 'The analysis noted shorter sentence lengths, which may indicate a reduction in expressive complexity.',
  'Frequent speech pauses': 'Multiple pauses were detected, which are often associated with the natural search for specific words during conversation.',
  'Excessive filler words': 'A higher frequency of filler words was used, which can happen when the mind is working harder to retrieve specific information.',
  'Low speech coherence': 'The logical connection between ideas occasionally seemed disconnected or difficult to follow.',
  'Reduced speech coherence': 'The flow between different thoughts and sentences was somewhat less consistent than expected.',
};

export function getInsightSummary(observations: string[]): string {
  if (observations.length === 0) {
    return 'The analysis suggests your speech flow and structure were largely within standard parameters for this session.';
  }

  const firstMatch = observations.find(obs => INSIGHT_MAP[obs]);
  return firstMatch ? INSIGHT_MAP[firstMatch] : observations[0];
}

export function formatRiskBadgeLabel(risk: RiskLevel): string {
  if (risk === 'High') return 'High Risk';
  if (risk === 'Medium') return 'Moderate Risk';
  return 'Low Risk';
}
