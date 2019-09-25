const http = require('http');
const Router = require('./router');

function Application() {
  this._router = new Router();
}

Application.prototype.get = function(path, handle) {
  this._router.get(path, handle)
}

http.METHODS.forEach(method => {
  method = method.toLowerCase();
  Application.prototype[method] = function(path, handle) {
    this._router[method].apply(this._router, arguments);
    return this;
  }
})

Application.prototype.use = function(handle) {
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
    this._router.handle(req, res, done);
  })
  server.listen(...arguments);
}


module.exports = Application;
