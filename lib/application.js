const http = require('http');
const Router = require('./router');
const middleware = require('./middleware/init.js');

function Application() {}

Application.prototype.lazyrouter = function() {
  if (!this._router) {
    this._router = new Router();
    this._router.use(middleware.init())
  }
}

// Application.prototype.get = function(path, handle) {
//   this._router.get(path, handle)
// }

http.METHODS.forEach(method => {
  method = method.toLowerCase();
  Application.prototype[method] = function(path, handle) {
    this.lazyrouter();
    this._router[method].apply(this._router, arguments);
    return this;
  }
})

Application.prototype.use = function(handle) {
  this.lazyrouter();
  let path = '/';
  if (typeof handle !== 'function') {
    path = handle;
    handle = arguments[1]
  }
  this._router.use(path, handle);
  return this;
}

Application.prototype.listen = function() {
  const server = http.createServer((req, res) => {
    const done = function(err) {
      res.writeHead(404, {
        'Content-Type': 'text/plain'
      })
      if (err) {
        res.end(`404: ${err}`)
      } else {
        res.end(`Cannot ${req.method} ${req.url}`)
      }
    }
    if (this._router) {
      this._router.handle(req, res, done);
    } else {
      done();
    }
  })
  server.listen(...arguments);
}


module.exports = Application;
