// Require modules
var express = require('express');
var bodyParser = require('body-parser');
var expressSession = require('express-session');
var mongodb = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

var db;

// Connect to mongo (make sure mongo is running!)
mongodb.MongoClient.connect('mongodb://localhost', function(err, database) {
	if (err) {
		console.log(err);
		return;
	}
	console.log("Connected to Database");
	db = database;
// start the server.
	startListening();
});

// Create express app
var app = express();

// Add req.body to each POST request
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));

// Add req.session for each individual for to every request
app.use(expressSession({
	secret: 'keyboard cat', // SECRET! Don't push to github
	resave: false,
	saveUninitialized: true
}));

// Get all turtles
app.get('/api/turtles', function(req, res) {
// Check if logged in
	if (!req.session.user) {
		res.status(403);
		res.send("forbidden");
		return;
	}
// return all turtles as a JSON array.
	db.collection('turtles').find({}).toArray(function(err, data){
		if (err) {
			console.log(err);
			res.status(500);
			res.send("error");
			return;
		}
		res.send(data);
	});
});

//upating db pizza count for a turtle
app.post("/api/pizza_count", function(req,res){
	if (!req.session.user) {
		res.status(403);
		res.send("forbidden");
		return;
	}
	db.collection("turtles").updateOne(
        { 
            _id: ObjectId(req.body._id)
        },
        { 
            $inc : { 
                pizza: 1
            }
        },
        function(err, result) { //callback
            if (err) { return console.log(err); }
           res.send(result); // contains data about the operation
        }
	);
});

// Delete one turtle
app.post('/api/deleteTurtle', function(req, res){
//validate user is logged in 
	if(!req.session.user){
		res.status(403);
		res.send("forbidden");
		return;
	}
	db.collection('turtles').deleteOne(
	{
		_id: ObjectId(req.body._id),
	}, 
	function (err, data){
		if(err){
			console.log(err);
			res.status(500);
			res.send("Error deleting a turtle🐢");
		}
		res.send(data);
	});
});


// Post a new turtle
app.post('/api/newTurtle', function(req, res) {
// todo: validate input
// checking if logged in
	if (!req.session.user) {
		res.status(403);
		res.send("forbidden");
		return;
	}

// Add new turtle
	db.collection('turtles').insertOne({
		name: req.body.name,
		color: req.body.color,
		weapon: req.body.weapon,
		submitter: req.session.user._id,
	}, function(err, data) {
		if (err) {
			console.log(err);
			res.status(500);
			res.send('Error inserting new turtle');
			return;
		}
		res.send(data);
	});
});

// Post to login
app.post('/api/login', function(req, res) {
// Check to see if a user with the given username, password exists
	db.collection('users').findOne({
		username: req.body.username,
		password: req.body.password
	}, function(err, data) {
// It's not an error to not find a user, we just get null data
		if (data === null) {
			res.send("error");
			return;
		}
// Otherwise, associate this cookie (session) with this user (object)
		req.session.user = {
			_id : data._id,
			username: data.username
		};
		res.send("success");
	});
});

// Register a new user
app.post('/api/register', function(req, res) {
	// todo validate input
	db.collection('users').insertOne({
		username: req.body.username,
		password: req.body.password //todo: hash this
	}, function(err, data) {
		if (err) {
			console.log(err);
			res.status(500);
			res.send('Error inserting new user');
			return;
		}
		res.send(data);
	});
});

//getting the details for one turtle
// app.get('/api/turtle/:id', function(req, res){
// 	var turtleId = req.params.id;
// 	db.collection('turtles')
// 	.findOne({
// 		id: ObjectId(turtleId)
// 		},
// 			function(err, turtleDoc) {
// 				if (err) {
// 					console.log(err);
// 					res.status(500);
// 					res.send('Error getting turtle details');
// 					return;
// 				}
// //adding user data who submited turtle
// 		db.collection("users").findOne({
// 			_id: ObjectId(turtleDoc.submitter)
// 		},function(err,userDoc){
// 			if(err){
// 				console.log(err);
// 				res.status(500);
// 				res.send("Error in getting turlte submiter information!");
// 				return; 
// 			}
// 			if(userDoc){
// 				turtleDoc.submitedBy = userDoc.username;
// 			}
// 			res.send(turtleDoc);
// 		});
// 	});
// });

// serve files out of the static public folder (e.g. index.html)
app.use(express.static('public'));

// 404 boilerplate
app.use(function(req, res, next) {
	res.status(404);
	res.send("File Not Found! Turtles are Sad 🐢");
});

// 500 boilerplate
app.use(function(err, req, res, next) {
	console.log(err);
	res.status(500);
	res.send("Internal Server Error! Turtles are Angry 🐢");
	//res.send(err);
});

// start listening (but only after we've connected to the db!)
function startListening() {
	app.listen(8080, function() {
		console.log("🐢 http://localhost:8080");
	});
}


