# REST API Implementations

This project contains two different implementations of a simple REST API with endpoints for managing items. Both APIs provide the same core functionality but use different technologies and approaches.

## Overview

Both implementations provide:
- **GET /items** - Retrieve all items
- **POST /items** - Create a new item
- Basic validation and error handling
- JSON responses with consistent format
- In-memory storage for demonstration

## Implementation 1: Next.js API Routes

Located in: `app/api/items/route.ts`

### Technology Stack
- Next.js 15.5.0 with App Router
- TypeScript
- Built-in API routes

### Features
- Server-side API routes using Next.js App Router
- TypeScript for type safety
- Built-in request/response handling
- Automatic deployment with Vercel/Next.js hosting

### Getting Started

1. The API is already integrated into the Next.js application
2. Start the development server:
```bash
npm run dev
```
3. Access the API at:
   - GET: `http://localhost:3000/api/items`
   - POST: `http://localhost:3000/api/items`

### Testing the Next.js API

1. **Web Interface**: Visit `http://localhost:3000/api-test` for a complete web interface
2. **curl commands**:
```bash
# Get all items
curl http://localhost:3000/api/items

# Create new item
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{"name": "My Item", "description": "Item description"}'
```

### API Response Format

**Success Response:**
```json
{
  "success": true,
  "data": [...],
  "count": 2
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

## Implementation 2: Express.js Server

Located in: `express-api/`

### Technology Stack
- Express.js 4.18.2
- Node.js
- CORS, Helmet, Morgan middleware
- Nodemon for development

### Features
- Dedicated Express server
- Advanced middleware stack (CORS, Helmet, Morgan)
- Query parameter support (search, pagination)
- Individual item retrieval by ID
- Health check endpoint
- Comprehensive error handling
- Request logging
- Security headers

### Getting Started

1. Navigate to the express-api directory:
```bash
cd express-api
```

2. Install dependencies (already done):
```bash
npm install
```

3. Start the server:
```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

4. Server runs on `http://localhost:3001`

### Available Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/items` | Get all items (with optional query params) |
| GET | `/items/:id` | Get item by ID |
| POST | `/items` | Create new item |

### Query Parameters (GET /items)
- `limit` - Limit number of results
- `offset` - Skip number of items
- `search` - Search in name/description

### Testing the Express API

1. **Test Client**: Run the included test client:
```bash
cd express-api
node test-client.js
```

2. **curl commands**:
```bash
# Health check
curl http://localhost:3001/health

# Get all items
curl http://localhost:3001/items

# Get items with pagination
curl http://localhost:3001/items?limit=5&offset=0

# Search items
curl http://localhost:3001/items?search=sample

# Get specific item
curl http://localhost:3001/items/1

# Create new item
curl -X POST http://localhost:3001/items \
  -H "Content-Type: application/json" \
  -d '{"name": "New Item", "description": "Item description"}'
```

## Comparison

| Feature | Next.js API | Express.js API |
|---------|-------------|----------------|
| **Setup Complexity** | Simple (built-in) | Moderate (separate server) |
| **Deployment** | Integrated with Next.js | Requires separate deployment |
| **Middleware** | Basic | Advanced (CORS, Helmet, Morgan) |
| **Query Parameters** | Basic | Advanced (search, pagination) |
| **Individual Item Access** | ❌ | ✅ (GET /items/:id) |
| **Health Check** | ❌ | ✅ |
| **Request Logging** | Basic | Advanced |
| **Type Safety** | TypeScript | JavaScript |
| **Performance** | Good | Excellent |
| **Scalability** | Good | Excellent |

## When to Use Which

### Use Next.js API Routes When:
- Building a full-stack Next.js application
- You want API routes integrated with your frontend
- You prefer TypeScript
- You need simple CRUD operations
- You plan to deploy on Vercel or similar platforms
- You want minimal setup and configuration

### Use Express.js When:
- Building a dedicated API server
- You need advanced middleware and features
- You require fine-grained control over the server
- You need extensive query capabilities
- You plan to serve multiple frontend applications
- You want maximum flexibility and performance
- You need comprehensive logging and monitoring

## Data Models

Both APIs use the same item structure:

```json
{
  "id": 1,
  "name": "Item Name",
  "description": "Optional description",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

## Error Handling

Both implementations provide consistent error responses:

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation errors) |
| 404 | Not Found |
| 409 | Conflict (Express only - duplicate names) |
| 500 | Internal Server Error |

## Future Enhancements

Possible improvements for both implementations:

1. **Database Integration**
   - Replace in-memory storage with PostgreSQL/MongoDB
   - Add connection pooling and transactions

2. **Authentication & Authorization**
   - JWT token authentication
   - Role-based access control

3. **Advanced Features**
   - Item updates (PUT/PATCH endpoints)
   - Item deletion (DELETE endpoint)
   - Bulk operations
   - File uploads for item images

4. **Performance & Monitoring**
   - Redis caching
   - Rate limiting
   - API metrics and monitoring
   - Request/response compression

5. **Documentation**
   - OpenAPI/Swagger documentation
   - API versioning

6. **Testing**
   - Unit tests
   - Integration tests
   - Load testing

## Running Both APIs Simultaneously

You can run both implementations at the same time:

1. **Terminal 1** - Next.js (port 3000):
```bash
npm run dev
```

2. **Terminal 2** - Express.js (port 3001):
```bash
cd express-api && npm run dev
```

3. **Terminal 3** - Test Express API:
```bash
cd express-api && node test-client.js
```

4. **Browser** - Test Next.js API:
   Visit `http://localhost:3000/api-test`

## Conclusion

Both implementations demonstrate different approaches to building REST APIs:

- **Next.js API Routes** are perfect for integrated full-stack applications with minimal setup
- **Express.js** provides more control, features, and scalability for dedicated API servers

Choose based on your specific needs, team expertise, and architectural requirements.