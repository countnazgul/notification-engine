var https = require('https');
var fs = require('fs');
var request = require('request');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var async = require('async');
var swig = require('swig');
var cons = require('consolidate');
var nodemailer = require('nodemailer');
var config = require('./config');

var Datastore = require('nedb');
var tasksdb = new Datastore({ filename: 'data/tasks.db', autoload: true });
tasksdb.loadDatabase(function (err) {    // Callback is optional
  console.log('tasks db is loaded');
});

var notificationsdb = new Datastore({ filename: 'data/notifications.db', autoload: true });
notificationsdb.loadDatabase(function (err) {    // Callback is optional
  console.log('notifications db is loaded');
});

app.use(bodyParser.json());
app.engine('html', cons.swig);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');
app.use(express.static('public'));

var host = config.qs.host;
var xrfkey = 'xrfkey=abcdefghijklmnop';
var mainOptions = {
  rejectUnauthorized: false,
  //port: 4242,
  //method: 'GET',
  headers: {
    'x-qlik-xrfkey': 'abcdefghijklmnop',
    'X-Qlik-User': 'UserDirectory= Internal; UserId= sa_repository',
    'Content-Type': 'application/json'
  },
  agentOptions: {
    //key: fs.readFileSync("C:\\CertStore\\instance-2\\client_key.pem"),
    //cert: fs.readFileSync("C:\\CertStore\\instance-2\\client.pem")
  }
};

var availableTasks = [
    {"id": "1", "taskname": "task1"},
    {"id": "2", "taskname": "task2"},
    {"id": "3", "taskname": "task3"},
    {"id": "4", "taskname": "task4"},
];

//  notificationsdb.insert( { notificationid : 'notification1', filter: 'filter1', url: 'http://localhost/3000/change' }, function(err, notification) {
//                   console.log(notification);                 
//               } );

app.get('/', function(req, res) {
  res.send('Hello World!')
});

app.post('/change', function(req, res) {
  var changes = req.body;

  async.each(changes, function(change, callback) {
      if (change.objectType == 'ExecutionResult') {
        Generate(change.objectID, function(msg) {
          console.log(msg)
          callback();
        })
      } else {
        console.log('Event is not for ExecutionResult');
        callback();
      }
    },
    function(err) {

    });
});

app.get('/reloadtasks', function(req, res) {
//   GetReloadTasksFull(function(reloadtask) {
//     res.send(reloadtask)
//   })
    
  async.each(availableTasks, function(availabletask, callback) {
      tasksdb.findOne( {'taskId': availabletask.id.toString()}, function(err, task) {
        //console.log(task)
          if(task == null) {
              tasksdb.insert( { taskId : availabletask.id, name: availabletask.taskname, success: "", fail:"" }, function(err, newTask) {
                  console.log(availabletask.id + ' inserted');
                callback();                     
              });
          } else {
           callback();   
          }      
      })    
    },
    function(err) {
      notificationsdb.find({}, function (err, notifications) {
          if(notifications.length > 0) {
              res.render('index', { tasks: availableTasks, notifications: notifications });  
          } else {
              res.render('index', { tasks: availableTasks });  
          }
      })                    
    });    
});

app.get('/tasksdetails/:taskid', function(req, res) {
    var taskId = req.params.taskid;
    
    tasksdb.findOne( {'taskId': taskId}, function(err, task) {        
        res.send(task)
    })    
});

app.post('/tasksdetailssave', function(req, res) {
    tasksdb.update({ 'taskId': req.body.taskid }, { $set: { success: req.body.success, fail: req.body.fail } }, { multi: false }, function (err, numReplaced) {
        res.send( {replaced: numReplaced });
    });        
});

app.get('/notifications', function(req, res) {
  notificationsdb.find({}, function (err, notifications) {
     res.send(notifications)
   });
})

app.get('/notificationdelete/:notificationid', function(req, res) {
    var notificationid = req.params.notificationid;
    //notificationsdb.remove({ notificationid: notificationid}, { multi: false }, function (err, numRemoved) {        
      //console.log(numRemoved)
      //res.send(numRemoved)
      res.send({deleted: 1} )
    //});    
    
//   notificationsdb.find({}, function (err, notifications) {
//      res.send(notifications)
//    });
})

app.get('/notificationcreate', function(req, res) {
    notificationsdb.insert( { notificationid : 'notification1', filter: '/qrs/notification...etc' }, function(err, notification) {
        res.send(notification.notificationid)
    });
})

function GetReloadTasksFull(callback) {
  MakeRequest('GET', '/qrs/reloadtask/full?', '', function(reloadtasks) {
    callback(reloadtasks)
  })
}

function Generate(executionresultid, callback) {
  GetExecutionResult(executionresultid, function(executionresult) {

    executionresult = JSON.parse(executionresult);
    var reloadTaskName = '';
    var status = executionresult.status; // 7--> Success; 8--> Fail
    var scriptLogAvailable = executionresult.scriptLogAvailable; // true or false

    GetReloadTask(executionresult.taskID, function(reloadtask) {
      reloadtask = JSON.parse(reloadtask);
      reloadTaskName = reloadtask.name;

      if (status == 8) {
        if (scriptLogAvailable == true) {
          GetReloadTaskScript(reloadtask.id, reloadtask.operational.lastExecutionResult.fileReferenceID, function(reloadtaskscript) {
            reloadtaskscript = JSON.parse(reloadtaskscript);

            DownloadScript(reloadtaskscript.value, reloadTaskName, function(script) {
              fs.writeFile('./temp/' + executionresultid + '.txt', script, function(err) {
                SendMail(function() {
                  callback('task failed! log generated and mail send')
                })
              })
            })
          })
        } else {
          callback('task failed! log NOT available and mail send');
        }
      } else {
        callback('task completed successfuly and mail send')
      }
    })
  })
}

function GetExecutionResult(executionresultid, callback) {
  MakeRequest('GET', '/qrs/executionresult/' + executionresultid + '?', '', function(executionresult) {
    callback(executionresult);
  })
}

function GetExecutionResultFull(callback) {
  MakeRequest('GET', '/qrs/executionresult/full?', '', function(executionresult) {
    callback(executionresult);
  })
}

function GetReloadTask(reloadtaskid, callback) {
  MakeRequest('GET', '/qrs/reloadtask/' + reloadtaskid + '?', '', function(reloadtask) {
    callback(reloadtask)
  })
}

function GetReloadTaskScript(reloadtaskid, fileReferenceId, callback) {
  //fileReferenceID
  MakeRequest('GET', '/qrs/reloadtask/' + reloadtaskid + '/scriptlog?fileReferenceId=' + fileReferenceId + '&', '', function(reloadtask) {
    callback(reloadtask)
  })
}

function DownloadScript(value, taskname, callback) {
  //fileReferenceID
  MakeRequest('GET', '/qrs/download/reloadtask/' + value + '/' + taskname + '.log&', '', function(script) {
    callback(script)
  })
}

if(1 === 0) {
    fs.readFile('data/notifications.db',function(err, content) {
        SendMail('notifications.db', content.toString(), function(msg) {
            console.log(msg)
        })
    })
}

function SendMail(filename, filecontent,callback) {
    
    var transporter = nodemailer.createTransport({
        service: config.mail.service,
        auth: {
            user: config.mail.user,
            pass: config.mail.pass
        }
    }, {
        // default values for sendMail method
        from: config.mail.from,
        headers: {
            'My-Awesome-Header': '123'
        }, attachments: [ {   // utf-8 string as an attachment
        filename: filename,
        content: filecontent
    }]
    });
    transporter.sendMail({
        to: 'stefan.stoichev@gmail.com',
        subject: 'hello',
        text: 'hello world!'
    }, function() {
        callback('mail send')
    });    
  
}

function MakeRequest(method, path, body, callback) {
  var options = mainOptions;
  options.method = method;
  options.url = host + path + xrfkey;

  if (method === 'POST') {
    options.body = body;
  }

  request(options, function(err, data) {
    if (err) {
      callback('err:' + err)
    } else {
      callback(data.body)
    }
  })
}

/*
// MakeRequest('GET', '/qrs/task/full?', '', function(extensions) {
//   ///qrs/download/reloadtask/75b96854-9dec-4ee1-a947-c08ed2f51833/Reload%20Taxi%20Data.log
//   console.log(extensions)
// })

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
// MakeRequest('POST', '/qrs/notification?name=ExecutionResult&changetype=Update&filter=status%20eq%20FinishedFail%20or%20status%20eq%20FinishedSuccess&', '"http://localhost:3000/change"', function(extensions) {
//   console.log(extensions)
// })
//
// MakeRequest('DELETE', '/qrs/notification?handle=045f4af8-9be5-4581-83db-1ac7c599f964&', '', function(extensions) {
//   console.log(extensions)
// })



// MakeRequest('GET', '/qrs/notification/changes?since=2014-11-20T07:11:43.999Z&types=Stream&', function(extensions) {
//   console.log(extensions)
// })
*/

/*
// Temp web methods
app.get('/executionresult/:executionresultid', function(req, res) {
  var executionresultid = req.params.executionresultid;

  GetExecutionResult(executionresultid, function(executionresult) {
    var status = executionresult.status; // 7--> Success; 8--> Fail
    var scriptLogAvailable = executionresult.scriptLogAvailable; // true or false
    res.send(executionresult)
  })
});

app.get('/executionresultfull', function(req, res) {
  GetExecutionResultFull(function(executionresult) {
    res.send(executionresult)
  })
});

app.get('/reloadtask/:reloadtaskid', function(req, res) {
  var reloadtaskid = req.params.reloadtaskid;

  GetReloadTask(reloadtaskid, function(reloadtask) {
    res.send(reloadtask)
  })
});

app.get('/reloadtaskscript/:reloadtaskid/:fileid', function(req, res) {
  var reloadtaskid = req.params.reloadtaskid;
  var fileid = req.params.fileid;

  GetReloadTaskScript(reloadtaskid, fileid, function(reloadtask) {
    res.send(reloadtask)
  })
});

app.get('/downloadscript/:value/:taskname', function(req, res) {
  var value = req.params.value;
  var taskname = req.params.taskname;

  DownloadScript(value, taskname, function(script) {
    console.log(script)
    fs.writeFile('./temp/script.txt', script, function(err) {
      res.send('done')
    })
  })
});

*/


var server = app.listen(3000, function() {
  var host = server.address().address;
  var port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port);
});
