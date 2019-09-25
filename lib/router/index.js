const http = require('http');
const url = require('url');
const Layer = require('./layer');
const Route = require('./route');

function Router() {
  this.stack = [];
}

// Router.prototype.get = function(path, handle) {
//   // this.stack.push({
//   //   path,
//   //   handle,
//   //   method: 'get'
//   // })
//   // this.stack.push(new Layer(path, handle))
//   const route = this.route(path);
//   route.get(handle)
//   return this;
// }

http.METHODS.forEach(method => {
  method = method.toLowerCase();
  Router.prototype[method] = function(path, handle) {
    const route = this.route(path);
    route[method].call(route, handle);
    return this;
  }
})

Router.prototype.route = function(path) {
  const route = new Route(path);
  const layer = new Layer(path, route.dispatch.bind(route));
  layer.route = route;
  this.stack.push(layer)
  return route;
}

Router.prototype.handle = function(req, res, out) {
  const {pathname} = url.parse(req.url)
  // console.log('this.stack', this.stack)
  // for (let i = 1; i < this.stack.length; i++) {
  //   if (this.stack[i].match(pathname) && this.stack[i].route && this.stack[i].route._handle_method(req.method)) {
  //     return this.stack[i].handle_request(req, res);
  //   }
  // }
  // return this.stack[0].handle_request(req, res)

  let idx = 0;
  const next = (err) => {
    let layerError = (err === 'route' ? null : err)
    if (layerError === 'router') {
      return out(null);
    }

    if (idx >= this.stack.length || layerError) {
      return out(err);
    }

    let layer = this.stack[idx++];

    if (layer.match(pathname) && layer.route && layer.route._handle_method(req.method)) {
      return layer.handle_request(req, res, next);
    } else {
      next(layerError);
    }
  }

  next();
}

module.exports = Router;

