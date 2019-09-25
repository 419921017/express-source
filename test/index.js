// const express = require('express')
const express = require('./../lib/express')
const app = express()

app.use((req, res, next) => {
  console.log('====================================');
  console.log('use');
  console.log('====================================');
  next()
})

app.get('/', function (req, res) {
  res.end('Hello World!')
})
app.get('/123', function (req, res) {
  res.end('123!')
})

app.listen(3001, function () {
  console.log('Example app listening on port 3001!')
})