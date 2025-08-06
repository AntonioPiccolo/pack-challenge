const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ 
  path: path.resolve(__dirname, '../../.env.test')
});

process.env.NODE_ENV = 'test';
process.env.DB_NAME = process.env.DB_NAME || 'pack_challenge';
process.env.DB_USER = process.env.DB_USER || 'pack_user';
process.env.DB_PASS = process.env.DB_PASS || 'pack_password';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5432';

process.env.DATABASE_URL = `postgresql://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

global.chai = require('chai');
global.expect = chai.expect;
global.sinon = require('sinon');
global.request = require('supertest');
global.API_KEY = process.env.API_KEY || 'pack-challenge-api-key';