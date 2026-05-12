const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const protoDir = path.join(__dirname, '../src/app/proto');
if (!fs.existsSync(protoDir)) {
    fs.mkdirSync(protoDir, { recursive: true });
}

const serverProtoDir = path.join(__dirname, '../../server/proto');
const clientProtos = fs.readdirSync(path.join(serverProtoDir, 'client'))
    .filter(f => f.endsWith('.proto'))
    .map(f => path.join(serverProtoDir, 'client', f));

const serverProtos = fs.readdirSync(path.join(serverProtoDir, 'server'))
    .filter(f => f.endsWith('.proto'))
    .map(f => path.join(serverProtoDir, 'server', f));

const allProtos = [...clientProtos, ...serverProtos];

console.log('Generating Protos...');
try {
    execSync(`npx pbjs -p ${serverProtoDir} -t static-module -w es6 -o ${path.join(protoDir, 'message.js')} ${allProtos.join(' ')}`, { stdio: 'inherit' });
    execSync(`npx pbts -o ${path.join(protoDir, 'message.d.ts')} ${path.join(protoDir, 'message.js')}`, { stdio: 'inherit' });
    console.log('Protos generated successfully.');
} catch (error) {
    console.error('Failed to generate protos:', error.message);
    process.exit(1);
}
