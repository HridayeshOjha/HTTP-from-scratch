# HTTP/1.1 Server From Scratch using raw TCP sockets

This project is a working HTTP/1.1 server implemented directly on top of raw TCP sockets in Node.js without using Node’s built-in 'http' module or any web framework.

My goal was not to build a website, but to understand what a web server actually does under the hood,
how bytes arriving over a network become structured HTTP requests and how responses are streamed back correctly.

Most applications use frameworks that hide these details. In this project i have tried to remove that abstraction and implement the protocol manually.

-------------------------------------------------------------------------------------------------------------------------------

## Why This Project

Modern backend development often treats HTTP as a black box,

request -> framework -> response

In reality, HTTP is a strict text protocol running over a streaming transport (TCP). Data does not arrive as full messages. It arrives in arbitrary chunks, 
and the server must reconstruct meaning from incomplete data while respecting the rules defined in the RFC.

I build this project to understand:

- How TCP differs from message-based communication
- Why HTTP parsing requires a state machine
- How servers detect incomplete or malformed requests
- Why 'Content-Length' and 'Transfer-Encoding: chunked' both exist
- How streaming and proxying actually work

----------------------------------------------------------------------

## Features

### Request Parsing
- Incremental HTTP request parser (handles partial TCP reads)
- Request line parsing with validation
- RFC-compliant header parsing (case-insensitive keys)
- Duplicate header merging
- Body parsing using 'Content-Length'

### Streaming Support
- Chunked transfer encoding implementation
- Chunked response writer
- Trailer headers
- SHA-256 integrity verification of streamed responses

### Server Behavior
- Custom TCP server (no 'http' module)
- Graceful connection handling
- Custom handler interface
- Binary file serving ('video/mp4')
- Reverse proxy streaming responses from httpbin.org in real time

### Response System
- Manual status line generation
- Default header management
- Dynamic headers and body writing
- Chunked and non-chunked responses

---------------------------------------------------------------------

## Example Raw Request
- curl --raw -v http://localhost:42069/httpbin/stream/100  --> the server parses this incrementally as bytes arrive, reconstructs the request, forwards it,
                                                               streams the response back chunk-by-chunk, and verifies integrity using trailers
  

- curl http://localhost:42069 / curl http://localhost:42069/myproblem / curl http://localhost:42069/yourproblem --> these are some other for text/html response. here server parses the request
                                                                                                                    and sends a proper response structured according to RFC guidelines of HTTP/1.1
  

- http://localhost:42069/video  --> the video route serves a real binary file(mp4). Because i have not stored that video in the repository,
                                    you need to download a video by yourself  => * make a assets directory and put some video in it
                                                                                 * open browser and run the command
                                    the browser will play the video directly, proving the server correctly handles binary responses


  -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

  # This project focuses on protocol understanding rather than framework usage.
    * It shows how web servers actually: ---
      - interpret network streams
      - manage connection lifecycles
      - handle incomplete data safely
      - stream large responses
      - act as intermediaries between clients and upstream servers

-----------------------------------------------------------------------

## Notes
Frameworks hide complexity.
I have build this project to understand the protocol layer beneath them.
