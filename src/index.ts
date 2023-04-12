import 'dotenv/config';
import app from './app';
import logger from './config/logger';

const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  logger.info(`listening at http://localhost:${port}`);
  logger.info(`environment: ${process.env.NODE_ENV}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received, shutting down gracefully');
  server.close(() => {
    logger.info('server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received, shutting down gracefully');
  server.close(() => {
    logger.info('server closed');
    process.exit(0);
  });
});

export default server;
