// const express = require('express')
const express = require('./../lib/express')
const app = express()

app.get('/', function (req, res) {
  res.end('Hello World!')
})
app.get('/123', function (req, res) {
  res.end('123!')
})

app.listen(3001, function () {
  console.log('Example app listening on port 3001!')
})