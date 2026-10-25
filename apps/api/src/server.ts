import http from 'http';
import { createApp } from './app';
import { CONFIG } from './config';
import { initSocketServer } from './socket';

const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO with HTTP server
initSocketServer(server);

const PORT = CONFIG.PORT;

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Game Difficulty Auto-Balancing API is running!`);
  console.log(` Listening on: http://localhost:${PORT}`);
  console.log(` Environment:  ${CONFIG.NODE_ENV}`);
  console.log(` ML Service:   ${CONFIG.ML_SERVICE_URL}`);
  console.log(`=================================================`);
});

export { server, app };
