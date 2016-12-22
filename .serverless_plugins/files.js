const s3 = require('s3');

class Files {
  constructor(serverless, options) {
    this.serverless = serverless;
    this.provider = serverless.getProvider('aws');
    this.commands = {
      files: {
        lifecycleEvents: ['resources']
      }
    };
    this.hooks = {
      'files:resources': this.deployFiles.bind(this)
    };
  }

  deployFiles() {
    const awsS3 = new this.provider.sdk.S3(this.provider.getCredentials());
    const s3Client = s3.createClient({s3Client: awsS3});
    let params = {
      localDir: 'files',
      deleteRemoved: true,
      s3Params: {
        Bucket: 'feedboostassetsdev',
        Prefix: ''
      }
    };

    let uploader = s3Client.uploadDir(params);

    uploader.on('error', err => {
      console.error('unable to sink: ', err.stack);
    });

    uploader.on('progress', () => {
      console.log('progress: ', uploader.progressAmount, uploader.progressTotal);
    });

    uploader.on('end', () => {
      console.log('done uploading');
    });
  }
}

module.exports = Files;
