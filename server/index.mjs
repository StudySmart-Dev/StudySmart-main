import 'dotenv/config';
import express from 'express';
import multer from 'multer';

import { extractTextFromUploadedFile } from './fileExtractors.mjs';
import { summarizeNote, explainNote } from './openaiClient.mjs';

const app = express();
const port = Number(process.env.SERVER_PORT || 3002);
const dbUrl = process.env.JSON_SERVER_URL || 'http://localhost:3001';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(express.json({ limit: '2mb' }));

app.use((_, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  if (_.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function normalizeText(input) {
  return String(input || '').trim();
}

app.get('/health', (_, res) => {
  res.json({ ok: true });
});

app.post('/api/notes/upload', upload.single('file'), async (req, res) => {
  try {
    const { title, institution, courseCode, topic, authorId, content } = req.body;
    const baseText = normalizeText(content);
    const fileText = req.file ? await extractTextFromUploadedFile(req.file) : '';
    const combinedText = normalizeText([baseText, fileText].filter(Boolean).join('\n\n'));

    if (!title || normalizeText(title).length < 3) {
      return res.status(400).json({ error: 'Title must be at least 3 characters.' });
    }
    if (!combinedText || combinedText.length < 20) {
      return res.status(400).json({ error: 'Note content is too short.' });
    }

    const aiSummary = await summarizeNote(combinedText);

    const notePayload = {
      title: normalizeText(title),
      institution: normalizeText(institution),
      courseCode: normalizeText(courseCode),
      topic: normalizeText(topic),
      content: combinedText,
      aiSummary,
      authorId: Number(authorId),
      file: req.file
        ? {
            name: req.file.originalname,
            mimeType: req.file.mimetype,
            size: req.file.size
          }
        : null,
      votes: [],
      upvotes: 0,
      downvotes: 0,
      createdAt: new Date().toISOString()
    };

    const r = await fetch(`${dbUrl}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notePayload)
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Failed to save note: ${t}`);
    }
    const saved = await r.json();

    return res.json({ note: saved, aiSummary });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Upload failed.' });
  }
});

app.post('/api/ai/explain', async (req, res) => {
  try {
    const { text, mode, customPrompt } = req.body || {};
    const noteText = normalizeText(text);
    if (!noteText) return res.status(400).json({ error: 'Missing note text.' });

    const response = await explainNote(noteText, mode, customPrompt);
    return res.json({ response });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'AI explanation failed.' });
  }
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`StudySmart server running on http://localhost:${port}`);
});

