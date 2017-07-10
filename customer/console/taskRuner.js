require("../console")  // App文件 包含这个文件就可以使用App对象
const  request = require('request');
const  exec  = require('child_process').exec;
const  events   = require('events');
const  eventEmitter = new events.EventEmitter();

var    taskUrl  = App.param.taskUrl;

//任务的执行状态
const  TaskStatus = {
       getTask:200,       //获取任务成功
       success:210,       // 任务执行成功
       failed : 210,      // 任务执行失败
       notTask : 404,     // 当前没有任务
       serverError:500,   // 服务器异常
}

// 任务完成触发函数
eventEmitter.on('taskOver' , function (status ,task) {
   // console.log(status ,task)
    if( status==TaskStatus.notTask ) //当前没有要执行的任务
    {
        //执行下一个
        setTimeout(doTask , 5000)
    }else
    {
        var  encry = App.encrypt.encryToken( App.param.taskToken )
        task.endTime = parseInt(Date.now()/1000);
        task.time = encry.time
        task.auth = encry.encry

        //var data = JSON.stringify( task );
        var opt = {
            url: App.param.taskResultUrl,
            method: "POST",
            json: true,
            headers: {
                "Content-Type": 'application/json'
            },
            body: task
        };
        var req = request(opt, function (error, response, body) {

            if (!error && response.statusCode == 200) {

                if(body=='success')
                  App.log.info ( "任务完成:"+ task.id )
                else
                  App.log.error("任务提交失败:" + body +" ### "+JSON.stringify(task))
            }else{
                  App.log.error("任务提交失败:" + JSON.stringify(task))
            }

        });
        //执行下一个
        setTimeout(doTask , 2000);
    }
} );

//
doTask();

/***
 *  获取并执行任务
 * @param url
 */
function  doTask() {
    var  encry = App.encrypt.encryToken( App.param.taskToken )
    fullUrl =  taskUrl+"?time="+encry.time+"&auth="+encry.encry

    request( fullUrl, function (error, response, body) {
        //console.log(response.charCode);
        if (!error && response.statusCode == 200) {
            // 解析数据
            try {
                var  task = JSON.parse(body);
            } catch (e) {
                console.log("服务端消息 : "+body)
                eventEmitter.emit('taskOver',TaskStatus.notTask,'');
                return;
            }

            var  title = task.title
            var  type =  task.type
            var  cmd = task.exec
            var  createdTime = task.createTime
            console.log("执行 : "+ title )
            var  result = '';

            exec( cmd, function(error, stdout, stderr){
                if(error) {
                    console.log('stdout: ' + error);
                    task.result = error;
                    eventEmitter.emit('taskOver' ,TaskStatus.failed, task);
                    return;
                }

                task.result = iconv.decode(new Buffer(stdout+stderr), 'GBK');
                console.log('stdout: ' + task.result);

                eventEmitter.emit('taskOver' ,TaskStatus.success, task);
            });

        }else{
            console.log("服务端出错  ")
            eventEmitter.emit('taskOver' ,TaskStatus.serverError , '');
        }

    })
}

