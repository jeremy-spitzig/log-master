# log-master

Connects to remote log servers and collects logs.

Get up and running
```sh
npm install
npm start
```

The server will search the log file provided in the path on the provided log servers in the `SERVERS` environment variable.  e.g. requesting `/logfile.log` will return results from `/logfile.log` on the list of servers provided.

It also supports to ability to request a specific number of lines from the log and to filter lines on text through the `n` and `filter` query parameters, respectively.

The following environment variables are available to customize the behavior of the server:

| Variable        | Description                                                                                                  | Default Value |
| --------------- | ------------------------------------------------------------------------------------------------------------ | ------------- |
| `SERVERS`       | Required: Comma delimited list of servers to search for logs in the format `servername` or `servername:port` | `null`        |
| `PORT`          | The port to listen on                                                                                        | 80            |
