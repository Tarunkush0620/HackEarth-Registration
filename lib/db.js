require('./env');
const { createClient } = require('@supabase/supabase-js');

function getServiceKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SECRET ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();
}

let client;
module.exports = function db() {
  if (!client) {
    const url = (process.env.SUPABASE_URL || 'https://vdeduahdpowgghovxbim.supabase.co').trim();
    const key = getServiceKey();
    client = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return client;
};
