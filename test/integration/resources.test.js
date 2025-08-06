const { createTestApp } = require('../helpers/app');
const { setupTestDatabase, cleanupTestDatabase, closeTestDatabase, getTestDb } = require('../helpers/database');
const path = require('path');
const fs = require('fs');

describe('Resources API Integration Tests', function() {
  let app;
  let db;

  before(async function() {
    db = await setupTestDatabase();
    app = createTestApp();
    
    await cleanupTestDatabase();
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterEach(async function() {
    await cleanupTestDatabase();
  });

  after(async function() {
    await closeTestDatabase();
  });

  describe('GET /api/resources', function() {
    it('should return empty array when no resources exist', function(done) {
      request(app)
        .get('/api/resources')
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          expect(res.body.data).to.be.an('array');
          expect(res.body.data).to.have.length(0);
          done();
        });
    });

    it('should return resources when they exist', async function() {
      await db.insertInto('resources')
        .values({
          title: 'Test Resource',
          description: 'A test resource',
          category: 'tutorial',
          language: 'javascript',
          provider: 'aws',
          role: 'developer',
          file_name: 'test.pdf',
          file_path: '/tmp/test.pdf',
          file_size: 1024,
          mime_type: 'application/pdf'
        })
        .execute();

      const response = await request(app)
        .get('/api/resources')
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.be.an('array');
      expect(response.body.data).to.have.length(1);
      expect(response.body.data[0]).to.have.property('title', 'Test Resource');
      expect(response.body.data[0]).to.have.property('category', 'tutorial');
    });
  });

  describe('GET /api/resources/summary', function() {
    beforeEach(async function() {
      await db.insertInto('resources')
        .values([
          {
            title: 'Tutorial Doc 1',
            description: 'First tutorial document',
            category: 'tutorial',
            language: 'javascript',
            provider: 'aws',
            role: 'developer',
            file_name: 'tutorial1.pdf',
            file_path: '/tmp/tutorial1.pdf',
            file_size: 1024,
            mime_type: 'application/pdf'
          },
          {
            title: 'Documentation Doc 2',
            description: 'Second documentation document',
            category: 'documentation', 
            language: 'python',
            provider: 'azure',
            role: 'devops',
            file_name: 'docs2.pdf',
            file_path: '/tmp/docs2.pdf',
            file_size: 2048,
            mime_type: 'application/pdf'
          },
          {
            title: 'Example Doc',
            description: 'Example document',
            category: 'example',
            language: 'java',
            provider: 'gcp',
            role: 'architect',
            file_name: 'example.pdf',
            file_path: '/tmp/example.pdf',
            file_size: 3072,
            mime_type: 'application/pdf'
          }
        ])
        .execute();
    });

    it('should return correct resource summary statistics', function(done) {
      request(app)
        .get('/api/resources/summary')
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('success', true);
          expect(res.body).to.have.property('data');
          
          const summary = res.body.data;
          expect(summary).to.have.property('total_resources', '3');
          expect(summary).to.have.property('total_size', '6144');
          expect(summary).to.have.property('categories_breakdown');
          expect(summary).to.have.property('languages_breakdown');
          expect(summary).to.have.property('providers_breakdown');
          expect(summary).to.have.property('roles_breakdown');

          expect(summary.categories_breakdown).to.deep.include({ category: 'tutorial', count: '1' });
          expect(summary.categories_breakdown).to.deep.include({ category: 'documentation', count: '1' });
          expect(summary.categories_breakdown).to.deep.include({ category: 'example', count: '1' });

          expect(summary.languages_breakdown).to.deep.include({ language: 'javascript', count: '1' });
          expect(summary.languages_breakdown).to.deep.include({ language: 'python', count: '1' });
          expect(summary.languages_breakdown).to.deep.include({ language: 'java', count: '1' });

          done();
        });
    });
  });

  describe('GET /api/resources/:id', function() {
    it('should return 404 for non-existent resource', function(done) {
      request(app)
        .get('/api/resources/999')
        .set('X-API-Key', API_KEY)
        .expect(404)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('message', 'Resource not found');
          done();
        });
    });

    it('should return resource information for local environment (test)', async function() {
      const [resource] = await db.insertInto('resources')
        .values({
          title: 'Download Test',
          description: 'Test download',
          category: 'template',
          language: 'typescript',
          provider: 'docker',
          role: 'qa',
          file_name: 'download-test.pdf',
          file_path: '/tmp/download-test.pdf',
          file_size: 2048,
          mime_type: 'application/pdf'
        })
        .returning('id')
        .execute();

      const response = await request(app)
        .get(`/api/resources/${resource.id}`)
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message');
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('resource_id', resource.id);
    });
  });

  describe('POST /api/resources', function() {
    it('should reject request without file', function(done) {
      request(app)
        .post('/api/resources')
        .set('X-API-Key', API_KEY)
        .field('title', 'Test Resource')
        .field('category', 'tutorial')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('message', 'Validation failed');
          done();
        });
    });

    it('should reject request with invalid category', function(done) {
      const testFilePath = path.join(__dirname, '../fixtures/test.txt');
      fs.writeFileSync(testFilePath, 'Test file content');

      request(app)
        .post('/api/resources')
        .set('X-API-Key', API_KEY)
        .attach('file', testFilePath)
        .field('title', 'Test Resource')
        .field('category', 'InvalidCategory')
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('message', 'Validation failed');
          expect(res.body.errors).to.be.an('array');
          
          fs.unlinkSync(testFilePath);
          done();
        });
    });

    it('should successfully upload a valid file with metadata', async function() {
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      const testFilePath = path.join(fixturesDir, 'test-upload.txt');
      fs.writeFileSync(testFilePath, 'Test file content for upload');

      const response = await request(app)
        .post('/api/resources')
        .set('X-API-Key', API_KEY)
        .attach('file', testFilePath)
        .field('title', 'Valid Test Resource')
        .field('description', 'A valid test resource')
        .field('category', 'guide')
        .field('language', 'english')
        .field('provider', 'pack')
        .field('role', 'Mentor / Coach')
        .expect(201)
        .expect('Content-Type', /json/);
          
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'Resource uploaded successfully');
      expect(response.body).to.have.property('data');
      expect(response.body.data).to.have.property('id');
      expect(response.body.data.id).to.be.a('number');

      const savedResource = await db.selectFrom('resources')
        .selectAll()
        .where('id', '=', response.body.data.id)
        .executeTakeFirst();

      expect(savedResource).to.exist;
      expect(savedResource.title).to.equal('Valid Test Resource');
      expect(savedResource.category).to.equal('guide');

      fs.unlinkSync(testFilePath);
    });

    it('should handle validation errors properly', function(done) {
      const fixturesDir = path.join(__dirname, '../fixtures');
      if (!fs.existsSync(fixturesDir)) {
        fs.mkdirSync(fixturesDir, { recursive: true });
      }

      const testFilePath = path.join(fixturesDir, 'validation-test.txt');
      fs.writeFileSync(testFilePath, 'Test validation');

      request(app)
        .post('/api/resources')
        .set('X-API-Key', API_KEY)
        .attach('file', testFilePath)
        .field('title', '')
        .field('category', 'tutorial')
        .expect(400)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          
          expect(res.body).to.have.property('message', 'Validation failed');
          expect(res.body).to.have.property('errors');
          expect(res.body.errors).to.be.an('array');

          fs.unlinkSync(testFilePath);
          done();
        });
    });
  });

  describe('API Key Authentication', function() {
    it('should return 401 when API key is missing', function(done) {
      request(app)
        .get('/api/resources')
        .expect(401)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('message', 'API key required. Include X-API-Key header.');
          done();
        });
    });

    it('should return 401 when API key is invalid', function(done) {
      request(app)
        .get('/api/resources')
        .set('X-API-Key', 'invalid-key')
        .expect(401)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', false);
          expect(res.body).to.have.property('message', 'Invalid API key.');
          done();
        });
    });

    it('should work with valid API key', function(done) {
      request(app)
        .get('/api/resources')
        .set('X-API-Key', API_KEY)
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('success', true);
          done();
        });
    });
  });

  describe('Health Check', function() {
    it('should return healthy status', function(done) {
      request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body).to.have.property('status', 'healthy');
          expect(res.body).to.have.property('environment', 'test');
          expect(res.body).to.have.property('timestamp');
          done();
        });
    });
  });
});