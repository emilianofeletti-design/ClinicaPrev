import { onAuthStateChanged, type User } from 'firebase/auth';
import { FileUp } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { AssessmentForm } from './components/AssessmentForm';
import { GuideAndLegalView } from './components/GuideAndLegalView';
import { HomePage } from './components/HomePage';
import { ResearchTrendsDashboard } from './components/ResearchTrendsDashboard';
import { RiskDashboard } from './components/RiskDashboard';
import { SourceReaderView } from './components/SourceReaderView';
import { TopNavBar, type AppSection } from './components/TopNavBar';
import {
  auth,
  isVerifiedCurator,
  signInCuratorWithGoogle,
  signOutCurator,
} from './firebase';
import {
  fetchActiveClinicalParametersFromFirestore,
  fetchParameterProposalsFromFirestore,
  fetchParameterRevisionsFromFirestore,
  publishParameterChangeToFirestore,
  rejectProposalInFirestore,
  seedBaselineToFirestore,
} from './services/firestoreClinicalStore';
import type {
  ClinicalAssessmentResult,
  ClinicalProfileDraft,
  ClinicalProfileInput,
  MonitoringDigestResponse,
  ValidationErrors,
} from './types/clinical';
import {
  applyApprovedProposal,
  applyGuardedAutoUpdates,
  BASELINE_PARAMETER_PROPOSALS,
  BASELINE_PARAMETER_REVISIONS,
  DEFAULT_CLINICAL_PARAMETERS,
  rollbackToRevision,
  type ClinicalParameterSet,
  type ParameterRevisionRecord,
  type ParameterUpdateProposal,
} from './utils/clinicalParameters';
import {
  draftToClinicalProfile,
  EMPTY_CLINICAL_DRAFT,
  evaluateClinicalRisk,
  profileToDraft,
  validateClinicalDraft,
} from './utils/clinicalRiskEngine';
import {
  buildPersonalArchiveFile,
  createPersonalAnalysisRecord,
  parsePersonalArchiveFile,
  triggerArchiveDownload,
  type PersonalAnalysisRecord,
} from './utils/personalArchiveFile';
import type { SourceReaderDocument } from './utils/sourceReader';

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('home');
  const [activeReader, setActiveReader] = useState<{
    doc: SourceReaderDocument;
    returnSection: AppSection;
  } | null>(null);
  const [draft, setDraft] = useState<ClinicalProfileDraft>(() => ({ ...EMPTY_CLINICAL_DRAFT }));
  const [computedProfile, setComputedProfile] = useState<ClinicalProfileInput | null>(null);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitAttemptCount, setSubmitAttemptCount] = useState(0);
  const [result, setResult] = useState<ClinicalAssessmentResult | null>(null);

  // Strictly in-memory personal timeline imported from user's local .json file (zero server storage)
  const [personalTimeline, setPersonalTimeline] = useState<PersonalAnalysisRecord[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const emptyDashboardFileRef = useRef<HTMLInputElement | null>(null);

  // Public shared clinical parameters & governance state (hydrated from Firebase Firestore)
  const [activeParams, setActiveParams] = useState<ClinicalParameterSet>(
    DEFAULT_CLINICAL_PARAMETERS
  );
  const [proposals, setProposals] = useState<ParameterUpdateProposal[]>(
    BASELINE_PARAMETER_PROPOSALS
  );
  const [revisions, setRevisions] = useState<ParameterRevisionRecord[]>(
    BASELINE_PARAMETER_REVISIONS
  );
  const [firestoreSynced, setFirestoreSynced] = useState(false);

  // Optional curator auth (only for persisting shared parameter updates to Firestore)
  const [curatorUser, setCuratorUser] = useState<User | null>(null);
  const [govBusy, setGovBusy] = useState(false);
  const [govStatus, setGovStatus] = useState<string | null>(null);
  const [govError, setGovError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCuratorUser(user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let mounted = true;
    const hydrateFromFirestore = async () => {
      const [paramsRes, proposalsRes, revisionsRes] = await Promise.all([
        fetchActiveClinicalParametersFromFirestore(),
        fetchParameterProposalsFromFirestore(),
        fetchParameterRevisionsFromFirestore(),
      ]);
      if (!mounted) return;
      setActiveParams(paramsRes.params);
      setProposals(proposalsRes.proposals);
      setRevisions(revisionsRes.revisions);
      setFirestoreSynced(paramsRes.fromFirestore);
    };
    void hydrateFromFirestore();
    return () => {
      mounted = false;
    };
  }, []);

  // Live recomputation whenever clinical parameter version changes
  useEffect(() => {
    if (computedProfile) {
      setResult(evaluateClinicalRisk(computedProfile, activeParams));
    }
  }, [activeParams, computedProfile]);

  const handleDraftChange = (next: ClinicalProfileDraft) => {
    setDraft(next);
    if (Object.keys(errors).length > 0) {
      setErrors(validateClinicalDraft(next));
    }
  };

  const handleResetEmpty = () => {
    setDraft({ ...EMPTY_CLINICAL_DRAFT });
    setErrors({});
  };

  const handleSubmitAssessment = () => {
    const validationErrors = validateClinicalDraft(draft);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setSubmitAttemptCount((c) => c + 1);
      return;
    }
    const cleanProfile = draftToClinicalProfile(draft);
    const computed = evaluateClinicalRisk(cleanProfile, activeParams);
    setComputedProfile(cleanProfile);
    setResult(computed);
    setActiveSection('dashboard');
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleNavigate = (section: AppSection) => {
    setActiveReader(null);
    if (section === 'dashboard') {
      const validationErrors = validateClinicalDraft(draft);
      if (Object.keys(validationErrors).length === 0) {
        const cleanProfile = draftToClinicalProfile(draft);
        setComputedProfile(cleanProfile);
        setResult(evaluateClinicalRisk(cleanProfile, activeParams));
      }
    }
    setActiveSection(section);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenSourceReader = (doc: SourceReaderDocument, returnSection: AppSection) => {
    setActiveReader({ doc, returnSection });
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleCloseSourceReader = () => {
    if (!activeReader) return;
    const target = activeReader.returnSection;
    setActiveReader(null);
    setActiveSection(target);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleExportArchiveFile = (label: string) => {
    if (!computedProfile || !result) return;
    const currentRec = createPersonalAnalysisRecord(computedProfile, result, label);
    const archive = buildPersonalArchiveFile(personalTimeline, currentRec);
    triggerArchiveDownload(archive);
  };

  const handleImportArchiveFile = (file: File) => {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parsePersonalArchiveFile(text);
      if (!parsed.ok) {
        setImportError(parsed.error);
        return;
      }
      setPersonalTimeline(parsed.archive.records);
      setDraft(profileToDraft(parsed.latestRecord.profile));
      setErrors({});
      setActiveSection('assessment');
      window.scrollTo({ top: 0, behavior: 'auto' });
    };
    reader.onerror = () => {
      setImportError('Impossibile leggere il file selezionato dal dispositivo.');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleCuratorSignIn = async () => {
    setGovError(null);
    setGovStatus(null);
    try {
      const user = await signInCuratorWithGoogle();
      if (isVerifiedCurator(user)) {
        setGovStatus(
          `Accesso curatore confermato (${user.email}). Le modifiche ai parametri verranno salvate permanentemente su Firebase Firestore.`
        );
      } else {
        setGovError(
          `Account ${user.email ?? ''} autenticato come ospite: solo il curatore autorizzato può scrivere su Firestore.`
        );
      }
    } catch (err) {
      setGovError(
        err instanceof Error ? err.message : 'Accesso Google annullato o non riuscito.'
      );
    }
  };

  const handleCuratorSignOut = async () => {
    await signOutCurator();
    setGovStatus('Sessione curatore chiusa.');
  };

  const handleSeedFirestore = async (digest: MonitoringDigestResponse | null) => {
    setGovBusy(true);
    setGovError(null);
    setGovStatus(null);
    try {
      await seedBaselineToFirestore(digest);
      setFirestoreSynced(true);
      setGovStatus(
        'Database Firebase Firestore inizializzato con parametri v1.0, proposte e bollettino scientifico.'
      );
    } catch (err) {
      setGovError(
        err instanceof Error ? err.message : 'Errore durante l’inizializzazione di Firestore.'
      );
    } finally {
      setGovBusy(false);
    }
  };

  const handleRunGuardedAutoUpdates = async () => {
    setGovBusy(true);
    setGovError(null);
    setGovStatus(null);
    try {
      const actor = curatorUser?.email || 'auto-guardrail@clinicaprev.org';
      const outcome = applyGuardedAutoUpdates(activeParams, proposals, actor);
      if (!outcome.revision || outcome.appliedProposals.length === 0) {
        setGovStatus('Nessun parametro automatico idoneo da aggiornare entro i guardrail.');
        return;
      }

      if (isVerifiedCurator(curatorUser)) {
        await publishParameterChangeToFirestore(
          outcome.nextParams,
          outcome.revision,
          outcome.appliedProposals
        );
        setFirestoreSynced(true);
      }

      setActiveParams(outcome.nextParams);
      setProposals(outcome.updatedProposals);
      setRevisions((prev) => [outcome.revision!, ...prev]);
      setGovStatus(
        isVerifiedCurator(curatorUser)
          ? `Pubblicata su Firebase Firestore la versione ${outcome.nextParams.version} (${outcome.appliedProposals.length} parametri aggiornati entro guardrail).`
          : `Simulata localmente la versione ${outcome.nextParams.version} (${outcome.appliedProposals.length} parametri entro guardrail). Accedi come Curatore per salvarla su Firestore.`
      );
    } catch (err) {
      setGovError(
        err instanceof Error ? err.message : 'Errore durante l’auto-aggiornamento guardrail.'
      );
    } finally {
      setGovBusy(false);
    }
  };

  const handleApproveProposal = async (proposal: ParameterUpdateProposal) => {
    setGovBusy(true);
    setGovError(null);
    setGovStatus(null);
    try {
      const actor = curatorUser?.email || 'sessione-locale@clinicaprev.org';
      const outcome = applyApprovedProposal(activeParams, proposal, actor);
      if (!outcome.ok || !outcome.revision) {
        setGovError(outcome.reason || 'La proposta non supera i controlli di sicurezza.');
        return;
      }

      if (isVerifiedCurator(curatorUser)) {
        await publishParameterChangeToFirestore(outcome.nextParams, outcome.revision, [
          outcome.updatedProposal,
        ]);
        setFirestoreSynced(true);
      }

      setActiveParams(outcome.nextParams);
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? outcome.updatedProposal : p))
      );
      setRevisions((prev) => [outcome.revision!, ...prev]);
      setGovStatus(
        isVerifiedCurator(curatorUser)
          ? `Proposta approvata e pubblicata su Firestore come versione ${outcome.nextParams.version}.`
          : `Proposta applicata nella sessione corrente (${outcome.nextParams.version}). Accedi come Curatore per renderla permanente su Firestore.`
      );
    } catch (err) {
      setGovError(
        err instanceof Error ? err.message : 'Errore durante l’approvazione della proposta.'
      );
    } finally {
      setGovBusy(false);
    }
  };

  const handleRejectProposal = async (proposal: ParameterUpdateProposal) => {
    setGovBusy(true);
    setGovError(null);
    setGovStatus(null);
    try {
      if (isVerifiedCurator(curatorUser)) {
        await rejectProposalInFirestore(proposal);
      }
      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposal.id
            ? { ...p, status: 'rejected', updatedAtIso: new Date().toISOString() }
            : p
        )
      );
      setGovStatus(`Proposta «${proposal.parameterLabel}» rifiutata.`);
    } catch (err) {
      setGovError(err instanceof Error ? err.message : 'Impossibile rifiutare la proposta.');
    } finally {
      setGovBusy(false);
    }
  };

  const handleRollbackRevision = async (targetRev: ParameterRevisionRecord) => {
    setGovBusy(true);
    setGovError(null);
    setGovStatus(null);
    try {
      const actor = curatorUser?.email || 'sessione-locale@clinicaprev.org';
      const outcome = rollbackToRevision(activeParams, targetRev, actor);
      if (isVerifiedCurator(curatorUser)) {
        await publishParameterChangeToFirestore(outcome.nextParams, outcome.revision);
        setFirestoreSynced(true);
      }
      setActiveParams(outcome.nextParams);
      setRevisions((prev) => [outcome.revision, ...prev]);
      setGovStatus(
        `Ripristinati i parametri della versione ${targetRev.version} (nuova revisione ${outcome.nextParams.version}).`
      );
    } catch (err) {
      setGovError(err instanceof Error ? err.message : 'Errore durante il rollback.');
    } finally {
      setGovBusy(false);
    }
  };

  const handleTopBarPrimaryAction = () => {
    if (activeSection === 'home') {
      handleNavigate('assessment');
    } else if (result && activeSection === 'dashboard') {
      handleNavigate('assessment');
    } else {
      handleNavigate('research');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F5] text-slate-800">
      <TopNavBar
        activeSection={activeSection}
        onNavigate={handleNavigate}
        hasAssessment={Boolean(result)}
        onPrimaryAction={handleTopBarPrimaryAction}
      />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {activeReader ? (
          <SourceReaderView
            doc={activeReader.doc}
            backLabel={
              activeReader.returnSection === 'guide'
                ? 'Torna a Guida & Note Legali'
                : 'Torna a Ricerca & Trend'
            }
            onBack={handleCloseSourceReader}
            onGoToAssessment={() => handleNavigate('assessment')}
          />
        ) : (
          <>
            {activeSection === 'home' && (
              <HomePage
                onStartAssessment={() => handleNavigate('assessment')}
                onOpenResearch={() => handleNavigate('research')}
                onOpenGuide={() => handleNavigate('guide')}
                onImportArchiveFile={handleImportArchiveFile}
                importError={importError}
                importedRecordCount={personalTimeline.length}
                activeParamVersion={activeParams.version}
              />
            )}

            {activeSection === 'assessment' && (
              <AssessmentForm
                draft={draft}
                errors={errors}
                submitAttemptCount={submitAttemptCount}
                importedTimeline={personalTimeline}
                importError={importError}
                onImportArchiveFile={handleImportArchiveFile}
                onChange={handleDraftChange}
                onResetEmpty={handleResetEmpty}
                onSubmit={handleSubmitAssessment}
                onOpenLegal={() => handleNavigate('guide')}
              />
            )}

            {activeSection === 'dashboard' &&
              (result && computedProfile ? (
                <RiskDashboard
                  profile={computedProfile}
                  result={result}
                  personalTimeline={personalTimeline}
                  importError={importError}
                  onEditParameters={() => handleNavigate('assessment')}
                  onExportArchiveFile={handleExportArchiveFile}
                  onImportArchiveFile={handleImportArchiveFile}
                  onClearTimeline={() => setPersonalTimeline([])}
                  onOpenLegal={() => handleNavigate('guide')}
                  onOpenResearch={() => handleNavigate('research')}
                />
              ) : (
                <section className="max-w-2xl mx-auto bg-gradient-to-br from-white to-[#F0FDFA]/60 border border-teal-100 rounded-2xl p-8 sm:p-10 text-center space-y-5 my-8 shadow-[0_2px_12px_rgba(13,110,110,0.05)]">
                  <p className="text-xs font-mono uppercase tracking-wide text-[#0D6E6E]">
                    Dashboard Rischi Preventivi
                  </p>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                    Nessuna valutazione ancora calcolata
                  </h1>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Compila i tuoi dati nella scheda Valutazione per scoprire il tuo profilo
                    cardiovascolare (ESC SCORE2), metabolico (FINDRISC) e oncologico (WCRF/AIRC),
                    oppure ricarica un tuo file analisi precedente (.json). Ricorda: nessun dato
                    viene salvato sul sito.
                  </p>
                  {importError && (
                    <div
                      role="alert"
                      className="rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-2.5 text-xs text-rose-900 text-left"
                    >
                      {importError}
                    </div>
                  )}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => handleNavigate('assessment')}
                      className="px-5 py-2.5 text-sm font-semibold text-white bg-[#0D6E6E] rounded-lg hover:bg-[#0A5656] transition-colors cursor-pointer"
                    >
                      Compila la Valutazione
                    </button>
                    <button
                      type="button"
                      onClick={() => emptyDashboardFileRef.current?.click()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[#0D6E6E] bg-white border border-teal-200 rounded-lg hover:bg-teal-50/70 transition-colors cursor-pointer"
                    >
                      <FileUp className="w-4 h-4" />
                      Carica file precedente (.json)
                    </button>
                    <input
                      ref={emptyDashboardFileRef}
                      type="file"
                      accept="application/json,.json"
                      className="hidden"
                      aria-label="Carica un file analisi precedente ClinicaPrev"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImportArchiveFile(file);
                          e.target.value = '';
                        }
                      }}
                    />
                  </div>
                </section>
              ))}

            {activeSection === 'research' && (
              <ResearchTrendsDashboard
                activeParams={activeParams}
                proposals={proposals}
                revisions={revisions}
                firestoreSynced={firestoreSynced}
                curatorUser={curatorUser}
                busyAction={govBusy}
                statusBanner={govStatus}
                errorBanner={govError}
                onCuratorSignIn={handleCuratorSignIn}
                onCuratorSignOut={handleCuratorSignOut}
                onSeedFirestore={handleSeedFirestore}
                onRunGuardedAutoUpdates={handleRunGuardedAutoUpdates}
                onApproveProposal={handleApproveProposal}
                onRejectProposal={handleRejectProposal}
                onRollbackRevision={handleRollbackRevision}
                onOpenSourceReader={(doc) => handleOpenSourceReader(doc, 'research')}
              />
            )}

            {activeSection === 'guide' && (
              <GuideAndLegalView
                onReturnToAssessment={() => handleNavigate('assessment')}
                onOpenSourceReader={(doc) => handleOpenSourceReader(doc, 'guide')}
              />
            )}
          </>
        )}
      </main>

      <footer className="border-t border-stone-200/90 bg-white/85 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
          <p className="leading-relaxed max-w-3xl">
            <strong className="text-slate-900">ClinicaPrev</strong> — Riferimento puramente
            informativo e divulgativo basato su ESC SCORE2, FINDRISC (IDF/OMS), WCRF/AICR e
            Fondazione AIRC. Non costituisce diagnosi né sostituisce il medico.{' '}
            <strong className="text-slate-900">
              Non salviamo alcun dato personale dell’utente sul sito.
            </strong>
          </p>
          <div className="flex items-center gap-5 shrink-0">
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('guide')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Disclaimer &amp; Privacy
            </button>
            <button
              type="button"
              onClick={() => handleNavigate('research')}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Fonti &amp; Parametri
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
