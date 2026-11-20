import { HeartPulse, ShieldCheck } from 'lucide-react';

export type AppSection = 'home' | 'assessment' | 'dashboard' | 'research' | 'guide';

interface TopNavBarProps {
  activeSection: AppSection;
  onNavigate: (section: AppSection) => void;
  hasAssessment: boolean;
  onPrimaryAction: () => void;
}

export function TopNavBar({
  activeSection,
  onNavigate,
  hasAssessment,
  onPrimaryAction,
}: TopNavBarProps) {
  const navItems: Array<{ id: AppSection; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'assessment', label: 'Valutazione' },
    { id: 'dashboard', label: 'Dashboard Rischi' },
    { id: 'research', label: 'Ricerca & Trend' },
    { id: 'guide', label: 'Guida & Note Legali' },
  ];

  const primaryLabel =
    activeSection === 'home'
      ? 'Inizia Valutazione'
      : hasAssessment && activeSection === 'dashboard'
        ? 'Aggiorna Parametri'
        : 'Fonti & Trend';

  return (
    <header className="sticky top-0 z-30 bg-[#FAF9F5]/95 backdrop-blur-md border-b border-stone-200/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer group"
        >
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D6E6E] to-[#14B8A6] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <HeartPulse className="w-4 h-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-slate-900">
            Clinica<span className="text-[#0D6E6E]">Prev</span>
          </span>
        </button>

        <nav aria-label="Navigazione principale" className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
                  active
                    ? 'text-[#0D6E6E] border-[#0D6E6E] font-semibold'
                    : 'text-slate-600 border-transparent hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={onPrimaryAction}
          className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5656] transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
        >
          {primaryLabel}
        </button>
      </div>

      {/* Mobile Nav Row */}
      <nav
        aria-label="Navigazione mobile"
        className="md:hidden border-t border-stone-200 px-3 py-2 flex items-center gap-4 overflow-x-auto bg-[#FAF9F5]"
      >
        {navItems.map((item) => {
          const active = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`text-xs font-medium whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                active
                  ? 'text-[#0D6E6E] border-[#0D6E6E] font-semibold'
                  : 'text-slate-600 border-transparent'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Ubiquitous Privacy & Informative Disclaimer Strip (visible on EVERY screen) */}
      <div
        role="note"
        aria-label="Avvertenza informativa e privacy"
        className="bg-amber-50/90 border-t border-amber-200/80"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-950">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className="w-4 h-4 text-[#0D6E6E] shrink-0" />
            <p className="leading-snug">
              <strong className="font-semibold">Riferimento informativo e divulgativo</strong> (non
              è una diagnosi né sostituisce il medico) ·{' '}
              <strong className="font-semibold">Zero salvataggio sul sito:</strong> i tuoi dati
              restano solo sul tuo dispositivo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('guide')}
            className="text-xs font-semibold text-[#0D6E6E] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
          >
            Disclaimer &amp; Privacy →
          </button>
        </div>
      </div>
    </header>
  );
}
