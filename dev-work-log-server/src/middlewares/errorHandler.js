const errorHandler = (err, req, res, next) => {
  console.error('[Global Error]:', err.stack || err.message || err);

  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    code: status,
    msg: message,
    data: null
  });
};

module.exports = errorHandler;
