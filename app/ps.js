var AWS = require('aws-sdk');
var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});
const awsParamStore = require( 'aws-param-store' );

let parameter = awsParamStore.getParameterSync( '/doorSensor/sns_arn', {region: 'us-east-1'});
let arn_sns = parameter.Value
console.log(arn_sns);
