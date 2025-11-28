// Watch placeholder
console.log('Watch placeholder - monitors file changes and triggers build');

const chokidar = require('chokidar');
const { exec } = require('child_process');

const watcher = chokidar.watch(['src/**/*', 'assets/**/*', 'manifest.json'], { ignoreInitial: true });

watcher.on('all', (event, path) => {
  console.log(`${event} detected on ${path} - running build`);
  exec('node scripts/build.js', (err, stdout, stderr) => {
    if (err) console.error(err);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
  });
});
