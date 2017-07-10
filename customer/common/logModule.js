const fs = require("fs");

LogPath = _ROOTPATH+"/log/";

Module ={
    info: function (msg) {
        var time = Date.now()
        var date = new Date();
        var filename = date.getFullYear()+"-"+date.getMonth()+"-"+date.getDay()+".log";
        var time = date.getHours()+"-"+date.getMinutes()+'-'+date.getSeconds();
        msg = time+" : "+msg+"\n"

        fs.appendFile( LogPath +'/log/'+filename, msg, function(err) {
            if (err) throw err;
        });
    },
    error: function (msg) {
        var time = Date.now()
        var date = new Date();
        var filename = date.getFullYear()+"-"+date.getMonth()+"-"+date.getDay()+".log";
        var time = date.getHours()+"-"+date.getMinutes()+'-'+date.getSeconds();
        msg = time+" : "+msg+"\n"
        fs.appendFile( LogPath +'/error/'+filename, msg, function(err) {
            if (err) throw err;
        });
    },

}

module.exports = Module
