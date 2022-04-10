const WebSocket = require('ws');
const request = require('request');
class BOT {
    constructor ( token, tacc = 'farm' ) {
        this.vkid = token.match(/vk_user_id=([0-9]+)/gi)[0].slice(11);
        this.pingDate = -1;
        this.ping = -1;
        this.ws = null;
        this.token = token;
        this.connected = false;
        this.intervals = false;
        this.tacc = tacc;
        this.connect();
    }

    setIntervals = () => {
        if(!this.intervals){
            setInterval(() => {
                if(!this.connected) return false;
                this.ws.send(this.stringToBuffer('{"type":"ping"}'));
                this.pingDate = (new Date).getTime()
                this.ws.send(this.stringToBuffer('{"type":"SyncUser"}'));
            }, 5000)
            setInterval(() => {
                if(!this.connected) return false;
                this.ws.send(this.stringToBuffer('{"type":"ClickPassive"}'));
            }, 1000);
            setTimeout(() => {
                if(!this.connected) return false;
                this.clicker();
            }, 5000);
            this.intervals = true;
        }
    }
    
    sendRest ( query ) {
        return new Promise((res, err) => {
            request({ 
                url: 'https://vaccine-api.skyreglis.studio/v1/' + query.method,
                method: query.isGET ? 'GET' : 'POST',
                headers: {
                    'user': this.token.slice(41),
                    'origin': 'https://vaccine.skyreglis.studio',
                    'referer': 'https://vaccine.skyreglis.studio/',
                    "Content-Type": "application/json",
                    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.106 Safari/537.36'
                },
                body: JSON.stringify(query.body) || JSON.stringify({})
            }, (e, r, body) => {
                if(body[0] === '{'){
                    res(JSON.parse(body));
                }else{
                    res(body);
                }
                console.log(body);
            })
        })
    }

    transfer (id, sum) {
        return this.sendRest({ method: 'transfer', body: { sum: sum, toUserId: id }})
    }

    connect () {
        this.ws = new WebSocket(this.token);
        this.ws.onmessage = ({ data: msg }) => {
            if ("{" === msg[0]) {
                let data = JSON.parse(msg);
                //console.log(data);
                switch (data.type) {
                    case 'SyncUser':
                        let data_ = data.data.data;
                        this.log(`Balance: ${String(Math.floor(data_.balance)).replace(/(.)(?=(\d{3})+$)/g,'$1.')} clickUser: ${data_.clickUser} clickPassive: ${data_.clickPassive}`);
                        //if (this.tacc == 'transfer') {
                            //this.transfer(510401337, data_.balance);
                            //this.transfer(197933618, data_.balance);
                        //}
                        break;
                    /*
                        {"type":"PassCaptcha","index":4}

                    */
                    case 'CaptchaSuccess':
                        this.log('Решил капчу')
                        break;
                    case 'CaptchaNeeded':
                        this.log('Получил капчу')
                        //let captchas = data.data;
                        //var longestWord = captchas.sort(function(a, b) { 
                        //    return b.length - a.length;
                        //});
                        var MaxIndex_size = -1
                        var MaxIndex_id = -1
                        //console.log(data);
                        for (let i = 0; i < data.data.length; i++) {
                            const e = data.data[i];
                            if(MaxIndex_size < e.length){
                                MaxIndex_size = e.length;
                                MaxIndex_id = i;
                            }
                            //console.log(i, e.length);
                        }
                        this.ws.send(this.stringToBuffer('{"type":"PassCaptcha","index":'+MaxIndex_id+'}'));
                        //this.ws.send(this.stringToBuffer('{"type":"PassCaptcha","index":4}'));
                        break;
                    case 'pong':
                        this.ping = (new Date).getTime()-this.pingDate;
                        break;
                    default:
                        break;
                }
            }
        };
        this.ws.onopen = _ => {
            this.connected = true;
            this.setIntervals();
        };

        this.ws.onclose = _ => {
            this.connected = false;
            setTimeout(() => {
                this.connect();
            }, 30e3);
        };
    }

    clicker () {
        if(!this.connected){
            setTimeout(() => {
                this.clicker();
            }, 1000)
            return false;
        };
        let x = 630//320+Math.round(Math.random()*50)
        let y = 630//320+Math.round(Math.random()*50)
        let date = (new Date).getTime()
        let hh = date+x+y
        this.ws.send(this.stringToBuffer('{"type":"ClickUser","time":'+date+',"x":'+320+Math.round(Math.random()*45)+',"y":'+320+Math.round(Math.random()*55)+',"hash":'+hh+'}'));
        setTimeout(() => {
            this.clicker();
        }, 25); //}, 350+Math.round(Math.random()*150));
    }

    stringToBuffer (str) {
        var binary_string = Buffer.from(str).toString('binary');
        var len = binary_string.length;
        var bytes = new Uint8Array(len);
        for (var i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }    
        return bytes.buffer;
    }

    log (text) {
        console.log(`[${new Date().toLocaleTimeString()}][${this.vkid}][${this.ping}ms] ${text}`);
    }
}

module.exports = BOT