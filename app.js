const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');

const app = express();

// 1) GLOBAL MIDDLEWARES
// SEt security HTTP headers
app.use(helmet());

// Dvelopment logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limiting the requests from the same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests form this IP, [please try again in an hour!'
});
app.use('/api', limiter);

// body parser, reading data from the body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against noSQL query injection.
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xss());

// Serving static files
app.use(express.static(`${__dirname}/public`));

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //console.log(req.headers);
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`cant't find ${req.originalUrl} in this server!`, 404));
});

app.use(globalErrorHandler);
module.exports = app;
