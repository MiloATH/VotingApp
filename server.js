var express = require('express');
var app = express();
var PORT = process.env.PORT || 3500;

app.listen(PORT,function(){
    console.log('Voting app listening on port',PORT);
})