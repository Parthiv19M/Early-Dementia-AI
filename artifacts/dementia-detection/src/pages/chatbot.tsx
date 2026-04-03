import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { Card, Input, Button } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAssistantReply,
  type AssistantLanguage,
} from "@/lib/local-assistant";

type ChatMessage = {
  role: "assistant" | "user";
  content: string;
};

export default function Chatbot() {
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<AssistantLanguage>("en");
  const translations = {
    en: {
      header: "Synapta",
      subheader: "Local cognitive health assistant with instant guidance",
      helpText:
        "Ask about dementia explanation, memory improvement, lifestyle habits, or general cognitive health.",
      placeholder: "Ask about brain health, memory tips...",
      initialMessage:
        "Hello! I am Synapta Assistant. I can explain dementia, share memory improvement tips, suggest healthy routines, and guide you on cognitive wellness. How can I help you today?",
    },
    hi: {
      header: "सिनेपटा",
      subheader:
        "त्वरित मार्गदर्शन के साथ स्थानीय संज्ञानात्मक स्वास्थ्य सहायक",
      helpText:
        "डिमेंशिया, स्मृति सुधार, जीवनशैली की आदतों या सामान्य संज्ञानात्मक स्वास्थ्य के बारे में पूछें।",
      placeholder: "मस्तिष्क स्वास्थ्य, स्मृति युक्तियों के बारे में पूछें...",
      initialMessage:
        "नमस्ते! मैं सिनेपटा सहायक हूँ। मैं डिमेंशिया को समझा सकता हूँ, स्मृति सुधार के सुझाव साझा कर सकता हूँ, स्वस्थ दिनचर्या का सुझाव दे सकता हूँ और संज्ञानात्मक कल्याण पर आपका मार्गदर्शन कर सकता हूँ। मैं आज आपकी क्या मदद कर सकता हूँ?",
    },
  };

  const t = language === "hi" ? translations.hi : translations.en;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: t.initialMessage,
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const prompt = input.trim();
    if (!prompt || isTyping) return;

    const userMessage: ChatMessage = { role: "user", content: prompt };
    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI thinking delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: getAssistantReply(prompt, language),
    };

    setMessages((current) => [...current, assistantMessage]);
    setIsTyping(false);
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col relative">
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent rounded-3xl -z-10 pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-lg shadow-black/5 flex items-center justify-center p-1 overflow-hidden border border-border">
            <img
              src={`${import.meta.env.BASE_URL}images/chatbot-avatar.png`}
              alt="Synapta Assistant"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
              {t.header} <Sparkles className="w-5 h-5 text-accent" />
            </h1>
            <p className="text-sm text-muted-foreground font-medium">
              {t.subheader}
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-border/50 rounded-xl p-1 flex shadow-sm">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-1.5 text-xs rounded-lg font-bold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] ${language === "en" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-secondary"}`}
          >
            EN
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={`px-4 py-1.5 text-xs rounded-lg font-bold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] ${language === "hi" ? "bg-primary text-white shadow-md shadow-primary/20" : "text-muted-foreground hover:bg-secondary"}`}
          >
            HI
          </button>
        </div>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden p-0 border-border/60 shadow-2xl shadow-primary/5">
        <div className="border-b border-border bg-white/80 px-6 py-4 text-sm text-muted-foreground font-medium">
          {t.helpText}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-secondary/20">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`flex gap-4 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    msg.role === "user"
                      ? "bg-primary text-white"
                      : "bg-white border border-border text-primary shadow-sm"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Bot className="w-5 h-5" />
                  )}
                </div>

                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3.5 text-[15px] leading-relaxed shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-white text-foreground border border-border/50 rounded-tl-sm"
                  }`}
                >
                  {msg.content.split("\n").map((line, i, lines) => (
                    <React.Fragment key={i}>
                      {line}
                      {i !== lines.length - 1 && <br />}
                    </React.Fragment>
                  ))}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="flex gap-4"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white border border-border text-primary shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white border border-border/50 rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex gap-1.5 items-center">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary/40"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.8,
                      delay: 0.15,
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-primary/60"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: 0.3 }}
                    className="w-1.5 h-1.5 rounded-full bg-primary/80"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-white border-t border-border">
          <form
            onSubmit={handleSend}
            className="flex gap-3 relative items-center"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t.placeholder}
              className="pr-14 rounded-full shadow-inner bg-secondary/50 focus:bg-white transition-all duration-300"
            />
            <Button
              type="submit"
              variant="primary"
              size="icon"
              disabled={!input.trim() || isTyping}
              aria-label="Send message"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full !w-10 !h-10 p-0 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 hover:shadow-lg shadow-primary/20"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
