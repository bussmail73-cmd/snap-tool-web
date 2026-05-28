/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-gray-100 shadow-2xl flex flex-col items-center">
            {/* Warning Icon with Pulsate Animation */}
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-6 animate-pulse">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">
              Oops! Something went wrong
            </h1>
            
            <p className="text-gray-500 font-semibold text-sm mb-6 leading-relaxed">
              An unexpected error occurred while loading this page. Don't worry, your privacy and tools are completely safe.
            </p>

            {this.state.error && (
              <div className="w-full bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left overflow-auto max-h-[150px] font-mono text-[11px] text-red-600">
                <p className="font-bold mb-1">{this.state.error.toString()}</p>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap opacity-80 leading-normal">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl active:scale-[0.98] text-sm"
              >
                <Home className="w-4 h-4" />
                Go Home
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-900 border-2 border-gray-900 font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98] text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
