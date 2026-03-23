import React, { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export const Card = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <div className={`bg-card rounded-2xl p-6 shadow-xl shadow-black/5 border border-border/50 ${className}`}>
    {children}
  </div>
);

export const Button = React.forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive', size?: 'sm' | 'md' | 'lg' | 'icon', isLoading?: boolean }>(({ children, className = '', variant = 'primary', size = 'md', isLoading, disabled, ...props }, ref) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 ease-out focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 focus:ring-primary/20",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-[0.97] focus:ring-secondary/20",
    outline: "bg-transparent border-2 border-border text-foreground hover:border-primary hover:bg-primary/5 active:scale-[0.97] focus:ring-primary/10",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted active:scale-[0.97] focus:ring-muted/50",
    destructive: "bg-destructive text-destructive-foreground shadow-lg shadow-destructive/25 hover:bg-destructive/90 active:scale-[0.97] focus:ring-destructive/20"
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
    icon: "h-10 w-10 p-2"
  };

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
});
Button.displayName = 'Button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full px-4 py-3 rounded-xl bg-background border-2 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all duration-200 ${className}`}
    {...props}
  />
));
Input.displayName = 'Input';

export const Badge = ({ children, variant = 'default', className = '' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'destructive' | 'outline', className?: string }) => {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-success/15 text-success border border-success/20",
    warning: "bg-warning/15 text-warning-foreground border border-warning/20",
    destructive: "bg-destructive/15 text-destructive border border-destructive/20",
    outline: "bg-transparent border border-border text-muted-foreground"
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const Waveform = ({ isActive }: { isActive: boolean }) => (
  <div className="flex items-center justify-center gap-1 h-12">
    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
      <div
        key={i}
        className={`w-1.5 rounded-full bg-primary ${isActive ? 'waveform-bar' : 'h-2'}`}
        style={{
          animationDelay: isActive ? `${Math.random() * 0.5}s` : '0s',
          animationDuration: isActive ? `${0.5 + Math.random() * 0.5}s` : '0s'
        }}
      />
    ))}
  </div>
);

export const ScoreGauge = ({ score }: { score: number }) => {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  
  let color = 'stroke-success';
  if (score > 40) color = 'stroke-warning';
  if (score > 70) color = 'stroke-destructive';

  return (
    <div className="relative w-48 h-48 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="96" cy="96" r={radius}
          className="stroke-secondary fill-none" strokeWidth="12"
        />
        <motion.circle
          cx="96" cy="96" r={radius}
          className={`${color} fill-none drop-shadow-sm`}
          strokeWidth="12"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          strokeDasharray={circumference}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-display font-bold text-foreground">{Math.round(score)}</span>
        <span className="text-xs text-muted-foreground font-semibold tracking-wider uppercase">Risk Score</span>
      </div>
    </div>
  );
};
