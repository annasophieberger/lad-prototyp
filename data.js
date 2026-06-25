// ─────────────────────────────────────────────────────────────
// data.js — Beispieldaten für den LAD-Prototyp
// Alle Werte sind hartcodiert und können hier direkt angepasst
// werden. Nach Änderungen index.html im Browser neu laden.
// ─────────────────────────────────────────────────────────────

// ── SCHÜLER:IN ────────────────────────────────────────────────
const schueler = {
  name: "Lena",
  klasse: "11b",
  schule: "BRG Wien 8"
};

// ── AKTIVES ZIEL ──────────────────────────────────────────────
// Zum Testen zwischen Leistungsziel und Zeitziel wechseln:
// Aktuell aktiv: Leistungsziel

const aktivesZiel = {
  typ: null,
  thema: null,
  themaName: null,
  ausgewaehlteModule: [],
  enddatum: null,
  zielStartdatum: null,
  konzepteProWoche: 0,
  verlauf: [{ datum: "2026-06-29", konzepte: 4 }]
};

const startKonzepte = aktivesZiel.verlauf.length > 0 ? aktivesZiel.verlauf[0].konzepte : 0;

// Zeitziel (zum Testen: obiges Objekt ersetzen)
// const aktivesZiel = {
//   typ: "zeit",
//   thema: "FA",
//   themaName: "Funktionale Abhängigkeiten",
//   tage: ["Mo", "Mi", "Fr"],
//   minuten: 20,
//   enddatum: "30. Juni 2026"
// };

// ── THEMENFORTSCHRITT ─────────────────────────────────────────
// verlauf: Fortschritt in % zu 5 Messzeitpunkten (Sep → Mai)
const themen = [
  {
    id: "AG",
    name: "Algebra und Geometrie",
    fortschritt: 74,
    module: [
      // AG-1 Grundlagen der Algebra
      { id: "AG-1-1", name: "Terme und Termumformungen",                       gemeistert: true,  aufgaben: 14, geschafft: 14 },
      { id: "AG-1-2", name: "Lineare Gleichungen und Ungleichungen",           gemeistert: true,  aufgaben: 13, geschafft: 13 },
      { id: "AG-1-3", name: "Lineare Gleichungssysteme",                       gemeistert: true,  aufgaben: 15, geschafft: 15 },
      { id: "AG-1-4", name: "Quadratische Gleichungen",                        gemeistert: true,  aufgaben: 18, geschafft: 18 },
      { id: "AG-1-5", name: "Höhergradige Gleichungen und Wurzelgleichungen",  gemeistert: true,  aufgaben: 19, geschafft: 19 },
      { id: "AG-1-6", name: "Betragsgleichungen und -ungleichungen",           gemeistert: true,  aufgaben: 17, geschafft: 17 },
      // AG-2 Geometrie und Trigonometrie
      { id: "AG-2-1", name: "Wiederholung: Satzgruppe des Pythagoras",         gemeistert: true,  aufgaben: 12, geschafft: 12 },
      { id: "AG-2-2", name: "Trigonometrie im rechtwinkligen Dreieck",         gemeistert: true,  aufgaben: 18, geschafft: 18 },
      { id: "AG-2-3", name: "Sinussatz und Kosinussatz",                       gemeistert: true,  aufgaben: 19, geschafft: 19 },
      { id: "AG-2-4", name: "Flächenberechnungen ebener Figuren",              gemeistert: true,  aufgaben: 14, geschafft: 14 },
      { id: "AG-2-5", name: "Körperberechnungen (Volumen, Oberfläche)",        gemeistert: false, aufgaben: 18, geschafft: 11 },
      // AG-3 Vektorrechnung
      { id: "AG-3-1", name: "Vektoren und Vektoroperationen",                  gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "AG-3-2", name: "Linearkombination und lineare Unabhängigkeit",    gemeistert: true,  aufgaben: 18, geschafft: 18 },
      { id: "AG-3-3", name: "Skalarprodukt und Winkel zwischen Vektoren",      gemeistert: true,  aufgaben: 19, geschafft: 19 },
      { id: "AG-3-4", name: "Geraden und Ebenen im Raum",                      gemeistert: false, aufgaben: 24, geschafft:  8 },
      { id: "AG-3-5", name: "Lagebeziehungen und Schnittmengen",               gemeistert: false, aufgaben: 23, geschafft:  0 },
      // AG-4 Komplexe Zahlen
      { id: "AG-4-1", name: "Einführung komplexer Zahlen",                     gemeistert: false, aufgaben: 17, geschafft:  0 },
      { id: "AG-4-2", name: "Grundrechenarten mit komplexen Zahlen",           gemeistert: false, aufgaben: 18, geschafft:  0 },
      { id: "AG-4-3", name: "Polardarstellung und Moivrescher Satz",           gemeistert: false, aufgaben: 25, geschafft:  0 }
    ],
    verlauf: {
      labels: ["Sep", "Nov", "Jan", "Mär", "Mai"],
      werte:  [45,    52,    48,    62,    74   ]
    },
    verlaufMonat: {
      labels: ["KW 20", "KW 21", "KW 22", "KW 23"],
      werte:  [70,      72,      71,      74     ]
    }
  },
  {
    id: "FA",
    name: "Funktionale Abhängigkeiten",
    fortschritt: 48,
    module: [
      // FA-1 Funktionsbegriff und Grundlagen
      { id: "FA-1-1", name: "Funktionsbegriff, Definitions- und Wertebereich", gemeistert: true,  aufgaben: 14, geschafft: 14 },
      { id: "FA-1-2", name: "Darstellungsformen (Graph, Tabelle, Term)",        gemeistert: true,  aufgaben: 13, geschafft: 13 },
      { id: "FA-1-3", name: "Umkehrfunktion",                                   gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "FA-1-4", name: "Verkettung von Funktionen",                        gemeistert: true,  aufgaben: 18, geschafft: 18 },
      // FA-2 Lineare und quadratische Funktionen
      { id: "FA-2-1", name: "Lineare Funktionen und ihre Eigenschaften",        gemeistert: true,  aufgaben: 14, geschafft: 14 },
      { id: "FA-2-2", name: "Lineare Modellierung und Anwendungen",             gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "FA-2-3", name: "Quadratische Funktionen (Scheitelpunkt)",          gemeistert: true,  aufgaben: 19, geschafft: 19 },
      { id: "FA-2-4", name: "Quadratische Modellierung und Anwendungen",        gemeistert: false, aufgaben: 19, geschafft: 11 },
      // FA-3 Potenz- und Wurzelfunktionen
      { id: "FA-3-1", name: "Potenzfunktionen (ganzzahlige Exponenten)",        gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "FA-3-2", name: "Wurzelfunktionen",                                 gemeistert: false, aufgaben: 18, geschafft:  9 },
      { id: "FA-3-3", name: "Potenzfunktionen mit rationalen Exponenten",       gemeistert: false, aufgaben: 19, geschafft:  3 },
      // FA-4 Exponential- und Logarithmusfunktionen
      { id: "FA-4-1", name: "Exponentialfunktionen und ihre Eigenschaften",     gemeistert: false, aufgaben: 20, geschafft: 12 },
      { id: "FA-4-2", name: "Wachstums- und Zerfallsprozesse",                  gemeistert: false, aufgaben: 20, geschafft:  9 },
      { id: "FA-4-3", name: "Logarithmusfunktionen (ln, log)",                  gemeistert: false, aufgaben: 19, geschafft:  5 },
      { id: "FA-4-4", name: "Logarithmusgesetze und Umformungen",               gemeistert: false, aufgaben: 18, geschafft:  0 },
      { id: "FA-4-5", name: "Anwendungen (Zinseszins, Halbwertszeit)",          gemeistert: false, aufgaben: 22, geschafft:  0 },
      // FA-5 Trigonometrische Funktionen
      { id: "FA-5-1", name: "Sinusfunktion und Kosinusfunktion",                gemeistert: false, aufgaben: 20, geschafft:  5 },
      { id: "FA-5-2", name: "Tangensfunktion",                                  gemeistert: false, aufgaben: 18, geschafft:  0 },
      { id: "FA-5-3", name: "Periodizität und Amplitude",                       gemeistert: false, aufgaben: 19, geschafft:  0 },
      { id: "FA-5-4", name: "Modellierung periodischer Vorgänge",               gemeistert: false, aufgaben: 23, geschafft:  0 },
      // FA-6 Weitere Funktionenklassen
      { id: "FA-6-1", name: "Betragsfunktion",                                  gemeistert: false, aufgaben: 16, geschafft:  0 },
      { id: "FA-6-2", name: "Stückweise definierte Funktionen",                 gemeistert: false, aufgaben: 18, geschafft:  0 },
      { id: "FA-6-3", name: "Rationale Funktionen (Grundlagen)",                gemeistert: false, aufgaben: 22, geschafft:  0 }
    ],
    verlauf: {
      labels: ["Sep", "Nov", "Jan", "Mär", "Mai"],
      werte:  [30,    35,    32,    40,    48   ]
    },
    verlaufMonat: {
      labels: ["KW 20", "KW 21", "KW 22", "KW 23"],
      werte:  [43,      45,      46,      48     ]
    }
  },
  {
    id: "AN",
    name: "Analysis",
    fortschritt: 62,
    module: [
      // AN-1 Grenzwerte und Stetigkeit
      { id: "AN-1-1", name: "Folgen und Grenzwerte",                             gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "AN-1-2", name: "Grenzwert einer Funktion",                          gemeistert: true,  aufgaben: 18, geschafft: 18 },
      { id: "AN-1-3", name: "Stetigkeit von Funktionen",                         gemeistert: true,  aufgaben: 16, geschafft: 16 },
      // AN-2 Differentialrechnung
      { id: "AN-2-1", name: "Einführung: Ableitung als Steigung",                gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "AN-2-2", name: "Ableitungsregeln (Potenz-, Faktor-, Summenregel)",  gemeistert: true,  aufgaben: 20, geschafft: 20 },
      { id: "AN-2-3", name: "Produktregel und Quotientenregel",                  gemeistert: true,  aufgaben: 19, geschafft: 19 },
      { id: "AN-2-4", name: "Kettenregel",                                       gemeistert: true,  aufgaben: 20, geschafft: 20 },
      { id: "AN-2-5", name: "Ableitungen von exp, ln, sin, cos",                 gemeistert: false, aufgaben: 22, geschafft: 14 },
      { id: "AN-2-6", name: "Höhere Ableitungen",                                gemeistert: false, aufgaben: 24, geschafft:  7 },
      // AN-3 Kurvendiskussion
      { id: "AN-3-1", name: "Monotonie und Extremwerte (notwendige Bedingung)",  gemeistert: true,  aufgaben: 19, geschafft: 19 },
      { id: "AN-3-2", name: "Hinreichende Bedingung für Extremwerte",            gemeistert: true,  aufgaben: 20, geschafft: 20 },
      { id: "AN-3-3", name: "Wendepunkte und Krümmungsverhalten",                gemeistert: false, aufgaben: 23, geschafft: 11 },
      { id: "AN-3-4", name: "Vollständige Kurvendiskussion",                     gemeistert: false, aufgaben: 25, geschafft:  6 },
      { id: "AN-3-5", name: "Optimierungsaufgaben",                              gemeistert: false, aufgaben: 24, geschafft:  0 },
      // AN-4 Integralrechnung
      { id: "AN-4-1", name: "Einführung: Integral als Fläche",                   gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "AN-4-2", name: "Stammfunktion und unbestimmtes Integral",           gemeistert: false, aufgaben: 20, geschafft: 12 },
      { id: "AN-4-3", name: "Grundlegende Integrationsregeln",                   gemeistert: false, aufgaben: 20, geschafft: 10 },
      { id: "AN-4-4", name: "Bestimmtes Integral und Hauptsatz",                 gemeistert: false, aufgaben: 24, geschafft:  8 },
      { id: "AN-4-5", name: "Flächenberechnung zwischen Kurven",                 gemeistert: false, aufgaben: 23, geschafft:  3 },
      { id: "AN-4-6", name: "Integrationsmethoden (Substitution, part. Int.)",  gemeistert: false, aufgaben: 26, geschafft:  0 },
      // AN-5 Anwendungen der Analysis
      { id: "AN-5-1", name: "Sachaufgaben zur Differentialrechnung",             gemeistert: false, aufgaben: 25, geschafft:  0 },
      { id: "AN-5-2", name: "Sachaufgaben zur Integralrechnung",                 gemeistert: false, aufgaben: 26, geschafft:  0 },
      { id: "AN-5-3", name: "Wachstumsmodelle (logistisches Wachstum)",          gemeistert: false, aufgaben: 24, geschafft:  0 }
    ],
    verlauf: {
      labels: ["Sep", "Nov", "Jan", "Mär", "Mai"],
      werte:  [5,     18,    15,    45,    62   ]
    },
    verlaufMonat: {
      labels: ["KW 20", "KW 21", "KW 22", "KW 23"],
      werte:  [58,      60,      59,      62     ]
    }
  },
  {
    id: "WS",
    name: "Wahrscheinlichkeit und Statistik",
    fortschritt: 85,
    module: [
      // WS-1 Beschreibende Statistik
      { id: "WS-1-1", name: "Statistische Grundbegriffe (Merkmal, Häufigkeit)", gemeistert: true,  aufgaben: 14, geschafft: 14 },
      { id: "WS-1-2", name: "Grafische Darstellungen (Histogramm, Boxplot)",    gemeistert: true,  aufgaben: 16, geschafft: 16 },
      { id: "WS-1-3", name: "Lagemaße (Mittelwert, Median, Modus)",             gemeistert: true,  aufgaben: 15, geschafft: 15 },
      { id: "WS-1-4", name: "Streumaße (Varianz, Standardabweichung)",          gemeistert: true,  aufgaben: 18, geschafft: 18 },
      { id: "WS-1-5", name: "Korrelation und lineare Regression",               gemeistert: true,  aufgaben: 19, geschafft: 19 },
      // WS-2 Kombinatorik
      { id: "WS-2-1", name: "Grundprinzip des Zählens",                         gemeistert: true,  aufgaben: 13, geschafft: 13 },
      { id: "WS-2-2", name: "Permutationen",                                    gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "WS-2-3", name: "Kombinationen ohne Wiederholung",                  gemeistert: true,  aufgaben: 18, geschafft: 18 },
      { id: "WS-2-4", name: "Kombinationen mit Wiederholung",                   gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "WS-2-5", name: "Binomialkoeffizient",                              gemeistert: true,  aufgaben: 19, geschafft: 19 },
      // WS-3 Wahrscheinlichkeitsrechnung
      { id: "WS-3-1", name: "Zufallsexperiment, Ereignis, Wahrscheinlichkeit",  gemeistert: true,  aufgaben: 15, geschafft: 15 },
      { id: "WS-3-2", name: "Additionssatz und Komplementregel",                gemeistert: true,  aufgaben: 18, geschafft: 18 },
      { id: "WS-3-3", name: "Bedingte Wahrscheinlichkeit",                      gemeistert: true,  aufgaben: 20, geschafft: 20 },
      { id: "WS-3-4", name: "Multiplikationssatz und Unabhängigkeit",           gemeistert: true,  aufgaben: 18, geschafft: 18 },
      { id: "WS-3-5", name: "Totale Wahrscheinlichkeit und Satz von Bayes",     gemeistert: true,  aufgaben: 22, geschafft: 22 },
      { id: "WS-3-6", name: "Baumdiagramme und Vierfeldertafel",                gemeistert: false, aufgaben: 20, geschafft: 15 },
      // WS-4 Zufallsvariablen und Verteilungen
      { id: "WS-4-1", name: "Diskrete Zufallsvariablen",                        gemeistert: true,  aufgaben: 17, geschafft: 17 },
      { id: "WS-4-2", name: "Erwartungswert und Varianz",                       gemeistert: true,  aufgaben: 19, geschafft: 19 },
      { id: "WS-4-3", name: "Binomialverteilung",                               gemeistert: false, aufgaben: 22, geschafft: 14 },
      { id: "WS-4-4", name: "Normalverteilung und Standardnormalverteilung",    gemeistert: false, aufgaben: 24, geschafft:  8 },
      { id: "WS-4-5", name: "Hypothesentest (Grundlagen)",                      gemeistert: false, aufgaben: 25, geschafft:  0 }
    ],
    verlauf: {
      labels: ["Sep", "Nov", "Jan", "Mär", "Mai"],
      werte:  [50,    62,    58,    72,    85   ]
    },
    verlaufMonat: {
      labels: ["KW 20", "KW 21", "KW 22", "KW 23"],
      werte:  [83,      84,      85,      85     ]
    }
  }
];

// ── LERNEMPFEHLUNGEN ──────────────────────────────────────────
const empfehlungen = {
  ziel: {
    thema: "AN",
    themaName: "Analysis",
    modul: "Kurvendiskussion",
    begruendung: "Du hast Ableitungsregeln und Extremwerte schon drauf. Kurvendiskussion ist dein nächster logischer Schritt.",
    zielbezug: "",
    dauer: 20,
    schwierigkeit: "Mittel"
  },
  fortschritt: {
    thema: "FA",
    themaName: "Funktionale Abhängigkeiten",
    modul: "Potenz- und Wurzelfunktionen",
    begruendung: "Mit 48% ist das dein schwächstes Thema gerade.",
    zielbezug: "",
    dauer: 15,
    schwierigkeit: "Einstieg"
  }
};

// ── SEMESTERANFORDERUNGEN ─────────────────────────────────────
const semesteranforderungen = {
  schulstufe: "11. Schulstufe",
  semester: "Sommersemester 2026",
  module: [
    { id: "AG-3", name: "Vektorrechnung",                          thema: "AG", status: "gemeistert" },
    { id: "FA-4", name: "Exponential- & Logarithmusfunktionen",    thema: "FA", status: "gemeistert" },
    { id: "FA-5", name: "Trigonometrische Funktionen",             thema: "FA", status: "offen"      },
    { id: "AN-2", name: "Differentialrechnung",                    thema: "AN", status: "gemeistert" },
    { id: "AN-3", name: "Kurvendiskussion",                        thema: "AN", status: "laufend"    },
    { id: "AN-4", name: "Integralrechnung",                        thema: "AN", status: "offen"      }
  ]
};

// ── WOCHENTAGE (für Zeitziel-Kalender) ───────────────────────
const woche = [
  { tag: "Mo", geplant: true,  erledigt: true  },
  { tag: "Di", geplant: false, erledigt: false },
  { tag: "Mi", geplant: true,  erledigt: true  },
  { tag: "Do", geplant: false, erledigt: false },
  { tag: "Fr", geplant: true,  erledigt: false },
  { tag: "Sa", geplant: false, erledigt: false },
  { tag: "So", geplant: false, erledigt: false }
];

// ── NOTEN ─────────────────────────────────────────────────────
// Chronologisch sortiert — neueste zuerst
// Schularbeiten sind klassenweite Prüfungen (nicht nach Thema getrennt)
// typ: "Schularbeit" | "Lernzielkontrolle"
// nummer: Ordinalzahl der Schularbeit (nur bei Schularbeiten, sonst null)
const noten = [
  { note: 3, typ: "Schularbeit",       nummer: "4.", datum: "Mai 2026"       },
  { note: 2, typ: "Lernzielkontrolle", nummer: null, datum: "April 2026"     },
  { note: 3, typ: "Lernzielkontrolle", nummer: null, datum: "März 2026"      },
  { note: 2, typ: "Schularbeit",       nummer: "3.", datum: "März 2026"      },
  { note: 4, typ: "Schularbeit",       nummer: "2.", datum: "Jänner 2026"    },
  { note: 2, typ: "Lernzielkontrolle", nummer: null, datum: "Dezember 2025"  },
  { note: 3, typ: "Schularbeit",       nummer: "1.", datum: "Oktober 2025"   }
];

// ── ABZEICHEN ─────────────────────────────────────────────────
// locked: false → freigeschaltet (datum vorhanden)
// locked: true  → noch nicht erreicht (datum: null)
const abzeichen = [
  { titel: "Erstes Ziel erreicht",   thema: "WS", datum: "Oktober 2025",  locked: false },
  { titel: "5 Kapitel gemeistert",   thema: "AG", datum: "Februar 2026",  locked: false },
  { titel: "WS-Ass",                 thema: "WS", datum: "März 2026",     locked: false },
  { titel: "Analyse-Profi",          thema: "AN", datum: null,            locked: true  },
  { titel: "FA Experte",             thema: "FA", datum: null,            locked: true  },
  { titel: "10 Kapitel gemeistert",  thema: "AG", datum: null,            locked: true  },
  { titel: "7-Tage-Lernsträhne",    thema: "AN", datum: null,            locked: true  },
  { titel: "Schularbeit-Held",       thema: "WS", datum: null,            locked: true  },
  { titel: "Voller Fokus",           thema: "FA", datum: null,            locked: true  }
];

// ── VERGANGENE ZIELE ──────────────────────────────────────────
const vergangeneZiele = [
  {
    thema: "WS",
    themaName: "Wahrscheinlichkeit und Statistik",
    zielProzent: 80,
    erreichterProzent: 85,
    status: "erreicht"
  },
  {
    thema: "AG",
    themaName: "Algebra und Geometrie",
    zielProzent: 70,
    erreichterProzent: 65,
    status: "nicht erreicht"
  }
];

// ── REFLEXIONSDATEN (vorausgefüllt für Demo) ──────────────────
// kompetenz: subjektive Einschätzung 1–10
// emotion:   1 = frustriert/ängstlich, 10 = neugierig/motiviert
const reflexion = {
  kompetenz: { AG: 7, FA: 4, AN: 6, WS: 9 },
  emotion:   { AG: 7, FA: 3, AN: 6, WS: 8 },
  kompetenzVerlauf: [
    { label: "Sep", wert: 5  },
    { label: "Okt", wert: 6  },
    { label: "Nov", wert: 5  },
    { label: "Dez", wert: 4  },
    { label: "Jan", wert: 3  },
    { label: "Feb", wert: 4  },
    { label: "Mär", wert: 6  },
    { label: "Apr", wert: 7  },
    { label: "Mai", wert: 7  },
    { label: "Jun", wert: 8  }
  ],
  emotionVerlauf: [
    { label: "Sep", wert: 10 },
    { label: "Okt", wert: 8  },
    { label: "Nov", wert: 6  },
    { label: "Dez", wert: 5  },
    { label: "Jan", wert: 4  },
    { label: "Feb", wert: 5  },
    { label: "Mär", wert: 6  },
    { label: "Apr", wert: 7  },
    { label: "Mai", wert: 7  },
    { label: "Jun", wert: 8  }
  ]
};

// ── LERNZEITMUSTER (aktuelle Woche, Mo 29.6. gerade begonnen) ─
const lernzeitmuster = [
  { tag: "Mo", minuten: 46 },
  { tag: "Di", minuten: 0 },
  { tag: "Mi", minuten: 0 },
  { tag: "Do", minuten: 0 },
  { tag: "Fr", minuten: 0 },
  { tag: "Sa", minuten: 0 },
  { tag: "So", minuten: 0 }
];

// ── LERNZEIT-VERLAUF (4 Wochen à 7 Tage) ─────────────────────
// KW4 = Diese Woche  Mo 29.6. – So 5.7. (heute = Mo 29.6., Tag gerade begonnen)
// KW3 = Letzte Woche Mo 22.6. – So 28.6.
// KW2 = Vor 2 Wo.   Mo 15.6. – So 21.6.
// KW1 = Vor 3 Wo.   Mo  8.6. – So 14.6.
const lernzeitVerlauf = [
  { kw: 'KW1', tage: [
    { tag: 'Mo', datum:  8, monat: 6, minuten: 28 },
    { tag: 'Di', datum:  9, monat: 6, minuten: 0  },
    { tag: 'Mi', datum: 10, monat: 6, minuten: 25 },
    { tag: 'Do', datum: 11, monat: 6, minuten: 32 },
    { tag: 'Fr', datum: 12, monat: 6, minuten: 0  },
    { tag: 'Sa', datum: 13, monat: 6, minuten: 0  },
    { tag: 'So', datum: 14, monat: 6, minuten: 0  }
  ]},
  { kw: 'KW2', tage: [
    { tag: 'Mo', datum: 15, monat: 6, minuten: 15 },
    { tag: 'Di', datum: 16, monat: 6, minuten: 20 },
    { tag: 'Mi', datum: 17, monat: 6, minuten: 0  },
    { tag: 'Do', datum: 18, monat: 6, minuten: 28 },
    { tag: 'Fr', datum: 19, monat: 6, minuten: 10 },
    { tag: 'Sa', datum: 20, monat: 6, minuten: 0  },
    { tag: 'So', datum: 21, monat: 6, minuten: 0  }
  ]},
  { kw: 'KW3', tage: [
    { tag: 'Mo', datum: 22, monat: 6, minuten: 35 },
    { tag: 'Di', datum: 23, monat: 6, minuten: 22 },
    { tag: 'Mi', datum: 24, monat: 6, minuten: 18 },
    { tag: 'Do', datum: 25, monat: 6, minuten: 0  },
    { tag: 'Fr', datum: 26, monat: 6, minuten: 0  },
    { tag: 'Sa', datum: 27, monat: 6, minuten: 0  },
    { tag: 'So', datum: 28, monat: 6, minuten: 12 }
  ]},
  { kw: 'KW4', tage: [
    { tag: 'Mo', datum: 29, monat: 6, minuten: 0 },
    { tag: 'Di', datum: 30, monat: 6, minuten: 0 },
    { tag: 'Mi', datum:  1, monat: 7, minuten: 0 },
    { tag: 'Do', datum:  2, monat: 7, minuten: 0 },
    { tag: 'Fr', datum:  3, monat: 7, minuten: 0 },
    { tag: 'Sa', datum:  4, monat: 7, minuten: 0 },
    { tag: 'So', datum:  5, monat: 7, minuten: 0 }
  ]}
];

// ── MANUELL EINGETRAGENE ZEITEN ───────────────────────────────
const manuellZeiten = [
  { tag: "Mo", minuten: 0 },
  { tag: "Di", minuten: 0 },
  { tag: "Mi", minuten: 0 },
  { tag: "Do", minuten: 0 },
  { tag: "Fr", minuten: 0 },
  { tag: "Sa", minuten: 0 },
  { tag: "So", minuten: 0 }
];

// ── MOCK-AUFGABEN ─────────────────────────────────────────────
const mockAufgaben = [
  { thema: "AG",
    kapitel: "Trigonometrie im rechtwinkligen Dreieck",
    schwierigkeit: "Einfach",
    aufgabe: "Ein rechtwinkliges Dreieck hat die Katheten a = 3 cm und b = 4 cm. Berechne den Winkel α zwischen der Hypotenuse und Kathete b.",
    antworten: ["α = 36,9°", "α = 53,1°", "α = 45,0°", "α = 30,0°"],
    richtig: 0 },
  { thema: "FA",
    kapitel: "Lineare Funktionen",
    schwierigkeit: "Einfach",
    aufgabe: "Bestimme die Steigung der Geraden durch die Punkte A(0|1) und B(2|5).",
    antworten: ["m = 1", "m = 2", "m = 3", "m = 0,5"],
    richtig: 1 },
  { thema: "AN",
    kapitel: "Ableitungsregeln",
    schwierigkeit: "Einfach",
    aufgabe: "Leite die Funktion f(x) = 3x² + 2x ab.",
    antworten: ["f'(x) = 6x + 2", "f'(x) = 3x + 2", "f'(x) = 6x", "f'(x) = 3x² + 2"],
    richtig: 0 },
  { thema: "WS",
    kapitel: "Grundlagen der Wahrscheinlichkeit",
    schwierigkeit: "Einfach",
    aufgabe: "Ein fairer Würfel wird einmal geworfen. Wie groß ist die Wahrscheinlichkeit eine gerade Zahl zu würfeln?",
    antworten: ["1/6", "1/3", "1/2", "2/3"],
    richtig: 2 }
];
