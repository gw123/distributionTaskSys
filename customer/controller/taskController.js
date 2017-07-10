// 获取任务控制器
console.log('get-task.js')
var mysql      = require('mysql');
/****
 *  这里是nodejs 的服务端 只负责接受任务和分发任务
 * */
controller = {
    //
    getTask : function (pathname, queryParam , response ,request) {
        //console.log(queryParam)
        if( !queryParam.time ||  !queryParam.auth)
        {
            response.end('认证失败'); return;
        }
        if(!App.encrypt.isValidAuth( queryParam.time,queryParam.auth , App.param.taskToken ) )
        {
            response.end('认证失败!'); return;
        }

        var task  = App.task.popTask(function (err,result) {

            if(err)
            {   response.write('服务器出错请联系管理员'); }
            else if(!result)
            {
                response.write('当前任务队列为空');
            }else {
                response.write(result[1]);
            }

            response.end();
        })
    } ,

    taskResult : function (pathname, data , response ,request) {
        //
         task = JSON.parse(data);
        console.log(task)
        if( !(task.time&&task.auth) )
        {
            response.write('认证失败')
            response.end();   return;
        }
        if(!App.encrypt.isValidAuth( task.time,task.auth , App.param.taskToken ) )
        {
            response.write('认证失败')
            response.end(); return;
        }

        task.result = mysql.escape( task.result )

        var  sql    =  'UPDATE systask SET endTime ='+task.endTime+' ,result ="'+
                        task.result+'" WHERE id ='+task.id  ;
        //console.log(sql)
        App.mysql.query( sql , [] , function (err, result) {
            if(err){
                console.log('[Mysql ERROR] - ',err.message);
                return;
            }
            //console.log('INSERT ID:',result.insertId);
        });
        response.write('success')
        response.end();
    }
}

module.exports = controller
