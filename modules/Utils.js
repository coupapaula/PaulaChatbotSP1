const axios = require('axios');
const log = require('cf-nodejs-logging-support');
const uaa = require('predix-uaa-client');
const url = require('url');
//const xsenv = require('@sap/xsenv');
const Destination = require('./Destination');

/*********************************************************
 * Parse env variable to find services
 *********************************************************/
//const services = xsenv.getServices({
//'destination': 'pocs-destination-service',
//'uaa': 'pocs-xsuaa'
//});

/*********************************************************
 * Some variables to cache destinations
*********************************************************/
const MAX_AGE_IN_MS = 20 * 60 * 1000; // 20 minutes
const UAA_MAX_AGE_IN_MS = 50 * 60 * 1000; // 50 minutes
var destinationsCache = {};
var uaaCache = {};
var oauthTokenCache = [];


class Utils {
/*********************************************************
* Get Service Credentials by Name
*********************************************************/
static getServiceByName(name) {
return services[name];
}

/*********************************************************
* Request token for service from XSUAA
* (e.g. connectivity or destination service)
*********************************************************/
static getJWTTokenForService(service) {
return new Promise((resolve, reject) => {
//if (typeof (service) === 'string') {
// service = Utils.getServiceByName(service);
//}

//if (uaaCache[service] && uaaCache[service]._timestamp + UAA_MAX_AGE_IN_MS > Date.now()) {
// // we could check if the destination is valid for less than e.g. one minute and refresh the cache (but resolving immediately)
// resolve(uaaCache.token);
//} else {
// let clientId;
// let clientSecret;

// //Something special needs to happen for the Business Rules services
// if (service['sap.cloud.service'] != undefined && service['sap.cloud.service'] == 'com.sap.bpm.rule') {
// clientId = service.uaa.clientid;
// clientSecret = service.uaa.clientsecret;
// } else {
// clientId = service.clientid;
// clientSecret = service.clientsecret;
// }

// uaa
// .getToken(services.uaa.url + "/oauth/token", clientId, clientSecret)
// .then(token => {
// uaaCache = { service: { token: token.access_token, _timestamp: Date.now() } };
// //token.access_token
resolve('8f12c7bb-390c-499b-addb-74dcd9b0c01c');
// });
//}
});
}

/*********************************************************
* Execute destination from name
*********************************************************/
static executeDestination(parameters) {
let { path, destination, method, body, headers } = parameters;

// Get the destinations
return new Promise(async function (resolve, reject) {
//let oauthCache = oauthTokenCache.find(el => el.name == destination);
//let authDetails = undefined;

////oauthCache = { name: 'destination', timestamp: '...', details: 'destination }
//if (oauthCache != undefined && oauthCache.timestamp + MAX_AGE_IN_MS > Date.now()) {
// authDetails = oauthCache.details;
//}

//if (authDetails == undefined) {
// //Get the destination details
// authDetails = await Utils.getDestinationFromName(destination);
//}

////Utils.getDestinationFromName(destination).then((dest) => {
//let dest = authDetails;
//console.log(dest.destinationConfiguration.URL + path);

////Update the cache
//let index = oauthTokenCache.findIndex(el => el.name == destination);

//if (index == -1) {
// oauthCache = {};
// oauthCache.name = destination;
// oauthCache.timestamp = Date.now();
// oauthCache.details = dest;
// oauthTokenCache.push(oauthCache);
//} else {
// oauthTokenCache[index].timestamp = Date.now();
// oauthTokenCache[index].details = dest;
//}

//if (headers == undefined) {
// console.log('Undefined headers...');
// headers = {};
//}

//if (dest.destinationConfiguration.hasOwnProperty('apikey')) {
// headers['apikey'] = dest.destinationConfiguration.apikey;
//}

////Add the authorization
//let authType = dest.authTokens[0].type;
//headers['Authorization'] = (authType.charAt(0).toUpperCase() + authType.substring(1)) + ' ' + dest.authTokens[0].value;

console.log('Executing ...:' + JSON.stringify(headers));
axios({
method: method,
url: path,
data: body,
headers: headers
}).then(data => {
console.log('Returning data');
resolve(data.data);
}).catch(error => {
console.log('Error2: ' + JSON.stringify(error));
//log.error('LOG : ' + JSON.stringify(error));
reject(error);
});
/*}).catch(error => {
log.error(JSON.stringify(error));
reject(error);
});*/
});
}

    /*********************************************************
* Destination details for service from DESTINATION
*********************************************************/
static getDestinationFromName(name) {
const destination = Utils.getServiceByName("destination");
return new Promise((resolve, reject) => {
if (destinationsCache[name] && destinationsCache[name]._timestamp + MAX_AGE_IN_MS > Date.now()) {
resolve(destinationsCache[name]);
// we could check if the destination is valid for less than e.g. one minute and refresh the cache (but resolving immediately)
return;
}

Utils.getJWTTokenForService(destination)
.then(token => {
var uri = {};
try {
uri = url.parse(destination.uri + "/destination-configuration/v1/destinations/" + name);
}
catch (e) {
reject("destination service error - see logs");
return;
}

var options = {
protocol: uri.protocol,
host: uri.host,
port: uri.port,
path: uri.path,
headers: {}
};

options.headers['Authorization'] = "Bearer " + token;

axios.get(uri.protocol + '//' + uri.host + uri.path, {
headers: {
'Authorization': 'Bearer ' + token
}
}).then((response) => {
console.log('Desttttttt: ' + JSON.stringify(response.data));
destinationsCache[name] = new Destination(response.data);
resolve(destinationsCache[name]);
}).catch((error) => {
console.error(error);
reject("destination service error - see logs");
});
})
});
}

    /*********************************************************
* Get country flags
*********************************************************/
static getCountryFlag(element, country, parent) {
let tempElement = element;

return new Promise(function (resolve, reject) {
axios.get('https://restcountries.eu/rest/v2/name/' + country)
.then(response => {
let codes = response.data;

if (codes.length > 0) {
let alpha2Code = codes[0].alpha2Code;
console.log('Ok got a country: ' + alpha2Code);
tempElement.imageUrl = "https://www.countryflags.io/" + alpha2Code + "/flat/64.png";
resolve(tempElement);
}
}).catch(error => {
axios.get('https://restcountries.eu/rest/v2/name/' + parent)
.then(response2 => {
let codes2 = response2.data;

if (codes2.length > 0) {
let alpha2Code2 = codes2[0].alpha2Code
tempElement.imageUrl = "https://www.countryflags.io/" + alpha2Code2 + "/flat/64.png";
resolve(tempElement);
} else {
tempElement.imageUrl = "https://upload.wikimedia.org/wikipedia/commons/b/b0/No_flag.svg"
resolve(tempElement);
}
}).catch(error => {
tempElement.imageUrl = "https://upload.wikimedia.org/wikipedia/commons/b/b0/No_flag.svg"
resolve(tempElement);
});
});
});
}
}

module.exports = Utils;