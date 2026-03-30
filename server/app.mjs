import path from 'node:path';

import express from 'express';
import multer from 'multer';

import { extractTextFromUploadedFile } from './fileExtractors.mjs';
import {
  summarizeNote,
  explainNote,
  generateNoteTitle,
  describeImageForNote,
  firstParagraphForCard
} from './openaiClient.mjs';

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif']);

export function createApp() {
  const app = express();
  const dbUrl = process.env.JSON_SERVER_URL || 'http://localhost:3001';

  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

  app.use(express.json({ limit: '2mb' }));

  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  function normalizeText(input) {
    return String(input || '').trim();
  }

  const routes = express.Router();

  routes.get('/health', (_, res) => {
    res.json({
      ok: true,
      jsonServerUrlConfigured: Boolean(process.env.JSON_SERVER_URL),
      usingDefaultJsonServer: !process.env.JSON_SERVER_URL
    });
  });

  routes.post('/notes/upload', upload.single('file'), async (req, res) => {
    try {
      if (process.env.VERCEL === '1' && !process.env.JSON_SERVER_URL) {
        return res.status(503).json({
          error:
            'JSON_SERVER_URL is not set. In Vercel → Environment Variables, set it to your hosted JSON Server URL (e.g. on Render).'
        });
      }

      let { title, institution, courseCode, topic, authorId, content } = req.body;
      const baseText = normalizeText(content);
      let fileText = '';
      if (req.file) {
        const ext = path.extname(req.file.originalname || '').toLowerCase();
        if (IMAGE_EXT.has(ext)) {
          fileText = await describeImageForNote(req.file.buffer, req.file.mimetype);
        } else {
          fileText = await extractTextFromUploadedFile(req.file);
        }
      }
      const combinedText = normalizeText([baseText, fileText].filter(Boolean).join('\n\n'));

      if (!combinedText || combinedText.length < 12) {
        return res.status(400).json({
          error: 'Add more text or upload a file with enough content (at least a short note or readable document).'
        });
      }
      if (!normalizeText(courseCode) || !normalizeText(topic)) {
        return res.status(400).json({ error: 'Course code and topic are required.' });
      }
      if (!normalizeText(institution)) {
        return res.status(400).json({
          error: 'Institution is missing. Set it on your account (sign up / profile).'
        });
      }

      title = normalizeText(title);
      if (title.length < 3) {
        title = await generateNoteTitle(combinedText);
      }

      const aiSummary = await summarizeNote(combinedText);
      const aiCardSummary = firstParagraphForCard(aiSummary);

      const notePayload = {
        title,
        institution: normalizeText(institution),
        courseCode: normalizeText(courseCode),
        topic: normalizeText(topic),
        content: combinedText,
        aiSummary,
        aiCardSummary,
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

  routes.post('/ai/explain', async (req, res) => {
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

  // /api/* (local dev + browser); bare paths for Vercel when the function receives a stripped path
  app.use('/api', routes);
  app.use(routes);

  return app;
}
