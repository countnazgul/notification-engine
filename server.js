var https = require('https');
var fs = require('fs');
var request = require('request');
var express = require('express');
var app = express();
var bodyParser = require('body-parser')

app.use( bodyParser.json() );

var xrfkey = 'xrfkey=abcdefghijklmnop';
var mainOptions = {
  rejectUnauthorized: false,
  url: 'https://localhost:4242',
  //port: 4242,
  //method: 'GET',
  headers: {
    'x-qlik-xrfkey': 'abcdefghijklmnop',
    'X-Qlik-User': 'UserDirectory= Internal; UserId= sa_repository'
    //'Content-Type': 'application/json'
  },
  agentOptions: {
    key: fs.readFileSync("C:\\CertStore\\instance-2\\client_key.pem"),
    cert: fs.readFileSync("C:\\CertStore\\instance-2\\client.pem")
  }
};

app.get('/', function(req, res) {
  res.render('index', { /* template locals context */ });
});

app.post('/change', function(req, res) {
  console.log(req.body)
  //res.send('called')
});

function MakeRequest(method, path, body, callback) {
  var options = mainOptions;
  options.method = method;
  options.url = options.url + path + xrfkey;
  if(method === 'POST') {
      options.body = body;
  }
//console.log(options)
  request(options, function(err, data) {
    if (err) {
      callback('err:' + err)
    } else {
      callback(data.body)
    }
  })
}

// MakeRequest('GET', '/qrs/ReloadTask/c09301eb-e472-46e6-a950-1fce948a2c1e/scriptlog?fileReferenceId=3cd1fc9a-e6a6-453b-81d2-699e17338992&', '', function(extensions) {
//   ///qrs/download/reloadtask/75b96854-9dec-4ee1-a947-c08ed2f51833/Reload%20Taxi%20Data.log
//   console.log(extensions)
// })

// MakeRequest('GET', '/qrs/reloadtask/c09301eb-e472-46e6-a950-1fce948a2c1e?', '', function(extensions) {
//   console.log(extensions)
// })

// MakeRequest('GET', '/qrs/executionresult/84194aa2-ffe1-40ad-ba3e-4b044662cdc5?', '', function(extensions) {
//   console.log(extensions)
// })

//POST /qrs/notification?name=ExecutionResult&filter=status%20eq%20FinishedFail&changetype=Update
// MakeRequest('POST', '/qrs/notification?name=ExecutionResult&filter=status%20eq%20FinishedFail&changetype=Update&', '"http://localhost:3000/change"', function(extensions) {
//   console.log(extensions)
// })

// MakeRequest('DELETE', '/qrs/notification?handle=7ad490a7-2994-4086-8d99-291995ea473b&', '', function(extensions) {
//   console.log(extensions)
// })



// MakeRequest('GET', '/qrs/notification/changes?since=2014-11-20T07:11:43.999Z&types=Stream&', function(extensions) {
//   console.log(extensions)
// })


var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
