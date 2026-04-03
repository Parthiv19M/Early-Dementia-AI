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
  const { isRecording, startRecording, stopRecording, audioBlob } = useAudioRecorder();

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

  useEffect(() => {
    const sampleStr = sessionStorage.getItem('synapta_sample');
    if (sampleStr) {
      try {
        const sample = JSON.parse(sampleStr);
        setTextInput(sample.text);
        setMode('text');
        setStep('record');
        if (sample.recalled && sample.recalled.includes(',')) {
          setChallengeWords(['Drum', 'Trumpet', 'Silver']);
        }
        sessionStorage.removeItem('synapta_sample');
      } catch (e) {
        console.error('Failed to parse sample data', e);
      }
    }
  }, [setChallengeWords]);

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

  const handleStartRecording = useCallback(() => {
    setError(null);
    setTranscribedText('');
    startTimeRef.current = Date.now();
    startRecording();
    startSpeechRecognition();
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

    console.log('--- CLIINICAL DEBUG: Waiting for audio blob to settle...');
    let pollCount = 0;
    while (!audioBlob && pollCount < 10 && mode === 'record') {
       await new Promise(r => setTimeout(r, 100));
       pollCount++;
    }

    const userSpeechText = mode === 'record' ? transcribedText.trim() : textInput.trim();

    if (mode === 'record' && !audioBlob && !userSpeechText) {
      setError('Recording failed or empty input. Please try again.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    const analysisTimeout = setTimeout(() => {
      setIsAnalyzing(false);
      setError('Analysis taking longer than expected. Please retry.');
    }, 15000);

    try {
      let result: ApiAnalysisResult;
      if (mode === 'record' && audioBlob) {
        try {
          const file = new File([audioBlob], 'speech-input.webm', { type: audioBlob.type || 'audio/webm' });
          result = await transcribeAudio({ audio: file, language: language as any, userId: activePatientId });
          setTranscribedText(result.transcript);
        } catch (transcribeError) {
          if (!userSpeechText) throw transcribeError;
          result = await analyzeText({ text: userSpeechText, language: language as any, userId: activePatientId });
        }
      } else {
        result = await analyzeText({ text: userSpeechText || '', language: language as any, userId: activePatientId });
      }

      await new Promise(r => setTimeout(r, 1500));
      
      // Calculate final results automatically
      const displayResult = toDisplayResult(result);
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
        apiScore: displayResult.score,
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
      clearTimeout(analysisTimeout);
    } catch (err: any) {
      console.error('--- CLIINICAL DEBUG: Analysis Error:', err);
      setError('Analysis failed. Please check your mic connection and try again.');
    } finally {
      setIsAnalyzing(false);
      clearTimeout(analysisTimeout);
    }
  }, [audioBlob, mode, transcribedText, textInput, language, isRecording, ensurePatientId, handleStopRecording, challengeWords, durationSeconds, setLatestResult, setLocation]);

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
  }, [step]);

  useEffect(() => {
    if (isRecording && mode === 'record') {
      setRecordingTimer(10);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTimer(prev => {
          if (prev <= 1) {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            handleStopRecording();
            setTimeout(() => {
              handleAnalyze();
            }, 500);
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
  }, [isRecording, mode, handleStopRecording, handleAnalyze]);

  const handleMemorized = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    ensurePatientId();
    setStep('record');
    setTimeout(() => {
      handleStartRecording();
    }, 500);
  };

  const translations = {
    en: {
      heroTitle: 'AI-Based Cognitive',
      heroSubtitle: 'Clinical Screening Tool',
      description: 'Instant, evidence-based cognitive screening using speech biomarkers and associative memory patterns. Designed for early detection and historical trend monitoring.',
      patientPlaceholder: 'Patient ID (Auto-generated if empty)',
      memoryTitle: 'Cognitive Memory Task',
      memoryHelp: 'Please memorize these words. You will be asked to recall them shortly.',
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
      memoryHelp: 'कृपया इन शब्दों को याद करें। आपसे जल्द ही इनके बारे में पूछा जाएगा।',
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-4">
      <div className="space-y-6 animate-in slide-in-from-left duration-700">
        <div>
          <Badge variant="outline" className="mb-4 py-1 px-3 border-primary/30 text-primary bg-primary/5 flex items-center gap-2 w-fit">
            <HeartPulse className="w-3.5 h-3.5" /> Clinical Proto-Type v1.4
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
      </div>

      <div className="relative">
        <div className="absolute -inset-10 bg-primary/5 blur-[120px] -z-10 rounded-full" />
        
        <Card className="p-6 md:p-10 border-none shadow-2xl relative overflow-hidden bg-white/90 backdrop-blur-sm">
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
                  className="flex flex-col items-center gap-6 min-h-[360px] justify-center"
                >
                  <div className="text-center space-y-2">
                     <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{t.medicalCard}</h3>
                     <h2 className="text-2xl font-display font-bold text-foreground">{t.memoryTitle}</h2>
                  </div>

                  <p className="text-sm font-medium text-muted-foreground text-center max-w-sm -mt-4">
                    {t.memoryHelp}
                  </p>

                   <div className="flex flex-wrap items-center justify-center gap-2 w-full overflow-hidden">
                    {challengeWords.map((word, i) => (
                      <div key={i} className="px-4 py-3 bg-secondary rounded-xl border-2 border-primary/10 shadow-sm whitespace-nowrap">
                        <span className="text-xl md:text-3xl font-display font-black text-primary">{word}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                       <Clock className="w-4 h-4" /> AUTO-ADVANCE IN {countdown}S
                    </div>
                    <Button onClick={handleMemorized} size="lg" className="px-8 py-5 md:px-10 md:py-7 text-base md:text-lg font-bold shadow-lg hover:shadow-primary/20 transition-all">
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
                  className="flex flex-col items-center gap-4 min-h-[360px] justify-center"
                >
                  {isAnalyzing ? (
                    <div className="flex flex-col items-center gap-6 animate-pulse">
                       <div className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                       <div className="text-center space-y-2">
                          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Diagnostic Neural Engine</h3>
                          <p className="text-xl font-display font-bold text-foreground">Analyzing Biomarkers...</p>
                       </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-6 w-full">
                       <div className="flex flex-col items-center gap-2 text-center mb-2">
                          <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Active Task</h3>
                          <h4 className="text-xl font-display font-bold">Verbal Memory Recall</h4>
                          <p className="text-xs text-muted-foreground font-medium max-w-[240px]">
                             Please recite the words you just memorized into the microphone.
                          </p>
                       </div>

                       <div className="relative w-40 h-40 flex items-center justify-center">
                          {isRecording && (
                            <motion.div 
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1.2, opacity: 0.15 }}
                              transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                              className="absolute inset-0 bg-primary rounded-full"
                            />
                          )}
                          
                          <button 
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`z-10 w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl relative ${isRecording ? 'bg-destructive text-white scale-110' : 'bg-primary text-white hover:bg-primary/90'}`}
                          >
                             {isRecording ? (
                               <div className="flex flex-col items-center">
                                 <span className="text-4xl font-black font-display leading-none">{recordingTimer}s</span>
                                 <span className="text-[9px] font-black uppercase tracking-widest mt-1">Remaining</span>
                               </div>
                             ) : (
                               <div className="flex flex-col items-center">
                                 <Mic className="w-10 h-10 mb-1" />
                                 <span className="text-[9px] font-black uppercase tracking-widest">Manual Start</span>
                               </div>
                             )}
                          </button>
                       </div>

                       <div className="flex flex-col items-center gap-3">
                          <Waveform isActive={isRecording} />
                          <p className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isRecording ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`}>
                            {isRecording ? "STABILITY: MONITORING SPEECH" : "SYSTEM READY FOR INPUT"}
                          </p>
                       </div>

                       {error && (
                         <div className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase tracking-tighter bg-destructive/5 px-4 py-2 border border-destructive/10 rounded-full">
                           <ShieldAlert className="w-3.5 h-3.5" /> {error}
                         </div>
                       )}
                    </div>
                  )}
                </motion.div>
              )}
           </AnimatePresence>
        </Card>

        <div className="mt-8 space-y-4 animate-in fade-in duration-1000 delay-500">
           <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-100 rounded-2xl p-4 flex gap-3 shadow-sm">
              <ShieldAlert className="w-5 h-5 text-amber-600/70 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed text-amber-900/80 font-medium">
                {t.disclaimer}
              </p>
           </div>
           
           <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-black uppercase tracking-widest px-1 opacity-60">
              <ClipboardCheck className="w-3.5 h-3.5 text-primary" />
              {t.privacyNote}
           </div>
        </div>
      </div>
    </div>
  );
}
