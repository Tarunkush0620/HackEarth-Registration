const getDb = require('./db');
const { validate } = require('./validate');
const { resolveTeam } = require('./roster');
const regCode = require('./regcode');
const { buildCard } = require('./qr');
const { buildInvoicePdf } = require('./invoice');
const { sendConfirmation } = require('./mailer');

async function processRegistration(body, { mockStore = null } = {}) {
  const { errors, data: d } = validate(body);
  if (errors) return { status: 422, errors };

  const leader = d.members[0];
  const db = (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) ? getDb() : null;

  // 1. Only Round 1 qualified teams may register (if enabled)
  if (db && process.env.REQUIRE_SHORTLIST === 'true') {
    const { data: row, error: sErr } = await db.from('shortlist').select('email').eq('email', leader.email).maybeSingle();
    if (sErr) throw sErr;
    if (!row) {
      return {
        status: 403,
        errors: { 'member0.email': 'This email is not on the Round 1 shortlist. Use the team leader email you used on Unstop.' },
      };
    }
  }

  // 2. Duplicate checks (same team name, same leader email, or duplicate transaction ID / UTR)
  if (db) {
    const checks = [
      db.from('registrations').select('id').eq('status', 'paid').eq('team_name_key', d.teamNameKey).limit(1),
      db.from('registrations').select('id').eq('status', 'paid').eq('leader_email', leader.email).limit(1),
    ];
    if (d.paytmTxnId) {
      checks.push(db.from('registrations').select('id').eq('status', 'paid').eq('razorpay_payment_id', d.paytmTxnId).limit(1));
    }
    if (d.utrNumber) {
      checks.push(db.from('registrations').select('id').eq('status', 'paid').eq('razorpay_payment_id', d.utrNumber).limit(1));
    }
    const results = await Promise.all(checks);
    if (results[0].data?.length) return { status: 409, errors: { teamName: 'A team with this name has already registered.' } };
    if (results[1].data?.length) return { status: 409, errors: { 'member0.email': 'This leader email has already completed registration.' } };
    if (d.paytmTxnId && results[2]?.data?.length) {
      return { status: 409, errors: { txnId: 'This Paytm Transaction ID has already been submitted by another team.' } };
    }
    const utrIdx = d.paytmTxnId ? 3 : 2;
    if (d.utrNumber && results[utrIdx]?.data?.length) {
      return { status: 409, errors: { utrNumber: 'This UPI UTR Number has already been submitted by another team.' } };
    }
  }

  // 3. Resolve team number & team ID (001-166) from official shortlist
  let fallbackNum = 167;
  if (db) {
    try {
      const { data: latestRows } = await db.from('registrations').select('team_number').order('team_number', { ascending: false }).limit(1);
      if (latestRows?.length && latestRows[0].team_number) {
        fallbackNum = Math.max(latestRows[0].team_number + 1, 167);
      }
    } catch {}
  }
  const resolved = resolveTeam(d.teamName, leader.name, fallbackNum);
  const teamNumber = resolved.teamNumber;
  const teamId = resolved.teamId;
  const panel = resolved.panel;
  const code = regCode();

  // 4. Upload payment screenshot to Supabase Storage bucket 'payment-proofs'
  let screenshotUrl = null;
  if (db && d.paymentProof && String(d.paymentProof).startsWith('data:')) {
    try {
      const mimeMatch = d.paymentProof.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : 'image/png';
      const base64Data = d.paymentProof.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const ext = mimeType.includes('jpeg') || mimeType.includes('jpg') ? 'jpg' : (mimeType.includes('pdf') ? 'pdf' : 'png');
      const fileName = `proof-${code}-${Date.now()}.${ext}`;

      const { error: upErr } = await db.storage
        .from('payment-proofs')
        .upload(fileName, buffer, { contentType: mimeType, upsert: true });

      if (!upErr) {
        const { data: urlData } = db.storage.from('payment-proofs').getPublicUrl(fileName);
        screenshotUrl = urlData?.publicUrl || null;
      } else {
        console.warn('Storage upload notice:', upErr.message);
      }
    } catch (e) {
      console.warn('Screenshot upload caught:', e.message);
    }
  }

  const regData = {
    team_number: teamNumber,
    team_id: teamId,
    reg_code: code,
    status: 'paid',
    team_name: d.teamName,
    team_name_key: d.teamNameKey,
    track: d.track,
    idea_title: d.ideaTitle,
    college: d.college,
    city: d.city,
    unstop_team_id: d.unstopTeamId,
    leader_name: leader.name,
    leader_email: leader.email,
    leader_phone: d.leaderPhone,
    emergency_name: d.emergencyName,
    emergency_relation: d.emergencyRelation,
    emergency_phone: d.emergencyPhone,
    members: d.members.map((m, idx) => (idx === 0 ? {
      ...m,
      payment_screenshot: screenshotUrl,
      paytm_txn_id: d.paytmTxnId || d.txnId,
      utr_number: d.utrNumber || '',
    } : m)),
    amount_paise: d.amountPaise,
    is_all_female: d.isAllFemale,
    need_stay: d.needStay,
    stay_count: d.stayCount,
    stay_fee_paise: d.stayFee * 100,
    paytm_txn_id: d.paytmTxnId || d.txnId,
    utr_number: d.utrNumber || '',
    payment_screenshot: screenshotUrl,
    razorpay_order_id: 'paytm_' + code,
    razorpay_payment_id: d.txnId,
    paid_at: new Date().toISOString(),
  };

  // 5. Save to database
  let savedReg = regData;
  if (db) {
    try {
      let { data: inserted, error: insErr } = await db.from('registrations').insert(regData).select().maybeSingle();
      // If table doesn't have the new payment columns yet, fallback gracefully
      if (insErr && insErr.message && insErr.message.includes('column')) {
        const legacyData = { ...regData };
        delete legacyData.paytm_txn_id;
        delete legacyData.utr_number;
        delete legacyData.payment_screenshot;
        const retry = await db.from('registrations').insert(legacyData).select().maybeSingle();
        if (!retry.error && retry.data) inserted = retry.data;
      }
      if (inserted) savedReg = inserted;
    } catch (dbErr) {
      console.warn('Database insert warning:', dbErr.message);
    }
  }
  if (mockStore) {
    mockStore.set('paytm_' + code, savedReg);
  }

  // 6. Build official RSVP pass card & PDF invoice
  const [png, pdf] = await Promise.all([
    buildCard({
      teamName: d.teamName,
      regCode: code,
      trackId: d.track,
      isAllFemale: d.isAllFemale,
      needStay: d.needStay,
      stayCount: d.stayCount,
      teamId,
    }),
    buildInvoicePdf(savedReg),
  ]);

  // 7. Send confirmation email to all team members
  let emailed = false;
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await sendConfirmation(savedReg, png, pdf);
      emailed = true;
      if (db) {
        await db.from('registrations').update({ email_sent_at: new Date().toISOString() }).eq('reg_code', code);
      }
    }
  } catch (mailErr) {
    console.error('Confirmation email sending failed for', code, mailErr);
  }

  return {
    status: 200,
    data: {
      ok: true,
      teamId,
      teamNumber,
      panel,
      regCode: code,
      teamName: d.teamName,
      isAllFemale: d.isAllFemale,
      needStay: d.needStay,
      stayCount: d.stayCount,
      fee: d.fee,
      emails: d.members.map((m) => m.email),
      emailed,
      qr: `data:image/png;base64,${png.toString('base64')}`,
      invoicePdf: `data:application/pdf;base64,${pdf.toString('base64')}`,
      paymentScreenshot: screenshotUrl,
      paytmTxnId: d.paytmTxnId || d.txnId,
      utrNumber: d.utrNumber || '',
    },
  };
}

module.exports = { processRegistration };

