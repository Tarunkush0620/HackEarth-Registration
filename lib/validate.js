const { TRACKS, MIN_MEMBERS, MAX_MEMBERS, FEE_INR, ALL_FEMALE_FEE_INR, ACCOMMODATION_FEE_PER_PERSON_INR } = require('./config');
const { verifyMemberGender, evaluateTeamDiscount } = require('./gender-verify');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const clean = (s, max = 120) => String(s ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

function validate(body = {}) {
  const errors = {};

  const teamName = clean(body.teamName, 40);
  if (teamName.length < 3) errors.teamName = 'Enter your team name (3–40 characters).';

  const college = clean(body.college, 120);
  if (college.length < 3) errors.college = 'Enter your college or university.';

  const track = TRACKS.find((t) => t.id === body.track);
  if (!track) errors.track = 'Choose one track.';

  const rawMembers = Array.isArray(body.members) ? body.members.slice(0, MAX_MEMBERS) : [];
  if (rawMembers.length < MIN_MEMBERS) errors.members = `A team needs ${MIN_MEMBERS}–${MAX_MEMBERS} members.`;

  const seen = new Set();
  const members = rawMembers.map((m, i) => {
    const name = clean(m?.name, 80);
    const email = clean(m?.email, 120).toLowerCase();
    const gender = clean(m?.gender, 20).toLowerCase();
    const phone = String(m?.phone ?? '').replace(/[\s\-()]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
    const rollNumber = clean(m?.rollNumber, 40).toUpperCase();

    if (name.length < 2) errors[`member${i}.name`] = 'Enter the full name.';
    if (!EMAIL_RE.test(email)) errors[`member${i}.email`] = 'Enter a valid email address.';
    else if (seen.has(email)) errors[`member${i}.email`] = 'This email is used twice in your team.';
    seen.add(email);

    if (!/^[6-9]\d{9}$/.test(phone)) {
      errors[`member${i}.phone`] = 'Enter a valid 10-digit mobile number.';
    }

    if (rollNumber.length < 2) {
      errors[`member${i}.rollNumber`] = 'Enter college roll or student ID number.';
    }

    const genderErr = verifyMemberGender(name, email, gender, i === 0 ? 'Leader' : `Member ${i + 1}`);
    if (genderErr) errors[`member${i}.gender`] = genderErr;

    return { name, email, gender, phone, rollNumber, role: i === 0 ? 'leader' : 'member' };
  });

  const discountInfo = evaluateTeamDiscount(members);

  // Accommodation calculations (only details collected right now, no payment taken on portal)
  const needStay = body.needStay === true || ['yes', 'true', '1'].includes(String(body.needStay || '').toLowerCase().trim());
  let stayCount = 0;
  let stayFee = 0;
  if (needStay) {
    const rawCount = parseInt(body.stayCount, 10);
    stayCount = (rawCount >= 1 && rawCount <= members.length) ? rawCount : members.length;
    // Accommodation fee is NOT collected on this portal right now (₹0 charged on portal)
    stayFee = 0;
  }
  const regFee = discountInfo.fee;
  const totalFee = regFee;

  const leaderPhone = members[0]?.phone || String(body.leaderPhone ?? '').replace(/[\s\-()]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(leaderPhone)) errors.leaderPhone = 'Enter a valid 10-digit mobile number.';

  // Emergency contact validation
  const emergencyPhone = String(body.emergencyPhone ?? '').replace(/[\s\-()]/g, '').replace(/^(\+91|91|0)(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(emergencyPhone)) {
    errors.emergencyPhone = 'Enter a valid 10-digit emergency contact phone number.';
  } else if (members.some((m) => m.phone && m.phone === emergencyPhone)) {
    errors.emergencyPhone = 'Emergency number should be a parent or guardian, not a team member.';
  }

  const emergencyName = clean(body.emergencyName, 80);
  if (emergencyName.length < 2) {
    errors.emergencyName = 'Enter parent or guardian full name.';
  }
  const emergencyRelation = clean(body.emergencyRelation, 40) || 'Parent';

  // Paytm Transaction ID and UPI UTR validation with strict format rules
  const txnId = clean(body.txnId || body.paytmTxnId || body.razorpay_payment_id, 80).replace(/\s/g, '');
  const utrNumber = clean(body.utrNumber || body.utr || body.upiUtr, 40).replace(/[\s-]/g, '');

  if (!txnId && !utrNumber) {
    errors.txnId = 'Enter your Paytm Transaction ID or 12-digit UPI UTR number.';
  } else {
    if (txnId && txnId.length < 6) {
      errors.txnId = 'Paytm Transaction ID should be at least 6 characters.';
    }
    if (utrNumber && !/^\d{12}$/.test(utrNumber)) {
      errors.utrNumber = 'UPI UTR must be an exact 12-digit numeric number (e.g. 405234123456).';
    }
  }

  // Payment proof screenshot validation
  const paymentProof = body.paymentProof || body.proofBase64 || body.paymentScreenshot || '';
  if (!paymentProof || (typeof paymentProof === 'string' && paymentProof.length < 20)) {
    errors.paymentProof = 'Please upload a screenshot of your payment receipt.';
  }

  if (body.consent !== true) errors.consent = 'Please confirm to continue.';

  if (Object.keys(errors).length) return { errors };

  return {
    data: {
      teamName,
      teamNameKey: teamName.toLowerCase(),
      college,
      city: clean(body.city, 60) || null,
      unstopTeamId: clean(body.unstopTeamId, 60) || null,
      ideaTitle: clean(body.ideaTitle, 120) || null,
      track: track.id,
      trackLabel: track.label,
      txnId: txnId || utrNumber,
      paytmTxnId: txnId,
      utrNumber,
      paymentProof,
      leaderPhone,
      emergencyName,
      emergencyRelation,
      emergencyPhone,
      members,
      isAllFemale: discountInfo.isAllFemale,
      regFee,
      discount: discountInfo.discount,
      badge: discountInfo.badge,
      needStay,
      stayCount,
      stayFee,
      stayRate: ACCOMMODATION_FEE_PER_PERSON_INR,
      fee: totalFee,
      amountPaise: totalFee * 100,
    },
  };
}

module.exports = { validate };
