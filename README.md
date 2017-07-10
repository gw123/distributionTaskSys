# distributionTaskSys
分布式任务处理系统
![image](https://github.com/gw123/distributionTaskSys/blob/master/image/1.png?raw=true)

# 消息队列使用 redis 

# 生产者一般为web服务端后台程序 在本项目中生产者是一个 yii的后台程序 
   ## porducer/task.php 中 配置消息队列的连接参数  
    *public $serverUrl    = '192.168.30.128';
    *public $port          = '6379';
    *public $authPassword = '';          // 认证密码
    *public $table         =  'systask';  //数据库中存放任务队列的数据表
    *public $key           =  'sysTask';    //redis 任务队列的key
    *public $emergentKey   = 'emergentTask';// 紧急任务队列的key
    *public $customerKey   = 'customer';    //存放当前消费者状态的key
    
## 消费者 分为三层  
  ### 多个nodejs服务端 
  #### * 接收执行者的请求 验证token ,分配任务 
  #### * 接收执行者任务的执行结果 ,存放数据库 
  
  ### Nginx 负载层
  #### * 负责将客户端的请求 负载nodejs服务器 , 
  #### * 容错处理 ,当一台nodejs服务器挂掉可以 快速找替代者
  
  ### 执行者
  #### * 请求nodejs服务器 获取任务 并执行
  #### * 获取命令行的执行结果 提交到nodejs
  
  
  
  ### customer 是一个本人写的 只有 MC两层的简单高效nodejs框架 ,主要是用了写api结果所以没有构建 view层.
    #### node.js 服务端执行步骤  
     *进入customer 目录 运行
     *node  app  8080  服务就启动了
    #### nginx 启动步骤这里不做说明 ,请自行百度
    #### 客户端启动说明
    *进入 cd customer/console 
    *node  taskRuner
    
  ### nginx 服务器配置文件
  
  upstream  localhost {
           server  192.168.30.1:8080;
           server  192.168.30.1:8081;
           server  192.168.30.1:8082;
           server  192.168.30.1:8083;
           server  192.168.30.1:8084;
           server  192.168.30.1:8085;
           server  192.168.30.1:8086;
           server  192.168.30.1:8087;
           server  192.168.30.1:8088;
           server  192.168.30.1:8089;
      }
   
   server {  
            listen 80;  
            server_name   test.xyt;  
            location / { 
               proxy_connect_timeout 1; 
               proxy_send_timeout 10; 
               proxy_read_timeout 20; 
               proxy_redirect off;  
               proxy_set_header X-Real-IP $remote_addr;  
               proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  
               proxy_set_header X-Forwarded-Proto $scheme;  
               proxy_set_header Host $http_host;  
               proxy_set_header X-NginX-Proxy true;  
               proxy_set_header Connection "";  
               proxy_http_version 1.1;  
               proxy_pass  http://localhost;  
           }  
      }  
      
