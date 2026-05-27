/**
 * SVG chart image endpoint — Direct Assurance mutuelle santé
 * Serves SVG images for MCP tool responses (rendered as inline markdown images in ChatGPT)
 *
 * GET /api/chart?type=quote&dob=15%2F06%2F1985&regime=general&family=single&hospit=comfort&optics=standard&dental=routine[&price=60][&insurer=MGEN]
 * GET /api/chart?type=simulate&scenario=dental_crown[&formula=equilibre]
 */
export const config = { runtime: 'edge' };

// ─── Pricing logic (self-contained copy) ─────────────────────────────────────

const FORMULA_CONFIG = [
  {
    id: 'essentielle', name: 'Essentielle', color: '#64748b',
    tagline: 'Les garanties juste au cas ou',
    coverage: { soins: 'Soins courants 100% BR', hospitalisation: 'Hospitalisation 100% BR', optique: 'Optique 100% (plafond SS)', dentaire: 'Dentaire 100% BR' },
  },
  {
    id: 'essentielle_plus', name: 'Essentielle +', color: '#475569',
    tagline: "L'essentiel + bonne couverture optique",
    coverage: { soins: 'Soins courants 100% BR', hospitalisation: 'Chambre individuelle incluse', optique: "Optique jusqu'a 200 EUR/an", dentaire: 'Dentaire jusqu a 125% BR' },
  },
  {
    id: 'equilibre', name: 'Equilibre', color: '#E30613',
    tagline: 'La formule complete et confortable',
    coverage: { soins: 'Soins courants 120% BR', hospitalisation: 'Clinique privee + 120% BR', optique: "Optique jusqu'a 300 EUR/an", dentaire: 'Dentaire jusqu a 150% BR' },
  },
];

const BASE: Record<string, number>        = { essentielle: 30, essentielle_plus: 45, equilibre: 62 };
const REGIME_MULT: Record<string, number> = { general: 1.0, independent: 1.15, agriculture: 0.95, student: 0.8, alsace_moselle: 0.9, other: 1.0 };
const FAMILY_MULT: Record<string, number> = { single: 1.0, couple: 1.85, family: 2.15, parent: 1.3 };

function getAge(dob: string): number {
  const [d, m, y] = dob.split('/').map(Number);
  const date = new Date(y, m - 1, d);
  const now  = new Date();
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

function calcFormulas(a: Record<string, any>) {
  const recommendedId = getRecommendedId(a.hospitalization_need, a.optics_need, a.dental_need);
  const age     = getAge(a.date_of_birth);
  const ageLoad = 1 + Math.max(0, age - 30) * 0.005;
  const regMult = REGIME_MULT[a.regime] ?? 1.0;
  const famMult = FAMILY_MULT[a.family_composition] ?? 1.0;
  const curP    = a.current_price ? parseFloat(a.current_price) : undefined;
  return {
    age,
    formulas: FORMULA_CONFIG.map(c => {
      const monthly = Math.round(BASE[c.id] * ageLoad * regMult * famMult * 100) / 100;
      return { ...c, recommended: c.id === recommendedId, monthlyPremium: monthly,
        annualPremium: Math.round(monthly * 12 * 100) / 100,
        monthlySaving: curP !== undefined ? Math.round((curP - monthly) * 10) / 10 : undefined };
    }),
  };
}

// ─── Reimbursement data ───────────────────────────────────────────────────────

const SCENARIOS: Record<string, { label: string; cost: number }> = {
  dental_crown:   { label: 'Couronne dentaire',       cost: 900  },
  optician_prog:  { label: 'Lunettes progressives',   cost: 400  },
  specialist:     { label: 'Specialiste secteur 2',   cost: 50   },
  gp_visit:       { label: 'Medecin generaliste',     cost: 25   },
  hospital_3d:    { label: 'Hospitalisation 3 nuits', cost: 1200 },
  dental_implant: { label: 'Implant dentaire',        cost: 1500 },
};

const REIMB: Record<string, Record<string, { secu: number; mutuelle: number; remaining: number }>> = {
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

// ─── SVG helpers ──────────────────────────────────────────────────────────────

function xe(s: string | number): string {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/EUR/g, '&#8364;').replace(/\./g, ',');
}

function fmt(n: number): string {
  return n.toFixed(2).replace('.', ',');
}

// ─── SVG generators ───────────────────────────────────────────────────────────

function generateQuoteSVG(a: Record<string, any>): string {
  const { age, formulas } = calcFormulas(a);
  const W = 720; const H = 440;
  const CW = 220; const CH = 370; const GAP = 11; const TOP = 58; const LEFT = 14;

  let cards = '';
  formulas.forEach((f, i) => {
    const x = LEFT + i * (CW + GAP);
    const y = TOP;
    const isRec = f.recommended;
    const col = f.color;

    cards += `<rect x="${x+2}" y="${y+2}" width="${CW}" height="${CH}" fill="rgba(0,0,0,0.06)" rx="14"/>`;
    cards += `<rect x="${x}" y="${y}" width="${CW}" height="${CH}" fill="white" rx="14" stroke="${isRec ? '#E30613' : '#e5e7eb'}" stroke-width="${isRec ? 2 : 1}"/>`;

    let hTop = y;
    if (isRec) {
      cards += `<rect x="${x}" y="${y}" width="${CW}" height="22" fill="${col}" rx="14"/>`;
      cards += `<rect x="${x}" y="${y+10}" width="${CW}" height="12" fill="${col}"/>`;
      cards += `<text x="${x + CW/2}" y="${y+15}" text-anchor="middle" fill="white" font-size="10" font-weight="700" font-family="system-ui,sans-serif">&#9733; RECOMMANDEE</text>`;
      hTop = y + 22;
    }

    const hH = 44;
    cards += `<rect x="${x}" y="${hTop}" width="${CW}" height="${hH}" fill="${col}" rx="${isRec ? 0 : 14}"/>`;
    if (!isRec) cards += `<rect x="${x}" y="${hTop + hH - 14}" width="${CW}" height="14" fill="${col}"/>`;
    cards += `<text x="${x + CW/2}" y="${hTop + 18}" text-anchor="middle" fill="white" font-size="13" font-weight="700" font-family="system-ui,sans-serif">${xe(f.name)}</text>`;
    cards += `<text x="${x + CW/2}" y="${hTop + 33}" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-size="9" font-family="system-ui,sans-serif">${xe(f.tagline.substring(0, 34))}</text>`;

    const priceY = hTop + hH + 6;
    cards += `<text x="${x + CW/2}" y="${priceY + 24}" text-anchor="middle" fill="${col}" font-size="24" font-weight="800" font-family="system-ui,sans-serif">${xe(fmt(f.monthlyPremium))} &#8364;</text>`;
    cards += `<text x="${x + CW/2}" y="${priceY + 38}" text-anchor="middle" fill="#9ca3af" font-size="10" font-family="system-ui,sans-serif">/mois &#8226; ${xe(fmt(f.annualPremium))} &#8364;/an</text>`;

    let nextY = priceY + 46;
    if (f.monthlySaving !== undefined) {
      const sc2 = f.monthlySaving >= 0 ? '#16a34a' : '#ea580c';
      const sb2 = f.monthlySaving >= 0 ? '#f0fdf4' : '#fff7ed';
      const sign = f.monthlySaving >= 0 ? '+' : '';
      cards += `<rect x="${x+20}" y="${nextY}" width="${CW-40}" height="18" fill="${sb2}" rx="9" stroke="${sc2}" stroke-width="0.5"/>`;
      cards += `<text x="${x + CW/2}" y="${nextY+12}" text-anchor="middle" fill="${sc2}" font-size="10" font-weight="600" font-family="system-ui,sans-serif">${sign}${xe(String(f.monthlySaving))} &#8364;/mois vs actuel</text>`;
      nextY += 22;
    }

    cards += `<line x1="${x+12}" y1="${nextY + 4}" x2="${x+CW-12}" y2="${nextY + 4}" stroke="#f3f4f6" stroke-width="1"/>`;

    const cov = [
      ['&#128138;', 'Soins',    f.coverage.soins.substring(0, 26)],
      ['&#127973;', 'Hospit.',  f.coverage.hospitalisation.substring(0, 26)],
      ['&#128083;', 'Optique',  f.coverage.optique.substring(0, 26)],
      ['&#129463;', 'Dentaire', f.coverage.dentaire.substring(0, 26)],
    ];
    let cy = nextY + 18;
    for (const [ico, lbl, val] of cov) {
      cards += `<text x="${x+14}" y="${cy}" fill="#6b7280" font-size="13" font-family="system-ui,sans-serif">${ico}</text>`;
      cards += `<text x="${x+30}" y="${cy}" fill="#374151" font-size="10" font-weight="600" font-family="system-ui,sans-serif">${lbl}</text>`;
      cards += `<text x="${x+30}" y="${cy+12}" fill="#9ca3af" font-size="9" font-family="system-ui,sans-serif">${xe(val)}</text>`;
      cy += 30;
    }

    const btnY = y + CH - 38;
    cards += `<rect x="${x+12}" y="${btnY}" width="${CW-24}" height="28" fill="${isRec ? col : 'white'}" stroke="${isRec ? col : '#e5e7eb'}" stroke-width="1" rx="14"/>`;
    cards += `<text x="${x+CW/2}" y="${btnY+18}" text-anchor="middle" fill="${isRec ? 'white' : '#6b7280'}" font-size="11" font-weight="600" font-family="system-ui,sans-serif">Selectionner</text>`;
  });

  const curInfo = a.current_insurer ? ` &#8226; Actuel : ${xe(a.current_insurer)}` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#F5F5F5" rx="16"/>
  <text x="14" y="26" fill="#111827" font-size="15" font-weight="700" font-family="system-ui,sans-serif">Devis Direct Assurance</text>
  <text x="14" y="44" fill="#6b7280" font-size="11" font-family="system-ui,sans-serif">${age} ans${curInfo}</text>
  <text x="${W-14}" y="44" text-anchor="end" fill="#E30613" font-size="11" font-weight="600" font-family="system-ui,sans-serif">quote-llm-six.vercel.app</text>
  ${cards}
</svg>`;
}

function generateReimbursementSVG(scenario: string, formulaFilter?: string): string {
  const sc = SCENARIOS[scenario];
  if (!sc) return '';
  const fmts = formulaFilter
    ? FORMULA_CONFIG.filter(f => f.id === formulaFilter)
    : FORMULA_CONFIG;

  const W = 620; const BAR_W = 310; const BAR_X = 164; const BAR_H = 18;
  const ROW_H = 72; const TOP = 66;
  const H = TOP + fmts.length * ROW_H + 46;

  let rows = '';
  fmts.forEach((f, i) => {
    const row  = REIMB[scenario]?.[f.id];
    if (!row) return;
    const y    = TOP + i * ROW_H;
    const tot  = sc.cost;
    const sW   = Math.round((row.secu     / tot) * BAR_W);
    const mW   = Math.round((row.mutuelle / tot) * BAR_W);
    const rW   = Math.max(0, BAR_W - sW - mW);
    const pct  = Math.round(((row.secu + row.mutuelle) / tot) * 100);
    const isRec = f.id === 'equilibre';
    const nc   = isRec ? '#E30613' : '#374151';

    rows += `<text x="14" y="${y+14}" fill="${nc}" font-size="12" font-weight="${isRec ? '700' : '500'}" font-family="system-ui,sans-serif">${xe(f.name)}${isRec ? ' &#9733;' : ''}</text>`;
    rows += `<text x="14" y="${y+28}" fill="#9ca3af" font-size="10" font-family="system-ui,sans-serif">Secu ${row.secu}&#8364;  Mutuelle ${row.mutuelle}&#8364;</text>`;

    rows += `<rect x="${BAR_X}" y="${y}" width="${BAR_W}" height="${BAR_H}" fill="#f3f4f6" rx="9"/>`;
    if (sW > 0) rows += `<rect x="${BAR_X}" y="${y}" width="${sW}" height="${BAR_H}" fill="#22c55e" rx="${mW + rW > 0 ? '9 0 0 9' : '9'}"/>`;
    if (mW > 0) rows += `<rect x="${BAR_X+sW}" y="${y}" width="${mW}" height="${BAR_H}" fill="#3b82f6" rx="${rW > 0 ? 0 : '0 9 9 0'}"/>`;
    if (rW > 0) rows += `<rect x="${BAR_X+sW+mW}" y="${y}" width="${rW}" height="${BAR_H}" fill="#ef4444" rx="${sW+mW > 0 ? '0 9 9 0' : '9'}"/>`;

    const remC = row.remaining === 0 ? '#16a34a' : row.remaining < 100 ? '#ea580c' : '#dc2626';
    rows += `<text x="${BAR_X+BAR_W+10}" y="${y+13}" fill="#6b7280" font-size="11" font-family="system-ui,sans-serif">${pct}% couvert</text>`;
    rows += `<text x="${BAR_X+BAR_W+10}" y="${y+28}" fill="${remC}" font-size="11" font-weight="600" font-family="system-ui,sans-serif">Reste : ${row.remaining}&#8364;</text>`;

    if (i < fmts.length - 1)
      rows += `<line x1="14" y1="${y+ROW_H-4}" x2="${W-14}" y2="${y+ROW_H-4}" stroke="#f3f4f6" stroke-width="1"/>`;
  });

  const lY = H - 22;
  const legend = [
    { x: 14,  color: '#22c55e', label: 'Securite sociale' },
    { x: 148, color: '#3b82f6', label: 'Mutuelle' },
    { x: 230, color: '#ef4444', label: 'Reste a charge' },
  ];
  for (const l of legend) {
    rows += `<rect x="${l.x}" y="${lY}" width="10" height="10" fill="${l.color}" rx="2"/>`;
    rows += `<text x="${l.x+14}" y="${lY+9}" fill="#6b7280" font-size="10" font-family="system-ui,sans-serif">${l.label}</text>`;
  }
  rows += `<text x="${W-14}" y="${lY+9}" text-anchor="end" fill="#9ca3af" font-size="9" font-family="system-ui,sans-serif">Indicatif 2024</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#F5F5F5" rx="16"/>
  <text x="14" y="26" fill="#111827" font-size="15" font-weight="700" font-family="system-ui,sans-serif">Simulation : ${xe(sc.label)}</text>
  <text x="14" y="46" fill="#6b7280" font-size="12" font-family="system-ui,sans-serif">Cout total estime : ${sc.cost}&#8364;</text>
  ${rows}
</svg>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export default async function handler(request: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'GET')    return new Response('GET only', { status: 405, headers: cors });

  const p    = new URL(request.url).searchParams;
  const type = p.get('type');

  let svg = '';

  if (type === 'quote') {
    svg = generateQuoteSVG({
      date_of_birth:        p.get('dob')    ?? '01/01/1985',
      regime:               p.get('regime') ?? 'general',
      family_composition:   p.get('family') ?? 'single',
      hospitalization_need: p.get('hospit') ?? 'minimum',
      optics_need:          p.get('optics') ?? 'minimum',
      dental_need:          p.get('dental') ?? 'routine',
      current_price:        p.get('price')  ?? undefined,
      current_insurer:      p.get('insurer') ?? undefined,
    });
  } else if (type === 'simulate') {
    const scenario = p.get('scenario') ?? '';
    const formula  = p.get('formula')  ?? undefined;
    svg = generateReimbursementSVG(scenario, formula);
  }

  if (!svg) return new Response('Not found — use ?type=quote or ?type=simulate', { status: 404, headers: cors });

  return new Response(svg, {
    headers: {
      ...cors,
      'Content-Type':  'image/svg+xml',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
