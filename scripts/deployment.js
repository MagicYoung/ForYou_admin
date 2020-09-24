const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const rp = require('request-promise');
const deployList = ['http://106.15.56.75'];

/**
 * Execute simple shell command (async wrapper).
 * @param {String} cmd
 * @return {Object} { stdout: String, stderr: String }
 */
async function sh(cmd) {
  return new Promise(function(resolve, reject) {
    console.log(cmd);
    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        console.log(err);
        reject({ err, stdout, stderr });
      } else {
        console.log(stdout);
        console.log(stderr);
        resolve({ stdout, stderr });
      }
    });
  });
}

const pathToDist = path.join(__dirname, '..', 'dist.zip');

async function main() {
  await sh('yarn build');
  await zipDist();
  console.log('zip success!');
  for (let uri of deployList) {
    const ret = await deploy(uri);
    console.log('upload success: ', uri);
  }
  fs.unlinkSync(pathToDist);
}

function zipDist() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(pathToDist);
    const archive = archiver('zip');
    archive.directory(path.join(__dirname, '..', 'dist'), false);
    archive.pipe(output);
    output.on('close', function() {
      resolve(true);
    });
    archive.on('error', function(err) {
      reject(err);
    });
    archive.finalize();
  });
}

function deploy(uri) {
  const options = {
    method: 'POST',
    uri: uri + '/api/deploy',
    formData: {
      token: 'auto-deployment?',
      file: {
        value: fs.createReadStream(pathToDist),
        options: {
          filename: 'dist.zip',
          contentType: 'application/x-zip-compressed',
        },
      },
    },
  };
  return rp(options);
}

main();
