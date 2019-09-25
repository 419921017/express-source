const http = require('http');
const Layer = require('./layer');

function Route(path) {
  this.stack = []
  this.path = path;
  this.methods = {}
}

Route.prototype._handle_method = function(method) {
  return Boolean(this.methods[method.toLowerCase()]);
}

// Route.prototype.get = function(handle) {
//   const layer = new Layer('/', handle)
//   layer.method = 'get';
//   this.methods['get'] = true;
//   this.stack.push(layer)
//   return this;
// }

http.METHODS.forEach(method => {
  method = method.toLowerCase();
  Route.prototype[method] = function(handle) {
    const layer = new Layer('/', handle)
    layer.method = method;
    this.methods[method] = true;
    this.stack.push(layer)
    return this;
  }
})

Route.prototype.dispatch = function(req, res, out) {
  // for (let i = 0; i < this.stack.length; i++) {
  //   if (req.method.toLowerCase() === this.stack[i].method) {
  //     return this.stack[i].handle_request(req, res);
  //   }
  // }
  let idx = 0;
  const next = (err) => {
    // 跳过route
    if (err && err === 'route') {
      return out();
    }
    // 跳过整个路由系统
    if (err && err === 'router') {
      return out(err);
    }
    // 不存在
    if (idx >= this.stack.length) {
      return out(err);
    }

    let layer = this.stack[idx++];

    if (req.method.toLowerCase() !== layer.method) {
      return next(err)
    }
    if (err) {
      // return out(err);
      layer.handle_error(err, req, res, next);
    } else {
      layer.handle_request(req, res, next);
    }

  }
  next()
}

module.exports = Route;