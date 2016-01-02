Add mail notification functionality for QS tasks running from `Scheduler Service`

#### Install
* clone this repo
* run `npm install` to install the dependency packages
* rename `config.js.example` to `config.js`
* edit `config.js` whith your settings
* `node server.js` to start the server (should use the `Service Dispatcher` service. Instructions to follow)

#### Options (`config.js`)

* config.main.port --> port on which the server to start
* config.main.calledurl --> the url to be called when task reload finish. Default `http://localhost`
* config.qs.host --> Qlik Sense host url
* config.mail.host --> SMTP host 
* config.mail.port --> SMTP port (25 or 587)
* config.mail.user --> SMTP username 
* config.mail.pass --> SMTP password
* config.mail.from --> from which username the mail will be send
* config.mail.ssl --> true or false
* config.mail.tls --> (fill if SSL is true) for example if using outlook.com as smtp server: SSLv3
* config.mail.subjectFail --> mail subject for fail tasks( for example: `'Task "{{taskname}}" failed to reload'`)
* config.mail.subjectSuccess --> mail subject for success tasks( for example: `'Task "{{taskname}}" was successfully reloaded'`)
* config.mail.bodyFail --> mail body for fail tasks. Accept html format ( for example: `'<b>"{{taskname}}" failed</b> <br> Find the execution script attached'`)
* config.mail.bodySuccess -->  mail body for success tasks. Accept html format( for example: `'<b>"{{taskname}}" was successfully reloaded!</b> <br>This is an automated email. Please do not reply to it.'`)
* config.mail.includefailscript = true or false. Should the QS reload script to be attached when task is failed to reload

### GUI
TBD

#### Workflow
TDB
