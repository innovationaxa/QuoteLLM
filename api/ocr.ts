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

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_completion_tokens: 300,
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
Ne retourne JAMAIS une valeur inventée. Si une information est absente ou illisible, retourne null.`,
            },
            {
              type: 'image_url',
              image_url: { url: imageBase64, detail: 'high' },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[api/ocr] OpenAI error', res.status, err);
    return new Response(JSON.stringify({ extracted: {} }), { status: 200 });
  }

  const data: any = await res.json();
  const raw: string = data.choices?.[0]?.message?.content ?? '{}';

  let extracted: Record<string, string | null> = {};
  try {
    const cleaned = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    extracted = JSON.parse(cleaned);
  } catch {
    // Extraction failed — return empty, caller falls back to manual
  }

  return new Response(JSON.stringify({ extracted }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
