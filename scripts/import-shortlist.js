// Load Round 1 qualified teams from a CSV into the `shortlist` table.
// CSV header: email,team_name,unstop_team_id   (team_name and unstop_team_id optional)
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/import-shortlist.js shortlist.csv
const fs = require('fs');
const getDb = require('../lib/db');

(async () => {
  const file = process.argv[2];
  if (!file) { console.error('Usage: node scripts/import-shortlist.js shortlist.csv'); process.exit(1); }
  const [head, ...lines] = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(Boolean);
  const cols = head.split(',').map((c) => c.trim().toLowerCase());
  const rows = lines.map((l) => {
    const cells = l.split(',').map((c) => c.trim());
    const r = Object.fromEntries(cols.map((c, i) => [c, cells[i] || null]));
    return { email: String(r.email || '').toLowerCase(), team_name: r.team_name, unstop_team_id: r.unstop_team_id };
  }).filter((r) => r.email.includes('@'));
  const { error } = await getDb().from('shortlist').upsert(rows, { onConflict: 'email' });
  if (error) throw error;
  console.log(`Imported ${rows.length} teams`);
})().catch((e) => { console.error(e); process.exit(1); });
