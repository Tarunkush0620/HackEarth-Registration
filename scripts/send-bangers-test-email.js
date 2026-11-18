// Send official test confirmation email for Team Bangers (Team #107)
require('../lib/env');
const { buildCard } = require('../lib/qr');
const { buildInvoicePdf } = require('../lib/invoice');
const { sendConfirmation } = require('../lib/mailer');
const regCode = require('../lib/regcode');

async function main() {
  console.log('====================================================');
  console.log('   WIE HackEarth 2.0 - Team Bangers (#107) Test Email');
  console.log('====================================================');

  const code = regCode();

  const bangersReg = {
    id: 107,
    team_number: 107,
    team_id: '107',
    reg_code: code,
    team_name: 'Bangers',
    track: 'ai-social-good',
    idea_title: 'Smart AI Agent for Community Action',
    college: 'Galgotias University',
    city: 'Greater Noida',
    unstop_team_id: 'UNSTOP-BNG107',
    leader_name: 'Sagar Pathak',
    leader_email: 'tarunkushwaha5656@gmail.com',
    leader_phone: '9876543210',
    emergency_name: 'Rajesh Pathak',
    emergency_relation: 'Parent',
    emergency_phone: '9811223344',
    members: [
      {
        name: 'Sagar Pathak',
        email: 'tarunkushwaha5656@gmail.com',
        gender: 'male',
        phone: '9876543210',
        rollNumber: 'GU22BTECH107',
      },
      {
        name: 'Tarun Kushwaha',
        email: 'tarunkush4545@gmail.com',
        gender: 'male',
        phone: '9876543211',
        rollNumber: '24SCSE1180294',
      },
    ],
    amount_paise: 40000,
    is_all_female: false,
    need_stay: false,
    stay_count: 0,
    stay_fee_paise: 0,
    razorpay_order_id: 'order_test_bng_107',
    razorpay_payment_id: 'pay_test_bng_107',
    status: 'paid',
    paid_at: new Date().toISOString(),
  };

  console.log('1. Generating official RSVP QR Pass for Team #107 (Bangers)...');
  const png = await buildCard({
    teamName: bangersReg.team_name,
    regCode: bangersReg.reg_code,
    trackId: bangersReg.track,
    isAllFemale: bangersReg.is_all_female,
    needStay: bangersReg.need_stay,
    stayCount: bangersReg.stay_count,
    teamId: bangersReg.team_id,
  });
  console.log('   ✓ QR Pass card generated successfully (' + png.length + ' bytes)');

  console.log('2. Generating official Tax Invoice PDF for Team #107...');
  const pdf = await buildInvoicePdf(bangersReg);
  console.log('   ✓ Tax Invoice PDF generated successfully (' + pdf.length + ' bytes)');

  console.log('3. Dispatching official email via IEEE Gmail SMTP...');
  console.log('   - To: ' + bangersReg.members[0].email);
  console.log('   - CC: ' + bangersReg.members[1].email);

  await sendConfirmation(bangersReg, png, pdf);

  console.log('\n====================================================');
  console.log('🎉 SUCCESS! Confirmation email for Team Bangers (#107) sent!');
  console.log('👉 Dispatched to:');
  console.log('   1. tarunkushwaha5656@gmail.com');
  console.log('   2. tarunkush4545@gmail.com');
  console.log('   Registration Code: ' + code);
  console.log('   Team ID: TEAM #107');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('❌ Failed to send email:', err);
  process.exit(1);
});

