export const config = { runtime: 'edge' };

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
    return new Response('Method not allowed', { status: 405, headers: cors });
  }

  const elKey   = (globalThis as any).process?.env?.ELEVENLABS_API_KEY
    ?? (globalThis as any).ELEVENLABS_API_KEY;
  const elVoice = (globalThis as any).process?.env?.ELEVENLABS_VOICE_ID
    ?? (globalThis as any).ELEVENLABS_VOICE_ID;

  if (!elKey || !elVoice) {
    return new Response(JSON.stringify({ error: 'ElevenLabs not configured' }), {
      status: 500, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  let text: string;
  try {
    const body = await request.json();
    text = String(body.text ?? '').trim();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid body' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  if (!text) {
    return new Response(JSON.stringify({ error: 'Empty text' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const elRes = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${elVoice}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key':   elKey,
        'Content-Type': 'application/json',
        'Accept':       'audio/mpeg',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.45, similarity_boost: 0.80, style: 0.2 },
      }),
    },
  );

  if (!elRes.ok) {
    const err = await elRes.text();
    console.error('[api/tts] ElevenLabs error', elRes.status, err);
    return new Response(JSON.stringify({ error: `ElevenLabs ${elRes.status}` }), {
      status: 502, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }

  const audio = await elRes.arrayBuffer();
  return new Response(audio, {
    status: 200,
    headers: {
      ...cors,
      'Content-Type':  'audio/mpeg',
      'Cache-Control': 'no-store',
    },
  });
}
