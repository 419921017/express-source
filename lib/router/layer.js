function Layer(path, handle) {
  this.path = path;
  this.handle = handle;
}

Layer.prototype.handle_request = function(req, res) {
  this.handle && this.handle(req, res);
}

Layer.prototype.match = function(pathname) {
  return (this.path === pathname || this.path === '*')
}

module.exports = Layer;
