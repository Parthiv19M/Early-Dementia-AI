import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import { jsPDF } from 'jspdf';
import { ArrowLeft, Brain, Eye, ShieldCheck, AlertTriangle, AlertOctagon, Lightbulb, CheckCircle2, XCircle, RotateCcw, Copy, Check, FileDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, Badge, Button } from '@/components/ui';
import { getInsightSummary, getRiskDescription, getScoreExplanation } from '@/lib/assessment-utils';
import { useAppStore, pickRandomWords } from '@/lib/store';
import { getAssessmentsByPatientId } from '@/lib/assessment-storage';
import { Sparkles, History, TrendingUp } from 'lucide-react';

export default function Results() {
  const [_, setLocation] = useLocation();
  const { latestResult, setLatestResult, setChallengeWords, language } = useAppStore();
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const translations = {
    en: {
      newAnalysis: 'New Analysis',
      resultsTitle: 'Analysis Results',
      startOver: 'Start Over',
      downloadReport: 'Download Report',
      patientId: 'Patient ID:',
      copied: 'Copied!',
      savedOn: 'Saved',
      cognitiveScore: 'Cognitive Score',
      riskSuffix: 'Risk',
      riskDesc: 'Risk Description',
      progressTitle: 'Progress Insight',
      progressFirst: 'This is your first assessment.',
      progressUp: 'Your cognitive score improved by {percent}% compared to your previous assessment.',
      progressDown: 'Your cognitive score decreased by {percent}% compared to your previous assessment.',
      progressStable: 'Your cognitive score remained stable compared to your previous assessment.',
      lastRecorded: 'Last recorded score:',
      speechScore: 'Speech Score',
      memoryScore: 'Memory Score',
      combinedScore: 'Combined Score',
      fromAi: 'From AI analysis',
      wordsRecalled: 'words recalled',
      averageOfBoth: 'Average of both',
      scoreExplanation: 'Score Explanation',
      recallDetails: 'Memory Recall Details',
      recalled: 'Recalled',
      missed: 'Missed',
      insightSummary: 'Insight Summary',
      noObservations: 'No specific observations reported.',
      recommendations: 'Recommendations',
      disclaimerTitle: 'Important Disclaimer',
      confidenceScore: 'Confidence score:',
      disclaimerText: '⚠️ This is an AI-based screening tool and not a medical diagnosis. Always consult a healthcare professional for formal cognitive assessment and medical advice.'
    },
    hi: {
      newAnalysis: 'नया विश्लेषण',
      resultsTitle: 'विश्लेषण के परिणाम',
      startOver: 'फिर से शुरू करें',
      downloadReport: 'रिपोर्ट डाउनलोड करें',
      patientId: 'रोगी आईडी:',
      copied: 'कॉपी किया गया!',
      savedOn: 'सहेजा गया',
      cognitiveScore: 'संज्ञानात्मक स्कोर',
      riskSuffix: 'जोखिम',
      riskDesc: 'जोखिम विवरण',
      progressTitle: 'प्रगति अंतर्दृष्टि',
      progressFirst: 'यह आपका पहला मूल्यांकन है।',
      progressUp: 'पिछले मूल्यांकन की तुलना में आपके स्कोर में {percent}% का सुधार हुआ है।',
      progressDown: 'पिछले मूल्यांकन की तुलना में आपके स्कोर में {percent}% की गिरावट आई है।',
      progressStable: 'पिछले मूल्यांकन की तुलना में आपका स्कोर स्थिर रहा।',
      lastRecorded: 'पिछला रिकॉर्ड किया गया स्कोर:',
      speechScore: 'भाषण स्कोर',
      memoryScore: 'स्मृति स्कोर',
      combinedScore: 'कुल स्कोर',
      fromAi: 'एआई विश्लेषण से',
      wordsRecalled: 'शब्द याद आए',
      averageOfBoth: 'दोनों का औसत',
      scoreExplanation: 'स्कोर का स्पष्टीकरण',
      recallDetails: 'स्मृति रिकॉल विवरण',
      recalled: 'याद आया',
      missed: 'छूट गया',
      insightSummary: 'अंतर्दृष्टि सारांश',
      noObservations: 'कोई विशिष्ट अवलोकन दर्ज नहीं किया गया।',
      recommendations: 'सिफ़ारिशें',
      disclaimerTitle: 'महत्वपूर्ण अस्वीकरण',
      confidenceScore: 'विश्वास स्कोर:',
      disclaimerText: '⚠️ यह एक एआई-आधारित प्रारंभिक जांच उपकरण है और चिकित्सा निदान नहीं है। औपचारिक मूल्यांकन और चिकित्सा सलाह के लिए हमेशा डॉक्टर से परामर्श लें।'
    }
  };

  const t = language === 'hi' ? translations.hi : translations.en;

  const handleDownloadPdf = async () => {
    if (!latestResult) return;
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const timestamp = format(new Date(latestResult.timestamp), 'PPP p');
      
      // Header
      doc.setFillColor(37, 99, 235); // Medical Blue
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.text("Synapta Assessment Report", 20, 25);
      
      // Content
      doc.setTextColor(33, 33, 33);
      doc.setFontSize(12);
      doc.text(`Patient ID: ${latestResult.patientId}`, 20, 55);
      doc.text(`Date: ${timestamp}`, 20, 65);
      
      doc.setDrawColor(200, 200, 200);
      doc.line(20, 75, 190, 75);
      
      // Scores
      doc.setFontSize(16);
      doc.text("Summary of Results", 20, 90);
      
      doc.setFontSize(12);
      doc.text(`Cognitive Score: ${Math.round(latestResult.combinedScore)}/100`, 20, 105);
      doc.text(`Risk Level: ${latestResult.risk.toUpperCase()}`, 20, 115);
      
      // Observations
      doc.setFontSize(14);
      doc.text("Observations:", 20, 135);
      doc.setFontSize(10);
      let y = 145;
      latestResult.observations.forEach(obs => {
        const splitText = doc.splitTextToSize(`• ${obs}`, 170);
        doc.text(splitText, 20, y);
        y += (splitText.length * 5) + 2;
      });
      
      // Recommendations
      doc.setFontSize(14);
      doc.text("Recommendations:", 20, y + 10);
      doc.setFontSize(10);
      y += 20;
      latestResult.recommendations.forEach(rec => {
        const splitText = doc.splitTextToSize(`• ${rec}`, 170);
        doc.text(splitText, 20, y);
        y += (splitText.length * 5) + 2;
      });
      
      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const footerText = "Synapta — AI-Based Early Dementia Screening Platform. This is not a clinical diagnosis.";
      doc.text(footerText, 20, 280);
      
      doc.save(`Synapta_Report_${latestResult.patientId}.pdf`);
    } catch (err) {
      console.error("PDF Export failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!latestResult) {
      setLocation('/');
    }
  }, [latestResult, setLocation]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!latestResult) return null;

  const handleCopyId = () => {
    navigator.clipboard.writeText(latestResult.patientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRiskVariant = (risk: string): 'success' | 'warning' | 'destructive' => {
    if (risk === 'High') return 'destructive';
    if (risk === 'Medium') return 'warning';
    return 'success';
  };

  const getRiskColor = (risk: string) => {
    if (risk === 'High') return { text: 'text-destructive', bg: 'bg-destructive/10', border: 'border-destructive/20', stroke: 'stroke-destructive', hex: '#ef4444' };
    if (risk === 'Medium') return { text: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', stroke: 'stroke-warning', hex: '#f59e0b' };
    return { text: 'text-success', bg: 'bg-success/10', border: 'border-success/20', stroke: 'stroke-success', hex: '#22c55e' };
  };

  const getRiskIcon = (risk: string) => {
    if (risk === 'High') return <AlertOctagon className="w-6 h-6" />;
    if (risk === 'Medium') return <AlertTriangle className="w-6 h-6" />;
    if (risk === 'Low') return <ShieldCheck className="w-6 h-6" />;
    return <ShieldCheck className="w-6 h-6" />;
  };

  const riskColors = getRiskColor(latestResult.risk);
  const combinedScore = latestResult.combinedScore;
  const scoreExplanation = getScoreExplanation(combinedScore);
  const insightSummary = getInsightSummary(latestResult.observations);

  const history = getAssessmentsByPatientId(latestResult.patientId);
  const previousAssessment = history.length > 1 ? history[1] : null;

  const getProgressInfo = () => {
    if (!previousAssessment) return { text: t.progressFirst, color: 'text-primary', icon: <Sparkles className="w-4 h-4" /> };
    const diff = combinedScore - previousAssessment.combinedScore;
    const percent = Math.abs(Math.round((diff / (previousAssessment.combinedScore || 1)) * 100));

    if (diff > 0) return { text: t.progressUp.replace('{percent}', percent.toString()), color: 'text-success', icon: <Sparkles className="w-4 h-4" /> };
    if (diff < 0) return { text: t.progressDown.replace('{percent}', percent.toString()), color: 'text-warning', icon: <AlertTriangle className="w-4 h-4" /> };
    return { text: t.progressStable, color: 'text-primary', icon: <History className="w-4 h-4" /> };
  };

  const progress = getProgressInfo();

  const radius = 65;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (combinedScore / 100) * circumference;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const handleNewTest = () => {
    setChallengeWords(pickRandomWords(3));
    setLocation('/');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-8">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={handleNewTest}
            className="flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-semibold mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> {t.newAnalysis}
          </button>
          <h1 className="text-3xl font-display font-bold">{t.resultsTitle}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDownloadPdf} disabled={isGenerating} className="gap-2 transition-all hover:scale-105 shadow-sm border-primary/20">
            <FileDown className="w-4 h-4" /> {isGenerating ? '...' : t.downloadReport}
          </Button>
          <Button variant="outline" onClick={handleNewTest} className="gap-2 transition-all hover:scale-105 active:scale-95 shadow-sm">
            <RotateCcw className="w-4 h-4" /> {t.startOver}
          </Button>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={item}>
          <Card className="relative overflow-hidden">
            <div className={`absolute inset-0 opacity-[0.03] ${riskColors.bg}`} />
            <div className="relative z-10 flex flex-col items-center text-center p-6 md:p-8 gap-6">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2">
                   <Badge className="px-4 py-2 text-sm font-semibold">
                    {t.patientId} {latestResult.patientId}
                   </Badge>
                   <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyId}
                    className="h-9 px-3 text-primary hover:bg-primary/10 gap-2 border border-primary/20"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span className="text-xs font-bold">{t.copied}</span>
                      </>
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {t.savedOn} {format(new Date(latestResult.timestamp), 'MMM dd, yyyy h:mm a')}
                </span>
              </div>

              <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r={60} className="stroke-secondary fill-none md:hidden" strokeWidth="14" />
                  <circle cx="112" cy="112" r={radius} className="hidden md:block stroke-secondary fill-none" strokeWidth="16" />
                  <motion.circle
                    cx="112" cy="112" r={radius}
                    className={`${riskColors.stroke} fill-none`}
                    strokeWidth="16"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.8, ease: "easeOut" }}
                    strokeDasharray={circumference}
                    style={{ filter: `drop-shadow(0 0 8px ${riskColors.hex}40)` }}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <motion.span
                    className="text-6xl font-display font-bold text-foreground"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                  >
                    {Math.round(combinedScore)}
                  </motion.span>
                  <span className="text-xs text-muted-foreground font-semibold tracking-wider uppercase mt-1">🧠 {t.cognitiveScore}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl ${riskColors.bg} ${riskColors.text} flex items-center justify-center`}>
                  {getRiskIcon(latestResult.risk)}
                </div>
                <Badge variant={getRiskVariant(latestResult.risk)} className="px-6 py-2.5 text-base font-bold">
                  ⚠️ {latestResult.risk} {t.riskSuffix}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                {getRiskDescription(latestResult.risk)}
              </p>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-0 overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 group border-none shadow-lg">
            <div className="flex flex-col md:flex-row shadow-sm">
              <div className={`w-full md:w-2 bg-gradient-to-b ${previousAssessment ? (combinedScore >= previousAssessment.combinedScore ? 'from-success/80 to-success/40' : 'from-warning/80 to-warning/40') : 'from-primary/80 to-primary/40'}`} />
              <div className="p-6 flex-1 bg-white">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-3 flex items-center gap-2">
                  {progress.icon} {t.progressTitle}
                </h3>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className={`text-xl font-display font-extrabold ${progress.color} leading-tight mb-2`}>
                      {progress.text}
                    </p>
                    {previousAssessment && (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold opacity-70">
                        <History className="w-3.5 h-3.5" />
                        <span>{t.lastRecorded} {Math.round(previousAssessment.combinedScore)} ({format(new Date(previousAssessment.timestamp), 'MMM dd')})</span>
                      </div>
                    )}
                  </div>
                  {previousAssessment && (
                    <div className={`hidden sm:flex w-16 h-16 rounded-2xl items-center justify-center shrink-0 ${combinedScore >= previousAssessment.combinedScore ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {combinedScore >= previousAssessment.combinedScore ? (
                        <TrendingUp className="w-8 h-8" />
                      ) : (
                        <div className="rotate-180"><TrendingUp className="w-8 h-8" /></div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 text-center transition-all hover:bg-secondary/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.speechScore}</p>
            <p className="text-4xl font-display font-bold text-primary">{Math.round(latestResult.apiScore)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.fromAi}</p>
          </Card>
          <Card className="p-6 text-center transition-all hover:bg-secondary/20">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.memoryScore}</p>
            <p className={`text-4xl font-display font-bold ${latestResult.memoryScore >= 67 ? 'text-success' : latestResult.memoryScore >= 34 ? 'text-warning' : 'text-destructive'}`}>
              {Math.round(latestResult.memoryScore)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {latestResult.recalledWords.length}/{latestResult.challengeWords.length} {t.wordsRecalled}
            </p>
          </Card>
          <Card className={`p-6 text-center border-2 ${riskColors.border} transition-all hover:bg-secondary/20`}>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">{t.combinedScore}</p>
            <p className={`text-4xl font-display font-bold ${riskColors.text}`}>{Math.round(combinedScore)}</p>
            <p className="text-xs text-muted-foreground mt-1">{t.averageOfBoth}</p>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-6 md:p-8 transition-all hover:shadow-lg">
            <h3 className="text-lg font-bold font-display mb-4">{t.scoreExplanation}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed italic border-l-4 border-primary/20 pl-4">{scoreExplanation}</p>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-6 md:p-8 transition-all hover:shadow-lg">
            <h3 className="text-lg font-bold font-display mb-5 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-accent" />
              {t.recallDetails}
            </h3>
            <div className="flex flex-wrap gap-3">
              {latestResult.challengeWords.map((word, idx) => {
                const wasRecalled = latestResult.recalledWords.includes(word.toLowerCase());
                return (
                  <motion.div
                    key={idx}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 + idx * 0.1 }}
                    className={`flex items-center gap-2 px-5 py-3 rounded-xl border-2 font-medium text-sm ${
                      wasRecalled
                        ? 'bg-success/10 border-success/30 text-success'
                        : 'bg-destructive/5 border-destructive/20 text-destructive'
                    }`}
                  >
                    {wasRecalled ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    <span className="font-display font-bold">{word}</span>
                    <span className="text-xs opacity-70">{wasRecalled ? t.recalled : t.missed}</span>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-6 md:p-8 transition-all hover:shadow-lg">
            <h3 className="text-lg font-bold font-display mb-6 flex items-center gap-2">
              <Eye className="w-5 h-5 text-primary" />
              {t.insightSummary}
            </h3>
            <div className="mb-5 rounded-2xl border border-primary/10 bg-primary/5 p-4 border-l-4 border-l-primary">
              <p className="text-sm font-medium text-foreground">{insightSummary}</p>
            </div>
            {latestResult.observations && latestResult.observations.length > 0 ? (
              <ul className="space-y-3">
                {latestResult.observations.map((observation, idx) => (
                  <motion.li
                    key={idx}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.08 }}
                    className="flex items-start gap-3 bg-secondary/40 p-4 rounded-xl border border-border/50 hover:bg-secondary/60 transition-colors"
                  >
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-foreground leading-relaxed">{observation}</span>
                  </motion.li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic px-4">{t.noObservations}</p>
            )}
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-6 md:p-8 transition-all hover:shadow-lg">
            <h3 className="text-lg font-bold font-display mb-5">{t.recommendations}</h3>
            <div className="space-y-3">
              {latestResult.recommendations.map((recommendation, idx) => (
                <div key={idx} className="rounded-2xl border border-border/50 bg-secondary/30 p-4 text-sm text-foreground hover:bg-secondary/50 transition-colors">
                  {recommendation}
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card className="p-8 border-none bg-secondary/30 shadow-inner group transition-all hover:bg-secondary/40 rounded-3xl">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                <Brain className="w-7 h-7 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
                  <p className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">{t.disclaimerTitle}</p>
                  <Badge variant="outline" className="w-fit mx-auto md:mx-0 text-[10px] font-bold py-0 h-5 bg-white/50 border-primary/20 text-primary">
                    {t.confidenceScore} {Math.round(latestResult.confidence * 100)}%
                  </Badge>
                </div>
                <p className="text-[13px] text-foreground/70 leading-relaxed font-semibold max-w-2xl">
                  {t.disclaimerText}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
