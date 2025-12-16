import { preview } from 'vite';

const port = Number(process.env.PORT) || 3000;

const server = await preview({
  preview: {
    port,
    host: '0.0.0.0',
  },
});

server.printUrls();

const closeSignals = ['SIGINT', 'SIGTERM'];
closeSignals.forEach((signal) => {
  process.on(signal, () => {
    server.httpServer.close(() => process.exit(0));
  });
});
