const { json, readJson } = require('../lib/http');
const { processRegistration } = require('../lib/register');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const body = await readJson(req);
    const result = await processRegistration(body);
    return json(res, result.status, result.data || { errors: result.errors, error: result.error });
  } catch (err) {
    console.error('Registration processing failed:', err);
    return json(res, 500, { error: 'Registration could not be completed. Please check your details and try again.' });
  }
};

