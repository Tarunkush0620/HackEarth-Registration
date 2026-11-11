require('./env');
const { createClient } = require('@supabase/supabase-js');
let client;
module.exports = function db() {
  if (!client) {
    client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return client;
};
