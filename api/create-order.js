const getDb = require('../lib/db');
const razorpay = require('../lib/razorpay');
const { json, readJson } = require('../lib/http');
const { validate } = require('../lib/validate');
const { FEE_INR } = require('../lib/config');
const regCode = require('../lib/regcode');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return json(res, 405, { error: 'Method not allowed' });
  try {
    const { errors, data: d } = validate(await readJson(req));
    if (errors) return json(res, 422, { errors });

    const db = getDb();
    const leader = d.members[0];

    // 1. Only Round 1 qualified teams may pay
    if (process.env.REQUIRE_SHORTLIST === 'true') {
      const { data: row, error } = await db.from('shortlist').select('email').eq('email', leader.email).maybeSingle();
      if (error) throw error;
      if (!row) {
        return json(res, 403, {
          errors: { 'member0.email': 'This email is not on the Round 1 shortlist. Use the team leader email you used on Unstop.' },
        });
      }
    }

    // 2. Already paid? (same team name, or same leader email)
    const [byName, byEmail] = await Promise.all([
      db.from('registrations').select('id').eq('status', 'paid').eq('team_name_key', d.teamNameKey).limit(1),
      db.from('registrations').select('id').eq('status', 'paid').eq('leader_email', leader.email).limit(1),
    ]);
    if (byName.error) throw byName.error;
    if (byEmail.error) throw byEmail.error;
    if (byName.data.length) return json(res, 409, { errors: { teamName: 'A team with this name has already registered.' } });
    if (byEmail.data.length) return json(res, 409, { errors: { 'member0.email': 'This leader email has already completed registration.' } });

    // 3. Clear this leader's earlier unpaid attempts
    await db.from('registrations').delete().eq('leader_email', leader.email).eq('status', 'pending');

    // 4. Razorpay order (amount is decided here on the server, never by the browser)
    const code = regCode();
    const feeInr = d.fee;
    const amount = d.amountPaise || (feeInr * 100);

    // Compute sequential team ID starting from 001
    const { data: latestRows } = await db.from('registrations').select('team_number').order('team_number', { ascending: false }).limit(1);
    const nextNum = (latestRows && latestRows.length && latestRows[0].team_number) ? (latestRows[0].team_number + 1) : 1;
    const teamId = String(nextNum).padStart(3, '0');

    const order = await razorpay().orders.create({
      amount,
      currency: 'INR',
      receipt: code,
      notes: {
        team: d.teamName,
        team_id: teamId,
        reg_code: code,
        leader: leader.email,
        all_female: String(d.isAllFemale),
        need_stay: String(d.needStay),
        stay_count: String(d.stayCount),
      },
    });

    // 5. Save as pending
    const { error: insErr } = await db.from('registrations').insert({
      team_number: nextNum,
      team_id: teamId,
      reg_code: code,
      status: 'pending',
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
      members: d.members,
      amount_paise: amount,
      is_all_female: d.isAllFemale,
      need_stay: d.needStay,
      stay_count: d.stayCount,
      stay_fee_paise: d.stayFee * 100,
      razorpay_order_id: order.id,
    });
    if (insErr) throw insErr;

    return json(res, 200, {
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount,
      fee: feeInr,
      regFee: d.regFee,
      stayFee: d.stayFee,
      needStay: d.needStay,
      stayCount: d.stayCount,
      isAllFemale: d.isAllFemale,
      currency: 'INR',
      teamId,
      teamNumber: nextNum,
      regCode: code,
      prefill: { name: leader.name, email: leader.email, contact: d.leaderPhone },
    });
  } catch (err) {
    console.error('create-order failed', err);
    return json(res, 500, { error: 'Could not start the payment. Please try again in a minute.' });
  }
};
