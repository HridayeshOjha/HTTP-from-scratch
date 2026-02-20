const { readSync } = require("fs");

const StatusCode={
    OK:200,
    BAD_REQUEST:400,
    INTERNAL_SERVER_ERROR:500,
};

function writeStatusLine(w, statusCode){
    let reason="";
    // console.log(statusCode);

    if(statusCode === StatusCode.OK){
        reason="OK";
    } else if (statusCode=== StatusCode.BAD_REQUEST){
        reason="Bad Request";
    } else if (statusCode=== StatusCode.INTERNAL_SERVER_ERROR){
        reason="Internal Server Error";
    }

    const line= `HTTP/1.1 ${statusCode} ${reason}\r\n`;
    // console.log(line);
    w.write(line);
}

function getDefaultHeaders(contentLength){
    return {
        "content-length": String(contentLength),
        "connection": "close",
        "content-type": "text/plain",
    };
}

function writeHeaders(w, headers){
    for (const key in headers){
        w.write(`${key}: ${headers[key]}\r\n`);
        // console.log(`${key}: ${headers[key]}\r\n`); 
    }
    w.write("\r\n");
}

module.exports={
    StatusCode,
    writeStatusLine,
    getDefaultHeaders,
    writeHeaders,
};