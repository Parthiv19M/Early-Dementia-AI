import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Mic, Square, Languages, UserCircle, Type, Brain, Sparkles, ArrowRight, CheckCircle2, RotateCcw, ShieldAlert, HeartPulse, ClipboardCheck, Info, Clock } from 'lucide-react';
import {
  analyzeText,
  createReport,
  transcribeAudio,
  type AnalysisResult as ApiAnalysisResult,
} from '@workspace/api-client-react';
import { Button, Card, Input, Waveform, Badge } from '@/components/ui';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { getLifestyleRecommendations } from '@/lib/assessment-utils';
import { saveAssessment } from '@/lib/assessment-storage';
import { useAppStore, pickRandomWords, calculateMemoryScore } from '@/lib/store';
import type { AnalyzeResult } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'memorize' | 'record' | 'recall';

function mapRiskLevel(riskLevel: ApiAnalysisResult['riskLevel']): AnalyzeResult['risk'] {
  if (riskLevel === 'High Risk') return 'High';
  if (riskLevel === 'Mild Cognitive Impairment') return 'Medium';
  return 'Low';
}

function toDisplayResult(result: ApiAnalysisResult): AnalyzeResult {
  return {
    score: result.riskScore,
    risk: mapRiskLevel(result.riskLevel),
    observations: result.problematicPatterns,
    recommendations: result.recommendations,
    confidence: result.confidence,
    transcript: result.transcript,
  };
}

export default function Home() {
  const [_, setLocation] = useLocation();
  const {
    userId, setUserId,
    ensurePatientId,
    language, setLanguage,
    setLatestResult,
    challengeWords, setChallengeWords,
  } = useAppStore();
  const { isRecording, startRecording, stopRecording, audioBlob } = useAudioRecorder();

  const [step, setStep] = useState<Step>('memorize');
  const [mode, setMode] = useState<'record' | 'text'>('record');
  const [textInput, setTextInput] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [recallInput, setRecallInput] = useState('');
  const [apiResult, setApiResult] = useState<AnalyzeResult | null>(null);

  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const sampleStr = sessionStorage.getItem('cogno_sample');
    if (sampleStr) {
      try {
        const sample = JSON.parse(sampleStr);
        setTextInput(sample.text);
        setRecallInput(sample.recalled);
        setMode('text');
        setStep('record');
        if (sample.recalled.includes(',')) {
          setChallengeWords(['Drum', 'Trumpet', 'Silver']);
        }
        sessionStorage.removeItem('cogno_sample');
      } catch (e) {
        console.error('Failed to parse sample data', e);
      }
    }
  }, [setChallengeWords]);

  useEffect(() => {
    if (step === 'memorize') {
      setCountdown(10);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (countdownRef.current) clearInterval(countdownRef.current);
      };
    }
    return undefined;
  }, [step, challengeWords]);

  const recognitionRef = useRef<any>(null);

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = (language as string) === 'hi' ? 'hi-IN' : 'en-US';

    let finalTranscript = '';

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscribedText(finalTranscript + interim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error !== 'aborted') {
        setError(`Speech recognition error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsTranscribing(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsTranscribing(true);
    setTranscribedText('');
    setError(null);
  }, [language]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsTranscribing(false);
  }, []);

  const handleStartRecording = () => {
    setError(null);
    setTranscribedText('');
    startRecording();
    startSpeechRecognition();
  };

  const handleStopRecording = () => {
    stopRecording();
    stopSpeechRecognition();
  };

  const handleMemorized = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    ensurePatientId();
    setStep('record');
  };

  const handleAnalyze = async () => {
    const activePatientId = ensurePatientId();
    const userSpeechText = mode === 'record' ? transcribedText.trim() : textInput.trim();

    if (mode === 'record' && !audioBlob && !userSpeechText) {
      setError('Please record audio or provide text for analysis.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let result: ApiAnalysisResult;

      if (mode === 'record' && audioBlob) {
        try {
          result = await transcribeAudio({
            audio: new File([audioBlob], 'speech-input.webm', { type: audioBlob.type || 'audio/webm' }),
            language: language as any,
            userId: activePatientId,
          });
          setTranscribedText(result.transcript);
        } catch (transcribeError) {
          if (!userSpeechText) throw transcribeError;
          result = await analyzeText({ text: userSpeechText, language: language as any, userId: activePatientId });
        }
      } else {
        result = await analyzeText({ text: userSpeechText || '', language: language as any, userId: activePatientId });
      }

      setApiResult(toDisplayResult(result));
      setStep('recall');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError('Analysis failed. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecallSubmit = () => {
    if (!apiResult) return;

    const activePatientId = ensurePatientId();
    const { score: memScore, matched } = calculateMemoryScore(challengeWords, recallInput);
    const combinedScore = Math.round((apiResult.score * 0.6) + (memScore * 0.4));
    
    const fullResult = {
      patientId: activePatientId,
      timestamp: new Date().toISOString(),
      apiScore: apiResult.score,
      memoryScore: memScore,
      combinedScore,
      risk: apiResult.risk,
      observations: apiResult.observations,
      challengeWords,
      recalledWords: matched,
      recommendations: apiResult.recommendations.length > 0 ? apiResult.recommendations : getLifestyleRecommendations(apiResult.risk),
      confidence: apiResult.confidence,
      transcript: apiResult.transcript,
    };

    saveAssessment(fullResult);
    setLatestResult(fullResult);
    setLocation('/results');
  };

  const translations = {
    en: {
      heroTitle: 'AI-Based Cognitive',
      heroSubtitle: 'Clinical Screening Tool',
      description: 'Instant, evidence-based cognitive screening using speech biomarkers and associative memory patterns. Designed for early detection and historical trend monitoring.',
      patientPlaceholder: 'Patient ID (Auto-generated if empty)',
      memoryTitle: 'Cognitive Memory Task',
      memoryHelp: 'Please memorize these 3 clinical markers. You will be asked to recall them following the linguistic assessment.',
      memorizedBtn: 'Confirm Memorization',
      audioBtn: 'Audio Input',
      textBtn: 'Text Input',
      tapStart: 'Start Clinical Recording',
      tapStop: 'Stop and Analyze',
      analyzeBtn: 'Process Analysis',
      recallTitle: 'Memory Recall Verification',
      recallHelp: 'Speech pattern analysis ready. Please recall the three markers provided at the start of the session.',
      seeResults: 'Generate Report',
      disclaimer: 'CLINICAL NOTICE: This system provides an AI-augmented screening, not a definitive diagnosis. It is intended for preliminary risk assessment and longitudinal tracking by healthcare professionals.',
      medicalCard: 'Screening Protocol',
      privacyNote: 'Secure Local Storage Active'
    },
    hi: {
      heroTitle: 'एआई-आधारित स्वास्थ',
      heroSubtitle: 'संज्ञानात्मक जांच प्रणाली',
      description: 'भाषण बायोमार्कर और स्मृति पैटर्न का उपयोग करके तत्काल संज्ञानात्मक जांच। यह प्रणाली प्रारंभिक जोखिम मूल्यांकन और दीर्घकालिक निगरानी के लिए तैयार की गई है।',
      patientPlaceholder: 'रोगी आईडी (स्वचालित रूप से उत्पन्न)',
      memoryTitle: 'संज्ञानात्मक स्मृति कार्य',
      memoryHelp: 'कृपया इन 3 शब्दों को याद करें। भाषाई मूल्यांकन के बाद आपसे इनके बारे में पूछा जाएगा।',
      memorizedBtn: 'मैंने याद कर लिया',
      audioBtn: 'ऑडियो इनपुट',
      textBtn: 'टेक्स्ट इनपुट',
      tapStart: 'जांच शुरू करें',
      tapStop: 'विश्लेषण करें',
      analyzeBtn: 'विश्लेषण प्रक्रिया शुरू करें',
      recallTitle: 'स्मृति सत्यापन',
      recallHelp: 'भाषाई विश्लेषण तैयार है। कृपया सत्र की शुरुआत में दिए गए तीन शब्दों को लिखें।',
      seeResults: 'रिपोर्ट प्राप्त करें',
      disclaimer: 'चिकित्सा सूचना: यह प्रणाली एआई-आधारित प्रारंभिक जांच (Screening) प्रदान करती है, यह अंतिम निदान नहीं है। यह केवल स्वास्थ्य पेशेवरों द्वारा उपयोग के लिए है।',
      medicalCard: 'जांच प्रोटोकॉल',
      privacyNote: 'सुरक्षित स्थानीय डेटा संग्रहण सक्रिय'
    }
  };

  const t = language === 'hi' ? translations.hi : translations.en;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[85vh] py-8">
      {/* Left Column — Context & Details */}
      <div className="space-y-8 animate-in slide-in-from-left duration-700">
        <div>
          <Badge variant="outline" className="mb-4 py-1 px-3 border-primary/30 text-primary bg-primary/5 flex items-center gap-2 w-fit">
            <HeartPulse className="w-3.5 h-3.5" /> Clinical Proto-Type v1.2
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-tight tracking-tight text-foreground">
            {t.heroTitle} <br />
            <span className="text-primary">{t.heroSubtitle}</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg font-medium">
            {t.description}
          </p>
        </div>

        <Card className="p-6 border-l-4 border-l-primary bg-white shadow-sm max-w-md">
           <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <Input
                  placeholder={t.patientPlaceholder}
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  className="bg-transparent border-none shadow-none focus-visible:ring-0 text-base font-bold p-0"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg">
                   <Languages className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 flex gap-2">
                   <button onClick={() => setLanguage('en')} className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${language === 'en' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}>English</button>
                   <button onClick={() => setLanguage('hi')} className={`text-xs font-bold px-3 py-1.5 rounded-md transition-colors ${language === 'hi' ? 'bg-primary text-white' : 'hover:bg-secondary'}`}>हिंदी</button>
                </div>
              </div>
           </div>
        </Card>

        {/* Professional Disclaimer Section */}
        <div className="max-w-md border-t border-border/60 pt-6 space-y-4">
           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[12px] leading-relaxed text-amber-900 font-semibold italic">
                {t.disclaimer}
              </p>
           </div>
           
           <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-bold uppercase tracking-widest px-1">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              {t.privacyNote}
           </div>
        </div>
      </div>

      {/* Right Column — Interactive Assessment Protocol */}
      <div className="relative">
        <div className="absolute -inset-10 bg-primary/5 blur-[120px] -z-10 rounded-full" />
        
        <Card className="p-10 border-none shadow-2xl relative overflow-hidden bg-white/90 backdrop-blur-sm">
           <div className="absolute bottom-0 right-0 p-6 opacity-[0.03] pointer-events-none translate-x-8 translate-y-8">
              <Brain className="w-56 h-56" />
           </div>

           <AnimatePresence mode="wait">
              {step === 'memorize' && (
                <motion.div 
                  key="memorize"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center gap-8 min-h-[400px] justify-center"
                >
                  <div className="text-center space-y-2">
                     <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.medicalCard}</h3>
                     <h2 className="text-2xl font-display font-bold text-foreground">{t.memoryTitle}</h2>
                  </div>

                   <div className="flex flex-row items-center justify-center gap-3 w-full overflow-x-auto pb-2">
                    {challengeWords.map((word, i) => (
                      <div key={i} className="px-6 py-4 bg-secondary rounded-2xl border-2 border-primary/10 shadow-sm whitespace-nowrap">
                        <span className="text-2xl md:text-3xl font-display font-black text-primary">{word}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col items-center gap-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                       <Clock className="w-4 h-4" /> AUTO-ADVANCE IN {countdown}S
                    </div>
                    <Button onClick={handleMemorized} size="lg" className="px-10 py-7 text-lg font-bold shadow-lg hover:shadow-primary/20 transition-all">
                      {t.memorizedBtn} <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 'record' && (
                <motion.div 
                  key="record"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex flex-col items-center gap-8 min-h-[400px] justify-center"
                >
                  <div className="flex gap-2 p-1 bg-secondary rounded-xl">
                    <button onClick={() => setMode('record')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'record' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}>{t.audioBtn}</button>
                    <button onClick={() => setMode('text')} className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${mode === 'text' ? 'bg-white text-primary shadow-sm' : 'text-muted-foreground'}`}>{t.textBtn}</button>
                  </div>

                  {mode === 'record' ? (
                    <div className="flex flex-col items-center gap-8 w-full">
                      <div className="h-10 w-full flex items-center justify-center">
                        <Waveform isActive={isRecording} />
                      </div>
                      <button 
                        onClick={isRecording ? handleStopRecording : handleStartRecording}
                        className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${isRecording ? 'bg-destructive text-white scale-110' : 'bg-primary text-white hover:bg-primary/90'}`}
                      >
                         {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-12 h-12" />}
                      </button>
                      <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">{isRecording ? t.tapStop : t.tapStart}</p>
                    </div>
                  ) : (
                    <textarea 
                      className="w-full h-40 p-4 rounded-2xl bg-secondary focus:bg-white border-2 border-transparent focus:border-primary/20 transition-all text-sm font-medium outline-none"
                      placeholder="Input clinical observations here..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                    />
                  )}

                  <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-7 text-lg font-bold tracking-tight">
                    {isAnalyzing ? 'Processing Patterns...' : t.analyzeBtn}
                  </Button>
                </motion.div>
              )}

              {step === 'recall' && (
                <motion.div 
                   key="recall"
                   initial={{ opacity: 0, scale: 1.1 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="flex flex-col items-center gap-8 min-h-[400px] justify-center"
                >
                   <div className="text-center space-y-2">
                     <Info className="w-10 h-10 text-primary mx-auto mb-4" />
                     <h2 className="text-2xl font-display font-bold">{t.recallTitle}</h2>
                     <p className="text-sm text-muted-foreground max-w-xs mx-auto">{t.recallHelp}</p>
                   </div>

                   <Input 
                      className="text-center text-2xl font-display font-black py-8 bg-secondary border-none"
                      placeholder="..."
                      value={recallInput}
                      onChange={(e) => setRecallInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleRecallSubmit()}
                   />

                   <Button onClick={handleRecallSubmit} size="lg" className="px-12 py-7 font-bold">
                      {t.seeResults}
                   </Button>
                </motion.div>
              )}
           </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
