import React, { Suspense, lazy } from "react";
import { Loader2 } from "lucide-react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const Home = lazy(() => import("@/pages/home"));
const Results = lazy(() => import("@/pages/results"));
const History = lazy(() => import("@/pages/history"));
const DoctorDashboard = lazy(() => import("@/pages/doctor-dashboard"));
const Chatbot = lazy(() => import("@/pages/chatbot"));
const Learn = lazy(() => import("@/pages/learn"));
const NotFound = lazy(() => import("@/pages/not-found"));

import { AppProvider } from "@/lib/store";
import { Layout } from "@/components/layout";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
      <Loader2 className="w-10 h-10 text-primary animate-spin" />
      <p className="text-sm font-medium text-muted-foreground animate-pulse">
        Loading health insights...
      </p>
    </div>
  );
}

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
      <Suspense fallback={<PageLoader />}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/results" component={Results} />
          <Route path="/history" component={History} />
          <Route path="/dashboard" component={DoctorDashboard} />
          <Route path="/chatbot" component={Chatbot} />
          <Route path="/learn" component={Learn} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
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
