var express = require('express');
var app = express();

app.get('/students', function (req, res) {
  res.send('all students');
});

app.get('/students/:id', function (req, res) {
  res.send('students' + req.params.id);
});

app.post('/students', function (req, res) {
  res.send('created student');
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