import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Search, Trash2, TrendingUp, Calendar, AlertCircle, FileClock, ClipboardList, ShieldCheck } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useAppStore } from '@/lib/store';
import { Card, Input, Button, Badge } from '@/components/ui';
import { deleteAssessment, getAssessmentsByPatientId, clearAllAssessments, type AssessmentRecord } from '@/lib/assessment-storage';

export default function History() {
  const { userId, setUserId, language } = useAppStore();
  const [searchInput, setSearchInput] = useState(userId);
  const [activeSearch, setActiveSearch] = useState(userId);
  const [records, setRecords] = useState<AssessmentRecord[]>([]);

  const translations = {
    en: {
      title: 'Patient Clinical History',
      subtitle: 'Longitudinal tracking of cognitive performance and linguistic biomarkers.',
      searchPlaceholder: 'Enter Patient ID (e.g. PAT-XYZ)',
      lookupBtn: 'Verify ID',
      noPatientTitle: 'No Patient Selected',
      noPatientHelp: 'Please enter a valid Patient ID to retrieve saved clinical records.',
      noReportsTitle: 'No Records Found',
      noReportsHelp: 'No assessment data exists for the selected ID on this device.',
      trendTitle: 'Cognitive Trajectory',
      assessmentsLabel: 'records',
      pastAssessments: 'Historical Assessments',
      assessmentFor: 'Report for:',
      riskSuffix: 'Risk',
      combinedScore: 'Global Index',
      speechScore: 'Speech',
      memoryScore: 'Memory',
      observationLabel: 'Primary Observation:',
      noObservations: 'No significant cognitive anomalies detected.',
      deleteConfirm: 'Confirm deletion of this clinical record?',
      demoNote: 'CLINICAL ARCHIVE: This system uses localized encrypted storage for preliminary tracking. Production environments utilize PostgreSQL with full EHR integration.'
    },
    hi: {
      title: 'रोगी का नैदानिक इतिहास',
      subtitle: 'संज्ञानात्मक प्रदर्शन और भाषाई बायोमार्कर की दीर्घकालिक निगरानी।',
      searchPlaceholder: 'रोगी आईडी दर्ज करें (उदा. PAT-XYZ)',
      lookupBtn: 'आईडी सत्यापित करें',
      noPatientTitle: 'कोई रोगी नहीं चुना गया',
      noPatientHelp: 'सहेजे गए नैदानिक रिकॉर्ड प्राप्त करने के लिए एक रोगी आईडी दर्ज करें।',
      noReportsTitle: 'कोई रिकॉर्ड नहीं मिला',
      noReportsHelp: 'इस डिवाइस पर चयनित आईडी के लिए कोई डेटा उपलब्ध नहीं है।',
      trendTitle: 'संज्ञानात्मक रुझान',
      assessmentsLabel: 'रिकॉर्ड',
      pastAssessments: 'ऐतिहासिक मूल्यांकन',
      assessmentFor: 'रिपोर्ट:',
      riskSuffix: 'जोखिम',
      combinedScore: 'वैश्विक सूचकांक',
      speechScore: 'भाषण',
      memoryScore: 'स्मृति',
      observationLabel: 'मुख्य अवलोकन:',
      noObservations: 'कोई महत्वपूर्ण विसंगति नहीं मिली।',
      deleteConfirm: 'इस नैदानिक रिकॉर्ड को हटाने की पुष्टि करें?',
      demoNote: 'नैदानिक पुरालेख: यह प्रणाली प्रारंभिक ट्रैकिंग के लिए स्थानीय एन्क्रिप्टेड स्टोरेज का उपयोग करती है।'
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
      [...records]
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .map((record) => ({
          date: format(new Date(record.timestamp), 'MMM dd'),
          score: Math.round(record.combinedScore),
        })),
    [records],
  );

  const latestRecord = records[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500 pb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="animate-in slide-in-from-left duration-500">
          <Badge variant="outline" className="mb-2 border-primary/20 text-primary">Patient Records</Badge>
          <h1 className="text-3xl font-display font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1 font-medium">{t.subtitle}</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto animate-in slide-in-from-right duration-500 p-1 bg-white rounded-xl shadow-sm border border-border">
          <Input
            placeholder={t.searchPlaceholder}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value.toUpperCase())}
            className="md:w-72 border-none shadow-none focus-visible:ring-0 font-bold"
          />
          <Button type="submit" className="px-6 font-bold shadow-md hover:scale-[1.03] active:scale-[0.97] transition-all">
            <Search className="w-4 h-4 mr-2" /> {t.lookupBtn}
          </Button>
        </form>
      </div>

      {!activeSearch ? (
        <Card className="py-20 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 bg-white/50 border-dashed">
          <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
            <ClipboardList className="w-10 h-10 text-primary/40" />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">{t.noPatientTitle}</h3>
          <p className="text-muted-foreground mt-2 max-w-sm font-medium">{t.noPatientHelp}</p>
        </Card>
      ) : records.length === 0 ? (
        <Card className="py-20 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 bg-white/50 border-dashed">
          <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold font-display text-foreground">{t.noReportsTitle}</h3>
          <p className="text-muted-foreground mt-2 font-medium">{t.noReportsHelp} <span className="text-foreground font-black tracking-tight">{activeSearch}</span></p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-3 p-6 md:p-8 transition-all hover:shadow-xl bg-white border-none shadow-md overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-5">
                <TrendingUp className="w-32 h-32" />
             </div>
             
             <div className="relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-xl font-bold font-display text-foreground flex items-center gap-2">
                       <TrendingUp className="w-5 h-5 text-primary" /> {t.trendTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground font-bold mt-1">ID: {activeSearch}</p>
                  </div>
                  <div className="flex gap-3">
                    <Badge variant="outline" className="px-4 py-1 font-bold bg-secondary/50 border-primary/10">{records.length} {t.assessmentsLabel}</Badge>
                    {latestRecord && (
                      <span 
                        className="inline-flex items-center px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: latestRecord.risk === 'High' ? '#ef4444' : latestRecord.risk === 'Medium' ? '#D97706' : '#22c55e',
                          color: '#ffffff',
                        }}
                      >
                        LATEST: {latestRecord.risk} {t.riskSuffix}
                      </span>
                    )}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="px-4 py-1 font-bold text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-muted-foreground/10"
                      onClick={() => {
                        if (confirm('DANGER: This will permanently delete ALL clinical history and reset the app. Continue?')) {
                          clearAllAssessments();
                          window.location.reload();
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Clear All History
                    </Button>
                  </div>
                </div>

                <div className="h-[320px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                       <defs>
                          <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dy={10} />
                      <YAxis domain={[0, 100]} tick={{ fill: '#888', fontSize: 12, fontWeight: 600 }} axisLine={false} tickLine={false} dx={-10} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="score"
                        stroke="#2563eb"
                        strokeWidth={4}
                        fillOpacity={1} 
                        fill="url(#colorHistory)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </Card>

          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-2 px-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-bold font-display text-foreground">{t.pastAssessments}</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {records.map((record, idx) => (
                <div key={record.id} className="animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                  <Card className="p-0 overflow-hidden border-none shadow-sm hover:shadow-md transition-all group">
                     <div className="flex h-full">
                        <div className={`w-2 shrink-0 ${record.risk === 'High' ? 'bg-destructive' : record.risk === 'Medium' ? 'bg-warning' : 'bg-success'}`} />
                        <div className="p-4 md:p-6 flex-1 bg-white">
                           <div className="flex justify-between items-start mb-4">
                              <div className="space-y-1">
                                 <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">
                                    {format(new Date(record.timestamp), 'PPPP')}
                                 </p>
                                 <h4 className="text-lg font-bold text-foreground">Score: {Math.round(record.combinedScore)}</h4>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { if (confirm(t.deleteConfirm)) { deleteAssessment(record.id); setRecords(getAssessmentsByPatientId(activeSearch)); } }}
                                className="w-8 h-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                              >
                                 <Trash2 className="w-4 h-4" />
                              </Button>
                           </div>
                           
                           <div className="flex gap-2 mb-4">
                              <Badge variant="outline" className="text-[10px] font-bold">SPEECH: {Math.round(record.apiScore)}</Badge>
                              <Badge variant="outline" className="text-[10px] font-bold">MEMORY: {Math.round(record.memoryScore)}</Badge>
                           </div>
                           
                           <div className="bg-secondary/30 rounded-xl p-3 text-[12px] text-foreground/80 font-medium leading-relaxed border border-transparent group-hover:border-primary/10 transition-colors">
                              {record.observations[0] || t.noObservations}
                           </div>
                        </div>
                     </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl flex gap-4 items-start animate-in slide-in-from-bottom duration-700">
         <FileClock className="w-6 h-6 text-slate-400 shrink-0 mt-0.5" />
         <p className="text-[13px] text-slate-600 font-semibold leading-relaxed">
            {t.demoNote}
         </p>
      </div>
    </div>
  );
}
