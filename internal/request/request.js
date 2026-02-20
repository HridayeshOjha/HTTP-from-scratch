const {newHeaders} = require("../headers/headers");

const State={
    request_line:0,
    headers:1,
    body:2,
    done:3,
};

class RequestLine{
    constructor(method, requestTarget, httpVersion){
        this.Method= method;
        this.RequestTarget=requestTarget;
        this.HttpVersion=httpVersion;
    }
}

class Request{
    constructor(){
        this.state=State.request_line;
        this.RequestLine=null;
        this.Headers={};
        this._headersParser=newHeaders();
        this.Body= Buffer.alloc(0);
    }

    parseSingle(dataBuffer){
        if(this.state===State.request_line){
            const str= dataBuffer.toString();
            // console.log(str);
            const lineEnd= str.indexOf("\r\n");
            // console.log(lineEnd);

            if(lineEnd===-1){
                return {consumed: 0};
            }

            const line =str.slice(0, lineEnd);
            //  console.log(`the line -> ${line}`);
            const requestLine=parseRequestLine(line);

            this.RequestLine=requestLine;
            this.state=State.headers;

            return {consumed: lineEnd + 2};
        }

        if(this.state=== State.headers){
            const {n, done}=this._headersParser.parse(dataBuffer);

            if(n===0) return {consumed:0};

            if(done){
                this.Headers=this._headersParser.map;
                this.state= State.body;
            }

            return {consumed:n};
        }

        if(this.state===State.body){
            const lenStr= this._headersParser.get("content-length");

            if(!lenStr){
                this.state=State.done;
                return {consumed:0};
            }

            const contentLength = parseInt(lenStr, 10);

            const remainingNeeded = contentLength- this.Body.length;
            const toTake= Math.min(remainingNeeded, dataBuffer.length);

            if(toTake > 0){
                this.Body= Buffer.concat([this.Body, dataBuffer.slice(0,toTake)]);
            }

            if(this.Body.length > contentLength){
                throw new Error("body exceeds content length");
            }
            
            if(this.Body.length=== contentLength){
                this.state = State.done;
            }
            
             return  {consumed: toTake};
        }

        if(this.state===State.done){
            return {consumed:0};
        }

        throw new Error("unknown state");
    }
    

    parse(dataBuffer){
        let totalConsumed=0;

        while(this.state!==State.done){
            const{consumed}= this.parseSingle(
                dataBuffer.slice(totalConsumed)
            );

            if(consumed===0) break;

            totalConsumed+=consumed;
        }
        return totalConsumed;
    }
}


function parseRequestLine(line) {
    // console.log(`the line -> ${line}`);
    const parts=line.split(" ");
    if(parts.length!==3){
        throw new Error("invalid request line");
    }

    const [method, target, versionPart]=parts;

    // uppercase letters only
    if(!/^[A-Z]+$/.test(method)){
        throw new Error("invalid method");
    }

    // must be HTTP/1.1 exactly
    if(!versionPart.startsWith("HTTP/")){
        throw new Error("invalid version format");
    }

    const version=versionPart.substring(5);
    if(version!=="1.1"){
        throw new Error("unsupported HTTP version");
    }

    return new RequestLine(method, target, version);
}

function requestFromReader(reader){
    const req=new Request();
    let buffer= Buffer.alloc(8);
    let readToIndex=0;

    while( req.state !== State.done){
        const chunk =reader.read();
        if(!chunk) break;

        while(readToIndex + chunk.length > buffer.length){
            const newBuf= Buffer.alloc(buffer.length*2);
            buffer.copy(newBuf);
            buffer=newBuf;
        }
        // console.log(buffer);

        chunk.copy(buffer, readToIndex);
        readToIndex +=chunk.length;

        const consumed = req.parse(buffer.slice(0,readToIndex));

        if(consumed>0){
            buffer.copy(buffer,0, consumed, readToIndex);
            readToIndex-=consumed;
        }
        // console.log(req.RequestLine);
    }

    if(req.state!==State.done){
        throw new Error("incomplete request");
    }

    return req;
}

module.exports = {
    requestFromReader,
};