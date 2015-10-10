var DEFAULT_PORT = 8080;
var PORT = process.env.PORT || DEFAULT_PORT;
var MONGO_DEFAULT_PORT = 27017;
var MONGO_PORT = process.env.MONGO_PORT_27017_TCP_PORT || MONGO_DEFAULT_PORT;
var MONGO_DEFAULT_IP = '192.168.59.103';
var MONGO_IP = process.env.MONGO_PORT_27017_TCP_ADDR || MONGO_DEFAULT_IP;

var express = require('express');
var bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({extended: false})
var app = express();
app.use(require('body-parser').urlencoded({extended: true}));

var mongoose = require('mongoose');
var mongo_address = 'mongodb://' + MONGO_IP + ':' + MONGO_PORT + '/test';
mongoose.connect(mongo_address);

var Course = require('./models/course.js');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:' + mongo_address));
db.once('open', function (callback) {
  console.log('succesfully connected to mongodb');
});


app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.get('/courses', function (req, res) {
  Course.find(function (err, courses) {
    if (err) return res.status(500).send('Error occurred: database error.');
    res.json(courses.map(function (c) {
      return {
        title: c.title,
        code: c.code
      }
    }));
  });
  console.log('all courses');
});

app.post('/courses', jsonParser, function (req, res) {
  console.log('received data ' + JSON.stringify(req.body));
  if (!req.body.code || !req.body.title)
    return res.status(400).send('New courses needs at least code and title');
  var c = new Course({
    code: req.body.code,
    title: req.body.title
  });

  c.save(function (err, s) {
    if (err) return res.status(500).send('Error occurred: database error.');
    res.json({id: s._id});
  });
});

var server = app.listen(PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});