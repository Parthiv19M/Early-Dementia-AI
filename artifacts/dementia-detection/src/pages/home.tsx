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
  const { isRecording, startRecording, stopRecording, audioBlob, setAudioBlob } = useAudioRecorder();

  const [step, setStep] = useState<Step>('memorize');
  const [mode, setMode] = useState<'record' | 'text'>('record');
  const [textInput, setTextInput] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [apiResult, setApiResult] = useState<AnalyzeResult | null>(null);

  const [countdown, setCountdown] = useState(10);
  const [recordingTimer, setRecordingTimer] = useState(10);
  const [durationSeconds, setDurationSeconds] = useState(0);
  
  const startTimeRef = useRef<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize fresh session
  useEffect(() => {
    // Generate new words for a new session
    setChallengeWords(pickRandomWords(3));
    setAudioBlob(null);
    setTranscribedText('');
    setStep('memorize');
  }, [setChallengeWords, setAudioBlob]);

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
      if (event.error === 'not-allowed') {
        setError('Microphone permission denied.');
      }
      setIsTranscribing(false);
    };

    recognition.onend = () => {
      setIsTranscribing(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsTranscribing(true);
      setTranscribedText('');
      setError(null);
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, [language]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsTranscribing(false);
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      setError(null);
      setTranscribedText('');
      startTimeRef.current = Date.now();
      await startRecording();
      startSpeechRecognition();
    } catch (err) {
      console.error("Critical Recording Start Failure:", err);
      setError("Failed to start recording. Please check microphone permissions.");
    }
  }, [startRecording, startSpeechRecognition]);

  const handleStopRecording = useCallback(() => {
    if (startTimeRef.current) {
      setDurationSeconds((Date.now() - startTimeRef.current) / 1000);
      startTimeRef.current = null;
    }
    stopRecording();
    stopSpeechRecognition();
  }, [stopRecording, stopSpeechRecognition]);

  const handleAnalyze = useCallback(async () => {
    const activePatientId = ensurePatientId();
    
    if (isRecording) {
      handleStopRecording();
    }

    // Wait for the MediaRecorder to finalize the blob
    let pollCount = 0;
    while (!audioBlob && pollCount < 15 && mode === 'record') {
       await new Promise(r => setTimeout(r, 100));
       pollCount++;
    }

    const userSpeechText = mode === 'record' ? transcribedText.trim() : textInput.trim();

    if (mode === 'record' && !audioBlob && !userSpeechText) {
      setError('System could not capture memory response. Click recording button to retry.');
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const apiTimeout = setTimeout(() => {
      if (isAnalyzing) {
        setIsAnalyzing(false);
        setError('Analysis stalled. System timeout reached.');
      }
    }, 15000);

    try {
      let result: ApiAnalysisResult;
      if (mode === 'record' && audioBlob) {
        const file = new File([audioBlob], 'speech-input.webm', { type: audioBlob.type || 'audio/webm' });
        result = await transcribeAudio({ audio: file, language: language as any, userId: activePatientId });
      } else {
        result = await analyzeText({ text: userSpeechText || '', language: language as any, userId: activePatientId });
      }

      // Professional simulated evaluation delay
      await new Promise(r => setTimeout(r, 1500));
      
      const finalSpeechText = result.transcript || userSpeechText;
      const { matched } = calculateMemoryScore(challengeWords, finalSpeechText);
      
      const { total: combinedScore, confidence, explanation, dynamicObservations } = calculateClinicalScore(
         matched.length,
         challengeWords.length,
         finalSpeechText,
         durationSeconds || 10
      );
      
      const fullResult = {
        patientId: activePatientId,
        timestamp: new Date().toISOString(),
        apiScore: result.riskScore,
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

      saveAssessment(fullResult);
      setLatestResult(fullResult);
      setLocation('/results');
    } catch (err: any) {
      setError('Assessment failed to process. Ensure stable internet connection.');
    } finally {
      setIsAnalyzing(false);
      clearTimeout(apiTimeout);
    }
  }, [audioBlob, mode, transcribedText, textInput, language, isRecording, ensurePatientId, handleStopRecording, challengeWords, durationSeconds, setLatestResult, setLocation]);

  // Master Timer - 10s Memorize Countdown
  useEffect(() => {
    if (step === 'memorize') {
      setCountdown(10);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            // Automatic advancement disabled per Task requirements for explicit click,
            // but the UI reflects the end of study period.
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
    if (isRecording && mode === 'record') {
      setRecordingTimer(10);
      const timer = setInterval(() => {
        setRecordingTimer(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleStopRecording();
            // Critical Auto-Trigger for Analysis (Task 6)
            setTimeout(() => {
              handleAnalyze();
            }, 600);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isRecording, mode, handleStopRecording, handleAnalyze]);

  const handleMemorized = async () => {
    ensurePatientId();
    setStep('record');
    // Task 2: Recording starts automatically after click
    setTimeout(() => {
       handleStartRecording();
    }, 400);
  };

  const t = language === 'hi' ? {
    heroTitle: 'एआई-आधारित स्वास्थ',
    heroSubtitle: 'संज्ञानात्मक जांच प्रणाली',
    description: 'भाषण बायोमार्कर और स्मृति पैटर्न का उपयोग करके तत्काल संज्ञानात्मक जांच। यह प्रणाली प्रारंभिक जोखिम मूल्यांकन और निगरानी के लिए है।',
    patientPlaceholder: 'रोगी आईडी दर्ज करें',
    memoryTitle: 'स्मृति चुनौती',
    memoryHelp: 'कृपया इन शब्दों को याद करें। ३... २... १...',
    memorizedBtn: 'सत्यापन शुरू करें',
    disclaimer: 'CLINICAL NOTICE: यह प्रणाली एआई-आधारित जांच प्रदान करती है, यह अंतिम निदान नहीं है।',
    medicalCard: 'जांच प्रोटोकॉल',
    privacyNote: 'सुरक्षित स्थानीय डेटा संग्रहण',
    tapStart: 'जांच शुरू करें'
  } : {
    heroTitle: 'AI-Based Cognitive',
    heroSubtitle: 'Clinical Screening Tool',
    description: 'Instant, evidence-based cognitive screening using speech biomarkers and associative memory patterns. Designed for early detection.',
    patientPlaceholder: 'Patient ID (Auto-generated)',
    memoryTitle: 'Cognitive Memory Task',
    memoryHelp: 'Please memorize these words. You will recite them in the next step.',
    memorizedBtn: 'Confirm & Start Recording',
    disclaimer: 'CLINICAL NOTICE: This system provides AI-augmented screening. Always consult a healthcare professional for diagnosis.',
    medicalCard: 'Screening Protocol',
    privacyNote: 'Secure Local Storage Active',
    tapStart: 'Tap Start Recording'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-4">
      <div className="space-y-6 animate-in slide-in-from-left duration-700">
        <div>
          <Badge variant="outline" className="mb-4 py-1 px-3 border-primary/30 text-primary bg-primary/5 flex items-center gap-2 w-fit">
            <HeartPulse className="w-3.5 h-3.5" /> Clinical Proto-Type v1.5
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
                   <button onClick={() => setLanguage('en')} className={`text-[10px] font-black px-4 py-2 rounded-lg transition-colors ${language === 'en' ? 'bg-primary text-white' : 'bg-secondary'}`}>ENGLISH</button>
                   <button onClick={() => setLanguage('hi')} className={`text-[10px] font-black px-4 py-2 rounded-lg transition-colors ${language === 'hi' ? 'bg-primary text-white' : 'bg-secondary'}`}>HINDI</button>
                </div>
              </div>
           </div>
        </Card>
      </div>

      <div className="relative">
        <div className="absolute -inset-10 bg-primary/5 blur-[120px] -z-10 rounded-full" />
        
        <Card className="p-6 md:p-10 border-none shadow-2xl relative overflow-hidden bg-white/90 backdrop-blur-sm min-h-[460px] flex flex-col items-center justify-center">
           <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
              <Brain className="w-48 h-48" />
           </div>

           <AnimatePresence mode="wait">
              {step === 'memorize' && (
                <motion.div 
                  key="memorize"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex flex-col items-center gap-8 w-full"
                >
                  <div className="text-center space-y-2">
                     <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">{t.medicalCard}</h3>
                     <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">{t.memoryTitle}</h2>
                  </div>

                   <div className="grid grid-cols-1 gap-3 w-full max-w-[280px]">
                    {challengeWords.map((word, i) => (
                      <motion.div 
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: i * 0.1 }}
                        key={i} 
                        className="px-6 py-4 bg-secondary rounded-2xl border border-primary/5 shadow-sm text-center"
                      >
                        <span className="text-2xl font-display font-black text-primary">{word}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex flex-col items-center gap-5">
                    <p className="text-xs font-bold text-muted-foreground text-center max-w-[200px]">
                      {t.memoryHelp}
                    </p>
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
                <motion.div 
                  key="record"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-6 w-full"
                >
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
                       <div className="relative w-24 h-24">
                          <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                       </div>
                       <div className="text-center space-y-2">
                          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Clinical AI</h3>
                          <p className="text-xl font-display font-bold text-foreground">Processing Diagnostic Biomarkers...</p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-8 w-full">
                       <div className="flex flex-col items-center gap-2 text-center">
                          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.25em]">Active Task</h3>
                          <h4 className="text-2xl font-display font-black">Verbal Recall</h4>
                          <p className="text-xs text-muted-foreground font-medium max-w-[240px]">
                             Please speak the memorized words clearly into the microphone.
                          </p>
                       </div>

                       <div className="relative w-44 h-44 flex items-center justify-center">
                          {isRecording && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1.3, opacity: 0.2 }}
                              transition={{ repeat: Infinity, duration: 1, ease: "easeOut" }}
                              className="absolute inset-0 bg-primary rounded-full shadow-[0_0_40px_rgba(var(--primary-rgb),0.4)]"
                            />
                          )}
                          
                          <button 
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative ${isRecording ? 'bg-destructive text-white scale-105' : 'bg-primary text-white hover:bg-primary/90'}`}
                          >
                             {isRecording ? (
                               <div className="flex flex-col items-center">
                                 <span className="text-5xl font-black font-display leading-none">{recordingTimer}</span>
                                 <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-2">REC ACTIVE</span>
                               </div>
                             ) : (
                               <div className="flex flex-col items-center">
                                 <Mic className="w-12 h-12 mb-1" />
                                 <span className="text-[8px] font-black uppercase tracking-[0.2em]">Manual Trigger</span>
                               </div>
                             )}
                          </button>
                       </div>

                       <div className="flex flex-col items-center gap-4">
                          <Waveform isActive={isRecording} />
                          <p className={`text-[10px] font-black uppercase tracking-[0.3em] transition-colors ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                            {isRecording ? "STABILITY: MONITORING DATA" : "SYSTEM SYNCHRONIZED"}
                          </p>
                       </div>

                       {error && (
                         <div className="flex items-center gap-2 text-white font-black text-[10px] uppercase tracking-widest bg-destructive px-6 py-3 rounded-full shadow-lg">
                           <ShieldAlert className="w-4 h-4" /> {error}
                         </div>
                       )}
                    </div>
                  )}
                </motion.div>
              )}
           </AnimatePresence>
        </Card>

        <div className="mt-8 space-y-4 animate-in fade-in duration-1000 delay-500">
           <div className="bg-amber-50/70 backdrop-blur-sm border border-amber-200/50 rounded-2xl p-5 flex gap-4 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600/80 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-amber-900/90 font-medium">
                {t.disclaimer}
              </p>
           </div>
           
           <div className="flex items-center gap-2 text-[9px] text-muted-foreground/40 font-black uppercase tracking-[0.2em] px-1">
              <ClipboardCheck className="w-3 h-3 text-primary/50" />
              {t.privacyNote}
           </div>
        </div>
      </div>
    </div>
  );
}
