function Layer(path, handle) {
  this.path = path;
  this.handle = handle;
}

Layer.prototype.handle_request = function(req, res, next) {
  // this.handle && this.handle(req, res);
  try {
    this.handle(req, res);
  } catch (err) {
    next(err)
  }
}

Layer.prototype.handle_error = function(error, req, res, next) {
  if (this.handle.length !== 4) {
    return next(error)
  }

  try {
    this.handle(error, req, res, next)
  } catch (err) {
    next(err)
  }
}

Layer.prototype.match = function(pathname) {
  return (this.path === pathname || this.path === '*')
}

module.exports = Layer;
