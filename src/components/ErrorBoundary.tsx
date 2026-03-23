"use client";

import React from "react";
import { Button } from "./ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#0A0A0F' }}>
          <div className="max-w-md w-full text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
              <AlertTriangle className="w-10 h-10 text-red-400" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">Algo salió mal</h1>
              <p className="text-white/60">
                Ocurrió un error inesperado. Por favor, intenta recargar la página.
              </p>
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="p-4 rounded-lg text-left text-sm overflow-auto max-h-40" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <pre className="text-red-400 whitespace-pre-wrap">{this.state.error.message}</pre>
              </div>
            )}
            
            <Button
              onClick={() => window.location.reload()}
              className="gap-2"
              style={{ background: '#FF6B4A' }}
            >
              <RefreshCw className="w-4 h-4" />
              Recargar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook version for functional components
export function useErrorHandler() {
  return (error: Error, errorInfo?: React.ErrorInfo) => {
    console.error("Error:", error, errorInfo);
  };
}
