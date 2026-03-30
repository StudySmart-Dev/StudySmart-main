import OpenAI from 'openai';

const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error('OPENAI_API_KEY is missing. Set it in your environment or .env file.');
  }
  return new OpenAI({ apiKey: key });
}

export async function summarizeNote(text) {
  const client = getClient();
  const prompt = [
    'Summarize this study note for a student.',
    'Output exactly:',
    '1) Bullet summary (4-6 bullets)',
    '2) Key formulas or definitions',
    '3) 3 quick revision questions with short answers',
    '',
    text
  ].join('\n');

  const res = await client.responses.create({
    model,
    input: prompt
  });
  return res.output_text?.trim() || 'No summary generated.';
}

export async function generateNoteTitle(text) {
  const client = getClient();
  const chunk = String(text || '').slice(0, 12000);
  const res = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: `From the following study material, output a single short title only (maximum 12 words). No quotation marks, no preamble:\n\n${chunk}`
      }
    ],
    max_tokens: 80
  });
  const raw = res.choices[0]?.message?.content?.trim() || 'Study note';
  return raw.replace(/^["']|["']$/g, '').slice(0, 120) || 'Study note';
}

export async function describeImageForNote(buffer, mimeType) {
  const client = getClient();
  const mt = mimeType && mimeType.startsWith('image/') ? mimeType : 'image/jpeg';
  const b64 = buffer.toString('base64');
  const url = `data:${mt};base64,${b64}`;
  const res = await client.chat.completions.create({
    model,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Transcribe visible text and briefly describe diagrams or photos for study notes. If this is lecture slides or handwritten notes, capture the main topic and key points.'
          },
          { type: 'image_url', image_url: { url } }
        ]
      }
    ],
    max_tokens: 1200
  });
  return res.choices[0]?.message?.content?.trim() || '';
}

export function firstParagraphForCard(aiSummary) {
  const t = String(aiSummary || '').trim();
  if (!t) return '';
  const first = t.split(/\n\n+/)[0] || t;
  const oneLine = first.replace(/\n/g, ' ').trim();
  return oneLine.length > 300 ? `${oneLine.slice(0, 297)}…` : oneLine;
}

export async function explainNote(text, mode, customPrompt) {
  const client = getClient();

  const modePrompt =
    mode === 'more'
      ? 'Explain this note in more depth, include context and intuition.'
      : mode === 'simpler'
        ? 'Explain this note in very simple language for a beginner.'
        : mode === 'example'
          ? 'Explain this note with practical examples and analogies.'
          : `Follow this custom instruction while explaining: ${customPrompt || 'Explain clearly.'}`;

  const prompt = [
    modePrompt,
    'Keep the response concise and structured for learning.',
    '',
    text
  ].join('\n');

  const res = await client.responses.create({
    model,
    input: prompt
  });
  return res.output_text?.trim() || 'No explanation generated.';
}

