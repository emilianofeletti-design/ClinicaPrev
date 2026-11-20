import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message || 'Si è verificato un errore imprevisto nell’interfaccia.',
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ClinicaPrev ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FAF9F5] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-stone-200 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm">
            <p className="text-xs font-mono uppercase tracking-wide text-rose-700">
              Ripristino Applicazione
            </p>
            <h1 className="text-xl font-bold text-slate-900">
              Qualcosa non ha funzionato come previsto
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nessun dato sanitario personale è stato inviato o perso. Puoi ricaricare la pagina per
              riprendere la navigazione.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-[#0D6E6E] rounded-xl hover:bg-[#0A5757] transition-colors cursor-pointer"
            >
              Ricarica ClinicaPrev
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
