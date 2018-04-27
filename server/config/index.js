var mongoHost = process.env.MONGOHOST || 'localhost';
var serverPort = process.env.PORT || 8000;
var serverHost = process.env.HOST || '0.0.0.0';
var etherHost = process.env.ETHERHOST || 'https://eth.chriamue.de';
var etherAccount = process.env.ETHERACCOUNT || '0xBcEFCB24Cc0a821C919A89C7A33B594CC3A6265C';
var etherPassword = process.env.ETHERPASSWORD || 'betoracle3';
//'impoleampoic';
// hullyounneli


module.exports = {
    mongourl: 'mongodb://' + mongoHost + '/bet_oracle',
    serverPort: serverPort,
    serverHost: serverHost,
    etherHost: etherHost,
    etherAccount: etherAccount,
    etherPassword: etherPassword
};
