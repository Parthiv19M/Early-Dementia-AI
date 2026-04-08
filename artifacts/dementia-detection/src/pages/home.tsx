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
import { getLifestyleRecommendations, calculateClinicalScore } from '@/lib/assessment-utils';
import { saveAssessment } from '@/lib/assessment-storage';
import { useAppStore, pickRandomWords, calculateMemoryScore, type RiskLevel } from '@/lib/store';
import type { AnalyzeResult } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';

type Step = 'memorize' | 'record';

export default function Home() {
  const [_, setLocation] = useLocation();
  const {
    userId, setUserId,
    ensurePatientId,
    language, setLanguage,
    setLatestResult,
    challengeWords, setChallengeWords,
  } = useAppStore();
  
  const { isRecording, startRecording, stopRecording, audioBlob, setAudioBlob, error: recorderError } = useAudioRecorder();

  const [step, setStep] = useState<Step>('memorize');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState('');

  const [countdown, setCountdown] = useState(10);
  const [recordingTimer, setRecordingTimer] = useState(10);
  
  const startTimeRef = useRef<number | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize fresh session on mount
  useEffect(() => {
    // Check for educational samples first (Task: Option 1)
    const sample = sessionStorage.getItem('synapta_sample');
    if (sample) {
      const data = JSON.parse(sample);
      sessionStorage.removeItem('synapta_sample');
      
      const challengeWordsLocal = ["Drum", "Trumpet", "Silver"];
      setChallengeWords(challengeWordsLocal);
      
      const performSampleAnalysis = async () => {
         setIsAnalyzing(true);
         const activePatientId = ensurePatientId();
         
         const score = data.forcedScore;
         const risk = data.forcedRisk;
         const recalled = data.recalled || [];
         
         const result = {
           patientId: activePatientId,
           timestamp: new Date().toISOString(),
           apiScore: score,
           memoryScore: (recalled.length / 3) * 100,
           combinedScore: score,
           risk: risk as RiskLevel,
           observations: data.forcedObservations || ["No specific observations reported."],
           challengeWords: challengeWordsLocal,
           recalledWords: recalled,
           recommendations: data.forcedRecommendations || getLifestyleRecommendations(score),
           confidence: data.forcedConfidence || 85,
           transcript: data.forcedExplanation || "Educational sample analysis completed.",
         };
         
         saveAssessment(result);
         setLatestResult(result);
         setTimeout(() => setLocation('/results'), 800);
      };
      performSampleAnalysis();
      return;
    }

    setChallengeWords(pickRandomWords(3));
    setAudioBlob(null);
    setTranscribedText('');
    setStep('memorize');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setError(null);
    } catch (e) {
      console.error('Recognition error', e);
    }
  }, [language]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscribedText('');
      startTimeRef.current = Date.now();
      await startRecording();
      startSpeechRecognition();
    } catch (err) {
      setError("Microphone access required");
    }
  }, [startRecording, startSpeechRecognition]);

  const handleStopRecording = useCallback(() => {
    stopRecording();
    stopSpeechRecognition();
  }, [stopRecording, stopSpeechRecognition]);

  // Master Timer - 10s Memorize Countdown
  useEffect(() => {
    if (step === 'memorize') {
      setCountdown(10);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step]);

  // Master Timer - 10s Record Countdown
  useEffect(() => {
    if (isRecording) {
      setRecordingTimer(10);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTimer(prev => {
          if (prev <= 1) {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            handleStopRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording, handleStopRecording]);

  useEffect(() => {
    if (!isRecording && step === 'record' && (audioBlob || transcribedText)) {
      handleInstantAnalysis();
    }
  }, [isRecording, audioBlob, step]);

  const handleInstantAnalysis = async () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setError(null);
    const activePatientId = ensurePatientId();

    try {
      const finalRawText = transcribedText.trim();
      const { matched } = calculateMemoryScore(challengeWords, finalRawText);
      const duration = startTimeRef.current ? (Date.now() - startTimeRef.current) / 1000 : 10;
      
      const { total: combinedScore, confidence, explanation, dynamicObservations } = calculateClinicalScore(
         matched.length,
         challengeWords.length,
         finalRawText,
         duration
      );

      const localResult = {
        patientId: activePatientId,
        timestamp: new Date().toISOString(),
        apiScore: combinedScore,
        memoryScore: (matched.length / challengeWords.length) * 100,
        combinedScore,
        risk: (combinedScore < 50 ? 'High' : combinedScore < 75 ? 'Medium' : 'Low') as RiskLevel,
        observations: dynamicObservations,
        challengeWords,
        recalledWords: matched,
        recommendations: getLifestyleRecommendations(combinedScore),
        confidence,
        transcript: explanation,
      };

      saveAssessment(localResult);
      setLatestResult(localResult);
      setLocation('/results');

      if (audioBlob) {
        const file = new File([audioBlob], 'speech-input.webm', { type: audioBlob.type || 'audio/webm' });
        transcribeAudio({ audio: file, language: language as any, userId: activePatientId })
          .catch(err => console.warn('Background sync failed - session preserved via local analysis.'));
      }
    } catch (err: any) {
      setError('Analysis encountered a delay. Retrying...');
      setIsAnalyzing(false);
    }
  };

  const handleMemorized = async () => {
    ensurePatientId();
    setStep('record');
    setTimeout(() => {
      handleStartRecording();
    }, 150);
  };

  const t = language === 'hi' ? {
    heroTitle: 'एआई-आधारित स्वास्थ',
    heroSubtitle: 'संज्ञानात्मक जांच प्रणाली',
    description: 'भाषण बायोमार्कर और स्मृति पैटर्न का उपयोग करके तत्काल संज्ञानात्मक जांच।',
    patientPlaceholder: 'रोगी आईडी दर्ज करें',
    memoryTitle: 'स्मृति चुनौती',
    memoryHelp: 'कृपया इन शब्दों को याद करें।',
    memorizedBtn: 'सत्यापन शुरू करें',
    medicalCard: 'जांच प्रोटोकॉल',
  } : {
    heroTitle: 'AI-Based Cognitive',
    heroSubtitle: 'Clinical Screening Tool',
    description: 'Instant, evidence-based cognitive screening for early detection.',
    patientPlaceholder: 'Patient ID (Auto-generated)',
    memoryTitle: 'Cognitive Memory Task',
    memoryHelp: 'Please memorize these words. You will recite them in the next step.',
    memorizedBtn: 'Confirm & Start Recording',
    medicalCard: 'Screening Protocol',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-4">
      <div className="space-y-6 animate-in slide-in-from-left duration-700">
        <div>
          <Badge variant="outline" className="mb-4 py-1 px-3 border-primary/30 text-primary bg-primary/5 flex items-center gap-2 w-fit">
            <HeartPulse className="w-3.5 h-3.5" /> Clinical Proto-Type v2.2
          </Badge>
          <h1 className="text-4xl md:text-5xl lg:text-5xl font-display font-extrabold leading-tight tracking-tight text-foreground">
            {t.heroTitle} <br />
            <span className="text-primary">{t.heroSubtitle}</span>
          </h1>
          <p className="mt-6 text-base text-muted-foreground leading-relaxed max-w-lg font-medium">
            {t.description}
          </p>
        </div>

        <Card className="p-6 border-l-4 border-l-primary bg-white shadow-sm max-w-md">
           <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg"><UserCircle className="w-5 h-5 text-primary" /></div>
                <Input placeholder={t.patientPlaceholder} value={userId} onChange={(e) => setUserId(e.target.value)} className="bg-transparent border-none shadow-none focus-visible:ring-0 text-base font-bold p-0" />
              </div>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary rounded-lg"><Languages className="w-5 h-5 text-primary" /></div>
                <div className="flex-1 flex gap-2">
                   <button onClick={() => setLanguage('en')} className={`text-[10px] font-black px-4 py-2 rounded-lg transition-colors ${language === 'en' ? 'bg-primary text-white' : 'bg-secondary'}`}>ENGLISH</button>
                   <button onClick={() => setLanguage('hi')} className={`text-[10px] font-black px-4 py-2 rounded-lg transition-colors ${language === 'hi' ? 'bg-primary text-white' : 'bg-secondary'}`}>HINDI</button>
                </div>
              </div>
           </div>
        </Card>
      </div>

      <div className="relative">
        <Card className="p-6 md:p-10 border-none shadow-2xl relative overflow-hidden bg-white/90 backdrop-blur-sm min-h-[460px] flex flex-col items-center justify-center">
           <AnimatePresence mode="wait">
              {step === 'memorize' && (
                <motion.div key="memorize" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.05 }} className="flex flex-col items-center gap-8 w-full text-center">
                  <div className="space-y-2">
                     <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">{t.medicalCard}</h3>
                     <h2 className="text-3xl font-display font-bold tracking-tight">{t.memoryTitle}</h2>
                  </div>
                   <div className="flex flex-wrap items-center justify-center gap-3 w-full mb-4">
                    {challengeWords.map((word, i) => (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} key={i} className="px-6 py-4 bg-secondary rounded-2xl border border-primary/5 shadow-sm min-w-[120px]">
                        <span className="text-xl md:text-2xl font-display font-black text-primary">{word}</span>
                      </motion.div>
                    ))}
                  </div>
                  <div className="flex flex-col items-center gap-5">
                    <p className="text-xs font-bold text-muted-foreground max-w-[200px]">{t.memoryHelp}</p>
                    <Button onClick={handleMemorized} size="lg" className="px-10 py-7 text-base font-black shadow-xl hover:shadow-primary/20 transition-all active:scale-95 group">
                      {t.memorizedBtn} <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                    <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/50 uppercase">
                       <Clock className="w-3.5 h-3.5" /> Study Period: {countdown}s
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 'record' && (
                <motion.div key="record" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6 w-full text-center">
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                       <div className="relative w-24 h-24">
                          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                       </div>
                       <div className="space-y-2">
                          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Clinical AI</h3>
                          <p className="text-xl font-display font-bold">Generating Instant Report...</p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8 w-full">
                       <div className="space-y-1">
                          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Active Task</h3>
                          <h4 className="text-2xl font-display font-black">Verbal Recall</h4>
                       </div>
                       <div className="relative w-44 h-44 flex items-center justify-center">
                          {isRecording && <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1.3, opacity: 0.2 }} transition={{ repeat: Infinity, duration: 1, ease: "easeOut" }} className="absolute inset-0 bg-primary rounded-full shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)]" />}
                          <button onClick={isRecording ? handleStopRecording : handleStartRecording} className={`z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative ${isRecording ? 'bg-destructive text-white scale-105' : 'bg-primary text-white'}`}>
                             {isRecording ? (
                               <div className="flex flex-col items-center">
                                 <Square className="w-10 h-10 mb-2 fill-current" />
                                 <span className="text-[10px] font-black uppercase tracking-[0.2em]">STOP & ANALYZE</span>
                                 <span className="text-2xl font-display font-black mt-1">{recordingTimer}s</span>
                               </div>
                             ) : <Mic className="w-12 h-12" />}
                          </button>
                       </div>
                       <div className="flex flex-col items-center gap-4">
                          <Waveform isActive={isRecording} />
                          <p className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                            {isRecording ? "RECORDING IN PROGRESS" : "TAP MIC TO BEGIN"}
                          </p>
                       </div>
                       {(error || recorderError) && (
                         <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest bg-destructive px-6 py-3 rounded-full shadow-lg">
                           <ShieldAlert className="w-4 h-4" /> {error || recorderError}
                         </div>
                       )}
                    </div>
                  )}
                </motion.div>
              )}
           </AnimatePresence>
        </Card>
      </div>
    </div>
  );
}
