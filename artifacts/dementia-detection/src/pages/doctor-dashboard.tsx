import React, { useEffect, useMemo, useState } from 'react';
import { Users, Activity, Brain, Clock, Search, TrendingUp, Calendar } from 'lucide-react';
import { Card, Input, Button, ScoreGauge, Badge } from '@/components/ui';
import { getStoredAssessments, getAssessmentsByPatientId, type AssessmentRecord } from '@/lib/assessment-storage';
import { useAppStore } from '@/lib/store';

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
      noObservations: 'No major speech warning signs were recorded.'
    },
    hi: {
      title: 'प्रदाता डैशबोर्ड',
      subtitle: 'सहेजे गए मूल्यांकनों की समीक्षा करें, संज्ञानात्मक स्क्रीनिंग प्रवृत्तियों की निगरानी करें, और रोगी आईडी द्वारा जल्दी से खोजें।',
      searchPlaceholder: 'रोगी आईडी खोजें...',
      viewPatient: 'रोगी देखें',
      snapshotTitle: 'समग्र अवलोकन',
      patientRecord: 'रोगी रिकॉर्ड:',
      assessmentsLabel: 'मूल्यांकन',
      statsTotal: 'कुल मूल्यांकन',
      statsTotalHelp: 'इस डिवाइस पर उपलब्ध सहेजे गए मूल्यांकन।',
      statsLatest: 'नवीनतम स्कोर',
      statsLatestHelp: 'नवीनतम जोखिम:',
      statsLatestEmpty: 'इस दृश्य को भरने के लिए एक मूल्यांकन चलाएं।',
      statsTrend: 'जोखिम रुझान',
      statsTrendHelp: 'सबसे पुराने रिकॉर्ड से नवीनतम तक परिवर्तन।',
      emptyState: 'प्रदाता डैशबोर्ड को भरने के लिए रोगी आईडी खोजें या मूल्यांकन पूरा करें।',
      snapshotCardHeader: 'वर्तमान संज्ञानात्मक स्थिति',
      averageScore: 'औसत स्कोर',
      recentTrend: 'हालिया मूल्यांकन रुझान',
      noObservations: 'कोई बड़ा भाषण चेतावनी संकेत दर्ज नहीं किया गया था।'
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
      ? Math.round(records.reduce((sum: number, record: AssessmentRecord) => sum + record.combinedScore, 0) / totalAssessments)
      : 0;
  const trend =
    totalAssessments > 1
      ? Math.round(records[0].combinedScore - records[records.length - 1].combinedScore)
      : 0;

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
          <p className={`text-4xl font-display font-bold ${trend > 0 ? 'text-destructive' : 'text-success'}`}>
            {trend > 0 ? '+' : ''}{trend}
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

          <Card className="md:col-span-2 p-0 overflow-hidden transition-all hover:shadow-lg flex flex-col">
            <div className="p-6 border-b border-border bg-secondary/30 flex items-center justify-between">
              <h3 className="text-lg font-bold font-display flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> {t.recentTrend}
              </h3>
            </div>
            <div className="divide-y divide-border overflow-y-auto max-h-[400px]">
              {trendRecords.map((record, idx) => (
                <div key={record.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-secondary/10 transition-colors animate-in slide-in-from-right duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
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
    </div>
  );
}
