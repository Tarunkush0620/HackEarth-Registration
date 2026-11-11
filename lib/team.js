// What organisers can view about a team (Full comprehensive access for organizers)
const FIELDS = 'id,team_number,team_id,reg_code,status,team_name,track,idea_title,college,city,unstop_team_id,leader_name,leader_email,leader_phone,emergency_name,emergency_relation,emergency_phone,members,amount_paise,is_all_female,need_stay,stay_count,stay_fee_paise,razorpay_order_id,razorpay_payment_id,paid_at,checked_in,checked_in_at,checked_in_by';

const brief = (r) => {
  const members = (r.members || []).map((m, idx) => ({
    name: m.name,
    email: m.email,
    gender: m.gender,
    phone: m.phone,
    rollNumber: m.rollNumber,
    role: m.role || (idx === 0 ? 'leader' : 'member'),
    present: m.present !== false, // default true when team checked in, false if marked absent
  }));

  const presentCount = members.filter((m) => m.present).length;
  const teamNum = r.team_number || (r.team_id ? parseInt(r.team_id, 10) : (typeof r.id === 'number' ? r.id : 1));
  const teamId = r.team_id || (teamNum ? String(teamNum).padStart(3, '0') : '001');

  return {
    id: r.id,
    teamNumber: teamNum,
    teamId: teamId,
    code: r.reg_code,
    team: r.team_name,
    track: r.track,
    ideaTitle: r.idea_title || '',
    college: r.college,
    city: r.city || '',
    unstopTeamId: r.unstop_team_id || '',
    leaderName: r.leader_name,
    leaderEmail: r.leader_email,
    leaderPhone: r.leader_phone,
    emergencyName: r.emergency_name,
    emergencyRelation: r.emergency_relation,
    emergencyPhone: r.emergency_phone,
    members,
    presentCount,
    totalMembers: members.length,
    amountPaise: r.amount_paise || 0,
    amountInr: r.amount_paise ? Math.round(r.amount_paise / 100) : 0,
    isAllFemale: !!r.is_all_female,
    needStay: !!r.need_stay,
    stayCount: r.stay_count || 0,
    stayFeeInr: r.stay_fee_paise ? Math.round(r.stay_fee_paise / 100) : 0,
    razorpayOrderId: r.razorpay_order_id || '',
    razorpayPaymentId: r.razorpay_payment_id || '',
    paidAt: r.paid_at || null,
    checkedIn: !!r.checked_in,
    checkedInAt: r.checked_in_at || null,
    checkedInBy: r.checked_in_by || null,
  };
};

module.exports = { FIELDS, brief };
