const cluster = require('cluster');
const os = require('os');

const WORKERS = process.env.WEB_CONCURRENCY || os.cpus().length;

if (cluster.isPrimary) {
  for (let i = 0; i < WORKERS; i++) {
    cluster.fork();
  }
  cluster.on('exit', (worker) => {
    cluster.fork();
  });
} else {
  require('./src/app.js');
}
