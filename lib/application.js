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

Application.prototype.listen = function() {
  const server = http.createServer((req, res) => {
    this._router.handle(req, res)
  })
  server.listen(...arguments);
}



module.exports = Application;