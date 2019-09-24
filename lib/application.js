const http = require('http');
const url = require('url');

let router = [{
  path: '*',
  method: '*',
  handle: function(req, res) {
      res.writeHead(200, {'Content-Type': 'text/plain'});
      res.end('404');
  }
}];

const app = {
  get(path, handle) {
    router.push({
      path,
      handle,
      method: 'get'
    })
  },
  listen() {
    const server = http.createServer((req, res) => {
      const {pathname} = url.parse(req.url)
      for (let i = 1; i < router.length; i++) {
        if ((pathname === router[i].path || router[i].path === '*') && (req.method.toLocaleLowerCase() === router[i].method || router[i].method === '*')) {
          return router[i].handle && router[i].handle(req, res)
        }
      }
      return router[0].handle && router[0].handle(req, res)
    });
    server.listen(...arguments);
  }
}

module.exports = app;
