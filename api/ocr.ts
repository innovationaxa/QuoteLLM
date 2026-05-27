import OpenAI from 'openai';

export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing API key' }), { status: 500 });
  }

  const { imageBase64 } = await req.json() as { imageBase64: string };

  const client = new OpenAI({ apiKey });

  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyse cette image d'une carte de tiers payant ou carte de mutuelle santé française.
Extrais UNIQUEMENT les informations visibles. Retourne un JSON strict sans markdown ni commentaire :
{
  "current_insurer": "nom exact de la mutuelle ou compagnie visible, ou null",
  "date_of_birth": "date de naissance JJ/MM/AAAA si visible, sinon null",
  "first_name": "prénom si visible, sinon null",
  "last_name": "nom de famille si visible, sinon null",
  "contract_number": "numéro adhérent ou contrat si visible, sinon null"
}
Ne retourne JAMAIS une valeur inventée. Si une information est absente ou illisible, retourne null pour ce champ.`,
          },
          {
            type: 'image_url',
            image_url: { url: imageBase64, detail: 'high' },
          },
        ],
      },
    ],
    max_completion_tokens: 300,
  });

  const raw = response.choices[0].message.content ?? '{}';
  let extracted: Record<string, string | null> = {};
  try {
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    extracted = JSON.parse(cleaned);
  } catch {
    // Extraction failed — return empty object, caller will fall back to manual
  }

  return new Response(JSON.stringify({ extracted }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
