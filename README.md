# distributionTaskSys
分布式任务处理系统
![image](https://github.com/gw123/distributionTaskSys/blob/master/image/1.png?raw=true)

# 消息队列使用 redis 

# 生产者一般为web服务端后台程序 在本项目中生产者是一个 yii的后台程序 
  porducer/task.php 中 配置消息队列的连接参数  
    public $serverUrl    = '192.168.30.128';
    public $port          = '6379';
    public $authPassword = ''; // r
    private $redis        = null;
    public $db            = '';
    public $table         =  'systask';
    public $key           =  'sysTask';
    public $emergentKey  = 'emergentTask';
    public $customerKey  = 'customer';
