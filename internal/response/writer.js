
const StatusCode={
    OK:200,
    BAD_REQUEST:400,
    INTERNAL_SERVER_ERROR:500,
};

const State={
    status:0,
    headers:1,
    body: 2,
    done: 3,
};

class Writer{
    constructor(socket){
        this.socket=socket;
        this.state=State.status;
    }

    writeStatusLine(statusCode){
        if(this.state!==State.status){
            throw new Error("status line already written");
        }
        let reason="";
        if(statusCode===200) reason="OK";
        else if(statusCode===400) reason="Bad Request";
        else if(statusCode===500) reason="Internal Server Error";

        this.socket.write(`HTTP/1.1 ${statusCode} ${reason}\r\n`);
        this.state=State.headers;
    }

    writeHeaders(headers){
        if(this.state!==State.headers){
            throw new Error("headers must come after status line");
        }
        for(const key in headers){
            this.socket.write(`${key}: ${headers[key]}\r\n`);
        }
        this.socket.write("\r\n");
        this.state=State.body;
    }

    writeBody(data){
        if(this.state!== State.body){
            throw new Error("body must come after headers");
        }

        if(typeof data==="string"){
            data=Buffer.from(data);
        }

        this.socket.write(data);
        this.socket.end();
        this.state=State.done;
    }
    
    writeChunkedBody(data){
        if(this.state!==State.body){
            throw new Error("must send headers before body");
        }
        if(typeof data === "string"){
            data= Buffer.from(data);
        }
        if(data.length===0){
            return 0;
        }
        const sizeHex= data.length.toString(16);
        this.socket.write(sizeHex+"\r\n");
        this.socket.write(data);
        this.socket.write("\r\n");
    
        return data.length;
    }
    
     writeChunkedBodyDone(){
        if(this.state!==State.body){
            throw new Error("cannot finish before body");
        }
        this.socket.write("0\r\n");
    }

    writeTrailers(headers){
        if(this.state!==State.body){
            throw new Error("trailers only allowed after chunked body");
        }
        for(const key in headers){
            this.socket.write(`${key}: ${headers[key]}\r\n`);
        }
        this.socket.write("\r\n");
        this.socket.end();
        this.state=State.done;
    }
}

module.exports={ Writer,StatusCode };