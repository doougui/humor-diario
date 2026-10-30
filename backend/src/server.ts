import { buildApp } from './app';
import { env } from './env';

buildApp()
  .then((app) => app.listen({ port: env.PORT, host: '0.0.0.0' }))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
