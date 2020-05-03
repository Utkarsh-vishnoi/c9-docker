const express = require('express');
const morgan = require('morgan');
const proxy = require('http-proxy').createProxyServer();

const app = express();

app.use(morgan('dev'));

app.use('/proxy/:port', (req, res, next) => {
	proxy.web(req, res, { target: `http://localhost:${req.params.port}` });
});

app.use('/', (req, res, next) => {
	proxy.web(req, res, { target: `http://localhost:4500` });
});

app.use((req, res, next) => {
	const error = new Error('Not Found');
	error.status = 404;
	next(error);
});

app.use((error, req, res, next) => {
	res.status(error.status || 500).json({
		error: {
			message: error.message
		}
	});
});

module.exports = app;
