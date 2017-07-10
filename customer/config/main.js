/***
 * 配置文件 下面的内容只需要实例化一次  可以使用App对象访问
 * @type {{redis: {init: config.redis.init}, mysql: {init: config.mysql.init}}}
 */

var config = {
    // parm 后面可能会用到
    param : {
        //获取任务地址
        taskUrl : "http://localhost:8080/task/getTask",
        //提交任务的执行结果
        taskResultUrl : "http://localhost:8080/task/taskResult",
        taskToken: "xytschool.com"
    },

    redis : {
        init:function () {
            var   redis      =  require('redis');
            var   port       =  '6379';
            var   serverUrl  =  '192.168.30.128';
            var   client     =  redis.createClient(port ,serverUrl,{password:'gao123456'});
            return client;
        }
    },

    mysql :{
        init : function () {

            var mysql      = require('mysql');
            var db = mysql.createConnection({
                host     : '192.168.30.128',
                user     : 'root',
                password : 'root',
                database : 'edu'
            });
            return db;
        }
    },

    task : {
       init : function ( ) {
           model =   require(_ROOTPATH + '/common/taskModule')
           return model;
       }
    },

    log :{
        init : function ( ) {
            model =   require(_ROOTPATH + '/common/logModule')
            return model;
        }
    },

    encrypt :{
        init : function ( ) {
            model =   require(_ROOTPATH + '/common/encryptModule')
            return model;
        }
    },

}

module.exports = config

