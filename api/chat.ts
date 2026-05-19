export const config = { runtime: 'edge' };

// ─── types ───────────────────────────────────────────────────────────────────

interface ApiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Slots {
  date_of_birth:        string | null;
  regime:               string | null;
  family_composition:   string | null;
  hospitalization_need: string | null;
  optics_need:          string | null;
  dental_need:          string | null;
  current_price:        string | null;
  current_insurer:      string | null;
  currently_insured:    boolean | null;
}

// ─── system prompt ───────────────────────────────────────────────────────────

function buildSystemPrompt(slots: Partial<Slots>): string {
  const known = Object.entries(slots)
    .filter(([, v]) => v !== null && v !== undefined)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join('\n');

  return `Tu es l'assistant IA de Direct Assurance, spécialisé en mutuelle santé.
Ton objectif : aider l'utilisateur à obtenir un devis de mutuelle santé personnalisé.

## Persona
- Langue : français uniquement
- Ton : chaleureux, professionnel, utilise le tutoiement
- Réponds de façon concise (2-4 phrases max par message)
- Sois proactif pour collecter les informations manquantes

## Informations à collecter (SLOTS)
Extrais ces informations naturellement au fil de la conversation :
- date_of_birth : date de naissance au format DD/MM/YYYY
- regime : régime SS (general, independent, agriculture, student, alsace_moselle, other)
- family_composition : single, couple, family (couple+enfants), parent (parent seul+enfants)
- hospitalization_need : minimum, comfort, premium
- optics_need : minimum, standard, enhanced
- dental_need : routine, prosthetics, orthodontics
- current_price : tarif mensuel actuel en euros (chiffre seul, ex: "45")
- current_insurer : nom de l'assureur actuel
- currently_insured : true si actuellement assuré, false sinon

## Données déjà connues
${known || '  (aucune pour l\'instant)'}

## FORMAT DE RÉPONSE (OBLIGATOIRE : réponds TOUJOURS en JSON valide, sans markdown)
{
  "reply": "Ton message en français ici",
  "slots": {
    // Uniquement les slots NOUVEAUX ou MIS À JOUR dans ce tour
    // Omets les slots déjà connus sauf s'ils sont modifiés
  },
  "action": null
}

Valeurs possibles pour "action" :
- null : conversation normale
- "show-pricing" : déclenche l'affichage du devis. Utilise ce déclencheur dès que tu as date_of_birth + regime + family_composition. Mentionne dans le reply que tu calcules le devis.
- "show-cta" : quand l'utilisateur confirme vouloir continuer sur le site DA

## Règles importantes
1. N'affiche PAS de liste à puces dans "reply" — reste conversationnel
2. Déclenche "show-pricing" dès que les 3 slots minimums sont collectés (date_of_birth + regime + family_composition), même si tu n'as pas encore les besoins
3. Si l'utilisateur mentionne un problème ou une question hors-scope, réponds brièvement puis recentre
4. Collecte les besoins (hospit/optique/dentaire) avant ou après le devis selon le flux naturel
5. Mentionne discrètement que les données sont traitées conformément au RGPD lors du premier message

## Formules Direct Assurance (pour référence)
- Essentielle : garanties de base, ~30€/mois (célibataire)
- Essentielle+ : meilleure optique + hospitalisation chambre individuelle, ~45€/mois
- Équilibre : couverture complète, clinique privée, ~62€/mois

## Exemple premier message
{
  "reply": "Bonjour ! Je suis l'assistant de Direct Assurance, je vais t'aider à trouver la mutuelle santé qui te correspond 😊 Tes données sont traitées en toute confidentialité (RGPD).\\n\\nPour démarrer, es-tu actuellement assuré(e) ? Et quel est ton régime de sécurité sociale (salarié régime général, indépendant, étudiant…) ?",
  "slots": {},
  "action": null
}`;
}

// ─── handler ──────────────────────────────────────────────────────────────────

export default async function handler(request: Request): Promise<Response> {
  const cors = {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const apiKey = (globalThis as any).process?.env?.OPENAI_API_KEY
    ?? (globalThis as any).OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not set' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let body: { messages: ApiMessage[]; slots: Partial<Slots> };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const { messages = [], slots = {} } = body;

  // Build OpenAI messages array: system prompt + conversation history
  const openaiMessages = [
    { role: 'system', content: buildSystemPrompt(slots) },
    ...messages,
  ];

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        model:       'gpt-4.1',
        max_tokens:  512,
        temperature: 0.4,
        messages:    openaiMessages,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('[api/chat] OpenAI error', openaiRes.status, errText);
      throw new Error(`OpenAI ${openaiRes.status}: ${errText}`);
    }

    const data: any = await openaiRes.json();
    const rawText: string = data?.choices?.[0]?.message?.content ?? '';

    // Robust JSON extraction — handles code-fenced or bare JSON
    let parsed: { reply: string; slots: Partial<Slots>; action: string | null };
    try {
      const jsonStr = rawText.match(/```json\s*([\s\S]*?)```/)?.[1]
        ?? rawText.match(/\{[\s\S]*\}/)?.[0]
        ?? rawText;
      parsed = JSON.parse(jsonStr);
    } catch {
      parsed = { reply: rawText, slots: {}, action: null };
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[api/chat]', err);
    return new Response(
      JSON.stringify({
        reply:  "Désolé, une erreur technique est survenue. Peux-tu réessayer dans un instant ?",
        slots:  {},
        action: null,
      }),
      { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } },
    );
  }
}
