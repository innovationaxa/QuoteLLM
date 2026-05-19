/**
 * Remote MCP server — Direct Assurance mutuelle santé
 * Protocol: MCP over Streamable HTTP (JSON-RPC 2.0, POST)
 * URL: https://<your-app>.vercel.app/api/mcp
 */
export const config = { runtime: 'edge' };

// ─── Pricing logic ────────────────────────────────────────────────────────────

const FORMULA_CONFIG = [
  {
    id: 'essentielle', name: 'Essentielle',
    tagline: 'Les garanties juste au cas où',
    coverage: { soins: 'Soins courants 100% BR', hospitalisation: 'Hospitalisation 100% BR', optique: 'Optique 100% (plafond SS)', dentaire: 'Dentaire 100% BR' },
  },
  {
    id: 'essentielle_plus', name: 'Essentielle +',
    tagline: "L'essentiel + bonne couverture optique",
    coverage: { soins: 'Soins courants 100% BR', hospitalisation: 'Hospitalisation 100% + chambre individuelle', optique: "Optique jusqu'à 200 €/an", dentaire: "Dentaire jusqu'à 125% BR" },
  },
  {
    id: 'equilibre', name: 'Équilibre',
    tagline: 'La formule complète et confortable',
    coverage: { soins: 'Soins courants 120% BR', hospitalisation: 'Hospitalisation 120% + clinique privée', optique: "Optique jusqu'à 300 €/an", dentaire: "Dentaire jusqu'à 150% BR" },
  },
];

const BASE: Record<string, number> = { essentielle: 30, essentielle_plus: 45, equilibre: 62 };
const REGIME_MULT: Record<string, number> = { general: 1.0, independent: 1.15, agriculture: 0.95, student: 0.8, alsace_moselle: 0.9, other: 1.0 };
const FAMILY_MULT: Record<string, number> = { single: 1.0, couple: 1.85, family: 2.15, parent: 1.3 };

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
  return score >= 5 ? 'equilibre' : score >= 2 ? 'essentielle_plus' : 'essentielle';
}

function calculateQuote(a: Record<string, any>) {
  const { date_of_birth, regime, family_composition, hospitalization_need, optics_need, dental_need, current_price, current_insurer } = a;
  const recommendedId = getRecommendedId(hospitalization_need, optics_need, dental_need);
  const age     = getAge(date_of_birth);
  const ageLoad = 1 + Math.max(0, age - 30) * 0.005;
  const regMult = REGIME_MULT[regime] ?? 1.0;
  const famMult = FAMILY_MULT[family_composition] ?? 1.0;

  const formulas = FORMULA_CONFIG.map(config => {
    const monthly = Math.round(BASE[config.id] * ageLoad * regMult * famMult * 100) / 100;
    const saving  = current_price ? Math.round((current_price - monthly) * 10) / 10 : undefined;
    return { ...config, recommended: config.id === recommendedId, monthlyPremium: monthly, annualPremium: Math.round(monthly * 12 * 100) / 100, monthlySaving: saving };
  });

  const lines: string[] = [`## Devis Direct Assurance — ${date_of_birth} · ${regime} · ${family_composition}`, ''];
  for (const f of formulas) {
    lines.push(`### ${f.name}${f.recommended ? ' ⭐ RECOMMANDÉE' : ''}`);
    lines.push(`**${f.monthlyPremium} €/mois** (${f.annualPremium} €/an)`);
    if (f.monthlySaving !== undefined) lines.push(`Économie vs assureur actuel : ${f.monthlySaving >= 0 ? '+' : ''}${f.monthlySaving} €/mois`);
    lines.push(`_${f.tagline}_`);
    lines.push(`- Soins : ${f.coverage.soins}`);
    lines.push(`- Hospitalisation : ${f.coverage.hospitalisation}`);
    lines.push(`- Optique : ${f.coverage.optique}`);
    lines.push(`- Dentaire : ${f.coverage.dentaire}`);
    lines.push('');
  }
  lines.push(`**Âge :** ${age} ans`);
  if (current_insurer) lines.push(`**Assureur actuel :** ${current_insurer}`);
  return lines.join('\n');
}

// ─── Pedagogical explanations ─────────────────────────────────────────────────

const EXPLANATIONS: Record<string, Record<string, string>> = {
  hospitalisation: {
    minimum: "Couvre uniquement le remboursement Sécu. Chambre partagée, dépassements à ta charge. Convient si tu es rarement hospitalisé·e.",
    comfort:  "Chambre individuelle couverte (80–150 €/nuit économisés), lit accompagnant, dépassements partiellement pris en charge. Bon équilibre pour la majorité.",
    premium:  "Clinique privée de ton choix, dépassements jusqu'à 200%, chambre individuelle dans les établissements premium. Recommandé si tu as des antécédents ou veux le meilleur confort.",
  },
  optique: {
    minimum:  "Montures ~30 € + verres simples dans la limite du remboursement Sécu. Adapté si tu ne portes pas souvent de lunettes.",
    standard: "Montures ~150 € + verres progressifs couverts, renouvellement tous les 2 ans. Bonne option pour un port quotidien.",
    enhanced: "Montures haut de gamme (~300 €) + verres premium + lentilles. À choisir si tu dépenses déjà plus de 300 € tous les 2 ans.",
  },
  dentaire: {
    routine:      "Soins courants : caries, détartrage, obturations. Suffit si ta situation dentaire est stable.",
    prosthetics:  "Couronnes, bridges, implants partiellement remboursés. Indispensable si tu as des soins lourds prévus.",
    orthodontics: "Appareils adulte et enfant en plus des prothèses. Nécessaire si un traitement orthodontique est en cours ou planifié.",
  },
};

// ─── Tools definition ─────────────────────────────────────────────────────────

const TOOLS = [
  {
    name: 'calculate_da_quote',
    description: "Calcule un devis Direct Assurance mutuelle santé et retourne les 3 formules avec tarifs et recommandation personnalisée.",
    inputSchema: {
      type: 'object',
      properties: {
        date_of_birth:        { type: 'string',  description: 'Date de naissance DD/MM/YYYY' },
        regime:               { type: 'string',  enum: ['general','independent','agriculture','student','alsace_moselle','other'] },
        family_composition:   { type: 'string',  enum: ['single','couple','family','parent'] },
        hospitalization_need: { type: 'string',  enum: ['minimum','comfort','premium'] },
        optics_need:          { type: 'string',  enum: ['minimum','standard','enhanced'] },
        dental_need:          { type: 'string',  enum: ['routine','prosthetics','orthodontics'] },
        current_price:        { type: 'number',  description: 'Tarif mensuel actuel en € (optionnel)' },
        current_insurer:      { type: 'string',  description: 'Assureur actuel (optionnel)' },
      },
      required: ['date_of_birth','regime','family_composition','hospitalization_need','optics_need','dental_need'],
    },
  },
  {
    name: 'explain_da_coverage',
    description: "Retourne une explication pédagogique d'un niveau de couverture (hospitalisation, optique ou dentaire).",
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['hospitalisation','optique','dentaire'] },
        level:    { type: 'string', description: 'minimum|comfort|premium / minimum|standard|enhanced / routine|prosthetics|orthodontics' },
      },
      required: ['category','level'],
    },
  },
  {
    name: 'chat_da_advisor',
    description: "Envoie un message au conseiller IA Direct Assurance (GPT-5.5). Pour les questions ouvertes ou la collecte d'infos manquantes.",
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        history: { type: 'array', items: { type: 'object', properties: { role: { type: 'string' }, content: { type: 'string' } }, required: ['role','content'] } },
        slots:   { type: 'object' },
      },
      required: ['message'],
    },
  },
];

// ─── JSON-RPC helpers ─────────────────────────────────────────────────────────

function ok(id: any, result: unknown) {
  return { jsonrpc: '2.0', id, result };
}
function err(id: any, code: number, message: string) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

// ─── Tool execution ───────────────────────────────────────────────────────────

async function runTool(name: string, args: Record<string, any>, baseUrl: string) {
  if (name === 'calculate_da_quote') {
    return { content: [{ type: 'text', text: calculateQuote(args) }] };
  }

  if (name === 'explain_da_coverage') {
    const { category, level } = args;
    const text = EXPLANATIONS[category]?.[level];
    if (!text) return { content: [{ type: 'text', text: `Inconnu : ${category}/${level}` }], isError: true };
    return { content: [{ type: 'text', text: `## ${category} — ${level}\n\n${text}` }] };
  }

  if (name === 'chat_da_advisor') {
    const { message, history = [], slots = {} } = args;
    const messages = [...history, { role: 'user', content: message }];
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, slots }),
    });
    if (!res.ok) return { content: [{ type: 'text', text: `Erreur API ${res.status}` }], isError: true };
    const data: any = await res.json();
    const lines = [`**Réponse :** ${data.reply}`];
    const extracted = Object.entries(data.slots ?? {}).filter(([, v]) => v != null);
    if (extracted.length) { lines.push('', '**Infos extraites :**'); extracted.forEach(([k, v]) => lines.push(`- ${k}: ${JSON.stringify(v)}`)); }
    if (data.action) lines.push('', `**Action :** ${data.action}`);
    return { content: [{ type: 'text', text: lines.join('\n') }] };
  }

  return { content: [{ type: 'text', text: `Outil inconnu : ${name}` }], isError: true };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(request: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST')    return new Response('POST only', { status: 405, headers: cors });

  const baseUrl = new URL(request.url).origin;

  let body: any;
  try { body = await request.json(); }
  catch { return new Response(JSON.stringify(err(null, -32700, 'Parse error')), { status: 400, headers: { ...cors, 'Content-Type': 'application/json' } }); }

  // Handle batch or single request
  const requests = Array.isArray(body) ? body : [body];
  const responses = await Promise.all(requests.map(async (req) => {
    const { id = null, method, params = {} } = req;

    if (method === 'initialize') {
      return ok(id, {
        protocolVersion: '2024-11-05',
        capabilities:    { tools: {} },
        serverInfo:      { name: 'direct-assurance-mcp', version: '1.0.0' },
      });
    }

    if (method === 'notifications/initialized' || method?.startsWith('notifications/')) {
      return null; // notifications have no response
    }

    if (method === 'tools/list') {
      return ok(id, { tools: TOOLS });
    }

    if (method === 'tools/call') {
      const { name, arguments: args = {} } = params;
      try {
        const result = await runTool(name, args, baseUrl);
        return ok(id, result);
      } catch (e: any) {
        return err(id, -32603, e?.message ?? 'Internal error');
      }
    }

    if (method === 'ping') return ok(id, {});

    return err(id, -32601, `Method not found: ${method}`);
  }));

  const filtered = responses.filter(Boolean);
  const payload  = Array.isArray(body) ? filtered : filtered[0];

  return new Response(JSON.stringify(payload), {
    status:  200,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}
