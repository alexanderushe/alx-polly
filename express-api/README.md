# Express Items API

A simple REST API built with Express.js for managing items. This API provides endpoints to create, retrieve, and manage items with basic CRUD operations.

## Features

- **GET /items** - Retrieve all items with optional filtering and pagination
- **POST /items** - Create a new item
- **GET /items/:id** - Retrieve a specific item by ID
- **GET /health** - Health check endpoint
- Built-in CORS support
- Request logging with Morgan
- Security headers with Helmet
- Input validation and error handling
- In-memory storage (easily replaceable with database)

## Installation

1. Navigate to the express-api directory:
```bash
cd express-api
```

2. Install dependencies:
```bash
npm install
```

## Usage

### Development Mode
```bash
npm run dev
```
This starts the server with nodemon for automatic restarts on file changes.

### Production Mode
```bash
npm start
```

The server will start on port 3001 by default. You can change this by setting the `PORT` environment variable:
```bash
PORT=8000 npm start
```

## API Endpoints

### Health Check
```
GET /health
```
Returns the API status and timestamp.

**Response:**
```json
{
  "success": true,
  "message": "Express Items API is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Get All Items
```
GET /items
```

**Query Parameters:**
- `limit` (optional) - Limit the number of items returned
- `offset` (optional) - Number of items to skip
- `search` (optional) - Search term to filter items by name or description

**Examples:**
```bash
# Get all items
curl http://localhost:3001/items

# Get first 5 items
curl http://localhost:3001/items?limit=5

# Search for items containing "sample"
curl http://localhost:3001/items?search=sample

# Pagination: skip first 10 items, get next 5
curl http://localhost:3001/items?offset=10&limit=5
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Sample Item 1",
      "description": "This is a sample item",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

### Create New Item
```
POST /items
```

**Request Body:**
```json
{
  "name": "New Item Name",
  "description": "Optional item description"
}
```

**Example:**
```bash
curl -X POST http://localhost:3001/items \
  -H "Content-Type: application/json" \
  -d '{"name": "My New Item", "description": "This is a new item"}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 3,
    "name": "My New Item",
    "description": "This is a new item",
    "createdAt": "2024-01-15T10:35:00.000Z"
  },
  "message": "Item created successfully"
}
```

### Get Item by ID
```
GET /items/:id
```

**Example:**
```bash
curl http://localhost:3001/items/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Sample Item 1",
    "description": "This is a sample item",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (validation errors)
- `404` - Not Found (item or route not found)
- `409` - Conflict (duplicate item name)
- `500` - Internal Server Error

## Data Storage

Currently, the API uses in-memory storage for demonstration purposes. Data will be lost when the server restarts. For production use, replace the in-memory storage with a proper database solution like:

- MongoDB with Mongoose
- PostgreSQL with Sequelize or TypeORM
- MySQL with Sequelize or TypeORM
- SQLite for lightweight applications

## Security Features

- **Helmet.js** - Sets various HTTP headers for security
- **CORS** - Cross-Origin Resource Sharing enabled
- **Input validation** - Request body validation and sanitization
- **Request size limits** - JSON payload limited to 10MB

## Testing

You can test the API using:

### curl commands (as shown in examples above)

### Postman Collection
Import the following into Postman:
1. GET `http://localhost:3001/health`
2. GET `http://localhost:3001/items`
3. POST `http://localhost:3001/items` with JSON body
4. GET `http://localhost:3001/items/1`

### JavaScript fetch examples
```javascript
// Get all items
fetch('http://localhost:3001/items')
  .then(response => response.json())
  .then(data => console.log(data));

// Create new item
fetch('http://localhost:3001/items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Test Item',
    description: 'Created via fetch'
  })
})
  .then(response => response.json())
  .then(data => console.log(data));
```

## Environment Variables

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment mode (development/production)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this code for your projects.