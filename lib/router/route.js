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

Route.prototype.dispatch = function(req, res) {
  for (let i = 0; i < this.stack.length; i++) {
    if (req.method.toLowerCase() === this.stack[i].method) {
      return this.stack[i].handle_request(req, res);
    }
  }
}

module.exports = Route;