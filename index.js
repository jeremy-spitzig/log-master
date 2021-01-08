const express = require('express')
const axios = require('axios')
const app = express()

const PORT = process.env.PORT || 80
const SERVERS = process.env.SERVERS

if(!SERVERS) {
  console.error('Server list must be provided in environment')
  process.exit(-1)
}

const servers = SERVERS.split(',').map(server => {
  let port = '80'
  let serverName = server
  if(server.includes(':')) {
    const parts = server.split(':')
    serverName = parts[0]
    port = parts[1]
  }
  return [serverName, port]
})

app.get('/*', (req, res) => {
  let urlTail = req.path
  let queryParams = []
  if(req.query.n) {
    queryParams.push('n=' + req.query.n)
  }
  if(req.query.filter) {
    queryParams.push('filter=' + req.query.filter)
  }
  if(queryParams.length > 0) {
    urlTail += '?' + queryParams.join('&')
  }
  Promise.all(servers.map(server => {
    const url = 'http://' + server[0] + ':' + server[1] + urlTail
    return axios({
      method: 'GET',
      url: url
    }).then(result => {
      // Improve this: don't read everything into memory...
      return result.data
    }).catch(error => {
      // Failed to retrieve some data.  Not all servers will have the same data,
      // so this doesn't have to be a fatal error, but log it for diagnostic purposes.
      console.log(error)
      return ''
    })
  })).then((results) => {
    res.setHeader('Content-Type', 'text/plain')
    res.send(results.join('\n'))
  })
})

app.listen(PORT)
