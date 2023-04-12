import 'dotenv/config';
import app from './app';

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`[server] listening at http://localhost:${port}`);
  console.log(`[server] environment: ${process.env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received, shutting down gracefully');
  server.close(() => {
    console.log('server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.info('SIGINT signal received, shutting down gracefully');
  server.close(() => {
    console.log('server closed');
    process.exit(0);
  });
});

export default server;
