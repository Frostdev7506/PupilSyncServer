// Example implementation of catchAsync
module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); // Catches promise rejections and passes them to next()
  };
};