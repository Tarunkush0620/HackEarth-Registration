// Script to test Supabase connection and verify tables
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read from .env or command line argument
let sbUrl = process.argv[2];
let sbKey = process.argv[3];

if (!sbUrl || !sbKey) {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const l of lines) {
      const trimmed = l.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq !== -1) {
        const k = trimmed.slice(0, eq).trim();
        const v = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
        if (k === 'SUPABASE_URL' && !sbUrl) sbUrl = v;
        if (k === 'SUPABASE_SERVICE_ROLE_KEY' && !sbKey) sbKey = v;
      }
    }
  }
}

async function testConnection() {
  console.log('==============================================');
  console.log('   WIE HackEarth 2.0 - Supabase Health Check   ');
  console.log('==============================================');

  if (!sbUrl || sbUrl.includes('xxxx') || !sbUrl.startsWith('http')) {
    console.log('❌ SUPABASE_URL is missing or contains placeholder "xxxx".');
    console.log('   Usage: node scripts/test-supabase.js https://<project-ref>.supabase.co');
    console.log('   Or update SUPABASE_URL in your .env file.\n');
    return;
  }

  if (!sbKey || sbKey.includes('...')) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY is missing or invalid.\n');
    return;
  }

  console.log(`Connecting to URL: ${sbUrl}`);
  console.log(`Using Secret Key : ${sbKey.slice(0, 15)}...${sbKey.slice(-6)}`);

  const supabase = createClient(sbUrl, sbKey, { auth: { persistSession: false } });

  try {
    // 1. Test query on registrations table
    console.log('\nChecking "registrations" table...');
    const { data: regData, error: regError } = await supabase.from('registrations').select('id, team_id, team_number, team_name').limit(5);

    if (regError) {
      if (regError.code === '42P01') {
        console.log('❌ "registrations" table does NOT exist yet.');
        console.log('👉 ACTION: Open Supabase Dashboard > SQL Editor, paste "supabase/schema.sql" and click RUN.');
      } else {
        console.log(`❌ Error querying registrations: ${regError.message} (code: ${regError.code})`);
      }
    } else {
      console.log(`✓ "registrations" table is ONLINE! (Found ${regData.length} records)`);
      if (regData.length > 0) {
        console.log('  Recent teams:', regData.map(r => `#${r.team_id || r.team_number || 'N/A'}: ${r.team_name}`).join(', '));
      }
    }

    // 2. Test query on shortlist table
    console.log('\nChecking "shortlist" table...');
    const { data: shortData, error: shortError } = await supabase.from('shortlist').select('email').limit(1);

    if (shortError) {
      if (shortError.code === '42P01') {
        console.log('❌ "shortlist" table does NOT exist yet. (Run supabase/schema.sql in SQL Editor)');
      } else {
        console.log(`❌ Error querying shortlist: ${shortError.message}`);
      }
    } else {
      console.log(`✓ "shortlist" table is ONLINE!`);
    }

    console.log('\n==============================================');
    console.log('🎉 Supabase connection test complete!');
    console.log('==============================================\n');
  } catch (err) {
    console.error('Connection failed:', err.message);
  }
}

testConnection();

