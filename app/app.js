var AWS = require('aws-sdk'); // SDK for Nodejs. 
var docClient; // AWS.DynamoDB.DocumentClient();

var globalSerial; // Pi Serial Number

var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(26, 'out'); //use GPIO pin 26 as output
var pushButton = new Gpio(13, 'in', 'both', {debounceTimeout: 100}); //use GPIO pin 13 as input, and 'both' button presses, and releases should be handled

const util = require('util');  // required to execute linux command
const exec = util.promisify(require('child_process').exec); // execute linux command

var arn_sns; // arn of sns topic to send message to our phone

fMain(); // main function

async function fMain() {
  try {  // try to execute
    var d = new Date();
    console.log("=================================");
    console.log("=================================");
    console.log(`doorSensor service is UP! -> ${d}`);
    exec('gpio -g mode 13 down'); // enable pulldown resistor for GPIO 13
    globalSerial = await fnSerial();  // get pi serial number
    console.log(`Serial number: ${globalSerial}`);
    var myRegion = await fnRegion();  // get AWS region from AWS configure
    console.log(`Region ${myRegion}`);
    var user = await fnUser();  // get linux user
    console.log(`User: ${user}`);

    AWS.config.update({region: myRegion});
    docClient = new AWS.DynamoDB.DocumentClient();  // client to use with dynamoDB
    
    // Parameter Store
    const awsParamStore = require( 'aws-param-store' );
    //this command is sync, NOT async
    let parameter = awsParamStore.getParameterSync( '/doorSensor/sns_arn', {region: myRegion});
    arn_sns = parameter.Value;
    console.log(`SNS topic ARN ${arn_sns}`);
    // Parameter Store end
    
    var ButtonStatus = pushButton.readSync();
    var status;
    if (ButtonStatus == 0) {
      LED.write(1);
      status = "Open!"
    } else {
      LED.write(0);
      status = "Closed!"
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
  // sendMessage(status);

});

async function fnSerial() { // return Pi Serial Number
  const { stdout, stderr } = await exec('cat /proc/cpuinfo | grep Serial');
  // console.log('stdout:', stdout);
  var serialSplit = stdout.split(":");
  var serialOnly = serialSplit[1].trim();
  return serialOnly;
}

async function fnRegion() {  // return AWS region 
  const { stdout, stderr } = await exec('cat ~/.aws/config | grep region');
  // console.log('stdout:', stdout);
  // console.log('stderr:', stderr);
  var splited = stdout.split("=");
  var Region = splited[1].trim();
  return Region;
}

async function fnUser() {  // return AWS region 
  const { stdout, stderr } = await exec('whoami');
  // console.log('stdout:', stdout);
  // console.log('stderr:', stderr);
  return stdout;
}

function writeToDynamoDB(status) { // putItem on dynamoDB table
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
  var d = new Date();
  var textmessage = new AWS.SNS({apiVersion: '2010-03-31'});
  textmessage.publish({
    Message: `Device ${globalSerial}: Door is:${status} on ${d}`,  /* required */
    TopicArn: arn_sns
  },
    function(err,data) {
      if (err) {
        console.error(err, err.stack);
        return;
      }
      console.log(data);    
  });
}

function unexportOnClose() { //function to run when exiting program
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
};

process.on('SIGINT', unexportOnClose); //run when user closes using ctrl+c