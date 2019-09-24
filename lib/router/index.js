const url = require('url');
const Layer = require('./layer');
const Route = require('./route');

function Router() {
  this.stack = [
    {
      path: '*',
      method: '*',
      handle: function(req, res) {
          res.writeHead(200, {
              'Content-Type': 'text/plain'
          });
          res.end('404');
      }
    }
  ];
}

Router.prototype.get = function(path, handle) {
  // this.stack.push({
  //   path,
  //   handle,
  //   method: 'get'
  // })
  // this.stack.push(new Layer(path, handle))
  const route = this.route(path);
  route.get(handle)
  return this;
}

Router.prototype.route = function(path) {
  const route = new Route(path);
  const layer = new Layer(path, route.dispatch.bind(route));
  layer.route = route;
  this.stack.push(layer)
  return route;
}

Router.prototype.handle = function(req, res) {
  const {pathname} = url.parse(req.url)
  for (let i = 1; i < this.stack.length; i++) {
    if (this.stack[i].match(pathname) && this.stack[i].route && this.stack[i].route._handle_method(req.method)) {
      return this.stack[i].handle_request(req, res);
    }
  }
  return this.stack[0].handle_request(req, res)
}

module.exports = Router;

