require('./env');
const Razorpay = require('razorpay');
let rzp;
module.exports = function razorpay() {
  if (!rzp) {
    rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return rzp;
};
