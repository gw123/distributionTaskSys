const crypto = require('crypto');

var mo = {
    aesEncrypt : function (data, key) {
        const cipher = crypto.createCipher('aes192', key);
        var crypted = cipher.update(data, 'utf8', 'hex');
        crypted += cipher.final('hex');
        return crypted;
    },
    aesDecrypt:function (encrypted, key) {
        const decipher = crypto.createDecipher('aes192', key);
        var decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    },
    md5:function  (text) {
        return crypto.createHash('md5').update(text).digest('hex');
    },
    /***
     * 使用时间和 token 加密当前请求
     * @param token
     * @returns {{time: Number, encry: *}}
     */
    encryToken :function (token) {
        var data = new Date();
        var time = parseInt(data.getTime()/1000);
        var rand = mo.md5(time+"@"+token)
        return {
            time : time,
            encry :rand
        }
    },
    /***
     * 判断 auth 是否有效
     * @param time
     * @param encry
     * @param token
     * @returns {boolean}
     */
    isValidAuth : function ( time , encry , token) {
        //console.log(encry ,mo.md5(time+"@"+token))
       return encry === mo.md5(time+"@"+token)
    }
}

module.exports = mo

// var data = 'Hello, this is a secret message!';
// var key = 'Password!';
// var encrypted = aesEncrypt(data, key);
// var decrypted = aesDecrypt(encrypted, key);