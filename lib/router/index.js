const http = require('http');
const url = require('url');
const Layer = require('./layer');
const Route = require('./route');

const proto = {}

http.METHODS.forEach(method => {
  method = method.toLowerCase();
  proto[method] = function(path, handle) {
    const route = this.route(path);
    route[method].call(route, handle);
    return this;
  }
})

proto.use = function(handle) {
  let path = '/';
  if (typeof handle !== 'function') {
    path = handle;
    handle = arguments[1]
  }
  const layer = new Layer(path, handle);
  layer.route = undefined;
  this.stack.push(layer);
  return this;
}

proto.route = function(path) {
  const route = new Route(path);
  const layer = new Layer(path, route.dispatch.bind(route));
  layer.route = route;
  this.stack.push(layer)
  return route;
}

proto.handle = function(req, res, out) {
  const { pathname } = url.parse(req.url)

  let idx = 0;
  let removed = '';
  let slashAdded = false;
  // 获取当前父路径
  const parentUrl = req.baseUrl || '';
  // 保存父路径
  req.baseUrl = parentUrl;
  // 保存原始路径
  req.orginalUrl = req.orginalUrl || req.url;

  const next = (err) => {
    let layerError = (err === 'route' ? null : err);

    // 如果有移除，复原原有路径
    if (slashAdded) {
      req.url = '';
      slashAdded = false;
    }

    if (removed.length !== 0) {
      req.baseUrl = parentUrl;
      req.url = removed + req.url
      removed = ''
    }

    if (layerError === 'router') {
      return out(null);
    }

    if (idx >= this.stack.length) {
      return out(err);
    }

    let layer = this.stack[idx++];

    if (layer.match(pathname)) {
      if (!layer.route) {
        // 要移除部分的路径
        removed = layer.path;
        // 设置当前路径
        req.url = req.url.substr(removed.length);
        if (req.url === '') {
          req.url = '/' + req.url;
          slashAdded = true;
        }
        // 设置当前路径的父路径
        req.baseUrl = parentUrl + removed
        // 处理中间件
        if (layerError) {
          // 错误中间件处理
          layer.handle_error(layerError, req, res, next)
        } else {
          layer.handle_request(req, res, next)
        }
      } else if (layer.route._handle_method(req.method)) {
        // 处理路由
        layer.handle_request(req, res, next)
      }
    } else {
      layer.handle_error(layerError, req, res, next)
    }
  }

  next();
}

module.exports = function () {
  function router(req, res, next) {
    router.handle(req, res, next);
  }
  Object.setPrototypeOf(router, proto)
  router.stack = [];
  return router
};

