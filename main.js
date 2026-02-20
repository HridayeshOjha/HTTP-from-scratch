const {serve}= require("./internal/server/server");
// const HandlerError= require("./internal/server/handlerError");
const{StatusCode}= require("./internal/response/writer");
const fs=require("fs");
const path=require("path");

const https=require("https");
const crypto= require("crypto");

async function proxyHttpbin(w, target){
    const destination ="https://httpbin.org" + target;

    const resp= await fetch(destination);

    w.writeStatusLine(200);

    const headers ={};
    for(const [k,v] of resp.headers){
        if(k.toLowerCase()!=="content-length"){
            headers[k]=v;
        }
    }

    headers["transfer-encoding"]="chunked";
    headers["trailer"]="X-Content-SHA256, X-Content-Length";

    w.writeHeaders(headers);

    const reader= resp.body.getReader();

    let fullBody=Buffer.alloc(0);

    while(true){
        const {done, value}= await reader.read();
        if(done) break;
        
        const buf=Buffer.from(value);
        fullBody=Buffer.concat([fullBody,buf]);
        w.writeChunkedBody(buf);
    }

    w.writeChunkedBodyDone();

    const hash= crypto.createHash("sha256").update(fullBody).digest("hex");

    w.writeTrailers({
        "X-Content-SHA256": hash,
        "X-Content-Length": String(fullBody.length)
    })
}

async function handler(w,req){
    const target= req.RequestLine.RequestTarget;

    if(req.RequestLine.Method!=="GET"){
        w.writeStatusLine(StatusCode.BAD_REQUEST);
        w.writeHeaders({"content-type":"text/plain"});
        w.writeBody(Buffer.from("only GET allowed"));
        return;
    }

    if(target=="/video"){
        const filetarget=path.join(__dirname, "/assets/vim.mp4");
        const video=fs.readFileSync(filetarget);

        w.writeStatusLine(StatusCode.OK);

        w.writeHeaders({
            "content-type":"video/mp4",
            "content-length": String(video.length),
            "connection": "close",
        });

        w.writeBody(video);
        return;

    }

    if(target.startsWith("/httpbin")){
        await proxyHttpbin(w, target.replace("/httpbin",""));
        return;
    }

    if(target==="/yourproblem"){
        // return new HandlerError(400, "your problem is not my problemc\n");
        w.writeStatusLine(StatusCode.BAD_REQUEST);
        w.writeHeaders({"content-type":"text/html"});
        w.writeBody(`<html>
            <head><title>400 Bad Request</title></head>
            <body>
                <h1>Bad Request</h1>
                <p>Your request honestly kinda sucked.</p>
            </body>
            </html>`);
            return;
    }

    if(target==="/myproblem"){
        // return new HandlerError(500, "my problem is your problem\n");
        w.writeStatusLine(StatusCode.INTERNAL_SERVER_ERROR);
        w.writeHeaders({"content-type":"text/html"});
        w.writeBody(`
            <html>
            <head><title>500 Internal Server Error</title></head>
            <body>
                <h1>Internal Server Error</h1>
                <p>Okay, you know what? My problem is your problem.</p>
            </body>
            </html>`);
            return;
    }

    // w.write("All good, frfr\n");
    // return null;
    w.writeStatusLine(StatusCode.OK);
    w.writeHeaders({"content-type":"text/html"});
    w.writeBody(`<html>
        <head><title>200 OK</title></head>
        <body>
            <h1>Success!</h1>
            <p>Your request was an absolute banger.</p>
        </body>
        </html>`);
        return;
}

const PORT= 42069;

(async () =>{
    const server = await serve(PORT, handler);
    console.log("Server started on port", PORT);

    // Graceful shutdown
    process.on("SIGINT", async()=>{
        console.log("Server gracefully stopped");
        await server.close();
        process.exit(0);
    });
}) ();