var expressPromiseRouter = require("express-promise-router");
var router = expressPromiseRouter();
var Promise = require("bluebird");
var fs = require("fs");
Promise.promisifyAll(fs);
var bhttp = require("bhttp");

/* GET home page. */
/* GET home page. */
router.get('/', function(req, res) {
  res.render('index', { title: 'Air Quality Egg' });
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
  var topic = "/osio/orgs/wd/aqe/particulate";
  return Promise.try(function () {
    return bhttp.get("http://eggapi.wickeddevice.com/v1/messages/topic/"
        + topic + "/" + serialNumber + "/" + "5min");
  }).then(function(response){
    var numMessages = response.body.messages.length;
    var lastPayload = response.body.messages[numMessages-1].payload.text;
    console.log(lastPayload);
    res.json(JSON.parse(lastPayload));
  }).catch(function(err){
    console.log(err);
    res.status(400).json(err);
  });
});



module.exports = router;
