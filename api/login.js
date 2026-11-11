const { json, readJson } = require('../lib/http');
const { issueToken } = require('../lib/auth');
const { verifyOrganiserPin } = require('../lib/organisers');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  const { passcode, pin } = await readJson(req);
  const inputPin = String(pin || passcode || '').trim();

  const organiser = verifyOrganiserPin(inputPin);
  if (!organiser) {
    await new Promise((r) => setTimeout(r, 600)); // slow down brute-force attempts
    return json(res, 401, { error: 'Invalid Organiser PIN. Access restricted to authorized organisers only.' });
  }

  const token = issueToken(14, organiser);
  return json(res, 200, {
    token,
    organiser: {
      id: organiser.id,
      name: organiser.name,
      role: organiser.role,
    },
  });
};
