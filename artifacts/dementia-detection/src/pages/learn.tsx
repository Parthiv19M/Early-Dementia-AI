import React from 'react';
import { Brain, Mic, Zap, Info, ArrowRight, UserCheck } from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui';
import { useLocation } from 'wouter';
import { motion, Variants } from 'framer-motion';

export default function Learn() {
  const [_, setLocation] = useLocation();

  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const handleTrySample = (type: 'healthy' | 'early' | 'moderate') => {
    const samples = {
      healthy: { 
        text: "I went to the market today and bought some fresh apples. The healthy weather was very pleasant. Drum, Trumpet, Silver.", 
        recalled: ["Drum", "Trumpet", "Silver"],
        forcedScore: 92,
        forcedRisk: 'Low' as const
      },
      early: { 
        text: "I... I had it just now… where did I keep it? Drum... wait, what was the other one?", 
        recalled: ["Drum"],
        forcedScore: 62,
        forcedRisk: 'Medium' as const
      },
      moderate: { 
        text: "Is today Monday? I’m not sure… I wanted to find my... the thing you use for writing.", 
        recalled: [],
        forcedScore: 32,
        forcedRisk: 'High' as const
      }
    };
    
    sessionStorage.setItem('synapta_sample', JSON.stringify(samples[type]));
    setLocation('/');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 px-4 sm:px-6">
      {/* SECTION 1 — WHAT IS SYNAPTA? */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="p-8 border-none shadow-xl bg-white relative overflow-hidden group">
          <div className="relative z-10 space-y-4 text-center sm:text-left">
            <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">What is <span className="text-primary">Synapta</span>?</h2>
            <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
              <p>
                <strong>Synapta</strong> is an AI-powered cognitive screening platform designed to detect early signs of memory and speech-related decline.
              </p>
              <p>
                The name "Synapta" is inspired by the word <strong>synapse</strong> — the connections between brain cells that enable memory, thinking, and communication.
              </p>
              <p>
                By analyzing how users speak, recall information, and respond to tasks, <strong>Synapta</strong> helps identify subtle cognitive changes at an early stage.
              </p>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* SECTION 2 — WHAT IS DEMENTIA? */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="p-8 border-none shadow-xl bg-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-700">
             <Brain className="w-32 h-32 text-primary" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl font-display font-bold text-foreground tracking-tight">What is Dementia?</h2>
            
            <div className="text-lg text-muted-foreground leading-relaxed space-y-4">
              <p>
                Dementia is a condition where <strong>brain cells gradually stop working properly</strong>. 
                It's not a single disease but a term for several conditions affecting memory, thinking, and social abilities.
              </p>
              
              <div className="bg-primary/5 border-none p-6 rounded-2xl italic space-y-3">
                <p>In diseases like Alzheimer’s:</p>
                <ul className="list-disc pl-6 space-y-2 font-medium text-foreground/80">
                  <li><strong>Memory-related areas</strong> of the brain get damaged first</li>
                  <li>Communication between <strong>brain cells slows down</strong> significantly</li>
                  <li>This leads to persistent <strong>forgetfulness, confusion, and speech difficulty</strong></li>
                </ul>
              </div>
              
              <p className="font-semibold text-primary/90 flex items-center gap-2 pt-2">
                <UserCheck className="w-5 h-5" />
                Early detection is important because it can help slow progression and improve quality of life.
              </p>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* SECTION 3 — HOW IT WORKS */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <Card className="p-8 border-none shadow-xl bg-white space-y-8">
          <div className="text-center sm:text-left space-y-3">
            <h2 className="text-3xl font-display font-bold">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl">
              Synapta helps detect early signs by analyzing key cognitive biomarkers that doctors also use in clinical screening.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Mic, label: "Speech Patterns", desc: "We analyze hesitation, pauses, and word choice that might indicate cognitive load.", color: "bg-blue-500" },
              { icon: Brain, label: "Memory Recall", desc: "Testing your ability to store and retrieve new information after a short distraction.", color: "bg-green-500" },
              { icon: Zap, label: "Response Behavior", desc: "Monitoring latency and confidence during interactions to gauge cognitive processing speed.", color: "bg-amber-500" }
            ].map((feature, idx) => (
              <motion.div key={idx} variants={item}>
                <div className="p-4 rounded-xl border border-border/50 bg-secondary/20 h-full group">
                  <div className={`w-10 h-10 ${feature.color}/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-5 h-5 ${feature.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h3 className="font-bold text-base mb-1">{feature.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.section>

      {/* SECTION 4 — REAL-WORLD CASES */}
      <motion.section 
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <Card className="p-8 border-none shadow-xl bg-white space-y-8">
          <h2 className="text-3xl font-display font-bold text-center sm:text-left">Real-Life Scenarios</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CASE 1 — HEALTHY */}
            <motion.div variants={item}>
              <div className="p-6 rounded-xl border border-border/50 bg-white h-full flex flex-col group hover:shadow-success/10 transition-all border-t-4 border-t-success shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Scenario 1</h3>
                    <p className="text-lg font-bold">Healthy Baseline</p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20 px-2 py-0.5 font-bold text-[10px]">Low Risk</Badge>
                </div>
                
                <div className="space-y-4 flex-1">
                  <ul className="text-sm space-y-2 font-medium text-foreground/80">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-success"/> Clear speech</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-success"/> 3/3 Word recall</li>
                  </ul>
                  <div className="p-3 rounded-xl bg-success/5 border border-success/10 text-[10px] italic leading-relaxed">
                    "I went to the market today and bought some fresh apples."
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                   size="sm"
                  className="mt-6 w-full border-success/20 text-success hover:bg-success/5 group text-xs font-bold"
                  onClick={() => handleTrySample('healthy')}
                >
                  Try Sample <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>

            {/* CASE 2 — EARLY SIGNS */}
            <motion.div variants={item}>
              <div className="p-6 rounded-xl border border-border/50 bg-white h-full flex flex-col group hover:shadow-warning/10 transition-all border-t-4 border-t-warning shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Scenario 2</h3>
                    <p className="text-lg font-bold">Early Indicators</p>
                  </div>
                  <Badge className="bg-warning/10 text-warning border-warning/20 px-2 py-0.5 font-bold text-[10px]">Medium Risk</Badge>
                </div>
                
                <div className="space-y-4 flex-1">
                  <ul className="text-sm space-y-2 font-medium text-foreground/80">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-warning"/> Pauses in speech</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-warning"/> 1/3 Word recall</li>
                  </ul>
                  <div className="p-3 rounded-xl bg-warning/5 border border-warning/10 text-[10px] italic leading-relaxed">
                    "I... I had it just now… where did I keep it?"
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-6 w-full border-warning/20 text-warning hover:bg-warning/5 group text-xs font-bold"
                  onClick={() => handleTrySample('early')}
                >
                  Try Sample <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>

            {/* CASE 3 — MODERATE */}
            <motion.div variants={item}>
              <div className="p-6 rounded-xl border border-border/50 bg-white h-full flex flex-col group hover:shadow-destructive/10 transition-all border-t-4 border-t-destructive shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-1">Scenario 3</h3>
                    <p className="text-lg font-bold">Clinical Concern</p>
                  </div>
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20 px-2 py-0.5 font-bold text-[10px]">High Risk</Badge>
                </div>
                
                <div className="space-y-4 flex-1">
                  <ul className="text-sm space-y-2 font-medium text-foreground/80">
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-destructive"/> Confusion</li>
                    <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-destructive"/> 0/3 Word recall</li>
                  </ul>
                  <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10 text-[10px] italic leading-relaxed">
                    "Is today Monday? I’m not sure… I wanted to find my..."
                  </div>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-6 w-full border-destructive/20 text-destructive hover:bg-destructive/5 group text-xs font-bold"
                  onClick={() => handleTrySample('moderate')}
                >
                  Try Sample <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </motion.div>
          </div>
        </Card>
      </motion.section>

      {/* FOOTER CALL TO ACTION */}
      <motion.div 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="text-center pt-8 border-t border-border/60"
      >
        <p className="text-sm text-muted-foreground mb-4 font-medium italic">
          Empowering families with accessible, evidence-based cognitive screening.
        </p>
        <Button onClick={() => setLocation('/')} size="lg" className="px-10 py-6 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
          Start Assessment Now
        </Button>
      </motion.div>
    </div>
  );
}
