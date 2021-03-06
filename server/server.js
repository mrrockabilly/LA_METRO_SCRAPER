'use strict';

const express = require('express');
const app = express();
const scraperController = require('./scraper');

//Allows CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//The route defined as root.
// app.get('/', scraperController.getAll);
app.get('/', scraperController.cachify);

app.listen(3000);

module.exports = app;
