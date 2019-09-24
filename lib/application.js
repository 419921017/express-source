const http = require('http');
const Router = require('./router');

function Application() {
  this._router = new Router();
}

Application.prototype.get = function(path, handle) {
  this._router.get(path, handle)
}

Application.prototype.listen = function() {
  const server = http.createServer((req, res) => {
    this._router.handle(req, res)
  })
  server.listen(...arguments);
}


module.exports = Application;
