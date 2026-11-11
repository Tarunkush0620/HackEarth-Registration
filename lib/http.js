// Small helpers shared by the API routes
function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
// Vercel parses JSON bodies for us; fall back to manual parsing if not.
async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = req.body && Buffer.isBuffer(req.body) ? req.body : await readRaw(req);
  try { return JSON.parse(raw.toString('utf8') || '{}'); } catch { return {}; }
}
module.exports = { json, readRaw, readJson };
