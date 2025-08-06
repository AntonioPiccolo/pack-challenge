#!/usr/bin/env node
const cdk = require('aws-cdk-lib');
const { PackChallengeEC2Stack } = require('./aws-cdk-ec2-stack');

const app = new cdk.App();

new PackChallengeEC2Stack(app, 'PackChallengeStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});