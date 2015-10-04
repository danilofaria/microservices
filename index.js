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

var Student = require('./models/student.js');

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function (callback) {
  console.log('succesfully connected to mongodb');
});

app.get('/students', function (req, res) {
	Student.find(function(err, students){
		if(err) return res.status(500).send('Error occurred: database error.'); 
		res.json(students.map(function(s){
			return {
				name: s.name,
                uni: s.uni,
                lastName: s.lastName
			} 
		}));
   });
  console.log('all students');
});

app.get('/students/:uni', function (req, res) {
  Student.findOne({'uni': req.params.uni}, function(err, s){
    if(err) return res.status(500).send('Error occurred: database error.'); 
    if(!s) 
    	return res.status(404).send('Student not found');
    console.log(s);
    res.json({
                name: s.name,
                uni: s.uni,
                lastName: s.lastName
     }); 
   });
  console.log('students' + req.params.uni);
});

app.post('/students', jsonParser, function (req, res) {
  console.log('received data ' + JSON.stringify(req.body));
  if (!req.body.uni || !req.body.name || !req.body.lastName)
    	return res.status(400).send('New student needs at least uni, name and lastName');
  var s = new Student({
            uni: req.body.uni,
            name: req.body.name,
            lastName: req.body.lastName
	});

  s.save(function(err, s){
    if(err) return res.status(500).send('Error occurred: database error.'); 
    res.json({ id: s._id });
  });

});

app.put('/students/:uni', jsonParser, function (req, res) {
  console.log('received data ' + JSON.stringify(req.body));
  Student.findOne({'uni': req.params.uni}, function (err, s){
  	if(err) return res.status(500).send('Error occurred: database error.'); 
    if(!s) 
    	return res.status(404).send('Student not found');
    if (req.body.name)
    	s.name = req.body.name;
    if (req.body.lastName)
    	s.name = req.body.lastName;
    s.save();
    res.json({
                name: s.name,
                uni: s.uni,
                lastName: s.lastName
    }); 
  });
});

app.delete('/students/:uni', function (req, res) {
  Student.findOneAndRemove({'uni': req.params.uni}, function(err, s) {
    if(err) return res.status(500).send('Error occurred: database error.'); 
    res.json({ id: s._id });
  });
});

var server = app.listen(3000, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);
});