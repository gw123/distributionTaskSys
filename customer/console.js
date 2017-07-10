/***
 * 定义 App 对象
 */
/* 指明根路径 */
global._ROOTPATH = __dirname;
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


