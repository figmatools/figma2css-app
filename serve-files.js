var express = require('express');
var frontend = express();

//setting middleware
frontend.use(express.static(__dirname + 'public')); //Serves resources from public folder


var server = frontend.listen(5000);
