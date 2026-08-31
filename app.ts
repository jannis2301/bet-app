import path from 'node:path';
import querystring from 'node:querystring';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
// Express 5 forwards rejected promises from handlers/middleware to the error
// middleware natively, so express-async-errors is no longer needed.

// security packages
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
// middleware
import errorHandlerMiddleware from './middleware/error-handler.js';
import notFoundMiddleware from './middleware/not-found.js';
//routers
import archiveRouter from './routes/archiveRoutes.js';
import authRouter from './routes/authRoutes.js';
import betsRouter from './routes/betsRoutes.js';
import matchesRouter from './routes/matchesRoutes.js';
import tableRouter from './routes/tableRoutes.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// registered before the SPA catch-all below so it doesn't get swallowed by it
app.get('/healthcheck', (_req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res
    .status(isDbConnected ? 200 : 503)
    .json({ status: isDbConnected ? 'ok' : 'db unavailable' });
});

app.use(express.json());
app.use(cookieParser());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // the browser no longer talks to openligadb directly — match data
        // is proxied through GET /api/matches, so 'self' is enough here
        imgSrc: [
          "'self'",
          'data:',
          'https://i.imgur.com',
          'https://upload.wikimedia.org',
        ],
      },
    },
  })
);

// Express 5's req.query is a getter that re-parses req.url on every access
// (no setter), so express-mongo-sanitize's `req.query = ...` reassignment
// throws / silently no-ops. body/params stay plain mutable objects, so those
// are sanitized as before; query is sanitized by hooking it into the parser
// itself instead.
app.set('query parser', (str: string) =>
  mongoSanitize.sanitize(querystring.parse(str))
);

app.use((req, _res, next) => {
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.params) mongoSanitize.sanitize(req.params);
  next();
});

app.use('/api/auth', authRouter);
app.use('/api/bets', betsRouter);
app.use('/api/matches', matchesRouter);
app.use('/api/table', tableRouter);
app.use('/api/archive', archiveRouter);

if (process.env.NODE_ENV === 'production') {
  // registered after the API routers so it only catches what they didn't —
  // otherwise this would swallow every GET request, API routes included
  // __dirname points at the compiled file's own location (dist/ in
  // production vs. the repo root under tsx/vitest), which differs between
  // environments — process.cwd() doesn't, since every entry point (tsx
  // watch, vitest, node dist/server.js) is launched from the repo root.
  const directoryPath = path.join(process.cwd(), 'client', 'dist');
  app.use(express.static(directoryPath));

  // {*splat} is Express 5's (path-to-regexp v8) match-everything-including-root
  // wildcard; a bare '*splat' would no longer match '/' like Express 4's '*' did.
  app.get('/{*splat}', (_req, res) => {
    res.sendFile(path.join(directoryPath, 'index.html'));
  });
}

app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

export default app;
