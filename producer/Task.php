<?php
namespace common\utils;
use yii\base\Component;
use Yii;
use yii\base\Exception;

/****
 * Yii 任务队列扩展
 * Class Task
 * @property integer $serverUrl    redis 服务器地址
 * @property integer $port         redis 端口
 * @property integer $authPassword redis 认证密码
 * @property string $redis
 * @property string $db           保存消息的数据库
 * @property string $table        保存消息的数据表
 * @property string $key          消息在队列中保存的键
 * @property string $emergentKey  紧急消息队列 存放需要及时处理的消息
 * @property string $customerKey  消费者队列 存放所有的执行任务的map
 * @package common\utils
 */
class  Task extends Component {

    public $serverUrl    = '192.168.30.128';
    public $port          = '6379';
    public $authPassword = '';
    private $redis        = null;
    public $db            = '';
    public $table         =  'systask';
    public $key           =  'sysTask';
    public $emergentKey  = 'emergentTask';
    public $customerKey  = 'customer';

    public  function init()
    {
        parent::init();
        // ... 配置生效后的初始化过程
        $this->redis = new \Redis();
        $this->redis->pconnect( $this->serverUrl, $this->port );
        if($this->authPassword)
        $this->redis->auth($this->authPassword);
    }

    /***
     * @param $title
     * @param $exec
     * @param int $type
     * @throws Exception
     */
    public  function  createTask($title,$exec,$type=1,$isEmerg=false)
    {
		 /***
         * name  任务名称
         * type  任务类型
         * cmd   执行指令
         * ctime 创建时间
         * endtime 结束时间
         * times  执行次数 用于在任务执行失败后 再次执行 累计次数大于2次 任务执行失败
         */
        $task = ['title'=>$title , 'type'=> $type  , 'exec'=> $exec , 'createdTime'=> time()  ];
        $db = null;
        if($this->db)
        {
            $db = Yii::$app->get($db);
        }else{
            $db = Yii::$app->db;
        }

        if(empty($this->table))
           throw  new Exception(' Task组件未指定 task表! ');

        $result = Yii::$app->db->createCommand()->insert($this->table,$task)->execute();

        if($result)
        {
            $lastInserId = $db->getLastInsertID();
        }else{
            throw  new Exception(' 创建任务失败! ');
        }
        $task['id'] = $lastInserId;

        $taskjson = json_encode($task);
        //将任务添加到任务队列
        if(!$isEmerg)
            $this->redis->lpush($this->key , $taskjson );
        else
            $this->redis->lpush($this->emergentKey,$taskjson );

        Yii::$app->logger->info( '创建任务!'.$title );
    }

    /***
     * 创建一个消费者 执行任务队列中的任务
     * @param $id  消费者标识符 ,用于停止消费者运行 ,状态查看
     */
    public  function  customer( $isEmerg=false )
    {
        $pid   = getmypid();
        $mac   = $this->GetMacAddr();
        $subKey = $mac."-".$pid;
        $this->redis->hMset( $this->customerKey ,[ $subKey=>1 ] );

        while(1)
        {
            //从任务队列中取出一个任务 执行 如果没有任务则等待 紧急10秒种 普通20
            if($isEmerg)
                $taskjson = $this->redis->brpop($this->key ,10);
            else
                $taskjson = $this->redis->brpop($this->key ,20);

            if(!$taskjson) { continue; }

            $task  =json_decode($taskjson[1] ,true);
            $output='';
            if($this->safe( $task['exec'] ))
            {
                exec($task['exec'] , $output);
                $result['endTime'] = time();
                $result['result'] = implode("\n",$output);
            } else {
                $result['endTime'] = time();
                $result['result'] = '任务执行失败,任务命令含有非法字符!';
                Yii::$app->logger->error("[{$task['id' ]}:{$task['exec' ]}]".'任务执行失败,任务命令含有非法字符!');
            }

            try{
                //echo Yii::$app->db->createCommand()->update($this->table , $result ,[ 'id'=>$task['id' ]] )->getRawSql();
                Yii::$app->db->createCommand()->update($this->table , $result ,[ 'id'=>intval($task['id']) ] )->execute();
            }catch (Exception $e)
            {
                Yii::$app->logger->error('任务完成 但数据入库失败!'.$e->getMessage());
            }
            Yii::$app->logger->info("[{$task['id' ]}]: \n [{$task['exec' ]}] \n".'任务完成!');
        }
    }

    /***
     *  获取所有的 存活的消费者 ,清理吊已经失效的消费着
     */
    public function getAllCustomer()
    {
        $rows = $this->redis->hGetAll($this->customerKey);
        $Return = [];
        foreach ($rows as $key=> $row)
        {
            $info = explode('-',$key);
            if( isset($info[1])&&!empty($info[1]))
            {
                // linux系统上检测进程是否存活
                $cmd = " ps --no-heading ".$info[1];
                exec($cmd ,$out);
                if($out)
                {
                    $Return[] = $key;
                  continue;
                }
            }
            $this->redis->hDel( $this->customerKey,$key );
        }

        return $Return;
    }

    /***
     * 终止指定 消费者进程
     * @param $key
     */
    public  function  killCustomer($key)
    {
        $info = explode('-',$key);
        if( isset($info[1])&&!empty($info[1]))
        {
            // linux系统上检测进程是否存活
            $cmd = " kill -9" . $info[1];
            exec($cmd, $out);
            $this->redis->hDel($this->customerKey, $key);
            return true;
        }
        return false;
    }
    /***
     * 任务过滤器 过滤掉一些可能会危害系统的命令
     * @param $cmd
     */
    public function safe($cmd)
    {
        if(empty($cmd))
            return false;

        $filters = ['rm ' ,'mv ' ,'chomd ','passwd ','adduser '];
        foreach ($filters as $filter)
        {
            if( strpos($cmd,$filter)===0 )
            {
                return false;
            }
        }

        return true;
    }


    var $return_array = array(); // 返回带有MAC地址的字串数组
    var $mac_addr;

    function GetMacAddr(){
        switch ( strtolower(PHP_OS) ){
            case "linux":
                $this->forLinux(); break;
            case "solaris":       break;
            case "unix":          break;
            case "aix":           break;
            default: $this->forWindows();break;
        }
        $temp_array = array();
        foreach ( $this->return_array as $value ){
            if (
                preg_match("/[0-9a-f][0-9a-f][:-]"."[0-9a-f][0-9a-f][:-]"."[0-9a-f][0-9a-f][:-]"."[0-9a-f][0-9a-f][:-]"."[0-9a-f][0-9a-f][:-]"."[0-9a-f][0-9a-f]/i",$value,
                $temp_array ) ){
                $this->mac_addr = $temp_array[0];
                break;
            }
        }
        unset($temp_array);
        return $this->mac_addr;
    }

    function forWindows(){
        @exec("ipconfig /all", $this->return_array);
        if ( $this->return_array )
            return $this->return_array;
        else{
            $ipconfig = $_SERVER["WINDIR"]."\system32\ipconfig.exe";
            if ( is_file($ipconfig) )
                @exec($ipconfig." /all", $this->return_array);
            else
                @exec($_SERVER["WINDIR"]."\system\ipconfig.exe /all", $this->return_array);
            return $this->return_array;
        }
    }

    function forLinux(){
        @exec("ifconfig -a", $this->return_array);
        return $this->return_array;
    }


}