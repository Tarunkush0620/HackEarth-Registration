const crypto = require('crypto');
const { json } = require('./http');

const secret = () => process.env.SESSION_SECRET || process.env.QR_SECRET || 'dev-secret-key-wie-2026';

const mac = (s) => crypto.createHmac('sha256', secret()).update(s).digest('base64url');

function safeEqual(a, b) {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Session token = "<base64urlPayload>.<hmac>", valid for 14 hours
function issueToken(hours = 14, organiser = null) {
  const exp = String(Date.now() + hours * 3600 * 1000);
  const orgName = organiser && organiser.name ? organiser.name : 'Organiser';
  const orgId = organiser && organiser.id ? organiser.id : 'organiser';
  const orgRole = organiser && organiser.role ? organiser.role : 'viewer';
  const payloadObj = { exp, id: orgId, name: orgName, role: orgRole };
  const payloadStr = Buffer.from(JSON.stringify(payloadObj)).toString('base64url');
  const sig = mac(`scan:${payloadStr}`);
  return `${payloadStr}.${sig}`;
}

function checkToken(token) {
  const [payloadStr, sig] = String(token || '').split('.');
  if (!payloadStr || !sig) return null;
  const expectedSig = mac(`scan:${payloadStr}`);
  if (!safeEqual(sig, expectedSig)) return null;
  try {
    const data = JSON.parse(Buffer.from(payloadStr, 'base64url').toString('utf8'));
    if (!data.exp || Number(data.exp) < Date.now()) return null;
    return data; // { exp, id, name, role }
  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const auth = checkToken(token);
  if (!auth) {
    json(res, 401, { error: 'Organiser session expired or invalid. Please re-enter your PIN.' });
    return null;
  }
  req.auth = auth;
  return auth;
}

function requireSuperAdmin(req, res) {
  const auth = requireAuth(req, res);
  if (!auth) return null;
  if (auth.role !== 'super_admin') {
    json(res, 403, { error: 'Access Denied: Only Super Admin (Tarun Kushwaha) can edit and manage records.' });
    return null;
  }
  return auth;
}

module.exports = { issueToken, checkToken, requireAuth, requireSuperAdmin, safeEqual };
