const tar = require('tar')
const path = require('path')
const axios = require('axios')
const fs = require('fs-extra')
const morgan = require('morgan')
const form = require('form-data')
const express = require('express')
const proxy = require('http-proxy').createProxyServer();

const mm = require('magic-mongo')

const app = express();
let idleTimer;

let backup = () => {
    // Initiate Backup Process
    tar.c({
        gzip: true,
        file: 'c9-workspace.tar.gz',
        cwd: process.env.WORKSPACE_PATH
    },[process.env.WORKSPACE_PATH]).then(async _ => {
        console.log('Workspace Compressed! Initializing Upload!');
        let formData = new form()
        formData.append('upload', fs.createReadStream('c9-workspace.tar.gz'))
        axios.post(process.env.APP_PERSIST_URL, formData, {
            auth: {
                username: process.env.APP_PERSIST_USERNAME,
                password: process.env.APP_PERSIST_PASSWORD
            },
            headers: {
                ...formData.getHeaders()
            }
        }).then(response => {
            console.log('Axios Upload Successfull...' )
        })
        .catch(error => console.log('Axios Upload Error: ' + error))
    })
}

    app.use(morgan('dev'));

    app.use((req, res, next) => {
        clearTimeout(idleTimer)
        idleTimer = setTimeout(backup, process.env.BACKUP_DELAY)
        next()
    })

    app.use('/proxy/:port', (req, res) => {
        proxy.web(req, res, { target: `http://localhost:${req.params.port}` }, err => {
            if (err !== 'socket hang up')
                console.log("Error on Port Proxy: " + err.toString())
        });
    });

    app.use('/', express.static(path.join(__dirname, 'static')))

    app.use('/', (req, res) => {
        if(fs.pathExistsSync('/tmp/__RESTORE_COMPLETED__')) {
            proxy.web(req, res, { target: `http://localhost:4500` }, err => {
                if (err !== 'socket hang up')
                    console.log("Error on C9 Proxy: " + err.toString())
            });
        }
        else {
            return  res.sendFile(__dirname + "/static/restoring.html")
        }
    });

    app.use((req, res, next) => {
        const error = new Error('Not Found');
        error.status = 404;
        next(error);
    });

    app.use((error, req, res) => {
        res.status(error.status || 500).json({
            error: {
                message: error.message
            }
        });
    });

module.exports = app

