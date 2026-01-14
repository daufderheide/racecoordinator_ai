const protobuf = require('protobufjs');
const http = require('http');

async function run() {
    const root = await protobuf.load('proto/message.proto');
    const HelloRequest = root.lookupType('com.antigravity.HelloRequest');

    const payload = { name: 'Test User' };
    const errMsg = HelloRequest.verify(payload);
    if (errMsg) throw Error(errMsg);

    const message = HelloRequest.create(payload);
    const buffer = HelloRequest.encode(message).finish();

    const options = {
        hostname: 'localhost',
        port: 7070,
        path: '/api/proto-hello',
        method: 'POST',
        headers: {
            'Content-Type': 'application/octet-stream',
            'Content-Length': buffer.length
        }
    };

    const req = http.request(options, (res) => {
        console.log(`STATUS: ${res.statusCode}`);
        res.on('data', (chunk) => {
            console.log(`BODY: ${chunk.toString('hex')}`);
        });
    });

    req.on('error', (e) => {
        console.error(`problem with request: ${e.message}`);
    });

    req.write(buffer);
    req.end();
}

run();
