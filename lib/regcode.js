const crypto = require('crypto');
// No 0/O/1/I so codes are easy to read out at the entry desk
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
module.exports = function regCode() {
  let s = '';
  for (let i = 0; i < 6; i++) s += ALPHABET[crypto.randomInt(ALPHABET.length)];
  return `HE26-${s}`;
};
