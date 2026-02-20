const net =require("net");

const {requestFromReader}= require("../request/request");
const {Writer}= require("../response/writer");

const {
    StatusCode,
    writeStatusLine,
    getDefaultHeaders,
    writeHeaders,
}=require("../response/response");

const HandlerError = require("./handlerError");

class SocketReader{
    constructor(socket){
        this.chunks=[];
        this.ended=false;

        socket.on("data", (chunk)=>{
            this.chunks.push(chunk);
        });

        socket.on("end", ()=>{
            this.ended=true;
        });
    }

    read(){
        if(this.chunks.length>0){
            return this.chunks.shift();
        }
        if(this.ended) return null;
        return null;
    }
}

class Server{
    constructor(listener, handler){
        this.listener=listener;
        this.handler=handler;
        this.closed=false;
    }

    async close(){
        this.closed = true;
        return new Promise((resolve) =>{
            this.listener.close(()=> resolve());
        });
    }

    listen(){
        this.listener.on("connection", (socket)=>{
            this.handle(socket);
        });
        
        this.listener.on("error", (err)=>{
            if(!this.closed){
                console.error("Server error:", err);
            }
        });
    }

    handle(socket){
        const reader = new SocketReader(socket);

        socket.on("data",()=>{
            let req;
            try{
                req = requestFromReader(reader);
                
                console.log("Request Line:");
                console.log(`- Method : ${req.RequestLine.Method}`);
                console.log(`- Target : ${req.RequestLine.RequestTarget}`);
                console.log(`- Version : ${req.RequestLine.HttpVersion}`);

                console.log("Headers Line:");
                    for(const key in req.Headers){
                        console.log(`-${key}: ${req.Headers[key]}`);
                    }

                console.log("Body:");
                console.log(req.Body.toString());


                
            } catch{
            //    writeHandlerError(socket, new HandlerError(400, "Bad Request\n"));
                const w=new Writer(socket);
                w.writeStatusLine(400);
                w.writeHeaders({"content-type":"text/html"});
                w.writeBody("<h1>Bad Request");
               return;
            }

            // const chunks=[];
            // const writer={
            //     write: (data)=>chunks.push(Buffer.from(data))
            // }

            const w=new Writer(socket);
            try{
                // const err= this.handler(writer, req);
                
                // if(err){
                //     writeHandlerError(socket, err);
                //     return;
                // }
                
                // const body= Buffer.concat(chunks);
                
                // writeStatusLine(socket, StatusCode.OK);
                
                // const headers=getDefaultHeaders(body.length);
                
                // writeHeaders(socket, headers);
                // socket.write(body);
                
                // socket.end();

                this.handler(w,req);
            } catch(e){
                // writeHandlerError(socket, new HandlerError(500, "Internal Server Error\n"));
                const errWriter= new Writer(socket);
                errWriter.writeStatusLine(500);
                errWriter.writeHeaders({"content-type":"text/html"});
                err.writeBody("<h1>Internal Server Error</h1>");
            }
        });

    }
}


function writeHandlerError(socket, err){
    writeStatusLine(socket, err.statusCode);

    const body = err.message;
    const headers = getDefaultHeaders(Buffer.byteLength(body));

    writeHeaders(socket, headers);
    // console.log(body);
    socket.write(body);
    socket.end();
}


async function serve(PORT, handler){
    return new Promise((resolve, reject) =>{
        const listener=net.createServer();

        listener.listen(PORT, ()=>{
            const server= new Server(listener,handler);
            server.listen();
            resolve(server);
        });

        listener.on("error", reject);
    });
}

module.exports={serve};