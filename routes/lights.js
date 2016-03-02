var expressPromiseRouter = require("express-promise-router");
var router = expressPromiseRouter();
var Promise = require("bluebird");
var fs = require("fs");
Promise.promisifyAll(fs);
var huewrapper = require("../huewrapper");


router.post('/:id/on', function(req, res){
    //console.log(req.params.id);
    //console.log(req.body);
    Promise.try(function() {
        return huewrapper.setOn(req.params.id);
    }).then(function(){
        res.send({ok: true});
    }).catch(function(err){
        res.send({ok: false, err: err});
    });
});

router.post('/:id/off', function(req, res){
    //console.log(req.params.id);
    //console.log(req.body);
    Promise.try(function(){
        return huewrapper.setOff(req.params.id);
    }).then(function(){
        res.send({ok: true});
    }).catch(function(err){
        res.send({ok: false, err: err});
    });
});

router.post('/:id/xybri', function(req, res){
    //console.log(req.params.id);
    //console.log(req.body);
    Promise.try(function(){
        console.log("setXYBri: "
            + req.params.id + ", "
            + req.body.x + ", "
            + req.body.y + ", "
            + req.body.brightness);
        return huewrapper.setXYColorBrightness(req.params.id, req.body.x, req.body.y, req.body.brightness);
    }).then(function(){
        res.send({ok: true});
    }).catch(function(err){
        res.send({ok: false, err: err});
    });
});

router.post('/:id/name', function(req, res){
    //console.log(req.params.id);
    //console.log(req.body);
    Promise.try(function(){
        return huewrapper.setLightName(req.params.id, req.body.name);
    }).then(function(){
        res.send({ok: true});
    }).catch(function(err){
        res.send({ok: false, err: err});
    });
});


module.exports = router;
