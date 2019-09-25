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