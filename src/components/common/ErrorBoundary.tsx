import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('FRAOVIA ErrorBoundary capturó un error no controlado:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070D1E] text-slate-100 flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-lg bg-[#0C162D] border border-rose-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 animate-in fade-in duration-200">
            
            {/* Header Icon & Title */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center shrink-0 shadow-inner">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold block">
                  Protección de Interfaz · FRAOVIA
                </span>
                <h2 className="text-lg sm:text-xl font-black text-white mt-0.5">
                  {this.props.fallbackTitle || 'Ocurrió un error inesperado'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  El sistema capturó una excepción para evitar que la pantalla quede en blanco.
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            {this.state.error && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-rose-950/60 text-rose-300 font-mono text-xs break-words shadow-inner space-y-1">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Detalle del error:</div>
                <div className="text-rose-400 font-bold">{this.state.error.message || String(this.state.error)}</div>
                {this.state.error.stack && (
                  <details className="mt-2 text-[10px] text-slate-500 cursor-pointer">
                    <summary className="hover:text-slate-400">Ver traza técnica</summary>
                    <pre className="mt-1 max-h-36 overflow-y-auto whitespace-pre-wrap font-mono p-2 bg-slate-900 rounded-lg text-slate-400">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reintentar</span>
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Recargar Aplicación</span>
              </button>
            </div>

          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
