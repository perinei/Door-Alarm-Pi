var AWS = require('aws-sdk');
var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});
const awsParamStore = require( 'aws-param-store' );

let parameter = awsParamStore.getParameterSync( '/doorSensor/arn_sns', {region: 'us-east-1'});
console.log(parameter);