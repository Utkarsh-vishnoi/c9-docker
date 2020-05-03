const http = require('http');
const app = require('./app');

const port = process.env.PORT || 3000;

console.log(`Server running on port: ${port}`);

const server = http.createServer(app);

server.listen(port);
