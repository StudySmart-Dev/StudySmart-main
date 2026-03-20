import path from 'node:path';
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import JSZip from 'jszip';

function cleanWhitespace(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function extractFromPdf(buffer) {
  const result = await pdf(buffer);
  return cleanWhitespace(result.text);
}

async function extractFromDocx(buffer) {
  const result = await mammoth.extractRawText({ buffer });
  return cleanWhitespace(result.value);
}

async function extractFromPptx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const slidePaths = Object.keys(zip.files)
    .filter((p) => /^ppt\/slides\/slide\d+\.xml$/.test(p))
    .sort((a, b) => {
      const an = Number(a.match(/slide(\d+)\.xml/)?.[1] || 0);
      const bn = Number(b.match(/slide(\d+)\.xml/)?.[1] || 0);
      return an - bn;
    });

  const chunks = [];
  for (const slidePath of slidePaths) {
    const xml = await zip.files[slidePath].async('text');
    const matches = [...xml.matchAll(/<a:t>(.*?)<\/a:t>/g)];
    const text = matches
      .map((m) => m[1])
      .join(' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (text.trim()) chunks.push(text.trim());
  }
  return cleanWhitespace(chunks.join('\n\n'));
}

async function extractFromText(buffer) {
  return cleanWhitespace(buffer.toString('utf8'));
}

export async function extractTextFromUploadedFile(file) {
  if (!file) return '';
  const ext = path.extname(file.originalname || '').toLowerCase();

  if (ext === '.pdf') return extractFromPdf(file.buffer);
  if (ext === '.docx') return extractFromDocx(file.buffer);
  if (ext === '.pptx') return extractFromPptx(file.buffer);
  if (ext === '.txt' || ext === '.md' || ext === '.json') return extractFromText(file.buffer);

  throw new Error('Unsupported file type. Please upload PDF, DOCX, PPTX, TXT, MD, or JSON.');
}

