
part  = {
    table   :  'sysTask',
    taskKey :  'sysTask',
    taskSecondKey : 'secondTask',  //第二队列 主要是存放 取出但在当前环境下无法运行的任务
    emergentKey   :  'emergentTask',
    customerKey   :  'customer',
    //弹出一个任务
    popTask : function (callBack) {
       //console.log( part.taskKey )
       App.redis.brpop( part.taskKey ,4 ,callBack );
    },

    setTaskRunResult: function (taskId) {

    },
}


module.exports = part ;

