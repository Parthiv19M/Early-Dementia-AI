import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Search, Trash2, TrendingUp, Calendar, AlertCircle, FileClock } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAppStore } from '@/lib/store';
import { Card, Input, Button, Badge } from '@/components/ui';
import { deleteAssessment, getAssessmentsByPatientId, type AssessmentRecord } from '@/lib/assessment-storage';

export default function History() {
  const { userId, setUserId, language } = useAppStore();
  const [searchInput, setSearchInput] = useState(userId);
  const [activeSearch, setActiveSearch] = useState(userId);
  const [records, setRecords] = useState<AssessmentRecord[]>([]);

  const translations = {
    en: {
      title: 'Patient History',
      subtitle: 'Track cognitive changes over time using the saved Patient ID.',
      searchPlaceholder: 'Enter Patient ID',
      lookupBtn: 'Lookup',
      noPatientTitle: 'No Patient Selected',
      noPatientHelp: 'Enter a Patient ID above to load saved assessments from this device.',
      noReportsTitle: 'No Reports Found',
      noReportsHelp: 'No saved data is available yet for Patient ID:',
      trendTitle: 'Saved Trend',
      assessmentsLabel: 'assessments',
      pastAssessments: 'Past Assessments',
      assessmentFor: 'Assessment for',
      riskSuffix: 'Risk',
      combinedScore: 'Combined Score',
      speechScore: 'Speech Score',
      memoryScore: 'Memory Score',
      observationLabel: 'Observation:',
      noObservations: 'No major speech warning signs were recorded.',
      deleteConfirm: 'Delete this saved assessment?',
      demoNote: 'Demo mode: Assessment history is stored locally for quick testing. Backend integration is planned for production.'
    },
    hi: {
      title: 'रोगी का इतिहास',
      subtitle: 'सहेजे गए रोगी आईडी का उपयोग करके समय के साथ संज्ञानात्मक परिवर्तनों को ट्रैक करें।',
      searchPlaceholder: 'रोगी आईडी दर्ज करें',
      lookupBtn: 'खोजें',
      noPatientTitle: 'कोई रोगी नहीं चुना गया',
      noPatientHelp: 'इस डिवाइस से सहेजे गए मूल्यांकन लोड करने के लिए ऊपर एक रोगी आईडी दर्ज करें।',
      noReportsTitle: 'कोई रिपोर्ट नहीं मिली',
      noReportsHelp: 'रोगी आईडी के लिए अभी तक कोई सहेजा गया डेटा उपलब्ध नहीं है:',
      trendTitle: 'सहेजा गया रुझान',
      assessmentsLabel: 'मूल्यांकन',
      pastAssessments: 'पिछले मूल्यांकन',
      assessmentFor: 'मूल्यांकन रिपोर्ट:',
      riskSuffix: 'जोखिम',
      combinedScore: 'कुल स्कोर',
      speechScore: 'भाषण स्कोर',
      memoryScore: 'स्मृति स्कोर',
      observationLabel: 'अवलोकन:',
      noObservations: 'कोई बड़ा भाषण चेतावनी संकेत दर्ज नहीं किया गया था।',
      deleteConfirm: 'क्या आप इस सहेजे गए मूल्यांकन को हटाना चाहते हैं?',
      demoNote: 'डेमो नोट: मूल्यांकन इतिहास स्थानीय रूप से इस डिवाइस पर सहेजा जाता है ताकि हैकथॉन डेमो बिना डेटाबेस कनेक्शन के भी काम करे।'
    }
  };

  const t = language === 'hi' ? translations.hi : translations.en;

  useEffect(() => {
    if (activeSearch.trim()) {
      setRecords(getAssessmentsByPatientId(activeSearch));
    } else {
      setRecords([]);
    }
  }, [activeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const normalized = searchInput.trim().toUpperCase();
    setSearchInput(normalized);
    setActiveSearch(normalized);
    setUserId(normalized);
  };

  const chartData = useMemo(
    () =>
      records
        .slice()
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((record) => ({
          date: format(new Date(record.timestamp), 'MMM dd'),
          score: record.combinedScore,
        })),
    [records],
  );

  const latestRecord = records[0];

  return (
    <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="animate-in slide-in-from-left duration-500">
          <h1 className="text-3xl font-display font-bold">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto animate-in slide-in-from-right duration-500">
          <Input
            placeholder={t.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            className="md:w-72 bg-white"
          />
          <Button type="submit" variant="primary" className="transition-all duration-200 hover:scale-[1.05] active:scale-[0.95] hover:shadow-lg">
            <Search className="w-4 h-4 mr-2" /> {t.lookupBtn}
          </Button>
        </form>
      </div>

      {!activeSearch ? (
        <Card className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold font-display">{t.noPatientTitle}</h3>
          <p className="text-muted-foreground mt-2 max-w-sm">{t.noPatientHelp}</p>
        </Card>
      ) : records.length === 0 ? (
        <Card className="py-16 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-bold font-display">{t.noReportsTitle}</h3>
          <p className="text-muted-foreground mt-2">{t.noReportsHelp} <span className="font-semibold">{activeSearch}</span></p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-3 p-6 transition-all hover:shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold font-display">{t.trendTitle}</h3>
                <p className="text-sm text-muted-foreground">Patient ID: {activeSearch}</p>
              </div>
              <div className="flex gap-3">
                <Badge>{records.length} {t.assessmentsLabel}</Badge>
                {latestRecord && (
                  <Badge variant={latestRecord.risk === 'High' ? 'destructive' : latestRecord.risk === 'Medium' ? 'warning' : 'success'}>
                    Latest: {latestRecord.risk} {t.riskSuffix}
                  </Badge>
                )}
              </div>
            </div>

            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis domain={[0, 100]} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'white' }}
                    activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="lg:col-span-3 p-6 transition-all hover:shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold font-display">{t.pastAssessments}</h3>
            </div>
            <div className="space-y-4">
              {records.map((record, idx) => (
                <div key={record.id} className="rounded-2xl border border-border/50 p-5 bg-white transition-all hover:border-primary/30 group animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-secondary flex flex-col items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                        <Calendar className="w-4 h-4 text-muted-foreground mb-1 group-hover:text-primary transition-colors" />
                        <span className="text-xs font-bold">{format(new Date(record.timestamp), 'dd')}</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-foreground">{t.assessmentFor} {record.patientId}</h4>
                          <Badge variant={record.risk === 'High' ? 'destructive' : record.risk === 'Medium' ? 'warning' : 'success'}>
                            {record.risk} {t.riskSuffix}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {t.combinedScore}: <span className="font-bold text-foreground">{record.combinedScore}</span> •
                          {t.speechScore}: {record.apiScore} • {t.memoryScore}: {record.memoryScore}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(record.timestamp), 'MMM dd, yyyy h:mm a')}
                        </p>
                        <div className="rounded-xl bg-secondary/40 p-4 text-sm text-foreground border border-transparent group-hover:border-primary/10 transition-all">
                          <span className="font-bold text-primary mr-2 uppercase text-[10px] tracking-widest">{t.observationLabel}</span> {record.observations[0] || t.noObservations}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(t.deleteConfirm)) {
                            deleteAssessment(record.id);
                            setRecords(getAssessmentsByPatientId(activeSearch));
                          }
                        }}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <Card className="p-5 bg-secondary/20 border-dashed animate-in fade-in slide-in-from-bottom duration-700 delay-300">
        <div className="flex items-start gap-3 text-sm text-muted-foreground">
          <FileClock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p>
            {t.demoNote}
          </p>
        </div>
      </Card>
    </div>
  );
}
