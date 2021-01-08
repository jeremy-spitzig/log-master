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
  res.setHeader('Content-Type', 'text/plain')
  Promise.all(servers.map((server) => {
    const url = 'http://' + server[0] + ':' + server[1] + urlTail
    return axios({
      method: 'GET',
      url: url,
      responseType: 'stream'
    }).then(result => {
      return copy(result.data, res)
    }).catch(error => {
      // Failed to retrieve some data.  Not all servers will have the same data,
      // so this doesn't have to be a fatal error, but log it for diagnostic purposes.
      console.log(error.message)
      return ''
    })
  })).then(() => {
    res.end()
  })
})

// Copy data to response in chunks to avoid pulling entire responses into memory
// This has to split the response into lines and retain the last line for sending with the next chunk,
// since a chunk may include a partial line and we don't want to accidentally interleave
// responses from two servers in the same line
function copy(from, to) {
  let outstanding = ''
  return new Promise((resolve, reject) => {
    from.on('data', (chunk) => {
      const data = outstanding + chunk
      const lines = data.split('\n')
      if(lines && lines.length > 0) {
        outstanding = lines.pop()
      } else {
        outstanding = ''
      }
      // Kind of hacky, but newlines between chunks get dropped, so we're adding one back in here
      // There is a bit of a bug from this where the first request to start writing adds an extra newline
      // so this could definitely be improved, but this prevents two log entries from showing up on the same line
      to.write('\n'+lines.join('\n'))
    })
    from.on('end', () => {
      if(outstanding && outstanding.length > 0) {
        to.write(outstanding)
      }
      resolve()
    })
    from.on('error', (error) => {
      reject(error)
    })
  })
}

app.listen(PORT)
