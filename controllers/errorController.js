const AppError = require('./../utils/appError');

const handleCastErrorDB = err => {
  const message = `invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateErrorDB = err => {
  const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
  const message = `Duplicate field value ${value}. Try different value!`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data! ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    messsage: err.message,
    stack: err.stack
  });
};

const sendErrorProd = (err, res) => {
  // Operation, trusted error: send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      messsage: err.message
    });
    // Programming or other unknown error: don't leak error details
  } else {
    // 1) Log the error
    console.error('ERROR:', err);
    // 2) send generic message

    res.status(500).json({
      status: 'Error',
      message: 'Something went very wrong!'
    });
  }
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'Error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateErrorDB(error);
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    sendErrorProd(error, res);
  }
};
