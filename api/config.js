const { json } = require('../lib/http');
const cfg = require('../lib/config');

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=300');
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify({
    eventName: cfg.EVENT_NAME,
    dates: cfg.EVENT_DATES,
    venue: cfg.EVENT_VENUE,
    fee: cfg.FEE_INR,
    allFemaleFee: cfg.ALL_FEMALE_FEE_INR,
    accommodationFeePerPerson: cfg.ACCOMMODATION_FEE_PER_PERSON_INR,
    minMembers: cfg.MIN_MEMBERS,
    maxMembers: cfg.MAX_MEMBERS,
    tracks: cfg.TRACKS,
  }));
};
