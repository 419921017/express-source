const url = require('url');

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
  this.stack.push({
    path,
    handle,
    method: 'get'
  })
}

Router.prototype.handle = function(req, res) {
  const {pathname} = url.parse(req.url)
  for (let i = 1; i < this.stack.length; i++) {
    if ((pathname === this.stack[i].path || this.stack[i].path === '*') && (req.method.toLocaleLowerCase() === this.stack[i].method || this.stack[i].method === '*')) {
      return this.stack[i].handle && this.stack[i].handle(req, res)
    }
  }
  return this.stack[0].handle && this.stack[0].handle(req, res)
}

module.exports = Router;

