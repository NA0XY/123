const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting OneCare Healthcare Platform Servers...\n');

// Start main Express server
const mainServer = spawn('node', [path.join(__dirname, 'server.js')], {
    stdio: 'inherit'
});

// Start WebSocket server
const websocketServer = spawn('node', [path.join(__dirname, 'server', 'websocket-server.js')], {
    stdio: 'inherit'
});

// Start FHIR API server
const fhirServer = spawn('node', [path.join(__dirname, 'fhir-api-server.js')], {
    stdio: 'inherit'
});

console.log('📡 Main Server: http://localhost:3000');
console.log('🔗 WebSocket Server: http://localhost:3002');
console.log('🏥 FHIR API Server: http://localhost:3003');
console.log('💡 To stop servers, press Ctrl+C\n');

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    
    mainServer.kill('SIGINT');
    websocketServer.kill('SIGINT');
    fhirServer.kill('SIGINT');
    
    setTimeout(() => {
        process.exit(0);
    }, 1000);
});

// Handle server crashes
mainServer.on('close', (code) => {
    if (code !== 0) {
        console.log(`❌ Main server exited with code ${code}`);
    }
});

websocketServer.on('close', (code) => {
    if (code !== 0) {
        console.log(`❌ WebSocket server exited with code ${code}`);
    }
});

fhirServer.on('close', (code) => {
    if (code !== 0) {
        console.log(`❌ FHIR server exited with code ${code}`);
    }
});