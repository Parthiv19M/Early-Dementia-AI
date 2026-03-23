import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Mic, Square, Languages, UserCircle, Type, Brain, Sparkles, ArrowRight, CheckCircle2, RotateCcw } from 'lucide-react';
import {
  analyzeText,
  createReport,
  transcribeAudio,
  type AnalysisResult as ApiAnalysisResult,
} from '@workspace/api-client-react';
import { Button, Card, Input, Waveform } from '@/components/ui';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { getLifestyleRecommendations } from '@/lib/assessment-utils';
import { saveAssessment } from '@/lib/assessment-storage';
import { useAppStore, pickRandomWords, calculateMemoryScore } from '@/lib/store';
import type { AnalyzeResult } from '@/lib/store';

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

  // Multi-step state
  const [step, setStep] = useState<Step>('memorize');
  const [mode, setMode] = useState<'record' | 'text'>('record');
  const [textInput, setTextInput] = useState('');
  const [transcribedText, setTranscribedText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Recall state
  const [recallInput, setRecallInput] = useState('');
  const [apiResult, setApiResult] = useState<AnalyzeResult | null>(null);

  // Countdown for memorization
  const [countdown, setCountdown] = useState(10);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start countdown when entering memorize step
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

  // Web Speech API
  const recognitionRef = useRef<any>(null);

  const startSpeechRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      return;
    }

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

  // Step transitions
  const handleMemorized = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    ensurePatientId();
    setStep('record');
  };

  const handleAnalyze = async () => {
    const activePatientId = ensurePatientId();
    const userSpeechText = mode === 'record' ? transcribedText.trim() : textInput.trim();

    if (mode === 'record' && !audioBlob && !userSpeechText) {
      setError('No speech detected. Please record again or switch to text mode.');
      return;
    }

    if (mode === 'text' && !userSpeechText) {
      setError('Please enter some text to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      let result: ApiAnalysisResult;

      if (mode === 'record' && audioBlob) {
        try {
          result = await transcribeAudio({
            audio: new File([audioBlob], 'speech-input.webm', {
              type: audioBlob.type || 'audio/webm',
            }),
            language: language as any,
            userId: activePatientId,
          });
          setTranscribedText(result.transcript);
        } catch (transcribeError) {
          if (!userSpeechText) {
            throw transcribeError;
          }

          result = await analyzeText({
            text: userSpeechText,
            language: language as any,
            userId: activePatientId,
          });
        }
      } else {
        result = await analyzeText({
          text: userSpeechText,
          language: language as any,
          userId: activePatientId,
        });
      }

      if (activePatientId) {
        try {
          await createReport({
            userId: activePatientId,
            transcript: result.transcript,
            riskLevel: result.riskLevel,
            riskScore: result.riskScore,
            confidence: result.confidence,
            features: result.features,
            problematicPatterns: result.problematicPatterns,
            recommendations: result.recommendations,
            language: result.language,
          });
        } catch (saveError) {
          console.error('Saving report failed:', saveError);
        }
      }

      setApiResult(toDisplayResult(result));
      setStep('recall');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(
        err?.message || t.analyzeError,
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRecallSubmit = () => {
    if (!apiResult) return;

    const activePatientId = ensurePatientId();
    const { score: memScore, matched } = calculateMemoryScore(challengeWords, recallInput);
    const combinedScore = Math.round((apiResult.score * 0.6) + (memScore * 0.4));
    const timestamp = new Date().toISOString();

    const fullResult = {
      patientId: activePatientId,
      timestamp,
      apiScore: apiResult.score,
      memoryScore: memScore,
      combinedScore,
      risk: apiResult.risk,
      observations: apiResult.observations,
      challengeWords,
      recalledWords: matched,
      recommendations:
        apiResult.recommendations.length > 0
          ? apiResult.recommendations
          : getLifestyleRecommendations(apiResult.risk),
      confidence: apiResult.confidence,
      transcript: apiResult.transcript,
    };

    saveAssessment(fullResult);
    setLatestResult(fullResult);
    setLocation('/results');
  };

  const handleRestart = () => {
    setChallengeWords(pickRandomWords(3));
    setStep('memorize');
    setRecallInput('');
    setApiResult(null);
    setTranscribedText('');
    setTextInput('');
    setError(null);
  };

  // ─────────────── Render ───────────────

  const translations = {
    en: {
      heroTitle: 'AI-Based Cognitive',
      heroSubtitle: 'Screening in Under 60 Seconds',
      description: 'Fast, accessible, and early detection without medical infrastructure. Our AI analyzes speech patterns and memory recall to flag cognitive risks — all from your browser.',
      patientPlaceholder: 'Patient ID will be auto-generated',
      memoryTitle: 'Memory Challenge',
      memoryHelp: 'Memorize these 3 words. You\'ll be asked to recall them after the speech analysis.',
      memorizedBtn: 'I\'ve Memorized Them',
      audioBtn: 'Record Audio',
      textBtn: 'Enter Text',
      readyToRecord: 'Ready to record',
      captureMsg: 'Recording captured',
      tapStart: 'Tap to start recording',
      tapStop: 'Tap to stop recording',
      analyzeBtn: 'Analyze Speech',
      analyzingBtn: 'Analyzing Speech Patterns...',
      recallTitle: 'Word Recall',
      recallHelp: 'Speech analysis complete! Now type the 3 words you memorized at the start, separated by spaces or commas.',
      seeResults: 'See My Results',
      skipRecall: 'Skip Recall',
      disclaimer: '⚠️ This is an AI-based screening tool and not a medical diagnosis.',
      analyzeError: 'Analysis failed. Please ensure the backend is running and try again.',
      analyzingHelp: 'Your analysis is in progress, please wait...',
      savingError: 'Saving report failed.'
    },
    hi: {
      heroTitle: 'एआई-आधारित संज्ञानात्मक',
      heroSubtitle: 'स्क्रीनिंग 60 सेकंड से कम समय में',
      description: 'तेज, सुलभ, और प्रारंभिक पहचान बिना चिकित्सा बुनियादी ढांचे के। हमारी एआई भाषण पैटर्न और मेमोरी रिकॉल का विश्लेषण करती है — सब कुछ सीधे आपके ब्राउज़र से।',
      patientPlaceholder: 'रोगी आईडी स्वचालित रूप से उत्पन्न होगी',
      memoryTitle: 'स्मृति परीक्षण',
      memoryHelp: 'इन 3 शब्दों को याद करें। भाषण विश्लेषण के बाद आपसे इन्हें फिर से बताने को कहा जाएगा।',
      memorizedBtn: 'मैंने याद कर लिया',
      audioBtn: 'आवाज रिकॉर्ड करें',
      textBtn: 'टेक्स्ट दर्ज करें',
      readyToRecord: 'रिकॉर्ड करने के लिए तैयार',
      captureMsg: 'रिकॉर्डिंग पूरी हुई',
      tapStart: 'रिकॉर्ड करना शुरू करने के लिए टैप करें',
      tapStop: 'रिकॉर्ड करना बंद करने के लिए टैप करें',
      analyzeBtn: 'भाषण का विश्लेषण करें',
      analyzingBtn: 'भाषण विश्लेषण जारी है...',
      recallTitle: 'शब्द फिर से बताएं',
      recallHelp: 'भाषण विश्लेषण पूरा! अब शुरुआत में याद किए गए 3 शब्दों को लिखें (अल्पविराम या स्पेस के साथ)।',
      seeResults: 'मेरे परिणाम देखें',
      skipRecall: 'छोड़ें',
      disclaimer: '⚠️ यह एक एआई-आधारित स्क्रीनिंग उपकरण है और चिकित्सा निदान नहीं है।',
      analyzeError: 'विश्लेषण विफल रहा। कृपया सुनिश्चित करें कि बैकएंड चल रहा है और पुन: प्रयास करें।',
      analyzingHelp: 'आपका विश्लेषण चल रहा है, कृपया प्रतीक्षा करें...',
      savingError: 'रिपोर्ट सहेजने में विफल।'
    }
  };

  const t = language === 'hi' ? translations.hi : translations.en;

  // Render...
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[80vh] fade-in">
      <div className="space-y-8 animate-in slide-in-from-left duration-700">
        <div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-extrabold leading-tight">
            {t.heroTitle} <br />
            <span className="gradient-text">{t.heroSubtitle}</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-lg">
            {t.description}
          </p>
        </div>

        <div className="flex flex-col gap-4 max-w-md">
          <div className="flex items-center gap-3">
            <UserCircle className="w-5 h-5 text-primary" />
            <Input
              placeholder={t.patientPlaceholder}
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="flex items-center gap-3">
            <Languages className="w-5 h-5 text-primary" />
            <div className="w-full bg-white border-2 border-border rounded-xl p-1 flex">
              <button
                onClick={() => setLanguage('en')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${language === 'en' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-secondary/80'}`}
              >English</button>
              <button
                onClick={() => setLanguage('hi')}
                className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${language === 'hi' ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-muted-foreground hover:bg-secondary/80'}`}
              >Hindi (हिंदी)</button>
            </div>
          </div>
        </div>

        <p className="text-sm text-muted-foreground max-w-md">
          A Patient ID is created automatically when the assessment begins, so you can reuse it later in History and Dashboard.
        </p>

        {/* Disclaimer Task 3 */}
        <div className="pt-6 mt-4 border-t border-border/40 max-w-md">
          <div className="flex gap-2 items-start opacity-70 group hover:opacity-100 transition-opacity duration-300">
            <div className="mt-0.5 p-1 rounded-full bg-primary/5 text-primary shrink-0">
              <Sparkles className="w-3 h-3" />
            </div>
            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed tracking-wide">
              {t.disclaimer}
            </p>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 max-w-md pt-4">
          {(['memorize', 'record', 'recall'] as Step[]).map((s, i) => (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${step === s ? 'text-primary' : s === 'memorize' && step !== 'memorize' ? 'text-success' : 'text-muted-foreground/50'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  step === s ? 'bg-primary text-white' :
                  (s === 'memorize' && step !== 'memorize') || (s === 'record' && step === 'recall') ? 'bg-success/20 text-success' :
                  'bg-secondary text-muted-foreground'
                }`}>
                  {(s === 'memorize' && step !== 'memorize') || (s === 'record' && step === 'recall')
                    ? <CheckCircle2 className="w-3.5 h-3.5" />
                    : i + 1}
                </span>
                {s === 'memorize' ? (language === 'hi' ? 'स्मृति' : 'Memorize') : s === 'record' ? (language === 'hi' ? 'बोलें' : 'Speak') : (language === 'hi' ? 'याद करें' : 'Recall')}
              </div>
              {i < 2 && <div className={`flex-1 h-0.5 rounded ${
                (i === 0 && step !== 'memorize') || (i === 1 && step === 'recall') ? 'bg-success/40' : 'bg-border'
              }`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Right column — Interactive card */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl -z-10 rounded-[3rem]" />

        <Card className="p-8 relative overflow-hidden transition-all duration-500 hover:shadow-2xl">
          <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay" style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/hero-bg.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }} />

          {/* ───── STEP 1: Memorize ───── */}
          {step === 'memorize' && (
            <div className="relative z-10 flex flex-col items-center gap-6 min-h-[340px] justify-center animate-in fade-in zoom-in duration-300">
              <div className="flex items-center gap-2 text-primary">
                <Brain className="w-6 h-6" />
                <h2 className="text-xl font-display font-bold">{t.memoryTitle}</h2>
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {t.memoryHelp.split('3 words')[0]}<strong>3 {language === 'hi' ? 'शब्द' : 'words'}</strong>{t.memoryHelp.split('3 words')[1]}
              </p>

              <div className="flex gap-4 my-4">
                {challengeWords.map((word, i) => (
                  <div
                    key={i}
                    className="px-6 py-4 bg-gradient-to-br from-primary/10 to-accent/10 border-2 border-primary/20 rounded-2xl text-center shadow-lg transition-transform hover:scale-105"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <span className="text-2xl font-display font-bold text-primary">{word}</span>
                  </div>
                ))}
              </div>

              {/* Countdown ring */}
              <div className="relative w-16 h-16 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" className="stroke-secondary fill-none" strokeWidth="4" />
                  <circle
                    cx="32" cy="32" r="28"
                    className="stroke-primary fill-none"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 28}
                    strokeDashoffset={2 * Math.PI * 28 * (1 - countdown / 10)}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <span className="absolute text-lg font-bold text-foreground">{countdown}</span>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleMemorized}
                  className="gap-2 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] hover:shadow-xl shadow-lg shadow-primary/10 px-8"
                >
                  {t.memorizedBtn} <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setChallengeWords(pickRandomWords(3)); setCountdown(10); }}
                  className="hover:bg-primary/5 rounded-full w-10 h-10 p-0 transition-transform active:rotate-180 duration-500"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ───── STEP 2: Speak ───── */}
          {step === 'record' && (
            <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex justify-center gap-4 mb-8">
                <button
                  onClick={() => setMode('record')}
                  className={`px-4 py-2 font-semibold text-sm rounded-full transition-all duration-200 hover:scale-[1.05] flex items-center gap-2 ${mode === 'record' ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
                >
                  <Mic className="w-4 h-4" /> {t.audioBtn}
                </button>
                <button
                  onClick={() => setMode('text')}
                  className={`px-4 py-2 font-semibold text-sm rounded-full transition-all duration-200 hover:scale-[1.05] flex items-center gap-2 ${mode === 'text' ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm' : 'text-muted-foreground hover:bg-secondary'}`}
                >
                  <Type className="w-4 h-4" /> {t.textBtn}
                </button>
              </div>

              <div className="min-h-[260px] flex flex-col items-center justify-center">
                {mode === 'record' ? (
                  <div className="flex flex-col items-center gap-6 w-full">
                    <div className="h-16 w-full max-w-[200px] flex items-center justify-center">
                      {isRecording ? (
                        <Waveform isActive={true} />
                      ) : audioBlob ? (
                        <Waveform isActive={false} />
                      ) : (
                        <span className="text-muted-foreground text-sm font-medium">{t.readyToRecord}</span>
                      )}
                    </div>

                    <button
                      onClick={isRecording ? handleStopRecording : handleStartRecording}
                      disabled={isAnalyzing}
                      className={`w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl hover:scale-110 active:scale-90 disabled:opacity-50 disabled:scale-100 ${
                        isRecording
                          ? 'bg-destructive text-white pulse-glow hover:bg-destructive/90 shadow-destructive/20'
                          : 'bg-primary text-white hover:bg-primary/90 shadow-primary/20'
                      }`}
                    >
                      {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-12 h-12" />}
                    </button>
                    <p className="text-sm font-bold text-muted-foreground tracking-wide">
                      {isRecording ? t.tapStop : audioBlob ? t.captureMsg : t.tapStart}
                    </p>

                    {transcribedText && (
                      <div className="w-full mt-2 p-3 bg-secondary/50 rounded-xl border border-border/50">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{language === 'hi' ? 'लिप्यंतरित पाठ' : 'Transcribed Text'}</p>
                        <p className="text-sm text-foreground leading-relaxed max-h-24 overflow-y-auto">{transcribedText}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full">
                    <textarea
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      placeholder={language === 'hi' ? 'विश्लेषण के लिए रोगी का भाषण यहां लिखें...' : 'Enter or paste the patient\'s speech text here for analysis...'}
                      className="w-full h-48 px-4 py-3 rounded-xl bg-background border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 resize-none text-sm leading-relaxed"
                    />
                    <p className="mt-2 text-xs text-muted-foreground text-right">
                      {textInput.length > 0 ? `${textInput.split(/\s+/).filter(Boolean).length} ${language === 'hi' ? 'शब्द' : 'words'}` : (language === 'hi' ? 'कोई पाठ नहीं' : 'No text entered')}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <Button
                  className="w-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg"
                  size="lg"
                  onClick={handleAnalyze}
                  disabled={
                    (mode === 'record' && !audioBlob && !transcribedText.trim()) ||
                    (mode === 'text' && !textInput.trim()) ||
                    isAnalyzing
                  }
                  isLoading={isAnalyzing}
                >
                  {isAnalyzing ? t.analyzingBtn : t.analyzeBtn}
                </Button>
                {error && (
                  <p className="mt-4 text-center text-sm text-destructive bg-destructive/10 p-3 rounded-lg animate-in shake-in">
                    {error}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ───── STEP 3: Recall ───── */}
          {step === 'recall' && (
            <div className="relative z-10 flex flex-col items-center gap-6 min-h-[340px] justify-center animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-2 text-accent">
                <Sparkles className="w-6 h-6" />
                <h2 className="text-xl font-display font-bold">{t.recallTitle}</h2>
              </div>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {t.recallHelp.split('3 words')[0]}<strong>3 {language === 'hi' ? 'शब्द' : 'words'}</strong>{t.recallHelp.split('3 words')[1]}
              </p>

                <div className="relative w-full max-w-sm group">
                  <Input
                    value={recallInput}
                    onChange={(e) => setRecallInput(e.target.value)}
                    placeholder="e.g. apple, train, blue"
                    className="text-center text-xl font-display font-bold bg-white/50 border-2 border-border/50 py-7 rounded-2xl shadow-inner focus:scale-[1.02] focus:bg-white focus:border-primary/50 transition-all duration-300"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRecallSubmit(); }}
                  />
                  <div className="absolute inset-x-0 -bottom-8 flex justify-center opacity-0 group-focus-within:opacity-100 transition-opacity duration-300">
                    <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em]">
                      {language === 'hi' ? 'प्रेस एंटर' : 'Press Enter to Submit'}
                    </p>
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium text-muted-foreground text-center italic opacity-80">
                  {language === 'hi' ? 'जो याद है उसे लिखें, फिर नीचे क्लिक करें' : 'Type what you remember, then click below'}
                </p>

              <div className="flex gap-3">
                <Button onClick={handleRecallSubmit} className="gap-2 transition-all duration-200 hover:scale-[1.03] active:scale-[0.97] hover:shadow-lg">
                  {t.seeResults} <ArrowRight className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleRecallSubmit} className="text-muted-foreground hover:bg-secondary">
                  {t.skipRecall}
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
