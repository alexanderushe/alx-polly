const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// In-memory storage for demonstration (use a database in production)
let items = [
  {
    id: 1,
    name: "Sample Item 1",
    description: "This is a sample item",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Sample Item 2",
    description: "This is another sample item",
    createdAt: new Date().toISOString(),
  },
];

let nextId = 3;

// Utility function for error responses
const sendError = (res, status, message) => {
  res.status(status).json({
    success: false,
    error: message,
  });
};

// Utility function for success responses
const sendSuccess = (res, data, message = null, status = 200) => {
  const response = {
    success: true,
    data,
  };

  if (message) response.message = message;
  if (Array.isArray(data)) response.count = data.length;

  res.status(status).json(response);
};

// Routes

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Express Items API is running",
    timestamp: new Date().toISOString(),
  });
});

// GET /items - Retrieve all items
app.get("/items", (req, res) => {
  try {
    // Optional query parameters for filtering/pagination
    const { limit, offset, search } = req.query;
    let filteredItems = [...items];

    // Simple search functionality
    if (search) {
      const searchTerm = search.toLowerCase();
      filteredItems = filteredItems.filter(
        (item) =>
          item.name.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm),
      );
    }

    // Simple pagination
    if (offset) {
      const offsetNum = parseInt(offset, 10);
      if (offsetNum >= 0) {
        filteredItems = filteredItems.slice(offsetNum);
      }
    }

    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (limitNum > 0) {
        filteredItems = filteredItems.slice(0, limitNum);
      }
    }

    sendSuccess(res, filteredItems);
  } catch (error) {
    console.error("Error retrieving items:", error);
    sendError(res, 500, "Failed to retrieve items");
  }
});

// POST /items - Create a new item
app.post("/items", (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate required fields
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return sendError(
        res,
        400,
        "Name is required and must be a non-empty string",
      );
    }

    // Validate optional fields
    if (description && typeof description !== "string") {
      return sendError(res, 400, "Description must be a string");
    }

    // Check for duplicate names (optional business logic)
    const existingItem = items.find(
      (item) => item.name.toLowerCase() === name.trim().toLowerCase(),
    );

    if (existingItem) {
      return sendError(res, 409, "An item with this name already exists");
    }

    // Create new item
    const newItem = {
      id: nextId++,
      name: name.trim(),
      description: description ? description.trim() : "",
      createdAt: new Date().toISOString(),
    };

    items.push(newItem);

    sendSuccess(res, newItem, "Item created successfully", 201);
  } catch (error) {
    console.error("Error creating item:", error);
    sendError(res, 500, "Failed to create item");
  }
});

// GET /items/:id - Get a specific item by ID
app.get("/items/:id", (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      return sendError(res, 400, "Invalid item ID");
    }

    const item = items.find((item) => item.id === id);

    if (!item) {
      return sendError(res, 404, "Item not found");
    }

    sendSuccess(res, item);
  } catch (error) {
    console.error("Error retrieving item:", error);
    sendError(res, 500, "Failed to retrieve item");
  }
});

// 404 handler for undefined routes
app.use("*", (req, res) => {
  sendError(res, 404, "Route not found");
});

// Global error handler
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  sendError(res, 500, "Internal server error");
});

// Start server
app.listen(PORT, () => {
  console.log(`Express Items API server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Items endpoint: http://localhost:${PORT}/items`);
});

module.exports = app;
