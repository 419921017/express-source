# exress-rs

## 项目初始化

需求

- `lib/express.js`导出结果应该是一个函数
- 这个函数包含`get`和`listen`

项目结构

```linux
├── lib
│   └── express.js
├── package.json
├── test
│   └── index.js
└── yarn.lock
```

## v0.1

需求

- 实现http服务器
- 实现get路由请求

实现http服务器:

在底层

1. 一个http请求主要包括请求行、请求头和消息体，nodejs将常用的数据封装为http.IncomingMessage类，在上面的代码中req就是该类的一个对象。
2. 每个http请求都会对应一个http响应。一个http响应主要包括状态行、响应头、消息体，nodejs将常用的数据封装为http.ServerResponse类，在上面的代码中res就是该类的一个对象。
3. 不仅仅是nodejs，基本上所有的http服务框架都会包含request和response两个对象，分别代表着http的请求和响应，负责服务端和浏览器的交互。

在上层

1. 服务器后台代码根据http请求的不同，绑定不同的逻辑。在真正的http请求来临时，匹配这些http请求，执行与之对应的逻辑，这个过程就是web服务器基本的执行流程。
2. 对于这些http请求的管理，有一个专有名词 —— “路由管理”，每个http请求就默认为一个路由，常见的路由区分策略包括URL、HTTP请求名词等等，但不仅仅限定这些，所有的http请求头上的参数其实都可以进行判断区分，例如使用user-agent字段判断移动端

router数组

创建一个router数组，负责管理所有路由映射, 抽象出每个路由的基本属性：

- path 请求路径，例如：/books、/books/1。
- method 请求方法，例如：GET、POST、PUT、DELETE。
- handle 处理函数。

```js
let router = [{
    path: '*',
    method: '*',
    handle: function(req, res) {
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.end('404');
    }
}];
```

## v0.1.1

整理程序目录

创建application.js文件，将createApplication函数中的代码转移到该文件，expross.js文件只保留引用

```js
var app = require('./application');

function createApplication() {
    return app;
}

module.exports = createApplication;
```

```linux

├── lib
│   ├── application.js
│   └── express.js
├── package.json
├── test
│   └── index.js
└── yarn.lock
```

## v0.2

需求

构建一个初步的路由系统, 目前的路由是用一个router数组进行描述管理，对于router的操作有两个，分别是在application.get函数和application.listen函数，前者用于添加，后者用来处理

将路由系统的数据和路由系统的操作封装到一起定义一个 Router类负责整个路由系统的主要工作

路由方面的操作只和Router本身有关，与application分离，使代码更加清晰

```js
// router

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


// application
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

```

## v0.21

需求

1. 如果路由不断的增多，this.stack数组会不断的增大，匹配的效率会不断降低，为了解决效率的问题, 需要修改Router
2. 路由是由三个部分构成：路径、方法和处理函数。前两者的关系并不是一对一的关系，而是一对多的关系

```js
GET books/1
PUT books/1
DELETE books/1
```

引入Layer, 将路径一样的路由整合成一组，提高效率

```js
Layer = {
  path，表示路由的路径。
  handle，代表路由的处理函数。
  route，代表真正的路由。
}

router 内部
------------------------------------------------
|     0     |     1     |     2     |     3     |
------------------------------------------------
| Layer     | Layer     | Layer     | Layer     |
|  |- path  |  |- path  |  |- path  |  |- path  |
|  |- handle|  |- handle|  |- handle|  |- handle|
|  |- route |  |- route |  |- route |  |- route |
------------------------------------------------

```

添加Route类处理method

```js
route 内部
------------------------------------------------
|     0     |     1     |     2     |     3     |
------------------------------------------------
| Layer      | Layer      | Layer      | Layer  |
|  |- method|  |- method|  |- method|  |- method|
|  |- handle|  |- handle|  |- handle|  |- handle|
------------------------------------------------

```

现在, 我们创建一个完整的路由系统，并在原始代码的基础上引入了Layer和Route两个概念

当前的目录结构如下

```js
├── lib
│   ├── application.js
│   ├── express.js
│   └── router
│       ├── index.js
│       ├── layer.js
│       └── route.js
├── package.json
├── test
│   └── index.js
└── yarn.lock
```

总结:

- application代表一个应用程序，expross是一个工厂类负责创建application对象。Router代表路由组件，负责应用程序的整个路由系统。
- 组件内部由一个Layer数组构成，每个Layer代表一组路径相同的路由信息，具体信息存储在Route内部，每个Route内部也是一个Layer对象，但是Route内部的Layer和Router内部的Layer是存在一定的差异性。
- Router内部的Layer，主要包含path、route属性。
- Route内部的Layer，主要包含method、handle属性。


如果一个请求来临，会现从头至尾的扫描router内部的每一层，而处理每层的时候会先对比URI，相同则扫描route的每一项，匹配成功则返回具体的信息，没有任何匹配则返回未找到。

```js
 --------------
| Application  |                                 ---------------------------------------------------------
|     |        |        ----- -----------        |     0     |     1     |     2     |     3     |  ...  |
|     |-router | ----> |     | Layer     |       ---------------------------------------------------------
 --------------        |  0  |   |-path  |       | Layer     | Layer     | Layer     | Layer     |       |
  application          |     |   |-route | ----> |  |- method|  |- method|  |- method|  |- method|  ...  |
                       |-----|-----------|       |  |- handle|  |- handle|  |- handle|  |- handle|       |
                       |     | Layer     |       ---------------------------------------------------------
                       |  1  |   |-path  |                                  route
                       |     |   |-route |
                       |-----|-----------|
                       |     | Layer     |
                       |  2  |   |-path  |
                       |     |   |-route |
                       |-----|-----------|
                       | ... |   ...     |
                        ----- -----------
                             router
```

## v0.3

需求

1. 丰富接口，目前只支持get接口
2. 增加路由系统的流程控制

express框架HTTP方法名的获取封装到另一个包，叫做methods, 返回的是一个方法的数组

```js
[
  'get',
  'post',
  'put',
  'head',
  ...
]
```

使用for循环生成所有函数, 具体的方法操作在Route中实现, 分别修改Route, Router, Application

```js
// Route
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

// Router
http.METHODS.forEach(method => {
  method = method.toLowerCase();
  Router.prototype[method] = function(path, handle) {
    const route = this.route(path);
    route[method].call(route, handle);
    return this;
  }
})

// Application
http.METHODS.forEach(method => {
  method = method.toLowerCase();
  Application.prototype[method] = function(path, handle) {
    this._router[method].apply(this._router, arguments);
    return this;
  }
})

```

## v0.32

目前的Router还存在一个问题, 每次新增方法只会从上到下执行, 不会按照预计的s形状执行

```js
app.put('/', function(req, res) {
    res.send('put Hello World!');
});

app.get('/', function(req, res) {
    res.send('get Hello World!');
});
```

结果并不是想象中类似下面的结构：

```js
                          ---------------------------------------------------------
 ----- -----------        |     0     |     1     |     2     |     3     |  ...  |
|     | Layer     |       ---------------------------------------------------------
|  0  |   |-path  |       | Layer     | Layer     | Layer     | Layer     |       |
|     |   |-route | ----> |  |- method|  |- method|  |- method|  |- method|  ...  |
|-----|-----------|       |  |- handle|  |- handle|  |- handle|  |- handle|       |
|     | Layer     |       ---------------------------------------------------------
|  1  |   |-path  |                                  route
|     |   |-route |
|-----|-----------|
|     | Layer     |
|  2  |   |-path  |
|     |   |-route |
|-----|-----------|
| ... |   ...     |
 ----- ----------- 
      router
```

而是如下的结构：

```js
 ----- -----------        -------------
|     | Layer     | ----> | Layer     |
|  0  |   |-path  |       |  |- method|   route
|     |   |-route |       |  |- handle|
|-----|-----------|       -------------
|     | Layer     |       -------------
|  1  |   |-path  | ----> | Layer     |
|     |   |-route |       |  |- method|   route
|-----|-----------|       |  |- handle|
|     | Layer     |       -------------
|  2  |   |-path  |       -------------  
|     |   |-route | ----> | Layer     |
|-----|-----------|       |  |- method|   route
| ... |   ...     |       |  |- handle|
 ----- -----------        -------------
    router
```

在路由系统中，路由的处理顺序非常重要，因为路由是按照数组的方式存储的，如果遇见两个同样的路由，同样的方法名，不同的处理函数，这时候前后声明的顺序将直接影响结果（这也是express中间件存在顺序相关的原因），例如下面的例子：

```js
app.get('/', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('first');
});

app.get('/', function(req, res) {
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('second');
});
```

上面的代码如果执行会发现永远都返回first，但是有的时候会根据前台传来的参数动态判断是否执行接下来的路由，怎样才能跳过first进入second？这就涉及到路由系统的流程控制问题。

流程控制分为主动和被动两种模式。

对于expross框架来说，路由绑定的处理逻辑、用户设置的路径参数这些都是不可靠的，在运行过程中很有可能会发生异常，被动流程控制就是当这些异常发生的时候，expross框架要担负起捕获这些异常的工作，因为如果不明确异常的发生位置，会导致js代码无法继续运行，并且无法准确的报出故障。

主动流程控制则是处理函数内部的操作逻辑，以主动调用的方式来跳转路由内部的执行逻辑。

目前express通过引入next参数的方式来解决流程控制问题。next是处理函数的一个参数，其本身也是一个函数，该函数有几种使用方式：

- 执行下一个处理函数。执行next()。
- 报告异常。执行next(err)。
- 跳过当前Route，执行Router的下一项。执行next('route')。
- 跳过整个Router。执行next('router')。

首先修改最底层的Layer对象，该对象的handle_request函数是负责调用路由绑定的处理逻辑，这里添加next参数，并且增加异常捕获功能。

```js
Layer.prototype.handle_request = function (req, res, next) {
  var fn = this.handle;

  try {
    fn(req, res, next);
  } catch (err) {
    next(err);
  }
};
```

修改Route.dispatch, 使用递归方式

```js

Route.prototype.dispatch = function(req, res, out) {
  // for (let i = 0; i < this.stack.length; i++) {
  //   if (req.method.toLowerCase() === this.stack[i].method) {
  //     return this.stack[i].handle_request(req, res);
  //   }
  // }
  let idx = 0;
  const next = (err) => {
    // 跳过route
    if (err && err === 'route') {
      return out();
    }
    // 跳过整个路由系统
    if (err && err === 'router') {
      return out(err);
    }
    // 不存在
    if (idx >= this.stack.length) {
      return out(err);
    }

    let layer = this.stack[idx++];

    if (req.method.toLowerCase() !== layer.method) {
      return next(err)
    }
    if (err) {
      return out(err);
    } else {
      layer.handle_request(req, res, next);
    }

  }
  next()
}

```

接着修改Router.handle的代码，逻辑和Route.dispatch类似。

```js

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
```

增加expross框架异常处理的逻辑, 删除this.stack[0]的layer数据

```js
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

```

## v0.33

express中规定参数为4个的是错误处理函数, javascript中，Function.length属性可以获取传入函数指定的参数个数，这个可以当做区分二者的关键信息。

正常处理函数

```js
function process_fun(req, res, next) {
}
```

错误处理函数

```js
function process_err(err, req, res, next) {
}
```

Layer中增加错误处理

```js

Layer.prototype.handle_error = function(error, req, res, next) {
  if (this.handle.length !== 4) {
    return next(error)
  }

  try {
    this.handle(error, req, res, next)
  } catch (err) {
    next(err)
  }
}

```

Route.dispatch中修改错误处理

```js

Route.prototype.dispatch = function(req, res, out) {
  let idx = 0;
  const next = (err) => {
    // ...
    if (err) {
      // return out(err);
      layer.handle_error(err, req, res, next);
    } else {
      layer.handle_request(req, res, next);
    }

  }
  next()
}
```

当发生错误的时候，Route会一直向后寻找错误处理函数，如果找到则返回，否则执行done(err)，将错误抛给Router

## v0.4

需求

1. 增加中间件功能
2. 完善路由系统

中间件

在express中，中间件其实是一个介于web请求来临后到调用处理函数前整个流程体系中间调用的组件。其本质是一个函数，内部可以访问修改请求和响应对象，并调整接下来的处理流程。

中间件的功能

- 执行任何代码。
- 修改请求和响应对象。
- 终结请求-响应循环。
- 调用堆栈中的下一个中间件。

中间件的类型

- 应用级中间件
- 路由级中间件
- 错误处理中间件
- 内置中间件
- 第三方中间件

应用级中间件, Application.use

```js
Application.prototype.use = function(handle) {
  let path = '/';
  if (typeof handle !== 'function') {
    path = handle;
    handle = arguments[1]
  }
  this._router.use(path, handle);
  return this;
}
```

Router.use

```js
Router.prototype.use = function(handle) {
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
```

普通路由和中间件的区别

- 普通路由放到Route中，且Router.route属性指向Route对象，Router.handle属性指向Route.dispatch函数
- 中间件的Router.route属性为undefined，Router.handle指向中间件处理函数，被放到Router.stack数组中

路由级中间件

导出Router类, 创建一个单独的路由系统

```js
// express.js
exports.Router = Router;


var app = express();
var router = express.Router();

router.use(function (req, res, next) {
  console.log('Time:', Date.now());
});
```

express将Router定义成一个特殊的中间件，而不是一个单独的类

```js
var router = express.Router();

// 将路由挂载至应用
app.use('/', router);

```

在Router.handle中增加中间件处理

```js

proto.handle = function(req, res, out) {
  const {pathname} = url.parse(req.url)

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

    // if (layer.match(pathname) && layer.route && layer.route._handle_method(req.method)) {
    //   return layer.handle_request(req, res, next);
    // } else {
    //   next(layerError);
    // }
    if (layer.match(pathname)) {
      if (!layer.route) {
        // 处理中间件
        layer.handle_request(req, res, next)
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

```

实现匹配逻辑就要清楚的知道哪段路径和哪个处理函数匹配，这里定义三个变量

- req.originalUrl 原始请求路径。
- req.url 当前路径。
- req.baseUrl 父路径。

我们需要处理下面2种情况

存在路由中间件的情况:

Router.handle顺序匹配到中间的时候，会递归调用Router.handle，所以需要保存当前的路径快照，具体路径相关信息放到req.url、req.originalUrl 和req.baseUrl 这三个参数中

```js
router.use('/1', function(req, res, next) {
    res.send('first user');
});

router.use('/2', function(req, res, next) {
    res.send('second user');
});

app.use('/users', router);
```

非路由中间件的情况:

Router.handle内部主要是按照栈中的次序匹配路径即可

```js
app.get('/', function(req, res, next) {
    res.send('home');
});

app.get('/books', function(req, res, next) {
    res.send('books');
});
```

修改Router种proto.handle的代码

```js


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

    if (idx >= this.stack.length || layerError) {
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
        layer.handle_request(req, res, next)
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
```

修改Layer.match,

- 不含有路径的中间件。path属性默认为/。
- 含有路径的中间件。
- 普通路由。如果path属性为*，表示任意路径。

```js
function Layer(path, handle) {
  this.path = undefined;
  this.handle = handle;
  //是否为*
  this.fast_star = (path === '*' ? true : false);
  if (!this.fast_star) {
    this.path = path;
  }
}

Layer.prototype.match = function(pathname) {
  // return (this.path === pathname || this.path === '*')
  // *
  if (this.fast_star) {
    this.path = '';
    return true;
  }
  // 普通路由
  if (this.route && this.path === this.path.slice(-this.path.length)) {
    return true
  }

  // 中间件
  if (!this.route) {
    // 不带路径的中间件
    if (this.path === '/') {
      this.path = ''
      return true;
    }
    if (this.path === path.slice(0, this.path.length)) {
      return true;
    }
  }
  return false;
}

```

Router中的proto.handle错误中间件处理

```js
if(idx >= stack.length || layerError) {
    return done(layerError);
}

```


## v0.5

需求

1. 封装request和response两个对象
2. Application中的router的懒加载

封装request和response两个对象

```js
// request
const http = require('http');

const req = Object.create(http.IncomingMessage.prototype);

module.exports = req;

//response
const http = require('http');

const res = Object.create(http.ServerResponse.prototype);

res.send = function(body) {
  this.writeHead(200, {'Content-Type': 'text/plain'});
  this.end(body)
}

module.exports = res;
```

Application中的router的懒加载

```js
// Application
Application.prototype.lazyrouter = function() {
    if(!this._router) {
        this._router = new Router();

        this._router.use(middleware.init());
    }
};

http.METHODS.forEach(method => {
  method = method.toLowerCase();
  Application.prototype[method] = function(path, handle) {
    this.lazyrouter();
    ...
  }
})

Application.prototype.use = function(handle) {
  this.lazyrouter();
  ...
}

//middleware.init
const request = require('./../request');
const response = require('./../response');

const init = function expressInit(req, res, next) {
  req.req = req
  res.res = res

  req = Object.setPrototypeOf(req, request);
  res = Object.setPrototypeOf(res, response);

  next()
}

exports.init = init
```
