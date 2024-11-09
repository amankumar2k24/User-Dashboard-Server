const otplib = require("otplib");

const issuer = 'UserDashboard';  
const account = 'aman.kumar2k15@gmail.com'; 

const secret = otplib.authenticator.generateSecret();

const qrCodeUrl = otplib.authenticator.keyuri(account, issuer, secret);

console.log(qrCodeUrl);

module.exports = qrCodeUrl ;
