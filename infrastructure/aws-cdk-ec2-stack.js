const cdk = require('aws-cdk-lib');
const ec2 = require('aws-cdk-lib/aws-ec2');
const iam = require('aws-cdk-lib/aws-iam');
const s3 = require('aws-cdk-lib/aws-s3');

class PackChallengeEC2Stack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // VPC - Default VPC is fine for simple setup
    const vpc = ec2.Vpc.fromLookup(this, 'DefaultVPC', {
      isDefault: true
    });

    // S3 bucket for file storage
    const filesBucket = new s3.Bucket(this, 'PackChallengeFilesBucket', {
      bucketName: `pack-challenge-files-${this.account}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      cors: [
        {
          allowedMethods: [
            s3.HttpMethods.GET,
            s3.HttpMethods.POST,
            s3.HttpMethods.PUT,
            s3.HttpMethods.DELETE,
          ],
          allowedOrigins: ['*'],
          allowedHeaders: ['*'],
        },
      ],
    });

    // Security Group for EC2
    const securityGroup = new ec2.SecurityGroup(this, 'PackChallengeSecurityGroup', {
      vpc: vpc,
      description: 'Security group for Pack Challenge EC2 instance',
      allowAllOutbound: true,
    });

    // Allow HTTP access
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(3000),
      'Allow HTTP access to application'
    );


    // Allow SSH access (optional - remove in production)
    securityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    // IAM Role for EC2
    const ec2Role = new iam.Role(this, 'PackChallengeEC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
      ],
    });

    // Grant S3 permissions to EC2
    filesBucket.grantReadWrite(ec2Role);

    // User Data script to install Docker and run the application
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      // Update system
      'yum update -y',
      
      // Install Docker
      'yum install -y docker',
      'systemctl start docker',
      'systemctl enable docker',
      'usermod -a -G docker ec2-user',
      
      // Install Docker Compose
      'curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose',
      'chmod +x /usr/local/bin/docker-compose',
      'ln -s /usr/local/bin/docker-compose /usr/bin/docker-compose',
      
      // Create application directory
      'mkdir -p /home/ec2-user/pack-challenge',
      'cd /home/ec2-user/pack-challenge',
      
      // Create docker-compose.yml
      'cat > docker-compose.yml << EOF',
      'version: "3.8"',
      'services:',
      '  app:',
      '    image: node:18-alpine',
      '    ports:',
      '      - "3000:3000"',
      '    environment:',
      '      - NODE_ENV=production',
      '      - DATABASE_URL=postgresql://pack_user:pack_password@db:5432/pack_challenge',
      `      - S3_BUCKET_NAME=${filesBucket.bucketName}`,
      `      - AWS_REGION=${this.region}`,
      '    depends_on:',
      '      - db',
      '    volumes:',
      '      - ./app:/app',
      '    working_dir: /app',
      '    command: ["npm", "start"]',
      '    restart: unless-stopped',
      '',
      '  db:',
      '    image: postgres:16-alpine',
      '    environment:',
      '      - POSTGRES_DB=pack_challenge',
      '      - POSTGRES_USER=pack_user',
      '      - POSTGRES_PASSWORD=pack_password',
      '    ports:',
      '      - "5432:5432"',
      '    volumes:',
      '      - postgres_data:/var/lib/postgresql/data',
      '    restart: unless-stopped',
      '',
      'volumes:',
      '  postgres_data:',
      'EOF',
      
      // Create app directory and placeholder
      'mkdir -p app',
      'echo "Application files will be deployed here" > app/README.txt',
      
      // Set proper ownership
      'chown -R ec2-user:ec2-user /home/ec2-user/pack-challenge',
      
      // Create deployment script
      'cat > /home/ec2-user/deploy.sh << EOF',
      '#!/bin/bash',
      'cd /home/ec2-user/pack-challenge',
      'echo "Stopping containers..."',
      'docker-compose down',
      'echo "Starting containers..."',
      'docker-compose up -d',
      'echo "Deployment complete!"',
      'echo "Application available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):3000"',
      'EOF',
      
      'chmod +x /home/ec2-user/deploy.sh',
      'chown ec2-user:ec2-user /home/ec2-user/deploy.sh'
    );

    // EC2 Instance
    const instance = new ec2.Instance(this, 'PackChallengeInstance', {
      vpc: vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: securityGroup,
      role: ec2Role,
      userData: userData,
      keyPair: ec2.KeyPair.fromKeyPairName(this, 'KeyPair', 'pack-challenge-key'),
    });

    // Elastic IP for static public IP
    const eip = new ec2.CfnEIP(this, 'PackChallengeEIP', {
      instanceId: instance.instanceId,
    });

    // Outputs
    new cdk.CfnOutput(this, 'InstanceId', {
      value: instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'PublicIP', {
      value: eip.ref,
      description: 'Public IP Address',
    });

    new cdk.CfnOutput(this, 'ApplicationURL', {
      value: `http://${eip.ref}:3000`,
      description: 'Application URL',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: filesBucket.bucketName,
      description: 'S3 Bucket for file storage',
    });

    new cdk.CfnOutput(this, 'SSHCommand', {
      value: `ssh -i pack-challenge-key.pem ec2-user@${eip.ref}`,
      description: 'SSH command to connect to instance',
    });
  }
}

module.exports = { PackChallengeEC2Stack };