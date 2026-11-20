import type {
  AcademicPublication,
  EmergingTrendItem,
  MonthlyTrendPoint,
  ReaderBrief,
} from '../types/clinical';

export interface ProtocolMetadata {
  id: string;
  name: string;
  organization: string;
  domain: string;
  citation: string;
  pmid: string;
  url: string;
  variablesUsed: string[];
  validationScope: string;
  readerBrief?: ReaderBrief;
}

export const INTERNATIONAL_PROTOCOLS: ProtocolMetadata[] = [
  {
    id: 'esc-score2',
    name: 'ESC SCORE2 & SCORE2-OP (2021)',
    organization: 'European Society of Cardiology (ESC)',
    domain: 'Rischio Cardiovascolare (10 anni)',
    citation: 'SCORE2 working group and ESC Cardiovascular risk collaboration. Eur Heart J. 2021;42(25):2439-2454.',
    pmid: '34120177',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34120177/',
    variablesUsed: [
      'Età e sesso biologico',
      'Pressione arteriosa sistolica (mmHg)',
      'Colesterolo non-HDL (mmol/L)',
      'Stato di fumatore',
      'Calibrazione regionale europea (Italia: area a basso rischio)',
    ],
    validationScope: 'Calibrato su oltre 677.000 individui in 45 coorti europee per eventi CV fatali e non fatali a 10 anni.',
    readerBrief: {
      headlineIt: 'Come si calcola il rischio cardiovascolare a 10 anni in Europa (ESC SCORE2)',
      plainSummary:
        'SCORE2 è il modello ufficiale della Società Europea di Cardiologia usato dai medici per stimare la probabilità di infarto o ictus nei prossimi 10 anni nelle persone apparentemente sane. A differenza dei vecchi calcolatori, considera sia gli eventi fatali sia quelli non fatali e adatta la stima al Paese in cui vivi (l’Italia rientra nella fascia europea a basso rischio di base).',
      keyTakeaways: [
        'Sviluppato analizzando oltre 677.000 persone in 45 studi europei e validato su più di 1 milione di individui.',
        'Usa il colesterolo non-HDL (colesterolo totale meno HDL) invece del solo colesterolo totale, perché misura meglio le particelle che si depositano nelle arterie.',
        'Le soglie di attenzione cambiano con l’età: sotto i 50 anni un rischio ≥7,5% è già considerato alto, tra 50 e 69 anni la soglia alta è ≥10%, dai 70 anni in su (SCORE2-OP) è ≥15%.',
      ],
      practicalMeaning:
        'Su ClinicaPrev questo protocollo guida il calcolo cardiovascolare: abbassare la pressione sistolica, smettere di fumare e migliorare il colesterolo non-HDL riducono subito la percentuale stimata a 10 anni.',
      studyLimits:
        'Non va applicato a chi ha già avuto un infarto/ictus, ha diabete già diagnosticato o ipercolesterolemia familiare: in questi casi il medico usa percorsi clinici dedicati.',
      evidenceLevel: 'Linea Guida Europea Ufficiale (ESC · Coorti su 677.000+ persone)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'findrisc',
    name: 'FINDRISC (Finnish Diabetes Risk Score)',
    organization: 'International Diabetes Federation (IDF) · WHO Europe',
    domain: 'Rischio Diabete Tipo 2 & Metabolico (10 anni)',
    citation: 'Lindström J, Tuomilehto J. The Diabetes Risk Score: a practical tool to predict type 2 diabetes risk. Diabetes Care. 2003;26(3):725-731.',
    pmid: '12610029',
    url: 'https://pubmed.ncbi.nlm.nih.gov/12610029/',
    variablesUsed: [
      'Età e BMI (kg/m²)',
      'Circonferenza vita per sesso',
      'Attività fisica giornaliera',
      'Consumo quotidiano di frutta e verdura',
      'Terapia antipertensiva, pregressa iperglicemia e familiarità diabetica',
    ],
    validationScope: 'Strumento non invasivo di riferimento in Europa e Italia (SID-AMD) con sensibilità 78–81% e specificità 76–77%.',
    readerBrief: {
      headlineIt: 'FINDRISC: il questionario europeo senza prelievi per stimare il rischio di diabete di tipo 2',
      plainSummary:
        'Nato in Finlandia e adottato dalla Federazione Internazionale del Diabete (IDF) e dalle società diabetologiche italiane (SID-AMD), FINDRISC stima la probabilità di sviluppare il diabete di tipo 2 entro 10 anni usando 8 domande semplici — senza bisogno di esami del sangue.',
      keyTakeaways: [
        'Assegna un punteggio da 0 a 26 punti: sotto i 7 punti il rischio a 10 anni è inferiore all’1% (1 persona su 100).',
        'Tra 12 e 14 punti il rischio sale a circa il 17% (1 su 6); da 15 punti in su diventa alto (~33%, 1 su 3) e merita un confronto con il medico per controllare glicemia a digiuno ed emoglobina glicata (HbA1c).',
        'Peso corporeo, circonferenza vita, movimento quotidiano e verdura/frutta pesano molto: cambiare stile di vita può ridurre il punteggio di diversi punti.',
      ],
      practicalMeaning:
        'Su ClinicaPrev FINDRISC è il motore del profilo metabolico: anche una riduzione moderata del girovita (4–6 cm) e almeno 30 minuti al giorno di movimento abbassano sensibilmente il punteggio.',
      studyLimits:
        'È uno strumento di screening preventivo e non fa diagnosi di diabete o prediabete: la diagnosi richiede sempre esami ematici prescritti dal medico.',
      evidenceLevel: 'Standard Internazionale di Screening (IDF · OMS Europa · SID-AMD)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'wcrf-aicr',
    name: 'WCRF/AICR Standardized Cancer Prevention Score',
    organization: 'World Cancer Research Fund / American Institute for Cancer Research · IARC',
    domain: 'Rischio Oncologico Preventivo',
    citation: 'Shams-White MM et al. Operationalizing the 2018 WCRF/AICR Cancer Prevention Recommendations. Nutrients. 2019;11(7):1572.',
    pmid: '31295900',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31295900/',
    variablesUsed: [
      'Esposizione al tabacco (IARC Gruppo 1)',
      'Consumo alcolico settimanale (IARC Gruppo 1)',
      'Adiposità corporea (BMI) e attività fisica OMS',
      'Apporto vegetale/fibre, carni rosse/lavorate e ultra-processati',
      'Protezione UV e anamnesi familiare oncologica di 1° grado',
    ],
    validationScope: 'Ogni incremento di 1 punto di aderenza WCRF/AICR si associa a una riduzione del 7–10% dell’incidenza oncologica complessiva nelle coorti EPIC e UK Biobank.',
    readerBrief: {
      headlineIt: 'Lo score WCRF/AICR: come stile di vita e dieta riducono il rischio di tumori',
      plainSummary:
        'Il World Cancer Research Fund (WCRF) analizza periodicamente tutta la letteratura mondiale sul legame tra alimentazione, peso, attività fisica e tumori. Questo punteggio standardizzato (da 0 a 7 punti) trasforma quelle raccomandazioni in una misura concreta di quanto le tue abitudini proteggano l’organismo.',
      keyTakeaways: [
        'Nelle grandi coorti europee (EPIC e UK Biobank), ogni singolo punto in più di aderenza allo score si associa a una riduzione del 7–10% dell’incidenza complessiva di tumori.',
        'I fattori con l’impatto protettivo più forte sono: mantenere un peso sano, fare attività fisica regolare, mangiare molte fibre/vegetali, limitare carni rosse/lavorate, cibi ultra-processati e alcol.',
        'Integrato con l’astensione dal fumo e la protezione solare UV (Codice Europeo Contro il Cancro / IARC), copre i principali determinanti modificabili della prevenzione oncologica.',
      ],
      practicalMeaning:
        'Su ClinicaPrev genera sia l’Indice di Esposizione Oncologica (0–100) sia il punteggio di aderenza WCRF/AICR (0–7), aiutandoti a vedere subito quali abitudini migliorano di più la protezione.',
      studyLimits:
        'Un punteggio ottimo riduce sensibilmente il rischio statistico, ma non lo azzera: età, genetica e fattori casuali restano presenti, perciò gli screening organizzati SSN restano fondamentali.',
      evidenceLevel: 'Consenso Scientifico Globale (WCRF/AICR Third Expert Report · IARC)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'who-pa-2020',
    name: 'WHO Guidelines on Physical Activity, Strength & Daily Steps',
    organization: 'World Health Organization (WHO) · EJPC / Lancet Public Health',
    domain: 'Prevenzione Primaria Multi-Patologia',
    citation: 'Bull FC et al. Br J Sports Med. 2020 (PMID 33239350); Banach M et al. Eur J Prev Cardiol. 2023 (PMID 37555441).',
    pmid: '37555441',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37555441/',
    variablesUsed: [
      'Frequenza e durata degli allenamenti settimanali (target OMS ≥150–300 min)',
      'Tipologia attività (combinata aerobico + forza riduce mortalità fino al 18% extra)',
      'Passi medi giornalieri (ogni +1.000 passi/die −15% mortalità globale; target ≥7.000–8.000)',
    ],
    validationScope: 'Meta-analisi su 226.889 individui (EJPC 2023) e 78.500 partecipanti UK Biobank (JAMA Intern Med 2022) su CVD, diabete e incidenza oncologica.',
    readerBrief: {
      headlineIt: 'Linee Guida OMS su movimento, forza muscolare e passi giornalieri: cosa funziona davvero',
      plainSummary:
        'Non serve diventare atleti per ottenere enormi benefici per cuore, metabolismo e prevenzione oncologica. Le linee guida OMS e le più recenti meta-analisi sui contapassi mostrano che già passare da uno stile sedentario a camminate regolari e due brevi sedute settimanali di rinforzo muscolare cambia drasticamente il profilo di salute.',
      keyTakeaways: [
        'Obiettivo base OMS: 150–300 minuti a settimana di attività moderata (o 75–150 di attività vigorosa), meglio se abbinati a 2 sessioni di rinforzo muscolare.',
        'Passi giornalieri (meta-analisi su 226.889 persone): benefici significativi già a partire da ~4.000 passi/giorno; ogni +1.000 passi extra si associa a −15% di mortalità per tutte le cause.',
        'Ridurre le ore seduti al giorno (sedentarietà) è un fattore indipendente: alzarsi e muoversi con regolarità conta anche per chi fa sport 2–3 volte a settimana.',
      ],
      practicalMeaning:
        'ClinicaPrev combina frequenza/durata degli allenamenti, tipo di attività (premiando l’allenamento combinato aerobico + forza) e i passi medi giornalieri per stimare il beneficio reale.',
      studyLimits:
        'Chi è fermo da molto tempo o ha patologie cardiache/articolari dovrebbe aumentare il volume di attività in modo graduale confrontandosi con il proprio medico.',
      evidenceLevel: 'Linee Guida OMS + Meta-analisi su 226.889 persone',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'fondazione-airc',
    name: 'Linee Guida di Prevenzione Oncologica — Fondazione AIRC',
    organization: 'Fondazione AIRC per la Ricerca sul Cancro (Italia)',
    domain: 'Prevenzione Oncologica & Stili di Vita',
    citation: 'Fondazione AIRC per la Ricerca sul Cancro — Guida scientifica alla prevenzione dei tumori, alimentazione, attività fisica e screening (allineata a IARC / WCRF / AIOM).',
    pmid: 'AIRC-IT',
    url: 'https://www.airc.it/cancro/prevenzione-tumore',
    variablesUsed: [
      'Astensione dal fumo e limitazione rigorosa dell’alcol',
      'Dieta mediterranea ricca di fibre, legumi, cereali integrali e riduzione carni lavorate',
      'Attività fisica combinata regolare, controllo peso corporeo e protezione UV',
      'Adesione agli screening oncologici organizzati SSN (mammella, colon-retto, cervice)',
    ],
    validationScope: 'Sintesi validata dalla comunità oncologica italiana (AIRC / AIOM) sulle evidenze peer-reviewed per ridurre fino al 40% dei nuovi casi di tumore prevenibili.',
    readerBrief: {
      headlineIt: 'Prevenzione oncologica secondo Fondazione AIRC: le scelte che riducono fino al 40% dei casi',
      plainSummary:
        'Fondazione AIRC raccoglie e traduce per i cittadini italiani le evidenze più solide della ricerca oncologica internazionale (IARC, WCRF, AIOM). Il messaggio chiave è doppio: da un lato la prevenzione primaria con stili di vita quotidiani sani, dall’altro la diagnosi precoce attraverso gli screening gratuiti del Servizio Sanitario Nazionale.',
      keyTakeaways: [
        'Circa il 40% dei nuovi casi di tumore è legato a fattori di rischio modificabili (fumo, alcol, sovrappeso, sedentarietà, alimentazione povera di fibre e raggi UV).',
        'La dieta mediterranea autentica (legumi, cereali integrali, frutta, verdura, olio extravergine, poche carni lavorate) è il modello alimentare più studiato per la prevenzione.',
        'Gli screening SSN (mammografia, sangue occulto nelle feci per il colon-retto, Pap-test/HPV-test) salvano vite perché intercettano lesioni precancerose o tumori in fase iniziale.',
      ],
      practicalMeaning:
        'Le raccomandazioni AIRC sono integrate nei suggerimenti personalizzati e nei promemoria sugli screening per fascia d’età mostrati nella Dashboard di ClinicaPrev.',
      studyLimits:
        'Le guide divulgative AIRC rappresentano una sintesi per la popolazione generale: per chi ha forte familiarità oncologica o sindromi ereditarie servono percorsi di consulenza oncogenetica dedicati.',
      evidenceLevel: 'Fonte Istituzionale Italiana Validata (AIRC / AIOM / IARC)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
];

export const BASELINE_MONTHLY_SERIES: MonthlyTrendPoint[] = [
  { month: 'Dic 25', oncology: 412, cardiovascular: 368, metabolic: 315, total: 1095 },
  { month: 'Gen 26', oncology: 438, cardiovascular: 382, metabolic: 334, total: 1154 },
  { month: 'Feb 26', oncology: 451, cardiovascular: 391, metabolic: 349, total: 1191 },
  { month: 'Mar 26', oncology: 476, cardiovascular: 410, metabolic: 378, total: 1264 },
  { month: 'Apr 26', oncology: 489, cardiovascular: 425, metabolic: 392, total: 1306 },
  { month: 'Mag 26', oncology: 514, cardiovascular: 439, metabolic: 418, total: 1371 },
  { month: 'Giu 26', oncology: 531, cardiovascular: 447, metabolic: 436, total: 1414 },
  { month: 'Lug 26', oncology: 548, cardiovascular: 462, metabolic: 451, total: 1461 },
  { month: 'Ago 26', oncology: 522, cardiovascular: 454, metabolic: 442, total: 1418 },
  { month: 'Set 26', oncology: 579, cardiovascular: 488, metabolic: 479, total: 1546 },
  { month: 'Ott 26', oncology: 604, cardiovascular: 512, metabolic: 506, total: 1622 },
  { month: 'Nov 26', oncology: 632, cardiovascular: 529, metabolic: 538, total: 1699 },
];

export const BASELINE_EMERGING_TRENDS: EmergingTrendItem[] = [
  {
    id: 'upf-crc-metabolic',
    topic: 'Alimenti ultra-processati (UPF), infiammazione sistemica e tumore del colon-retto precoce',
    domain: 'oncology',
    growthPctYoY: 42,
    monthlyPublications: 148,
    evidenceLevel: 'Umbrella Review & Coorti prospettiche (BMJ / Lancet)',
    summary:
      'Nuove meta-analisi su coorti europee e statunitensi confermano una correlazione dose-risposta tra elevata quota calorica da UPF (>30% kcal/die), disbiosi intestinale, insulino-resistenza e incidenza di neoplasie colorettali e cardiometaboliche.',
    protocolImpact:
      'Integrato nell’indice alimentare preventivo accanto al consumo di carni lavorate e fibre vegetali.',
    keyCitation: 'Lane MM et al. BMJ 2024;384:e077310 · PMID 38418082',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38418082/',
    readerBrief: {
      headlineIt: 'Perché i cibi ultra-processati (UPF) sono al centro della ricerca su intestino, cuore e tumori',
      plainSummary:
        'Gli alimenti ultra-processati (snack confezionati, piatti pronti industriali, bevande zuccherate, salumi ricostituiti) non pesano solo per le calorie: la ricerca più recente mostra che il loro consumo frequente altera il microbiota intestinale, favorisce l’infiammazione cronica di basso grado e si associa a un aumento di diabete, malattie cardiovascolari e tumore del colon-retto anche in età più giovane.',
      keyTakeaways: [
        'Una grande revisione pubblicata sul BMJ (quasi 10 milioni di partecipanti) ha collegato un alto consumo di UPF a +50% di mortalità cardiovascolare e +12% di rischio di diabete di tipo 2.',
        'Il meccanismo non è solo “zucchero e grassi”: emulsionanti, scarso contenuto di fibre e struttura industriale del cibo accelerano i picchi glicemici e irritano la barriera intestinale.',
        'Sostituire anche solo parte dei prodotti industriali con cibi freschi o minimamente lavorati (legumi, verdura, cereali integrali, pesce, frutta secca) riduce rapidamente l’esposizione.',
      ],
      practicalMeaning:
        'Su ClinicaPrev la frequenza di consumo di cibi ultra-processati è un parametro diretto della sezione alimentazione e incide sul profilo oncologico e metabolico.',
      studyLimits:
        'Gran parte delle prove deriva da grandi studi osservazionali: non tutti i cibi confezionati hanno lo stesso impatto (es. pane integrale semplice o yogurt naturale differiscono molto da snack dolci o carni ricostituite).',
      evidenceLevel: 'Umbrella Review & Grandi Coorti (BMJ / The Lancet)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'lpa-apob-score2',
    topic: 'Lipoproteina(a), ApoB e raffinamento della stratificazione ESC SCORE2',
    domain: 'cardiovascular',
    growthPctYoY: 36,
    monthlyPublications: 194,
    evidenceLevel: 'Linee Guida ESC / EAS & Coorte UK Biobank',
    summary:
      'La determinazione una tantum della Lipoproteina(a) e il calcolo del colesterolo non-HDL/ApoB riclassificano fino al 18% dei soggetti in fascia intermedia SCORE2, soprattutto in presenza di familiarità cardiovascolare precoce.',
    protocolImpact:
      'Il motore di calcolo utilizza il colesterolo non-HDL (come da SCORE2) e suggerisce il dosaggio di Lp(a) nei profili a rischio moderato-alto.',
    keyCitation: 'Kronenberg F et al. Eur Heart J 2022 · ESC Prevention Update · PMID 36036785',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36036785/',
    readerBrief: {
      headlineIt: 'Oltre il colesterolo classico: cos’è la Lipoproteina(a) e perché i cardiologi europei ne parlano sempre di più',
      plainSummary:
        'Molte persone scoprono un rischio cardiovascolare nonostante abbiano un colesterolo LDL “quasi normale”. Le nuove indicazioni della Società Europea dell’Aterosclerosi (EAS) e dell’ESC evidenziano il ruolo della Lipoproteina(a) — una particella ereditaria simile all’LDL — e del colesterolo non-HDL/ApoB per individuare rischi nascosti.',
      keyTakeaways: [
        'La Lipoproteina(a) è determinata per oltre l’80% dalla genetica: le linee guida europee raccomandano di dosarla almeno una volta nella vita con un semplice esame del sangue.',
        'Valutarla insieme ad ApoB o colesterolo non-HDL migliora la classificazione del rischio fino al 18% nelle persone in fascia intermedia SCORE2.',
        'Se la Lp(a) risulta alta, diventa ancora più utile ottimizzare gli altri fattori modificabili (pressione arteriosa, LDL, fumo, movimento) con il proprio medico.',
      ],
      practicalMeaning:
        'ClinicaPrev utilizza già il colesterolo non-HDL (come previsto da ESC SCORE2) e, nei profili intermedi o con familiarità cardiovascolare precoce, segnala la Lp(a) come argomento utile da discutere col medico.',
      studyLimits:
        'I farmaci specifici per abbassare direttamente la Lp(a) sono ancora in fase avanzata di sperimentazione clinica; oggi la gestione si concentra sul controllo rigoroso di tutti gli altri fattori di rischio.',
      evidenceLevel: 'Consensus ESC / EAS & Coorte UK Biobank',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'glp1-cardiometabolic-prevention',
    topic: 'Terapie incretiniche (GLP-1/GIP) e prevenzione combinata cardiovascolare e metabolica',
    domain: 'metabolic',
    growthPctYoY: 54,
    monthlyPublications: 263,
    evidenceLevel: 'Trial Clinici Randomizzati (SELECT, FLOW, SURMOUNT)',
    summary:
      'Oltre al controllo glicemico, gli studi di outcome mostrano una riduzione del 20% degli eventi MACE nei pazienti con obesità e rischio CV elevato, mentre l’intervento intensivo sullo stile di vita resta la prima linea nella popolazione generale.',
    protocolImpact:
      'Evidenziato nella guida clinica per i profili con BMI ≥30 e FINDRISC ≥15 da discutere esclusivamente con lo specialista.',
    keyCitation: 'Lincoff AM et al. N Engl J Med 2023 (SELECT Trial) · PMID 37952131',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37952131/',
    readerBrief: {
      headlineIt: 'Nuove evidenze su obesità viscerale, metabolismo e protezione del cuore (Trial SELECT)',
      plainSummary:
        'Gli studi clinici più citati degli ultimi anni hanno dimostrato che ridurre in modo significativo l’eccesso di grasso viscerale protegge direttamente il cuore, anche in chi non ha il diabete. Queste scoperte confermano quanto il tessuto adiposo addominale sia un organo metabolicamente attivo che alimenta l’infiammazione vascolare.',
      keyTakeaways: [
        'Nello studio SELECT (oltre 17.600 pazienti ad alto rischio con sovrappeso/obesità e precedente malattia CV), il trattamento medico mirato ha ridotto del 20% infarti, ictus e mortalità cardiovascolare.',
        'Per la popolazione generale senza malattia cardiovascolare pregressa, dieta mediterranea, riduzione del girovita ed esercizio fisico restano sempre la prima scelta sicura e sostenibile.',
        'Per chi ha obesità importante (BMI ≥30) e alto rischio metabolico, oggi il medico specialista dispone di strumenti terapeutici affiancabili allo stile di vita.',
      ],
      practicalMeaning:
        'Su ClinicaPrev questo filone conferma l’importanza di monitorare insieme BMI e circonferenza vita: ridurre il grasso addominale migliora contemporaneamente cuore, diabete e prevenzione oncologica.',
      studyLimits:
        'I trial citati riguardano pazienti selezionati ad alto rischio seguiti da specialisti: qualunque valutazione farmacologica spetta esclusivamente al medico curante o allo specialista.',
      evidenceLevel: 'Trial Clinici Randomizzati di Fase 3 (NEJM)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'alcohol-zero-threshold',
    topic: 'Assenza di soglia sicura per l’alcol nella carcinogenesi (Dichiarazione OMS Europa)',
    domain: 'oncology',
    growthPctYoY: 29,
    monthlyPublications: 112,
    evidenceLevel: 'Consensus WHO / IARC (The Lancet Public Health)',
    summary:
      'Le revisioni epidemiologiche confermano che anche consumi lievi-moderati (<1,5 litri di vino/settimana) contribuiscono al rischio attribuibile di tumore della mammella e del tratto gastrointestinale.',
    protocolImpact:
      'Soglia ottimale WCRF/OMS fissata a 0 unità/settimana con penalità progressiva nel calcolo del rischio oncologico.',
    keyCitation: 'Anderson BO et al. Lancet Public Health 2023;8(1):e6-e7 · PMID 36603913',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36603913/',
    readerBrief: {
      headlineIt: 'Alcol e prevenzione oncologica: perché l’OMS oggi dice che “meno è sempre meglio”',
      plainSummary:
        'Per decenni si è diffusa l’idea che un bicchiere al giorno fosse protettivo. Le revisioni epidemiologiche recenti di OMS Europa e IARC chiariscono che, per quanto riguarda i tumori, l’etanolo è un cancerogeno di Gruppo 1 e non esiste una quantità “completamente priva di rischio”: il rischio cresce progressivamente a partire dalla prima unità alcolica.',
      keyTakeaways: [
        'In Europa circa metà dei tumori attribuibili all’alcol si verifica in persone con consumi considerati “lievi o moderati” (meno di 1,5 litri di vino o 3,5 litri di birra a settimana).',
        'I legami più forti riguardano tumore della mammella, colon-retto, fegato, esofago e cavo orale, indipendentemente dal tipo di bevanda (vino, birra o superalcolici).',
        'Non serve l’approccio “tutto o niente” per avere benefici: ogni riduzione delle unità settimanali abbassa subito il rischio cumulativo.',
      ],
      practicalMeaning:
        'Su ClinicaPrev il target ottimale oncologico è fissato a 0 unità alcoliche/settimana; nel simulatore “Cosa succede se...” puoi vedere quanto scende il rischio riducendo o azzerando l’alcol.',
      studyLimits:
        'L’effetto biologico si somma fortemente al fumo di sigaretta (effetto moltiplicativo su bocca, gola ed esofago): smettere di fumare resta la priorità assoluta.',
      evidenceLevel: 'Dichiarazione Ufficiale OMS Europa & IARC (The Lancet Public Health)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'resistance-training-longevity',
    topic: 'Esercizio contro resistenza, sarcopenia e riduzione della mortalità oncologica e diabetica',
    domain: 'metabolic',
    growthPctYoY: 31,
    monthlyPublications: 129,
    evidenceLevel: 'Meta-analisi Prospettiche (Br J Sports Med)',
    summary:
      'Combinare 30–60 minuti settimanali di rinforzo muscolare con l’attività aerobica produce una riduzione aggiuntiva del 15–20% del rischio di diabete di tipo 2 e mortalità cardiovascolare rispetto alla sola attività aerobica.',
    protocolImpact:
      'Raccomandazione di 2 sessioni settimanali di forza integrata nella Guida ai Risultati.',
    keyCitation: 'Momma H et al. Br J Sports Med 2022;56(13):755-763 · PMID 35228201',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35228201/',
    readerBrief: {
      headlineIt: 'Perché bastano 30–60 minuti a settimana di esercizi di forza per allungare la salute',
      plainSummary:
        'Camminare, correre o andare in bici fa benissimo, ma aggiungere due brevi sessioni a settimana di esercizi per i muscoli (pesi leggeri, elastici o corpo libero) produce un beneficio extra che l’attività aerobica da sola non raggiunge: il muscolo attivo migliora la sensibilità all’insulina e contrasta la perdita di massa muscolare legata all’età.',
      keyTakeaways: [
        'Una meta-analisi sul British Journal of Sports Medicine associa gli esercizi di forza a una riduzione del 10–17% di mortalità globale, malattie cardiovascolari, tumori totali e diabete di tipo 2.',
        'Il massimo beneficio si osserva già tra 30 e 60 minuti complessivi a settimana (es. 2 sedute da 20–30 minuti), senza bisogno di allenamenti estremi.',
        'Combinare forza + attività aerobica porta il calo del rischio di mortalità fino al 40% rispetto alla sedentarietà.',
      ],
      practicalMeaning:
        'Nel modulo di valutazione di ClinicaPrev la tipologia “Combinata (aerobico + forza)” riceve il massimo fattore protettivo rispetto a una sola modalità.',
      studyLimits:
        'Gli studi inclusi sono in prevalenza coorti prospettiche auto-riferite; l’intensità va sempre adattata all’età e alla condizione articolare individuale.',
      evidenceLevel: 'Meta-analisi di 16 Studi Prospettici (Br J Sports Med)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
];

export const BASELINE_PUBLICATIONS: AcademicPublication[] = [
  {
    id: 'pub-38418082',
    title: 'Ultra-processed food exposure and adverse health outcomes: umbrella review of epidemiological meta-analyses',
    authors: 'Lane MM, Gamage E, Du S, Ashtree DN, McGuinness AJ, et al.',
    journal: 'BMJ',
    publishedDate: '2024-02',
    database: 'PubMed',
    domain: 'metabolic',
    pmid: '38418082',
    url: 'https://pubmed.ncbi.nlm.nih.gov/38418082/',
    keyFinding:
      'Associazioni convincenti tra elevato consumo di alimenti ultra-processati, mortalità cardiovascolare (+50%), diabete di tipo 2 (+12% per incremento) e obesità.',
    clinicalRelevance: 'Giustifica l’inserimento della frequenza UPF come variabile autonoma nel profilo alimentare.',
    readerBrief: {
      headlineIt: 'Cibi ultra-processati e salute: la più ampia sintesi scientifica pubblicata sul BMJ',
      plainSummary:
        'Questo lavoro è una “umbrella review” (una revisione di tutte le meta-analisi esistenti) che ha esaminato i dati di quasi 10 milioni di persone. I ricercatori hanno scoperto che un’alimentazione ricca di prodotti industriali ultra-processati si associa in modo coerente a 32 diversi esiti negativi per la salute, soprattutto a carico di cuore e metabolismo.',
      keyTakeaways: [
        'Evidenza convincente: +50% di rischio di morte per cause cardiovascolari nei grandi consumatori rispetto a chi li consuma raramente.',
        'Evidenza dose-risposta: ogni aumento del 10% di calorie da cibi ultra-processati si associa a un +12% di rischio di diabete di tipo 2.',
        'Aumento rilevante anche di sovrappeso, disturbi del sonno e sindrome metabolica.',
      ],
      practicalMeaning:
        'Sostituire merendine, bibite zuccherate, snack confezionati e piatti pronti con alimenti freschi o semplici (frutta, verdura, legumi, cereali integrali) è una delle leve più efficaci nel profilo alimentare di ClinicaPrev.',
      studyLimits:
        'Si basa su studi osservazionali: dimostra un’associazione molto forte e coerente, ma non può separare completamente l’effetto di ogni singolo additivo dalla qualità nutrizionale complessiva.',
      evidenceLevel: 'Umbrella Review di Meta-analisi · BMJ (9,8 milioni di partecipanti)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'pub-34120177',
    title: 'SCORE2 risk prediction algorithms: new models to estimate 10-year risk of cardiovascular disease in Europe',
    authors: 'SCORE2 working group and ESC Cardiovascular risk collaboration',
    journal: 'European Heart Journal',
    publishedDate: '2021-07',
    database: 'PubMed',
    domain: 'cardiovascular',
    pmid: '34120177',
    url: 'https://pubmed.ncbi.nlm.nih.gov/34120177/',
    keyFinding:
      'Nuovi algoritmi calibrati per quattro regioni europee di rischio con colesterolo non-HDL e soglie di trattamento stratificate per età.',
    clinicalRelevance: 'Protocollo cardine utilizzato per la stima cardiovascolare a 10 anni in ClinicaPrev.',
    readerBrief: {
      headlineIt: 'Lo studio ufficiale dietro ESC SCORE2: come prevedere infarto e ictus a 10 anni in Europa',
      plainSummary:
        'Pubblicato sull’European Heart Journal, questo studio ha creato il nuovo standard europeo per calcolare il rischio cardiovascolare tra i 40 e i 69 anni. Rispetto al vecchio SCORE, stima sia gli eventi fatali sia infarti e ictus non fatali e suddivide l’Europa in 4 aree geografiche per evitare sovrastime o sottostime.',
      keyTakeaways: [
        'Addestrato su 677.684 persone senza precedenti eventi CV in 45 coorti e testato su oltre 1,1 milioni di europei.',
        'L’Italia appartiene alla fascia europea a basso rischio cardiovascolare di base, grazie anche alla minore incidenza media rispetto all’Est Europa.',
        'Introduce il colesterolo non-HDL (totale meno HDL) come indicatore lipidico principale, più accurato del solo colesterolo totale.',
      ],
      practicalMeaning:
        'È esattamente il modello di riferimento usato da ClinicaPrev per calcolare la tua percentuale di rischio cardiovascolare a 10 anni.',
      studyLimits:
        'Applicabile a persone senza malattie cardiovascolari già note né diabete conclamato; per gli over 70 si utilizza l’estensione dedicata SCORE2-OP.',
      evidenceLevel: 'Studio Fondativo di Linea Guida · European Heart Journal',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'pub-37952131',
    title: 'Semaglutide and Cardiovascular Outcomes in Obesity without Diabetes (SELECT Trial)',
    authors: 'Lincoff AM, Brown-Frandsen K, Colhoun HM, Deanfield J, et al.',
    journal: 'New England Journal of Medicine',
    publishedDate: '2023-12',
    database: 'PubMed',
    domain: 'cardiovascular',
    pmid: '37952131',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37952131/',
    keyFinding:
      'Riduzione del 20% dell’endpoint composito cardiovascolare in adulti con sovrappeso/obesità e patologia cardiovascolare pregressa senza diabete.',
    clinicalRelevance: 'Conferma il ruolo causale dell’adiposità viscerale nella patogenesi cardiovascolare.',
    readerBrief: {
      headlineIt: 'Studio SELECT (NEJM): ridurre l’obesità riduce del 20% gli eventi cardiaci anche senza diabete',
      plainSummary:
        'Questo grande studio clinico internazionale su 17.604 adulti con sovrappeso o obesità e precedente patologia cardiovascolare (ma senza diabete) ha dimostrato per la prima volta in modo rigoroso che intervenire sull’adiposità porta a una protezione diretta del cuore.',
      keyTakeaways: [
        'Riduzione del 20% dell’esito combinato di morte cardiovascolare, infarto non fatale o ictus non fatale in un follow-up medio di oltre 3 anni.',
        'I benefici sono apparsi precocemente, suggerendo un effetto positivo sia sul peso sia su infiammazione, pressione arteriosa e profilo lipidico.',
        'Conferma che l’eccesso di peso viscerale è un fattore di rischio cardiovascolare diretto e non solo un problema estetico.',
      ],
      practicalMeaning:
        'Rafforza il valore della gestione del peso corporeo e del girovita (BMI e circonferenza vita) nella valutazione combinata di ClinicaPrev.',
      studyLimits:
        'Lo studio riguardava pazienti con malattia cardiovascolare già accertata (prevenzione secondaria): nella popolazione sana la base resta sempre lo stile di vita, e qualsiasi terapia va valutata solo dal medico.',
      evidenceLevel: 'Trial Clinico Randomizzato in Doppio Cieco · NEJM (17.604 pazienti)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'pub-36603913',
    title: 'Health and cancer risks associated with low levels of alcohol consumption',
    authors: 'Anderson BO, Berdzuli N, Ilbawi A, Kestel D, Kluge HP, et al. (WHO Europe)',
    journal: 'The Lancet Public Health',
    publishedDate: '2023-01',
    database: 'Google Scholar',
    domain: 'oncology',
    pmid: '36603913',
    url: 'https://pubmed.ncbi.nlm.nih.gov/36603913/',
    keyFinding:
      'Non esiste una soglia di consumo alcolico priva di rischio oncologico; metà dei tumori alcol-attribuibili in Europa deriva da consumi lievi o moderati.',
    clinicalRelevance: 'Fonda la soglia preventiva di 0 unità/settimana nel modello oncologico.',
    readerBrief: {
      headlineIt: 'OMS Europa su The Lancet: nessun livello di alcol è privo di rischio per i tumori',
      plainSummary:
        'In questa presa di posizione pubblicata su The Lancet Public Health, gli esperti dell’Organizzazione Mondiale della Sanità per l’Europa fanno chiarezza sul consumo moderato di alcol: l’etanolo danneggia il DNA già a basse dosi e aumenta il rischio di almeno sette tipi di tumore.',
      keyTakeaways: [
        'Circa il 50% dei tumori legati all’alcol in Europa riguarda persone che bevono in modo “moderato” (meno di 1,5 litri di vino a settimana).',
        'Nelle donne, il tumore della mammella è la principale neoplasia legata a consumi bassi o moderati di alcol.',
        'Non esistono evidenze solide che eventuali effetti cardiovascolari del vino superino il rischio oncologico complessivo.',
      ],
      practicalMeaning:
        'Su ClinicaPrev ridurre le unità alcoliche settimanali verso lo zero è una delle modifiche che migliora più chiaramente il profilo oncologico preventivo.',
      studyLimits:
        'È un documento di sintesi e politica sanitaria basato sulle meta-analisi IARC/OMS; il rischio individuale assoluto dipende anche da età, sesso, fumo e altri fattori.',
      evidenceLevel: 'Dichiarazione di Consenso OMS Europa · The Lancet Public Health',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'pub-31295900',
    title: 'Operationalizing the 2018 World Cancer Research Fund/American Institute for Cancer Research Cancer Prevention Recommendations',
    authors: 'Shams-White MM, Brockton NT, Mitrou P, Romaguera D, Brown S, et al.',
    journal: 'Nutrients',
    publishedDate: '2019-07',
    database: 'PubMed',
    domain: 'oncology',
    pmid: '31295900',
    url: 'https://pubmed.ncbi.nlm.nih.gov/31295900/',
    keyFinding:
      'Standardizzazione dello score WCRF/AICR (0–7 punti) su peso corporeo, attività fisica, dieta vegetale, carni rosse/lavorate, bevande zuccherate e alcol.',
    clinicalRelevance: 'Base metodologica dello score di aderenza oncologica mostrato nella dashboard.',
    readerBrief: {
      headlineIt: 'Come nasce il punteggio 0–7 di prevenzione oncologica (WCRF/AICR)',
      plainSummary:
        'I ricercatori del National Cancer Institute (USA) e del World Cancer Research Fund hanno creato uno score standardizzato (da 0 a 7 punti) per misurare in modo oggettivo quanto le abitudini quotidiane di una persona rispecchino le raccomandazioni internazionali contro i tumori.',
      keyTakeaways: [
        'Valuta 7 pilastri concreti: peso/girovita, attività fisica, alimenti ricchi di fibre e vegetali, cibi ultra-processati, carni rosse e lavorate, bevande zuccherate e alcol.',
        'Ogni abitudine ottiene 0 (non aderente), 0,5 (parzialmente aderente) o 1 punto (pienamente aderente).',
        'Negli studi di validazione successivi, punteggi più alti sono associati a minore incidenza di tumori del colon-retto, mammella, polmone e a minore mortalità complessiva.',
      ],
      practicalMeaning:
        'È il punteggio “Aderenza WCRF/AICR (0–7)” che trovi direttamente nella scheda Oncologia Preventiva della tua Dashboard.',
      studyLimits:
        'Lo score nasce per misurare dieta e stile di vita e non include di per sé fumo, esposizione solare o genetica — fattori che ClinicaPrev integra a parte secondo IARC e AIRC.',
      evidenceLevel: 'Metodologia Standardizzata Internazionale · NCI / WCRF',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'pub-35228201',
    title: 'Muscle-strengthening activities are associated with lower risk and mortality in major non-communicable diseases',
    authors: 'Momma H, Kawakami R, Honda T, Sawada SS',
    journal: 'British Journal of Sports Medicine',
    publishedDate: '2022-07',
    database: 'Google Scholar',
    domain: 'metabolic',
    pmid: '35228201',
    url: 'https://pubmed.ncbi.nlm.nih.gov/35228201/',
    keyFinding:
      'L’attività di rinforzo muscolare riduce del 10–17% il rischio di mortalità per tutte le cause, CVD, tumori totali e diabete di tipo 2; l’effetto massimo si ottiene combinandola con l’aerobica.',
    clinicalRelevance: 'Fonda il peso premiante per la tipologia di allenamento combinata (aerobica + forza).',
    readerBrief: {
      headlineIt: 'Rinforzo muscolare e longevità: −10% / −17% di rischio per cuore, diabete e tumori',
      plainSummary:
        'Questa revisione sistematica con meta-analisi pubblicata sul British Journal of Sports Medicine ha riunito 16 grandi studi condotti su centinaia di migliaia di adulti per capire quanto contano gli esercizi di forza (pesi, corpo libero, bande elastiche) indipendentemente dall’attività aerobica.',
      keyTakeaways: [
        'Chi pratica esercizi di rinforzo muscolare mostra una riduzione del 10–17% di mortalità per tutte le cause, malattie cardiovascolari, tumori totali e diabete di tipo 2.',
        'La dose con il massimo beneficio è sorprendentemente accessibile: circa 30–60 minuti a settimana in totale.',
        'Abbinare forza e movimento aerobico (camminata veloce, corsa, bici, nuoto) produce la protezione più alta in assoluto.',
      ],
      practicalMeaning:
        'Ecco perché in ClinicaPrev chiediamo anche il tipo di allenamento: aggiungere 2 brevi sessioni di forza alla settimana migliora tutti e tre i profili di rischio.',
      studyLimits:
        'Oltre i 130–140 minuti a settimana di sola forza molto intensa i dati sugli esiti di mortalità erano meno numerosi e più incerti; la costanza moderata resta l’obiettivo ideale.',
      evidenceLevel: 'Revisione Sistematica & Meta-analisi (16 coorti) · BJSM',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'pub-37555441',
    title: 'The association between daily step count and all-cause and cardiovascular mortality: a meta-analysis',
    authors: 'Banach M, Lewek J, Surma S, Penson PE, Sahebkar A, et al.',
    journal: 'European Journal of Preventive Cardiology',
    publishedDate: '2023-08',
    database: 'PubMed',
    domain: 'cardiovascular',
    pmid: '37555441',
    url: 'https://pubmed.ncbi.nlm.nih.gov/37555441/',
    keyFinding:
      'Meta-analisi su 226.889 persone: ogni incremento di 1.000 passi/giorno riduce la mortalità per tutte le cause del 15%, e ogni +500 passi riduce la mortalità cardiovascolare del 7%.',
    clinicalRelevance: 'Giustifica l’integrazione diretta dei passi medi giornalieri nel calcolatore clinico.',
    readerBrief: {
      headlineIt: 'Quanti passi al giorno servono davvero? La risposta di una meta-analisi su 226.889 persone',
      plainSummary:
        'Per anni si è parlato del mito dei “10.000 passi”. Questa grande meta-analisi europea pubblicata sull’European Journal of Preventive Cardiology dimostra che i benefici per il cuore e la longevità iniziano molto prima — già sotto i 4.000 passi — e continuano a crescere con ogni migliaio di passi in più.',
      keyTakeaways: [
        'Ogni +1.000 passi al giorno in più si associa a una riduzione del 15% della mortalità per tutte le cause.',
        'Ogni +500 passi al giorno in più si associa a una riduzione del 7% della mortalità cardiovascolare.',
        'I benefici sono significativi già intorno ai 3.900–4.000 passi/giorno, ma puntare a 7.000–8.000+ passi offre una protezione ancora più ampia a qualsiasi età.',
      ],
      practicalMeaning:
        'Su ClinicaPrev puoi inserire i tuoi passi medi giornalieri (da telefono o smartwatch): anche senza palestra, aumentare le camminate quotidiane migliora sensibilmente il profilo preventivo.',
      studyLimits:
        'Gli studi inclusi sono osservazionali (persone già più sane tendono anche a camminare di più), sebbene le analisi abbiano corretto per età e malattie preesistenti.',
      evidenceLevel: 'Meta-analisi di 17 Coorti (226.889 partecipanti) · EJPC',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'pub-airc-prevenzione',
    title: 'Prevenzione oncologica: alimentazione mediterranea, attività fisica combinata, alcol e fumo',
    authors: 'Comitato Tecnico-Scientifico Fondazione AIRC',
    journal: 'Fondazione AIRC per la Ricerca sul Cancro',
    publishedDate: '2025-11',
    database: 'AIRC',
    domain: 'oncology',
    url: 'https://www.airc.it/cancro/prevenzione-tumore',
    keyFinding:
      'Fino al 40% dei tumori può essere prevenuto intervenendo su fumo, sedentarietà, eccesso ponderale, dieta povera di fibre/ricca di carni lavorate, alcol ed esposizione UV non protetta.',
    clinicalRelevance: 'Fonte istituzionale italiana integrata nei criteri preventivi e negli screening SSN.',
    readerBrief: {
      headlineIt: 'Guida AIRC alla prevenzione dei tumori: le regole pratiche con più prove scientifiche',
      plainSummary:
        'La guida divulgativa della Fondazione AIRC per la Ricerca sul Cancro sintetizza per i cittadini italiani ciò che la ricerca oncologica ha dimostrato con maggiore solidità: intervenire su abitudini quotidiane e aderire agli screening gratuiti del Servizio Sanitario Nazionale è la strategia più efficace contro i tumori.',
      keyTakeaways: [
        'Non fumare resta la singola scelta più potente: il tabacco è responsabile di circa un terzo delle morti oncologiche prevenibili.',
        'Alimentazione ricca di fibre (verdure, frutta, legumi, cereali integrali), pochi salumi/carni rosse, peso sano e alcol al minimo riducono il rischio di molti tumori comuni.',
        'Proteggersi dal sole (prevenzione melanoma) e partecipare agli screening SSN per età completano la prevenzione.',
      ],
      practicalMeaning:
        'È una delle fonti principali su cui sono calibrati i consigli pratici e i promemoria screening nella Dashboard di ClinicaPrev.',
      studyLimits:
        'Ha finalità educativa per la popolazione generale e non sostituisce visite specialistiche o programmi di sorveglianza personalizzati in caso di familiarità oncologica.',
      evidenceLevel: 'Guida Divulgativa Validata · Fondazione AIRC (Italia)',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
  {
    id: 'pub-airc-movimento',
    title: 'Attività fisica e riduzione del rischio di tumore del colon-retto, della mammella e dell’endometrio',
    authors: 'Fondazione AIRC — Approfondimenti Scientifici',
    journal: 'Fondazione AIRC per la Ricerca sul Cancro',
    publishedDate: '2025-09',
    database: 'AIRC',
    domain: 'oncology',
    url: 'https://www.airc.it/cancro/prevenzione-tumore/attivita-fisica',
    keyFinding:
      'L’esercizio regolare modula insulina, IGF-1, infiammazione cronica e tempi di transito intestinale; combinare movimento aerobico, forza e passi quotidiani massimizza la protezione.',
    clinicalRelevance: 'Supporta la differenziazione tra tipologie di allenamento e passi giornalieri.',
    readerBrief: {
      headlineIt: 'Come il movimento protegge dai tumori (spiegato semplice da Fondazione AIRC)',
      plainSummary:
        'Perché muoversi riduce il rischio di sviluppare un tumore? L’approfondimento di Fondazione AIRC spiega i meccanismi biologici reali: l’attività fisica regolare abbassa i livelli di insulina e infiammazione nel sangue, regola gli ormoni sessuali, rafforza il sistema immunitario e riduce il tempo di contatto tra sostanze irritanti e parete dell’intestino.',
      keyTakeaways: [
        'Le prove più forti riguardano la riduzione del rischio di tumore del colon-retto (fino al 20–25% in meno nei più attivi), della mammella e dell’endometrio.',
        'Il beneficio vale anche indipendentemente dal dimagrimento: muoversi fa bene anche se il peso sulla bilancia resta stabile.',
        'Spezzare le lunghe ore seduti alla scrivania o sul divano con brevi pause attive potenzia ulteriormente l’effetto protettivo.',
      ],
      practicalMeaning:
        'Spiega perché su ClinicaPrev consideriamo separatamente allenamenti settimanali, passi giornalieri e ore sedentarie al giorno.',
      studyLimits:
        'L’intensità dell’esercizio va sempre adeguata all’età e allo stato di salute; in presenza di patologie croniche o dopo interventi conviene concordare il programma col medico.',
      evidenceLevel: 'Approfondimento Scientifico · Fondazione AIRC',
      readingTimeMinutes: 2,
      generatedBy: 'curated',
    },
  },
];
