const responseHandler = (req, res, next) => {
  res.success = (data = null, message = 'success') => {
    res.status(200).json({
      code: 200,
      msg: message,
      data: data
    });
  };

  res.error = (message = 'error', code = 500) => {
    res.status(200).json({
      code: code,
      msg: message,
      data: null
    });
  };

  next();
};

module.exports = responseHandler;
