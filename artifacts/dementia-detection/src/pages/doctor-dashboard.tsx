import React, { useEffect, useMemo, useState } from 'react';
import { Users, Activity, Brain, Clock, Search, TrendingUp, Calendar, LineChart as ChartIcon, ShieldAlert } from 'lucide-react';
import { Card, Input, Button, ScoreGauge, Badge } from '@/components/ui';
import { getStoredAssessments, getAssessmentsByPatientId, type AssessmentRecord } from '@/lib/assessment-storage';
import { useAppStore } from '@/lib/store';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function DoctorDashboard() {
  const { language } = useAppStore();
  const [patientId, setPatientId] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [records, setRecords] = useState<AssessmentRecord[]>([]);

  const translations = {
    en: {
      title: 'Provider Dashboard',
      subtitle: 'Review saved assessments, monitor cognitive screening trends, and quickly search by Patient ID.',
      searchPlaceholder: 'Search Patient ID...',
      viewPatient: 'View Patient',
      snapshotTitle: 'Overall Demo Snapshot',
      patientRecord: 'Patient Record:',
      assessmentsLabel: 'assessments',
      statsTotal: 'Total Assessments',
      statsTotalHelp: 'Saved screenings available on this device.',
      statsLatest: 'Latest Score',
      statsLatestHelp: 'Latest risk:',
      statsLatestEmpty: 'Run an assessment to populate this view.',
      statsTrend: 'Risk Trend',
      statsTrendHelp: 'Change from oldest visible record to newest.',
      emptyState: 'Search for a patient ID or complete a screening to populate the provider dashboard.',
      snapshotCardHeader: 'Current Cognitive Snapshot',
      averageScore: 'Average Score',
      recentTrend: 'Recent Assessment Trend',
      noObservations: 'No major speech warning signs were recorded.',
      trendGraph: 'Cognitive Trend Graph',
      historyTitle: 'Assessment History'
    },
    hi: {
      title: 'चिकित्सक डैशबोर्ड',
      subtitle: 'सहेजे गए मूल्यांकनों की समीक्षा करें, संज्ञानात्मक प्रवृत्तियों की निगरानी करें और रोगी आईडी द्वारा खोजें।',
      searchPlaceholder: 'रोगी आईडी खोजें...',
      viewPatient: 'रोगी विवरण',
      snapshotTitle: 'नैदानिक अवलोकन',
      patientRecord: 'रोगी रिकॉर्ड:',
      assessmentsLabel: 'मूल्यांकन',
      statsTotal: 'कुल जांच',
      statsTotalHelp: 'इस डिवाइस पर उपलब्ध सहेजे गए स्क्रीनिंग डेटा।',
      statsLatest: 'नवीनतम स्कोर',
      statsLatestHelp: 'जोखिम स्तर:',
      statsLatestEmpty: 'विवरण देखने के लिए स्क्रीनिंग शुरू करें।',
      statsTrend: 'संज्ञानात्मक रुझान',
      statsTrendHelp: 'प्रथम और नवीनतम रिकॉर्ड के बीच परिवर्तन।',
      emptyState: 'डैशबोर्ड को भरने के लिए रोगी आईडी खोजें या मूल्यांकन पूरा करें।',
      snapshotCardHeader: 'नैदानिक स्थिति',
      averageScore: 'औसत स्कोर',
      recentTrend: 'हालिया संज्ञानात्मक रुझान',
      noObservations: 'कोई बड़ी चेतावनी दर्ज नहीं की गई।',
      trendGraph: 'दीर्घकालिक रुझान ग्राफ',
      historyTitle: 'मूल्यांकन इतिहास'
    }
  };

  const t = language === 'hi' ? translations.hi : translations.en;

  useEffect(() => {
    setRecords(activeSearch ? getAssessmentsByPatientId(activeSearch) : getStoredAssessments());
  }, [activeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(patientId.trim().toUpperCase());
  };

  const latestRecord = records[0];
  const totalAssessments = records.length;
  const averageScore =
    totalAssessments > 0
      ? Math.round(records.reduce((sum, record) => sum + record.combinedScore, 0) / totalAssessments)
      : 0;
  
  const trend =
    totalAssessments > 1
      ? Math.round(records[0].combinedScore - records[records.length - 1].combinedScore)
      : 0;

  const chartData = useMemo(() => {
    return [...records]
      .reverse()
      .map(r => ({
        date: new Date(r.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: Math.round(r.combinedScore),
        risk: r.risk
      }));
  }, [records]);

  const trendRecords = useMemo(() => records.slice(0, 5), [records]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      <div className="bg-primary text-primary-foreground rounded-2xl p-8 relative overflow-hidden shadow-xl group border border-primary/20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-20 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
          <Brain className="w-96 h-96" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-end gap-6">
          <div className="animate-in slide-in-from-left duration-500">
            <h1 className="text-3xl font-display font-bold mb-2 tracking-tight">{t.title}</h1>
            <p className="text-primary-foreground/80 max-w-xl font-medium">
              {t.subtitle}
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-md w-full md:w-auto animate-in slide-in-from-right duration-500 border border-white/20">
            <Input
              placeholder={t.searchPlaceholder}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value.toUpperCase())}
              className="bg-white/95 border-transparent focus:border-white text-foreground placeholder:text-muted-foreground/60 transition-all focus:ring-2 focus:ring-white/20"
            />
            <Button type="submit" variant="secondary" className="shrink-0 text-primary font-bold hover:scale-[1.05] active:scale-[0.95] transition-all duration-200">
              <Search className="w-4 h-4 mr-2" /> {t.viewPatient}
            </Button>
          </form>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <h2 className="text-xl font-display font-bold">
          {activeSearch ? `${t.patientRecord} ${activeSearch}` : t.snapshotTitle}
        </h2>
        <Badge className="bg-primary/10 text-primary border-primary/20">{totalAssessments} {t.assessmentsLabel}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 transition-all hover:shadow-lg border-l-4 border-primary">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-muted-foreground">{t.statsTotal}</h3>
          </div>
          <p className="text-4xl font-display font-bold text-foreground">{totalAssessments}</p>
          <p className="text-sm text-muted-foreground mt-2">{t.statsTotalHelp}</p>
        </Card>

        <Card className="p-6 transition-all hover:shadow-lg border-l-4 border-accent">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Activity className="w-5 h-5 text-accent" />
            </div>
            <h3 className="font-semibold text-muted-foreground">{t.statsLatest}</h3>
          </div>
          <p className="text-4xl font-display font-bold text-foreground">{latestRecord?.combinedScore ?? 0}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {latestRecord ? `${t.statsLatestHelp} ${latestRecord.risk}` : t.statsLatestEmpty}
          </p>
        </Card>

        <Card className="p-6 transition-all hover:shadow-lg border-l-4 border-success">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-success/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <h3 className="font-semibold text-muted-foreground">{t.statsTrend}</h3>
          </div>
          <p className={`text-4xl font-display font-bold ${trend > 0 ? 'text-success' : 'text-destructive'}`}>
            {trend >= 0 ? '+' : ''}{trend}
          </p>
          <p className="text-sm text-muted-foreground mt-2">{t.statsTrendHelp}</p>
        </Card>
      </div>

      {!latestRecord ? (
        <Card className="py-16 text-center text-muted-foreground bg-secondary/20 border-dashed animate-in zoom-in duration-500">
          {t.emptyState}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom duration-700">
          {/* Recent Trend Card with Graph */}
          <Card className="md:col-span-2 p-6 transition-all hover:shadow-lg">
             <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold font-display flex items-center gap-2">
                  <ChartIcon className="w-5 h-5 text-primary" /> {t.trendGraph}
                </h3>
             </div>
             <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#888'}} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      cursor={{ stroke: '#2563eb', strokeWidth: 2, strokeDasharray: '5 5' }}
                    />
                    <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </Card>

          {/* Current Status Sidebar */}
          <Card className="p-6 flex flex-col items-center justify-center text-center transition-all hover:shadow-lg">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-6 border-b border-border pb-2 w-full">
              {t.snapshotCardHeader}
            </h3>
            <ScoreGauge score={latestRecord.combinedScore} />

            <div className="w-full mt-8 space-y-4 pt-6 border-t border-border">
              <div className="flex justify-between items-center group/item hover:bg-secondary/40 p-2 rounded-lg transition-colors">
                <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                  <Brain className="w-4 h-4 text-primary" /> {t.averageScore}
                </span>
                <span className="text-sm font-bold text-foreground bg-white px-2 py-1 rounded shadow-sm">{averageScore}</span>
              </div>
              <div className="flex justify-between items-center group/item hover:bg-secondary/40 p-2 rounded-lg transition-colors">
                <span className="text-sm text-muted-foreground flex items-center gap-2 font-medium">
                  <Users className="w-4 h-4 text-primary" /> Patient ID
                </span>
                <span className="text-sm font-bold text-foreground bg-white px-2 py-1 rounded shadow-sm">{latestRecord.patientId}</span>
              </div>
            </div>
          </Card>

          {/* Detailed History Table */}
          <Card className="md:col-span-3 p-0 overflow-hidden transition-all hover:shadow-lg flex flex-col mt-6">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
              <h3 className="text-lg font-bold font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> {t.historyTitle}
              </h3>
            </div>
            <div className="divide-y divide-border overflow-y-auto max-h-[400px]">
              {trendRecords.map((record, idx) => (
                <div key={record.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-bold text-sm text-foreground">{new Date(record.timestamp).toLocaleDateString()}</span>
                      <Badge variant={record.risk === 'High' ? 'destructive' : record.risk === 'Medium' ? 'warning' : 'success'} className="px-3 py-0 scale-90">
                        {record.risk}
                      </Badge>
                    </div>
                    <p className="text-[13px] text-muted-foreground font-medium">
                      Score: <span className="text-foreground font-bold">{record.combinedScore}</span> • Speech {record.apiScore} • Memory {record.memoryScore}
                    </p>
                    <div className="mt-3 p-3 bg-secondary/50 rounded-xl text-[13px] text-foreground/80 leading-relaxed border border-border/40">
                      {record.observations[0] || t.noObservations}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-border/60">
        <div className="bg-secondary/30 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 group transition-all hover:bg-secondary/40">
           <div className="w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
             <ShieldAlert className="w-7 h-7 text-primary" />
           </div>
           <div className="text-center md:text-left">
             <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
                <span className="text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">Clinical Notice / चिकित्सा सूचना</span>
                <Badge variant="outline" className="w-fit mx-auto md:mx-0 text-[10px] font-bold py-0 h-5 bg-white/50 border-primary/20 text-primary uppercase">
                   Protocol 7B.2
                </Badge>
             </div>
             <p className="text-[13px] text-foreground/70 leading-relaxed font-semibold">
               This dashboard is intended for screening and longitudinal observation. All AI insights should be clinically verified by a professional physician. Data is currently being stored within this local environment for prototype fidelity.
             </p>
           </div>
        </div>
      </div>
    </div>
  );
}
