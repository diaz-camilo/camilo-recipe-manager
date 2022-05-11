require('dotenv').config()


var usersRouter = require('./routes/users');
var recipesRouter = require('./routes/recipes');

const express = require('express');
const path = require('path');
var cors = require('cors');

const app = express();

app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/recipes', recipesRouter);

// Custome error handler middleware
function errorHandler(err, req, res, next) {
  res.status(500)
  res.json({ error: err.toString() })
}

// Set app to use custome error handler
app.use(errorHandler)

const port = process.env.PORT || 8080; //http port
app.listen(port);

console.log(`API listening on ${port}`);