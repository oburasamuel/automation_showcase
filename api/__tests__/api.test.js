const request = require('supertest');
const { app } = require('../../api/server');

let server;

beforeAll((done) => {
  server = app.listen(4000, () => {
    console.log('Test server running on port 4000');
    done();
  });
});

afterAll((done) => {
  server.close(() => {
    console.log('Test server closed');
    done();
  });
});


describe('Notes API', () => {
  let authToken;
  let createdNoteId;

  beforeAll(async () => {
    // Login to get auth token
    const loginResponse = await request(server)
      .post('/api/login')
      .send({ username: 'admin', password: 'password' });
    
    authToken = loginResponse.body.token;
  });

  describe('POST /api/login', () => {
    test('should login with valid credentials', async () => {
      const response = await request(server)
        .post('/api/login')
        .send({ username: 'admin', password: 'password' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('admin');
    });

    test('should reject invalid credentials', async () => {
      const response = await request(server)
        .post('/api/login')
        .send({ username: 'admin', password: 'wrongpassword' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    test('should require username and password', async () => {
      const response = await request(server)
        .post('/api/login')
        .send({ username: 'admin' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username and password required');
    });
  });

  describe('GET /api/items', () => {
    test('should return notes array for authenticated user', async () => {
      const response = await request(server)
        .get('/api/items')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(0);
    });

    test('should reject request without auth token', async () => {
      const response = await request(server)
        .get('/api/items');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access token required');
    });

    test('should reject request with invalid token', async () => {
      const response = await request(server)
        .get('/api/items')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });

  describe('POST /api/items', () => {
    test('should create new note with valid data', async () => {
      const noteData = { content: 'Test note content' };
      
      const response = await request(server)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('content', noteData.content);
      expect(response.body).toHaveProperty('createdAt');
      
      createdNoteId = response.body.id;
    });

    test('should reject note with empty content', async () => {
      const response = await request(server)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Content is required');
    });

    test('should reject note without content field', async () => {
      const response = await request(server)
        .post('/api/items')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Content is required');
    });

    test('should require authentication', async () => {
      const response = await request(server)
        .post('/api/items')
        .send({ content: 'Test note' });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/items/:id', () => {
    test('should update existing note', async () => {
      const updatedContent = 'Updated test note content';
      
      const response = await request(server)
        .put(`/api/items/${createdNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: updatedContent });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdNoteId);
      expect(response.body).toHaveProperty('content', updatedContent);
      expect(response.body).toHaveProperty('updatedAt');
    });

    test('should return 404 for non-existent note', async () => {
      const response = await request(server)
        .put('/api/items/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Updated content' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Note not found');
    });

    test('should reject update with empty content', async () => {
      const response = await request(server)
        .put(`/api/items/${createdNoteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: '' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Content is required');
    });
  });

  describe('DELETE /api/items/:id', () => {
    test('should delete existing note', async () => {
      const response = await request(server)
        .delete(`/api/items/${createdNoteId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    test('should return 404 for non-existent note', async () => {
      const response = await request(server)
        .delete('/api/items/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Note not found');
    });

    test('should require authentication', async () => {
      const response = await request(server)
        .delete('/api/items/1');

      expect(response.status).toBe(401);
    });
  });

  describe('Health Check', () => {
    test('should return health status', async () => {
      const response = await request(server)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });
});