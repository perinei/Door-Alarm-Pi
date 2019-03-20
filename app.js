var AWS = require('aws-sdk');
AWS.config.loadFromPath('./config.json');
// var dynamodb = new AWS.DynamoDB();
var docClient = new AWS.DynamoDB.DocumentClient();

var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(26, 'out'); //use GPIO pin 26 as output
var pushButton = new Gpio(13, 'in', 'both'); //use GPIO pin 13 as input, and 'both' button presses, and releases should be handled

console.log('Alarm is on');
// var fs = require('fs');

// // get serial

// const exec = require( 'child_process' ).exec;
// exec('cat /proc/cpuinfo | grep Serial',(error,stdout,stderr) => {
//     if(error){
//         console.error( `exec error: ${error}` );
//         return;
//     }

// var serial = stdout.split(":");
// serial = serial[1].trim();

//     console.log( `stdout: ${stdout}` );// this is your RPI serial number
//     console.log( `stderr: ${stderr}` );

// console.log(`(${serial})`);

// // create a file

// // include node fs module

 
// // writeFile function with filename, content and callback function
// fs.writeFile('serial.txt', serial, function (err) {
//   if (err) throw err;
//   console.log('File is created successfully.');
// }); 

// // create a file end //



// });

// // get serial end


// fs.readFile('serial.txt', 'utf8', function(err, contents) {
//   if (err) throw err;
//   console.log(contents);
  
// });
// console.log('after calling readFile');


var ButtonStatus = pushButton.readSync();
if (ButtonStatus == 0) {
  LED.write(1);
  console.log(ButtonStatus);
  // console.log(serial);
  writeToDynamoDB();
  sendMessage("Open");
}

pushButton.watch(function (err, value) { //Watch for hardware interrupts on pushButton GPIO, specify callback function
  if (err) { //if an error
    console.error('There was an error', err); //output error message to console
  return;
  }
  var alarm = 0;
  if (value == 1) {
    alarm = 0;
    sendMessage("Close");
    writeToDynamoDB("Close");
  } else
  {
    alarm = 1;
    console.log("writting to DB");
    writeToDynamoDB("Open");
    sendMessage("Open");
    console.log("done writting to DB");
  }
  LED.writeSync(alarm); //turn LED on or off depending on the button state (0 or 1)
  console.log(alarm);
});


function writeToDynamoDB(status) {
  var serial = serial;
  var d = new Date();
  var seconds = Math.round(d.getTime() / 1000);
  
  var params = {
    Item: {
     "date_time": seconds,
     "Status": status, 
     "Serial": "16464546464"
    },     
    ReturnConsumedCapacity: "TOTAL", 
    TableName: "office"
   };

   docClient.put(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response
  
  });

}

function unexportOnClose() { //function to run when exiting program
  LED.writeSync(0); // Turn LED off
  LED.unexport(); // Unexport LED GPIO to free resources
  pushButton.unexport(); // Unexport Button GPIO to free resources
};

function sendMessage(status) {
// Create publish parameters
var params = {
  Message: `Office door:${status}`,  /* required */
  TopicArn: 'arn:aws:sns:us-east-1:286771205773:officedoor'
};

// Create promise and SNS service object
var publishTextPromise = new AWS.SNS({apiVersion: '2010-03-31'}).publish(params).promise();

// Handle promise's fulfilled/rejected states
publishTextPromise.then(
  function(data) {
    console.log("Message ${params.Message} send sent to the topic ${params.TopicArn}");
    console.log("MessageID is " + data.MessageId);
  }).catch(
    function(err) {
    console.error(err, err.stack);
  });
}

process.on('SIGINT', unexportOnClose); //function to run when user closes using ctrl+c