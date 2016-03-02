var expressPromiseRouter = require("express-promise-router");
var router = expressPromiseRouter();
var Promise = require("bluebird");
var fs = require("fs");
Promise.promisifyAll(fs);
var bhttp = require("bhttp");
var background = require("../background");

/* GET home page. */
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Air Quality Egg' });
});

router.get('/lights', function(req, res){
  return Promise.try(function(){
    return background.getLights()
  }).then(function(lights){
    res.json(lights);
  }).catch(function(err){
    console.log(err);
    res.status(400).json(err);
  });
});

router.get('/timeremaining', function(req, res){
  return Promise.try(function(){
    return background.getTimeRemaining();
  }).then(function(timeRemaining){
    res.json(timeRemaining);
  }).catch(function(err){
    console.log(err);
    res.status(400).json(err);
  });
});

router.get('/config', function(req, res){
  return Promise.try(function() {
    var dir = __dirname.split('/');
    dir = dir.slice(0, dir.length-1);
    return fs.readFileAsync(dir.join('/') + "/config.json", "utf8");
  }).then(function(contents){
    res.json(JSON.parse(contents));
    console.log(contents);
  }).catch(function(err){
    console.log(err);
    res.status(400).json(err);
  })
});

router.get('/recentstats/:eggSerialNumber', function(req, res) {
  // TODO: this only works for particulate eggs right now
  var serialNumber = req.params.eggSerialNumber;
  return Promise.try(function () {
    return background.getRecentStats(serialNumber);
  }).then(function(data){
    res.json(data);
  }).catch(function(err){
    console.log(err);
    res.status(400).json(err);
  });
});



module.exports = router;
