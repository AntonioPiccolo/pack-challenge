# Pack Challenge

Backend API for managing file uploads and providing data.

## 🚀 Requirements

- ✅ Backend APIs
- ✅ Database
- ✅ Testing
- ✅ Setup & Deployment

## ✨ Nice to Haves (Optional)

- ✅ Integration test
- ❌ Handling big files/videos upload.
- ✅ Store files in cloud storage (e.g., AWS S3; local storage fallback is fine). 
- ✅ Basic authentication stub (API keys or token check).
- ✅ Describe any scaling or multi-tenant considerations you’d make if this went to production. (section below)

## 📚 Tech Stack

- **Backend:** Node.js, Express.js
- **Authentication:** API Key
- **Validation:** Zod schemas
- **Testing:** Mocha, Chai, Sinon integration tests
- **Documentation:** Swagger/OpenAPI 3.0
- **Database:** PostgreSQL
- **Containerization:** Docker, Docker Compose
- **Cloud:** AWS (EC2, S3, IAM)
- **Infrastructure:** AWS CDK

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

## 📊 Describe any scaling or multi-tenant considerations

Currently we have a single shared database with no tenant isolation, single S3 prefix and a single EC2 for container managment. 

Changes that I suggest for scaling or multi-tenant improvement:
  - Add tenant_id column to resources table, consider use data partitioning by tenant or separeted schemas
  - JWT-based authentication with tenant context
  - Use tenant id for S3 key prefix (es. tenant-{id}/resources/)
  - Use SQS form sync file operations
  - Caching system for frequently accessed metadata
  - Use ECS for a better container management

## 📝 API Endpoints

### Public Endpoints
- `GET /api-docs` - Swagger documentation

### Protected Endpoints (Require API Key)
- `GET /api/resources` - List all resources
- `GET /api/resources/:id` - Get specific resource
- `GET /api/resources/summary` - Get aggregated stats
- `POST /api/resources` - Upload new resource

## ⚠️ Security Considerations

**IMPORTANT SECURITY NOTE:** Currently, sensitive values like API keys are hardcoded in configuration files (docker-compose.yml, .env files, etc.). This is a **serious security vulnerability** and should never be done.

This test project uses hardcoded values for simplicity and demonstration purposes only, in a real case project my suggest is to use a Secret Manager in AWS.

## 🏠 Quick Start

### Local Development

1. **Start:**
   ```bash
   npm install
   npm start
   ```
   This starts both the Server and PostgreSQL database.

## 🧪 Testing

### Running Tests

- Ensure the local database is running: `npm start`
- Tests use a separate test database configuration

**Run all tests:**
```bash
npm test
```

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
