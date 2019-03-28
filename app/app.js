var globalSerial;
var myRegion;
myRegion = await fnRegion();
console.log(myRegion);

var AWS = require('aws-sdk');
// var credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
// AWS.config.credentials = credentials;
AWS.config.update({region: 'us-east-1'});
var docClient = new AWS.DynamoDB.DocumentClient();
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(26, 'out'); //use GPIO pin 26 as output
var pushButton = new Gpio(13, 'in', 'both'); //use GPIO pin 13 as input, and 'both' button presses, and releases should be handled
const util = require('util');
const exec = util.promisify(require('child_process').exec);

// Parameter Store
const awsParamStore = require( 'aws-param-store' );
let parameter = awsParamStore.getParameterSync( '/doorSensor/sns_arn', {region: 'us-east-1'});
var arn_sns = parameter.Value;
console.log(arn_sns);
// Parameter Store end



fMain();

async function fMain() {
  try {
    console.log(`doorSensor service is UP!`);
    globalSerial = await fnSerial();
    myRegion = await fnRegion();
    console.log(myRegion);
    var ButtonStatus = pushButton.readSync();
    var status;
    if (ButtonStatus == 0) {
      LED.write(1);
      status = "Door is Open"
    } else {
      LED.write(0);
      status = "Door is Closed"
    }
      writeToDynamoDB(status);
      // sendMessage(status);
  } catch (error) {
    console.error(error);
  }
}

pushButton.watch(async function (err, value) { //Watch for hardware interrupts on pushButton GPIO, specify callback function
  if (err) { //if an error
    console.error('There was an error', err); //output error message to console
  return;
  }
  var status;
  if (value == 1) {
    LED.write(0);
    status = "Closed"
  } else
  {
    LED.write(1);
    status = "Opened"
  }
  writeToDynamoDB(status);
  sendMessage(status);
  
  LED.writeSync(value); //turn LED on or off depending on the button state (0 or 1)
});

async function fnSerial() {
  const { stdout, stderr } = await exec('cat /proc/cpuinfo | grep Serial');
  // console.log('stdout:', stdout);
  // console.log('stderr:', stderr);
  var serialSplit = stdout.split(":");
  var serialOnly = serialSplit[1].trim();
  // console.log(serial1);
  return serialOnly;
}

async function fnRegion() {
  const { stdout, stderr } = await exec('cat ~/.aws/config | grep region');
  // console.log('stdout:', stdout);
  // console.log('stderr:', stderr);
  var splited = stdout.split("=");
  var Region = splited[1].trim();
  return Region;
}

function writeToDynamoDB(status) {
  var d = new Date();
  var seconds = Math.round(d.getTime() / 1000);
  
  var params = {
    Item: {
     "Serial": globalSerial,
     "date_time": seconds,
     "status": status     
    },     
    ReturnConsumedCapacity: "TOTAL", 
    TableName: "door_sensor"
   };

   docClient.put(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response  
 });
}

function sendMessage(status) {
    // Create publish parameters
    var d = new Date();
    var params = {
    Message: `${globalSerial}: Door:${status} on ${d}`,  /* required */
    TopicArn: arn_sns
  };

  // Create promise and SNS service object
  var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

  // Handle promise's fulfilled/rejected states
  publishTextPromise.then(
    function(data) {
      console.log(`Message ${params.Message} send sent to the topic ${params.TopicArn}`);
      console.log("MessageID is " + data.MessageId);
    }).catch(
    function(err) {
      console.error(err, err.stack);
  });
}

function unexportOnClose() { //function to run when exiting program
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
};

process.on('SIGINT', unexportOnClose); //run when user closes using ctrl+c
