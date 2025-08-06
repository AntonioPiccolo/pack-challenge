# Pack Challenge - File Resource Management API

A Node.js/Express API for managing file resources with metadata validation, built with Zod schemas and Swagger documentation.

## 🚀 Quick Start

### Local Development

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd pack-challenge
   npm install
   ```

2. **Start:**
   ```bash
   npm start
   ```
   This starts both the app and PostgreSQL database.

## 📦 AWS Deployment

### Prerequisites

1. **Install AWS CLI and CDK:**
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure AWS credentials
   aws configure
   
   # Install CDK globally
   npm install -g aws-cdk
   ```

2. **Create EC2 Key Pair:**
   ```bash
   aws ec2 create-key-pair --key-name pack-challenge-key --query 'KeyMaterial' --output text > ~/.ssh/pack-challenge-key.pem
   chmod 400 ~/.ssh/pack-challenge-key.pem
   ```

3. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap
   ```

### Deploy Infrastructure

1. **Install CDK dependencies:**
   ```bash
   cd infrastructure
   npm install
   ```

2. **Deploy to AWS:**
   ```bash
   cdk deploy PackChallengeStack
   ```

3. **Note the outputs:**
   After deployment, note the `PublicIP` from the CDK output.

### Deploy Application

1. **Deploy your application code:**
   ```bash
   # From project root
   EC2_HOST=YOUR_EC2_PUBLIC_IP ./scripts/deploy-to-ec2.sh
   ```

2. **Access your deployed application:**
   - API: http://YOUR_EC2_PUBLIC_IP:3000
   - Documentation: http://YOUR_EC2_PUBLIC_IP:3000/api-docs
   - Health check: http://YOUR_EC2_PUBLIC_IP:3000/health

## 🏗️ Architecture

### AWS
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Internet      │    │   EC2 Instance   │    │   S3 Bucket     │
│   Port: 3000    │────│   Docker Compose │────│   File Storage  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                       ┌──────────────────┐
                       │   PostgreSQL     │
                       │   (Container)    │
                       └──────────────────┘
```

## 📝 API Endpoints

- `GET /api-docs` - Swagger documentation
- `GET /api/resources` - List all resources
- `GET /api/resources/:id` - Get specific resource
- `GET /api/resources/summary` - Get aggregated stats
- `POST /api/resources` - Upload new resource
- `GET /health` - Health check endpoint

## 📚 Tech Stack

- **Backend:** Node.js, Express.js
- **Validation:** Zod schemas
- **Documentation:** Swagger/OpenAPI 3.0
- **Database:** PostgreSQL
- **Containerization:** Docker, Docker Compose
- **Cloud:** AWS (EC2, S3, IAM)
- **Infrastructure:** AWS CDK
