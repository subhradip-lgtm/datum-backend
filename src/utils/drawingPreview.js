const { execFile } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execFileAsync = util.promisify(execFile);

const STORAGE_DIR = process.env.STORAGE_DIR || './storage';
const DPI = process.env.PDF_PREVIEW_DPI || 120;

/**
 * Rasterises every page of an uploaded PDF drawing to JPEG using poppler's
 * pdftoppm — the same tool AUR already uses in its manual drawing-review
 * workflow (pdftoppm -jpeg -r 100), so preview output stays consistent with
 * what a reviewer would see doing it by hand.
 *
 * Requires poppler-utils on the host: `apt-get install -y poppler-utils`
 *
 * @param {string} projectId
 * @param {string} fileId       ProjectFile.id — used to name the preview folder
 * @param {string} sourcePdfPath absolute path to the uploaded PDF
 * @returns {Promise<{previewDir: string, pageCount: number}>}
 */
async function generateDrawingPreview(projectId, fileId, sourcePdfPath) {
  const previewDir = path.join(STORAGE_DIR, projectId, 'previews', fileId);
  fs.mkdirSync(previewDir, { recursive: true });

  const outPrefix = path.join(previewDir, 'page');
  // pdftoppm -jpeg -r <dpi> input.pdf outPrefix   -> outPrefix-1.jpg, outPrefix-2.jpg, ...
  await execFileAsync('pdftoppm', ['-jpeg', '-r', String(DPI), sourcePdfPath, outPrefix]);

  const pages = fs.readdirSync(previewDir).filter((f) => f.endsWith('.jpg')).sort();
  return { previewDir, pageCount: pages.length };
}

module.exports = { generateDrawingPreview };
