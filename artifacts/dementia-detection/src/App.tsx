import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AppProvider } from "@/lib/store";
import { Layout } from "@/components/layout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import Home from "@/pages/home";
import Results from "@/pages/results";
import History from "@/pages/history";
import DoctorDashboard from "@/pages/doctor-dashboard";
import Chatbot from "@/pages/chatbot";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

type ErrorBoundaryState = {
  error: Error | null;
};

class AppErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("Frontend render crash:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-background text-foreground p-8">
          <h1 className="text-2xl font-bold mb-4">Frontend crashed during render</h1>
          <p className="mb-3">Temporary debug fallback is active.</p>
          <pre className="whitespace-pre-wrap rounded-lg bg-white p-4 text-sm border border-border">
            {this.state.error.message}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/results" component={Results} />
        <Route path="/history" component={History} />
        <Route path="/dashboard" component={DoctorDashboard} />
        <Route path="/chatbot" component={Chatbot} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <TooltipProvider>
            <WouterRouter>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AppProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}

export default App;
