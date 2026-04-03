import React from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, Brain, History, LayoutDashboard, MessageSquare, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { path: '/', icon: Activity, label: 'Analysis' },
    { path: '/learn', icon: Info, label: 'Learn' },
    { path: '/history', icon: History, label: 'History' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/chatbot', icon: MessageSquare, label: 'AI Assistant' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 md:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Brain className="w-5 h-5 md:w-6 md:h-6 text-primary" />
            </div>
            <span className="font-display font-bold text-xl md:text-2xl tracking-tight text-foreground">
              Syn<span className="text-primary">apta</span>
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
              return (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-200 active:scale-[0.95] hover:scale-[1.05] ${
                    isActive 
                      ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90' 
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-2 pb-24 md:p-6 lg:px-8 lg:py-4 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
      
      {/* Mobile nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border p-2 flex justify-around z-50 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path || (item.path !== '/' && location.startsWith(item.path));
          return (
            <Link 
              key={item.path} 
              href={item.path}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg ${
                isActive ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
