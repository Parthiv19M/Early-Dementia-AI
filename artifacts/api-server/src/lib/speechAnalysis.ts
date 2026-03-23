export interface SpeechFeatures {
  wordCount: number;
  uniqueWordCount: number;
  vocabularyDiversity: number;
  avgSentenceLength: number;
  pauseCount: number;
  repetitionCount: number;
  repetitionRate: number;
  fillerWordCount: number;
  coherenceScore: number;
}

export interface AnalysisResult {
  transcript: string;
  riskLevel: "Normal" | "Mild Cognitive Impairment" | "High Risk";
  riskScore: number;
  confidence: number;
  features: SpeechFeatures;
  problematicPatterns: string[];
  recommendations: string[];
  language: string;
}

const FILLER_WORDS_EN = new Set([
  "uh", "um", "er", "ah", "like", "you know", "basically", "literally",
  "actually", "right", "okay", "so", "well", "anyway"
]);

const FILLER_WORDS_HI = new Set([
  "मतलब", "जैसा कि", "ठीक है", "तो", "हम्म", "वैसे"
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 0);
}

function splitSentences(text: string): string[] {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
}

function countRepetitions(words: string[]): number {
  let count = 0;
  for (let i = 1; i < words.length; i++) {
    if (words[i] === words[i - 1]) count++;
    if (i >= 2 && words[i] === words[i - 2]) count++;
  }
  const window = 5;
  for (let i = 0; i < words.length - window; i++) {
    const phrase = words.slice(i, i + 3).join(" ");
    for (let j = i + 3; j < Math.min(i + window * 2, words.length - 2); j++) {
      const other = words.slice(j, j + 3).join(" ");
      if (phrase === other) count++;
    }
  }
  return count;
}

function estimatePauses(text: string): number {
  const pausePatterns = /\.\.\.|,\s|;\s|—|–|\s{2,}/g;
  return (text.match(pausePatterns) || []).length;
}

function countFillerWords(words: string[], language: string): number {
  const fillers = language === "hi" ? FILLER_WORDS_HI : FILLER_WORDS_EN;
  return words.filter(w => fillers.has(w)).length;
}

function computeCoherence(sentences: string[]): number {
  if (sentences.length <= 1) return 1.0;
  let sharedWords = 0;
  let totalChecks = 0;
  for (let i = 1; i < sentences.length; i++) {
    const prev = new Set(tokenize(sentences[i - 1]));
    const curr = tokenize(sentences[i]);
    const shared = curr.filter(w => prev.has(w) && w.length > 3).length;
    sharedWords += shared;
    totalChecks += Math.max(curr.length, 1);
  }
  const raw = sharedWords / totalChecks;
  return Math.min(1.0, raw * 3 + 0.3);
}

export function extractFeatures(text: string, language = "en"): SpeechFeatures {
  const words = tokenize(text);
  const sentences = splitSentences(text);
  const uniqueWords = new Set(words);

  const wordCount = words.length;
  const uniqueWordCount = uniqueWords.size;
  const vocabularyDiversity = wordCount > 0 ? uniqueWordCount / wordCount : 0;
  const avgSentenceLength = sentences.length > 0 ? wordCount / sentences.length : wordCount;
  const pauseCount = estimatePauses(text);
  const repetitionCount = countRepetitions(words);
  const repetitionRate = wordCount > 0 ? repetitionCount / wordCount : 0;
  const fillerWordCount = countFillerWords(words, language);
  const coherenceScore = computeCoherence(sentences);

  return {
    wordCount,
    uniqueWordCount,
    vocabularyDiversity,
    avgSentenceLength,
    pauseCount,
    repetitionCount,
    repetitionRate,
    fillerWordCount,
    coherenceScore,
  };
}

export function classifyRisk(features: SpeechFeatures): {
  riskLevel: "Normal" | "Mild Cognitive Impairment" | "High Risk";
  riskScore: number;
  confidence: number;
  problematicPatterns: string[];
} {
  // We'll calculate a 'Health Score' (0-100).
  // 100 is perfect, deductions are made for issues.
  let healthScore = 100;
  const patterns: string[] = [];

  // Deductions for vocabulary issues
  if (features.vocabularyDiversity < 0.3) {
    healthScore -= 20;
    patterns.push("Low vocabulary diversity");
  } else if (features.vocabularyDiversity < 0.5) {
    healthScore -= 10;
    patterns.push("Reduced vocabulary diversity");
  }

  // Deductions for repetitions
  if (features.repetitionRate > 0.15) {
    healthScore -= 25;
    patterns.push("High word repetition rate");
  } else if (features.repetitionRate > 0.08) {
    healthScore -= 12;
    patterns.push("Moderate word repetition");
  }

  // Deductions for sentence length (short sentences)
  if (features.avgSentenceLength < 3) {
    healthScore -= 20;
    patterns.push("Very short, fragmented sentences");
  } else if (features.avgSentenceLength < 6) {
    healthScore -= 8;
    patterns.push("Short sentence structure");
  }

  // Deductions for pauses/filler words
  if (features.pauseCount > 10) {
    healthScore -= 15;
    patterns.push("Frequent speech pauses");
  }
  if (features.fillerWordCount > 8) {
    healthScore -= 15;
    patterns.push("Excessive filler words");
  }

  // Deductions for coherence
  if (features.coherenceScore < 0.3) {
    healthScore -= 25;
    patterns.push("Low speech coherence");
  } else if (features.coherenceScore < 0.5) {
    healthScore -= 12;
    patterns.push("Reduced speech coherence");
  }

  // Rewards for good input
  if (features.wordCount > 60) healthScore += 5;
  if (features.uniqueWordCount > 30) healthScore += 5;

  // Final Score Normalization
  const riskScore = Math.max(0, Math.min(100, healthScore));

  // Confidence Calculation
  // Base confidence starts from text length
  let confidence = features.wordCount >= 80 ? 0.95 : features.wordCount >= 40 ? 0.85 : features.wordCount >= 15 ? 0.70 : 0.50;

  // Adjust confidence based on variety
  if (features.vocabularyDiversity > 0.6) confidence += 0.05;

  // Reduce confidence if the sample is extremely inconsistent with the number of patterns
  if (patterns.length > 5 && features.wordCount < 30) {
    confidence -= 0.15;
  }

  confidence = Math.max(0.4, Math.min(0.98, confidence));

  let riskLevel: "Normal" | "Mild Cognitive Impairment" | "High Risk";
  if (riskScore >= 70) {
    riskLevel = "Normal";
  } else if (riskScore >= 40) {
    riskLevel = "Mild Cognitive Impairment";
  } else {
    riskLevel = "High Risk";
  }

  return { riskLevel, riskScore, confidence, problematicPatterns: patterns };
}

export function generateRecommendations(
  riskLevel: string,
  features: SpeechFeatures,
  language = "en"
): string[] {
  const recs: string[] = [];
  const isEn = language !== "hi";

  if (riskLevel === "Normal") {
    recs.push(isEn ? "Speech patterns appear normal. Continue regular cognitive exercises." : "भाषण पैटर्न सामान्य दिखते हैं। नियमित संज्ञानात्मक अभ्यास जारी रखें।");
    recs.push(isEn ? "Engage in social conversations and reading activities daily." : "दैनिक सामाजिक बातचीत और पढ़ने की गतिविधियों में शामिल हों।");
    recs.push(isEn ? "Maintain a healthy diet and regular physical exercise." : "स्वस्थ आहार और नियमित शारीरिक व्यायाम बनाए रखें।");
  } else if (riskLevel === "Mild Cognitive Impairment") {
    recs.push(isEn ? "Consider scheduling a cognitive assessment with your doctor." : "अपने डॉक्टर के साथ संज्ञानात्मक मूल्यांकन निर्धारित करने पर विचार करें।");
    recs.push(isEn ? "Practice word games and memory exercises (crosswords, sudoku)." : "शब्दों के खेल और स्मृति अभ्यास (क्रॉसवर्ड, सुडोकू) का अभ्यास करें।");
    recs.push(isEn ? "Read aloud daily to improve speech fluency and vocabulary." : "भाषण प्रवाह और शब्दावली में सुधार के लिए प्रतिदिन ज़ोर से पढ़ें।");
    recs.push(isEn ? "Reduce stress through meditation and adequate sleep (7-9 hours)." : "ध्यान और पर्याप्त नींद (7-9 घंटे) के माध्यम से तनाव कम करें।");
    if (features.repetitionRate > 0.08) {
      recs.push(isEn ? "Try tongue twisters and vocabulary building exercises." : "टंग ट्विस्टर और शब्दावली निर्माण अभ्यास आज़माएं।");
    }
  } else {
    recs.push(isEn ? "Please consult a neurologist or geriatric specialist immediately." : "कृपया तुरंत न्यूरोलॉजिस्ट या जेरियाट्रिक विशेषज्ञ से परामर्श लें।");
    recs.push(isEn ? "Seek a comprehensive neuropsychological evaluation." : "एक व्यापक न्यूरोसाइकोलॉजिकल मूल्यांकन की तलाश करें।");
    recs.push(isEn ? "Engage in structured cognitive rehabilitation therapy." : "संरचित संज्ञानात्मक पुनर्वास चिकित्सा में शामिल हों।");
    recs.push(isEn ? "Involve family members in caregiving and communication support." : "परिजनों को देखभाल और संचार सहायता में शामिल करें।");
    recs.push(isEn ? "Consider joining a dementia support group." : "डिमेंशिया सहायता समूह में शामिल होने पर विचार करें।");
  }

  return recs;
}

export function analyzeText(text: string, language = "en"): AnalysisResult {
  const features = extractFeatures(text, language);
  const { riskLevel, riskScore, confidence, problematicPatterns } = classifyRisk(features);
  const recommendations = generateRecommendations(riskLevel, features, language);

  return {
    transcript: text,
    riskLevel,
    riskScore,
    confidence,
    features,
    problematicPatterns,
    recommendations,
    language,
  };
}
