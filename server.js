const axios = require('axios')
const tar = require('tar')
const http = require('http')
const app = require('./app')
const path = require('path')
const fs = require('fs-extra')
const { spawn } = require('child_process')
const untildify = require('untildify')

const port = process.env.PORT || 3000
const server = http.createServer(app)
const io = require('socket.io')(server)

let frontClient, prevProgress
io.on('connection', (client) => {
    frontClient = client
    if (prevProgress)
        io.emit('progress', prevProgress)
})

io.on('disconnect', () => frontClient = null)

server.listen(port, async () => {
    console.log(`Server running on port: ${port}`)

    const WStream = fs.createWriteStream('c9-workspace.tar.gz')

    const { data, headers } = await axios.get(process.env.APP_PERSIST_URL + '/uploads/c9-workspace.tar.gz', {
        responseType: 'stream'
    })

    const totalSize = headers['content-length']
    let processedSize = 0

    data.on('data', chunk => {
        processedSize += chunk.length
        const progress = Math.ceil(processedSize * 100 / totalSize)
        
        if (frontClient && progress !== prevProgress) {
            io.emit('progress', progress)
        }
        prevProgress = progress
    })

    WStream.on('finish', () => {
        console.log('Initiating Extraction...')
        tar.x({
            file: 'c9-workspace.tar.gz',
            cwd: path.join(process.env.WORKSPACE_PATH, '..')
        }).then(_=> {
            console.log('Extraction Completed! Workspace Ready...')
            fs.ensureFileSync('/tmp/__RESTORE_COMPLETED__')
            const c9_proc = spawn('npm',
                ['run', 'initiate'], { cwd: '/root/proxy-server/c9/'})
            console.log(`Spawning C9 Process with PID: ${c9_proc.pid}`)
            c9_proc.stdout.on('data', (data) => {
                console.log(`C9 Process STDOUT: ${data.toString()}`)
            })
            c9_proc.stderr.on('data', (data) => {
                console.log(`C9 Process STDERR: ${data.toString()}`)
            })
            c9_proc.on('close', () => {
                console.log('C9 Process Exited.....')
            })
        })
    })

    WStream.on('error', error => console.log('Error with Stream: ' + error))

    data.pipe(WStream)
})

