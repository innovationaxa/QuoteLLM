#!/usr/bin/env node
import { Server }              from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ─── Pricing logic (ported from web/src/data/pricing.ts) ─────────────────────

const FORMULA_CONFIG = [
  {
    id: 'essentielle', name: 'Essentielle',
    tagline: 'Les garanties juste au cas où',
    coverage: {
      soins:           'Soins courants 100% BR',
      hospitalisation: 'Hospitalisation 100% BR',
      optique:         'Optique 100% (plafond SS)',
      dentaire:        'Dentaire 100% BR',
    },
  },
  {
    id: 'essentielle_plus', name: 'Essentielle +',
    tagline: "L'essentiel + bonne couverture optique",
    coverage: {
      soins:           'Soins courants 100% BR',
      hospitalisation: 'Hospitalisation 100% + chambre individuelle',
      optique:         "Optique jusqu'à 200 €/an",
      dentaire:        "Dentaire jusqu'à 125% BR",
    },
  },
  {
    id: 'equilibre', name: 'Équilibre',
    tagline: 'La formule complète et confortable',
    coverage: {
      soins:           'Soins courants 120% BR',
      hospitalisation: 'Hospitalisation 120% + clinique privée',
      optique:         "Optique jusqu'à 300 €/an",
      dentaire:        "Dentaire jusqu'à 150% BR",
    },
  },
];

const BASE: Record<string, number> = { essentielle: 30, essentielle_plus: 45, equilibre: 62 };
const REGIME_MULT: Record<string, number> = {
  general: 1.0, independent: 1.15, agriculture: 0.95,
  student: 0.8, alsace_moselle: 0.9, other: 1.0,
};
const FAMILY_MULT: Record<string, number> = {
  single: 1.0, couple: 1.85, family: 2.15, parent: 1.3,
};

function getAge(dob: string): number {
  const [d, m, y] = dob.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  const now = new Date();
  let age = now.getFullYear() - date.getFullYear();
  if (now < new Date(now.getFullYear(), date.getMonth(), date.getDate())) age--;
  return Math.max(0, age);
}

function getRecommendedId(hospit: string, optics: string, dental: string): string {
  let score = 0;
  if (hospit === 'premium') score += 3; else if (hospit === 'comfort') score += 2;
  if (optics === 'enhanced') score += 2; else if (optics === 'standard') score += 1;
  if (dental === 'orthodontics') score += 2; else if (dental === 'prosthetics') score += 1;
  if (score >= 5) return 'equilibre';
  if (score >= 2) return 'essentielle_plus';
  return 'essentielle';
}

function calculateQuote(args: {
  date_of_birth: string;
  regime: string;
  family_composition: string;
  hospitalization_need: string;
  optics_need: string;
  dental_need: string;
  current_price?: number;
  current_insurer?: string;
}) {
  const { date_of_birth, regime, family_composition, hospitalization_need, optics_need, dental_need, current_price, current_insurer } = args;
  const recommendedId = getRecommendedId(hospitalization_need, optics_need, dental_need);
  const age     = getAge(date_of_birth);
  const ageLoad = 1 + Math.max(0, age - 30) * 0.005;
  const regMult = REGIME_MULT[regime] ?? 1.0;
  const famMult = FAMILY_MULT[family_composition] ?? 1.0;

  const formulas = FORMULA_CONFIG.map(config => {
    const base    = BASE[config.id];
    const monthly = Math.round(base * ageLoad * regMult * famMult * 100) / 100;
    const saving  = current_price ? Math.round((current_price - monthly) * 10) / 10 : undefined;
    return {
      ...config,
      recommended:    config.id === recommendedId,
      monthlyPremium: monthly,
      annualPremium:  Math.round(monthly * 12 * 100) / 100,
      monthlySaving:  saving,
    };
  });

  const recommended = formulas.find(f => f.recommended)!;
  return { formulas, recommendedId, recommended, age, current_price, current_insurer };
}

// ─── Concrete examples per formula ───────────────────────────────────────────

const FORMULA_EXAMPLES: Record<string, string[]> = {
  essentielle: [
    "🩺 Consultation généraliste (25 €) → Tu paies 1 € (ticket modérateur). La mutuelle complète les 30% non remboursés par la Sécu.",
    "🏥 Appendicite — 3 jours à l'hôpital → Chambre partagée, forfait journalier (20 €/j) couvert. Dépassements d'honoraires à ta charge : 0 à 300 €.",
    "👓 Lunettes progressives (~400 €) → Remboursement limité au plafond Sécu (~20 €). Reste à charge : ~380 €.",
    "🦷 Couronne dentaire (~900 €) → Remboursement 100% BR ≈ 120 €. Reste à charge : ~780 €.",
  ],
  essentielle_plus: [
    "🩺 Consultation généraliste (25 €) → Pareil qu'Essentielle. Tu paies 1 €.",
    "🏥 Appendicite — 3 jours à l'hôpital → Chambre individuelle incluse : tu économises ~100 €/nuit, soit ~300 € sur 3 jours. Dépassements partiellement couverts.",
    "👓 Lunettes progressives (~400 €) → Jusqu'à 200 € remboursés (montures + verres). Reste à charge : ~200 €.",
    "🦷 Couronne dentaire (~900 €) → Remboursement 125% BR ≈ 150 €. Reste à charge : ~750 €.",
  ],
  equilibre: [
    "🩺 Spécialiste secteur 2 (50 €) → Soins courants 120% BR : quasi-totalité des dépassements couverts. Tu paies ~5 € au lieu de 27 €.",
    "🏥 Opération en clinique privée → Clinique au choix, chambre individuelle garantie, dépassements couverts à 120%. Reste à charge : très faible ou nul.",
    "👓 Lunettes premium + lentilles (~500 €) → Jusqu'à 300 € remboursés. Lentilles de contact aussi prises en charge chaque année.",
    "🦷 Couronne + implant dentaire (~900 €) → Remboursement 150% BR ≈ 180 €. Implants partiellement couverts. Idéal pour les soins lourds.",
  ],
};

// ─── Pedagogical explanations ─────────────────────────────────────────────────

const EXPLANATIONS: Record<string, Record<string, string>> = {
  hospitalisation: {
    minimum:  "Le niveau Minimum couvre les soins remboursés par la Sécurité sociale. Tu es en chambre partagée et les dépassements d'honoraires restent à ta charge. Convient si tu es rarement hospitalisé·e et en bonne santé.",
    comfort:  "Le niveau Confort inclut la chambre individuelle (économie de 80–150 €/nuit), un lit accompagnant pour un proche, et une prise en charge partielle des dépassements d'honoraires. C'est le bon équilibre pour la majorité des assurés.",
    premium:  "Le niveau Premium te permet de choisir ton établissement privé librement, couvre les dépassements jusqu'à 200%, et inclut la chambre individuelle dans les cliniques haut de gamme. Recommandé si tu as des antécédents médicaux ou que tu veux le meilleur confort.",
  },
  optique: {
    minimum:  "Le niveau Minimum prend en charge les verres simples et des montures autour de 30 €, dans la limite du remboursement Sécu. Adapté si tu ne portes pas de lunettes ou si ta vue est stable et tu achètes des montures peu chères.",
    standard: "Le niveau Standard couvre des montures jusqu'à ~150 € et les verres progressifs, avec renouvellement tous les 2 ans. C'est la bonne option si tu portes des lunettes au quotidien.",
    enhanced: "Le niveau Renforcé couvre des montures haut de gamme (~300 €), les verres premium, et souvent les lentilles de contact. À choisir si tu dépenses déjà plus de 300 € tous les 2 ans en optique.",
  },
  dentaire: {
    routine:      "Le niveau Routine couvre les soins courants : caries, détartrage, obturations, soins de canal. Suffit si ta situation dentaire est stable et que tu n'as pas de travaux lourds en vue.",
    prosthetics:  "Le niveau Prothèses rembourse partiellement couronnes, bridges et implants. Indispensable si tu as des soins prothétiques prévus ou récurrents — les coûts peuvent facilement dépasser 1 000 €.",
    orthodontics: "Le niveau Orthodontie inclut les appareils adulte et enfant, en plus des prothèses. Nécessaire si un traitement orthodontique est en cours ou planifié dans ton foyer.",
  },
};

// ─── Reimbursement simulation data ───────────────────────────────────────────

const SCENARIOS: Record<string, { label: string; cost: number }> = {
  dental_crown:   { label: 'Couronne dentaire',       cost: 900  },
  optician_prog:  { label: 'Lunettes progressives',   cost: 400  },
  specialist:     { label: 'Spécialiste secteur 2',   cost: 50   },
  gp_visit:       { label: 'Médecin généraliste',     cost: 25   },
  hospital_3d:    { label: 'Hospitalisation 3 nuits', cost: 1200 },
  dental_implant: { label: 'Implant dentaire',        cost: 1500 },
};

const REIMBURSEMENT: Record<string, Record<string, { secu: number; mutuelle: number; remaining: number }>> = {
  gp_visit: {
    essentielle:      { secu: 17, mutuelle: 7,   remaining: 1   },
    essentielle_plus: { secu: 17, mutuelle: 7,   remaining: 1   },
    equilibre:        { secu: 17, mutuelle: 7,   remaining: 1   },
  },
  specialist: {
    essentielle:      { secu: 16, mutuelle: 7,   remaining: 27  },
    essentielle_plus: { secu: 16, mutuelle: 15,  remaining: 19  },
    equilibre:        { secu: 16, mutuelle: 28,  remaining: 6   },
  },
  dental_crown: {
    essentielle:      { secu: 84, mutuelle: 36,  remaining: 780 },
    essentielle_plus: { secu: 84, mutuelle: 66,  remaining: 750 },
    equilibre:        { secu: 84, mutuelle: 96,  remaining: 720 },
  },
  optician_prog: {
    essentielle:      { secu: 5,  mutuelle: 15,  remaining: 380 },
    essentielle_plus: { secu: 5,  mutuelle: 195, remaining: 200 },
    equilibre:        { secu: 5,  mutuelle: 295, remaining: 100 },
  },
  hospital_3d: {
    essentielle:      { secu: 900, mutuelle: 120, remaining: 180 },
    essentielle_plus: { secu: 900, mutuelle: 240, remaining: 60  },
    equilibre:        { secu: 900, mutuelle: 290, remaining: 10  },
  },
  dental_implant: {
    essentielle:      { secu: 0, mutuelle: 0,   remaining: 1500 },
    essentielle_plus: { secu: 0, mutuelle: 100, remaining: 1400 },
    equilibre:        { secu: 0, mutuelle: 350, remaining: 1150 },
  },
};

function simulateReimbursement(scenario: string, formulaFilter?: string): string {
  const sc = SCENARIOS[scenario];
  if (!sc) return `Scénario inconnu : ${scenario}. Valeurs disponibles : ${Object.keys(SCENARIOS).join(', ')}`;

  const formulas = formulaFilter
    ? [formulaFilter]
    : ['essentielle', 'essentielle_plus', 'equilibre'];

  const lines: string[] = [
    `## Simulation : ${sc.label} (coût total ~${sc.cost} €)`,
    '',
    '| Formule | Sécu | Mutuelle | **Reste à charge** |',
    '|---|---|---|---|',
  ];

  for (const f of formulas) {
    const row = REIMBURSEMENT[scenario]?.[f];
    if (!row) continue;
    const name = f === 'essentielle' ? 'Essentielle' : f === 'essentielle_plus' ? 'Essentielle +' : 'Équilibre';
    const pct  = Math.round(((sc.cost - row.remaining) / sc.cost) * 100);
    lines.push(`| ${name} | ${row.secu} € | ${row.mutuelle} € | **${row.remaining} €** (${pct}% couvert) |`);
  }

  lines.push('', '_Valeurs indicatives basées sur les tarifs conventionnels 2024. Non contractuelles._');
  return lines.join('\n');
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
  { name: 'direct-assurance-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name:        'calculate_da_quote',
      description: "Calcule un devis Direct Assurance mutuelle santé et retourne les 3 formules avec leurs tarifs mensuels et la recommandation personnalisée.",
      inputSchema: {
        type: 'object',
        properties: {
          date_of_birth:        { type: 'string',  description: 'Date de naissance au format DD/MM/YYYY (ex: 15/06/1985)' },
          regime:               { type: 'string',  enum: ['general','independent','agriculture','student','alsace_moselle','other'], description: 'Régime de sécurité sociale' },
          family_composition:   { type: 'string',  enum: ['single','couple','family','parent'], description: 'Situation familiale' },
          hospitalization_need: { type: 'string',  enum: ['minimum','comfort','premium'], description: 'Niveau de couverture hospitalisation souhaité' },
          optics_need:          { type: 'string',  enum: ['minimum','standard','enhanced'], description: 'Niveau de couverture optique souhaité' },
          dental_need:          { type: 'string',  enum: ['routine','prosthetics','orthodontics'], description: 'Niveau de couverture dentaire souhaité' },
          current_price:        { type: 'number',  description: 'Tarif mensuel actuel en € (optionnel, pour calculer les économies potentielles)' },
          current_insurer:      { type: 'string',  description: 'Nom de l\'assureur actuel (optionnel)' },
        },
        required: ['date_of_birth','regime','family_composition','hospitalization_need','optics_need','dental_need'],
      },
    },
    {
      name:        'explain_da_coverage',
      description: "Retourne une explication pédagogique détaillée d'un niveau de couverture (hospitalisation, optique ou dentaire). Utile quand l'utilisateur hésite sur son choix.",
      inputSchema: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['hospitalisation','optique','dentaire'], description: 'La catégorie de couverture' },
          level:    { type: 'string', description: 'Le niveau : minimum/comfort/premium pour hospit ; minimum/standard/enhanced pour optique ; routine/prosthetics/orthodontics pour dentaire' },
        },
        required: ['category','level'],
      },
    },
    {
      name:        'simulate_reimbursement',
      description: "Simule le remboursement d'un soin courant par chaque formule Direct Assurance (Sécu + mutuelle + reste à charge). Idéal pour montrer concrètement la différence entre les formules sur un cas réel.",
      inputSchema: {
        type: 'object',
        properties: {
          scenario: {
            type: 'string',
            enum: ['dental_crown','optician_prog','specialist','gp_visit','hospital_3d','dental_implant'],
            description: "Type de soin : dental_crown (couronne ~900€), optician_prog (lunettes prog. ~400€), specialist (spécialiste sect.2 ~50€), gp_visit (généraliste ~25€), hospital_3d (hospit. 3 nuits ~1200€), dental_implant (implant ~1500€)",
          },
          formula: {
            type: 'string',
            enum: ['essentielle','essentielle_plus','equilibre'],
            description: "Formule spécifique (optionnel — si absent, compare les 3 formules)",
          },
        },
        required: ['scenario'],
      },
    },
    {
      name:        'chat_da_advisor',
      description: "Envoie un message au conseiller IA Direct Assurance (GPT-5.5). Retourne la réponse de l'assistant et les données de profil extraites. Utilise cet outil pour les questions ouvertes, les doutes, ou pour collecter les infos manquantes de façon conversationnelle.",
      inputSchema: {
        type: 'object',
        properties: {
          message:  { type: 'string', description: 'Message de l\'utilisateur' },
          history:  {
            type:  'array',
            items: { type: 'object', properties: { role: { type: 'string' }, content: { type: 'string' } }, required: ['role','content'] },
            description: 'Historique de la conversation (optionnel)',
          },
          slots: {
            type: 'object',
            description: 'Profil déjà connu (optionnel) : date_of_birth, regime, family_composition, etc.',
          },
        },
        required: ['message'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  // ── simulate_reimbursement ──────────────────────────────────────────────────
  if (name === 'simulate_reimbursement') {
    const { scenario, formula } = args as { scenario: string; formula?: string };
    return { content: [{ type: 'text', text: simulateReimbursement(scenario, formula) }] };
  }

  // ── calculate_da_quote ──────────────────────────────────────────────────────
  if (name === 'calculate_da_quote') {
    const result = calculateQuote(args as any);
    const lines: string[] = [
      `## Devis Direct Assurance — ${args.date_of_birth} · ${args.regime} · ${args.family_composition}`,
      '',
    ];
    for (const f of result.formulas) {
      const tag = f.recommended ? ' ⭐ RECOMMANDÉE' : '';
      lines.push(`### ${f.name}${tag}`);
      lines.push(`**${f.monthlyPremium} €/mois** (${f.annualPremium} €/an)`);
      if (f.monthlySaving !== undefined) {
        const sign = f.monthlySaving >= 0 ? '+' : '';
        lines.push(`Économie vs assureur actuel : ${sign}${f.monthlySaving} €/mois`);
      }
      lines.push(`_${f.tagline}_`);
      lines.push(`- Soins : ${f.coverage.soins}`);
      lines.push(`- Hospitalisation : ${f.coverage.hospitalisation}`);
      lines.push(`- Optique : ${f.coverage.optique}`);
      lines.push(`- Dentaire : ${f.coverage.dentaire}`);
      const examples = FORMULA_EXAMPLES[f.id];
      if (examples) {
        lines.push('');
        lines.push('**Exemples concrets du quotidien :**');
        examples.forEach(ex => lines.push(`- ${ex}`));
      }
      lines.push('');
    }
    lines.push(`**Âge calculé :** ${result.age} ans`);
    if (result.current_insurer) lines.push(`**Assureur actuel :** ${result.current_insurer}`);
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  // ── explain_da_coverage ─────────────────────────────────────────────────────
  if (name === 'explain_da_coverage') {
    const { category, level } = args as { category: string; level: string };
    const explanation = EXPLANATIONS[category]?.[level];
    if (!explanation) {
      return { content: [{ type: 'text', text: `Niveau inconnu : ${category} / ${level}` }], isError: true };
    }
    const label: Record<string, Record<string, string>> = {
      hospitalisation: { minimum: 'Minimum', comfort: 'Confort', premium: 'Premium' },
      optique:         { minimum: 'Minimum', standard: 'Standard', enhanced: 'Renforcé' },
      dentaire:        { routine: 'Routine', prosthetics: 'Prothèses', orthodontics: 'Orthodontie' },
    };
    const text = `## ${category.charAt(0).toUpperCase() + category.slice(1)} — niveau ${label[category]?.[level] ?? level}\n\n${explanation}`;
    return { content: [{ type: 'text', text }] };
  }

  // ── chat_da_advisor ─────────────────────────────────────────────────────────
  if (name === 'chat_da_advisor') {
    const { message, history = [], slots = {} } = args as {
      message: string;
      history?: { role: string; content: string }[];
      slots?: Record<string, unknown>;
    };

    const apiUrl = process.env.DA_API_URL ?? 'https://quote-llm.vercel.app';
    const messages = [...history, { role: 'user', content: message }];

    const res = await fetch(`${apiUrl}/api/chat`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ messages, slots }),
    });

    if (!res.ok) {
      return { content: [{ type: 'text', text: `Erreur API : ${res.status}` }], isError: true };
    }

    const data = await res.json() as { reply: string; slots: Record<string, unknown>; action: string | null };
    const lines = [`**Réponse :** ${data.reply}`];
    const newSlots = Object.entries(data.slots ?? {}).filter(([, v]) => v != null);
    if (newSlots.length) {
      lines.push('', '**Infos extraites :**');
      for (const [k, v] of newSlots) lines.push(`- ${k}: ${JSON.stringify(v)}`);
    }
    if (data.action) lines.push('', `**Action déclenchée :** ${data.action}`);

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  return { content: [{ type: 'text', text: `Outil inconnu : ${name}` }], isError: true };
});

// ─── Start ────────────────────────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
