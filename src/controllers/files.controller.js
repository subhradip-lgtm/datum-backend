const path = require('path');
const fs = require('fs');
const prisma = require('../config/db');
const { generateDrawingPreview } = require('../utils/drawingPreview');

async function upload(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file received' });

  const kind = (req.body.kind || 'OTHER').toUpperCase();
  const record = await prisma.projectFile.create({
    data: {
      projectId: req.params.projectId,
      uploadedBy: req.user.id,
      kind,
      originalName: req.file.originalname,
      storageKey: req.file.path,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
    },
  });

  // Fire off preview rendering for PDF drawings; don't block the upload response on it.
  if (kind === 'DRAWING' && req.file.mimetype === 'application/pdf') {
    generateDrawingPreview(req.params.projectId, record.id, req.file.path)
      .then(({ previewDir, pageCount }) =>
        prisma.projectFile.update({
          where: { id: record.id },
          data: { previewStorageDir: previewDir, previewPageCount: pageCount },
        })
      )
      .catch((err) => console.error(`[preview] failed for file ${record.id}:`, err.message));
  }

  res.status(201).json(record);
}

async function list(req, res) {
  const files = await prisma.projectFile.findMany({
    where: { projectId: req.params.projectId },
    orderBy: { createdAt: 'desc' },
  });
  res.json(files);
}

/** Serves a single rendered preview page as JPEG, e.g. GET /files/:fileId/preview/2 */
async function previewPage(req, res) {
  const file = await prisma.projectFile.findUnique({ where: { id: req.params.fileId } });
  if (!file || !file.previewStorageDir) {
    return res.status(404).json({ error: 'Preview not available yet — it may still be rendering' });
  }
  const page = Number(req.params.page || 1);
  const imgPath = path.join(file.previewStorageDir, `page-${page}.jpg`);
  if (!fs.existsSync(imgPath)) return res.status(404).json({ error: `Page ${page} not found` });
  res.sendFile(path.resolve(imgPath));
}

async function download(req, res) {
  const file = await prisma.projectFile.findUnique({ where: { id: req.params.fileId } });
  if (!file) return res.status(404).json({ error: 'File not found' });
  res.download(path.resolve(file.storageKey), file.originalName);
}

module.exports = { upload, list, previewPage, download };
