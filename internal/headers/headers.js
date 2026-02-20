
class Headers {
    constructor(){
        this.map={};
    }

     /**
     * Parse ONE header line from data buffer
     * @param {Buffer} data
     * @returns {{ n: number, done: boolean }}
     */

     parse(data){
        const str=data.toString();

        const lineEnd=str.indexOf("\r\n");
        if(lineEnd === -1){
            return {n: 0, done: false}; // need more data
        }

        // if CRLF at start -> end of headers
        if(lineEnd===0){
            return {n:2, done: true};
        }

        const line = str.slice(0,lineEnd);

        // Invalid if space before colon in key
        const colonIndex= line.indexOf(":");
        if(colonIndex === -1){
            throw new Error("invalid header format");
        }

        const keyPart= line.slice(0, colonIndex);
        const valuePart= line.slice(colonIndex+1);

        let key= keyPart.trimStart();
        const value= valuePart.trim();

        // there should be no space between keypart and colon
        if(/\s/.test(key)){
            throw new Error("invalid spacing before colon in header key");
        }

        if (!/^[A-Za-z0-9!#$%&'*+\-.^_`|~]+$/.test(key)) {
            throw new Error("invalid character in header key");
        }

        key=key.toLowerCase();

        if(this.map[key]){
            this.map[key]=`${this.map[key]}, ${value}`;
        }
        else{
            this.map[key]= value;
        }
        return {n: lineEnd+2, done: false}; 
     }

     get(key){
        return this.map[key.toLowerCase()];
     }
}


function newHeaders(){
    return new Headers();
}

module.exports={newHeaders};