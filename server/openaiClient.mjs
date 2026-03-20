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

