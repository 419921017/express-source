function Layer(path, handle) {
  this.path = undefined;
  this.handle = handle;
  //是否为*
  this.fast_star = (path === '*' ? true : false);
  if (!this.fast_star) {
    this.path = path;
  }
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
  // return (this.path === pathname || this.path === '*')
  // *
  if (this.fast_star) {
    this.path = '';
    return true;
  }
  // 普通路由
  if (this.route && this.path === pathname.slice(-this.path.length)) {
    return true
  }

  // 中间件
  if (!this.route) {
    // 不带路径的中间件
    if (this.path === '/') {
      this.path = ''
      return true;
    }
    if (this.path === pathname.slice(0, this.path.length)) {
      return true;
    }
  }
  return false;
}

module.exports = Layer;
