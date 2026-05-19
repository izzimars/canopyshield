import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { GlobalErrorCatcherMiddleware } from '../shared/middlewares/global-error-catch-middleware';
import { corsOptions } from './cors';
import { Router, ROUTE_BASE } from '../routes';

export const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Parse cookies
app.use(express.static('public'));
app.use(ROUTE_BASE.V1_PATH, Router);

app.use((req, res, _next) => {
  res.status(404).json({
    status: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
      details: null,
    },
  });
});


app.use(GlobalErrorCatcherMiddleware);

export default app;
