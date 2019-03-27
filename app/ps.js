var AWS = require('aws-sdk');
var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});

const awsParamStore = require( 'aws-param-store' );

awsParamStore.getParametersByPath( '/arn_sns' )
    .then( (parameters) => {

        console.log(parameters);
        return parameters;
    });
