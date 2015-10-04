var express = require('express');
var bodyParser = require('body-parser');
// create application/json parser
var jsonParser = bodyParser.json()
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })
var app = express();
app.use(require('body-parser').urlencoded({ extended: true }));

var mongoose = require('mongoose');
mongoose.connect('mongodb://192.168.59.103:27017/test');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  var studentSchema = mongoose.Schema({
    name: String
  });
  var Student = mongoose.model('Student', studentSchema);
  var popo = new Student({ name: 'popo' });
  console.log(popo.name); // 'popo'
  // popo.save(function (err, popo) {
  //   if (err) return console.error(err);
  //   console.log('saved popo!');
  // });
});

app.get('/students', function (req, res) {
  res.send('all students');
});

app.get('/students/:id', function (req, res) {
  res.send('students' + req.params.id);
});

app.post('/students', jsonParser, function (req, res) {
  res.send('created student ' + req.body.name);
});

app.put('/students/:id', function (req, res) {
  res.send('update student ' + req.params.id);
});

app.delete('/students/:id', function (req, res) {
  res.send('delete student' + req.params.id);
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});