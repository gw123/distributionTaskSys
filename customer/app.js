/*导入需要用到的nodejs库*/
var http = require('http');
var url  = require('url');
var qs   = require('querystring');

/* 指明根路径 */
global._ROOTPATH = __dirname;

/**
 * 简单配置个路由 用来检测无用的请求 仅符合路由规则的才能被接受
 * 自己可以按照需要定义
 * @type {{/: string, favicon: string, user: string, login: string, biz: string}}
 */
var route = {
    '/task/taskResult':getDefaultRoute,
    '/task/getTask':getDefaultRoute,
    '/task/task-run-result': function (pathname, queryParam , response) {
        response.write( 'taskRunResult' );
        response.end();
    },
};

/**
 * 上述路由的简单判断规则
 */
var isValid = function (reqPath) {
    for (var key in route)
    {   if ( key == reqPath ) { return true;}  }
    return false;
}

/***
 *  路由请求
 * @param pathname    请求方法
 * @param queryParam  请求参数
 * @param response    回复句柄
 */
function  onRequest(pathname, queryParam , response) {
    //console.log( pathname , route[pathname] )
    if ( route[pathname] && typeof route[pathname] == 'function')
    {
        route[pathname](pathname, queryParam , response);
    }else{
        response.writeHead( 401, {'Content-Type': 'text/plain;charset=utf-8'} );
        response.write( '未授权' );
        response.end();
    }

}

/***
 * 默认路由
 * @param pathname
 * @param queryParam
 * @param response
 * @param request
 */
function  getDefaultRoute(pathname, queryParam , response ,request) {
    pathname = pathname.substring(1);
    var pathnames = pathname.split('/');
    if(!pathnames[1]||pathnames[1]=='')
    {
        pathnames[1]='index';
    }

    var controller = require(_ROOTPATH+"/controller/"+pathnames[0]+"Controller");

    if( typeof  controller[pathnames[1]] == 'function')
    {
        //response.write("123");
        controller[pathnames[1]](pathname, queryParam , response);
        // 因为node程序是异步的 所以可能在end 不能在这里执行 设置一个超时时间 5秒
        response.setTimeout(5000,function(){

        });

    }else{
        //console.error("Controller:"+pathnames[0]+" Action :"+pathnames[1]+"未定义!");
        response.writeHead(404, {'Content-Type': 'text/plain;charset=utf-8'});
        response.write( "Controller:"+pathnames[0]+" Action :"+pathnames[1]+"未定义!");
        response.end();
        return
    }
}

/***
 * 定义 App 对象
 */
global.App=  {}
var config = require(_ROOTPATH+"/config/"+"main.js");

if(config&& typeof  config =='object')
{
    //console.log(config)
    for  (var key in config)
    {
        if( typeof  config[key].init == 'function')
        {
            App[key] = config[key].init()
        }else
        {
            App[key] = config[key]
        }
    }
}

//  指定服务运行端口
var HttpServerPort = 8080;
if( process.argv[2] && parseInt(process.argv[2]))
{
    HttpServerPort = parseInt( process.argv[2] );
}

/**
 * 启用http
 */
http.createServer(function (request, response) {
    var queryPath   = url.parse(request.url).pathname;
    //console.log( getClientIp(request) );
    if (!isValid(queryPath)) {
        response.writeHead(404, {'Content-Type': 'text/plain;charset=utf-8'});
        response.write("{'errcode':404,'errmsg':'404 页面不见啦'}");
        response.end();
        return;
    }

    if (request.method.toUpperCase() == 'POST') {

        var postData = "";
        request.addListener("data", function (data) {
            postData += data;

        });
        request.addListener("end", function () {
            var requestUrl = url.parse(request.url, true)
            var pathname   = requestUrl.pathname;
            var query =postData;
            //console.log("Post Data:",postData ,query)
            onRequest( pathname,query ,response ,request);
        });

    } else if (request.method.toUpperCase() == 'GET') {
        var requestUrl = url.parse(request.url, true)
        var pathname   = requestUrl.pathname;
        var queryParam = requestUrl.query;
        //console.log(pathname  ); console.log(queryParam)
        onRequest( pathname,queryParam ,response ,request);
    } else {
        //head put delete options etc.
    }

}).listen(HttpServerPort, function () {
    console.log("listen on port "+HttpServerPort);
});




