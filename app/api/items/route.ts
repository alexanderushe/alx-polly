import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "../../../lib/auth";

// Basic input sanitizer to prevent XSS
const sanitize = (input: string) => {
  if (!input) return "";
  return input.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// In-memory storage for demonstration (use a database in production)
let items: {
  id: number;
  name: string;
  description: string;
  createdAt: string;
}[] = [
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

// GET /api/items - Retrieve all items
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to retrieve items",
      },
      { status: 500 },
    );
  }
}

// POST /api/items - Create a new item
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();

    // Validate and sanitize required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Name is required and must be a string",
        },
        { status: 400 },
      );
    }

    const sanitizedName = sanitize(body.name.trim());
    const sanitizedDescription = sanitize(body.description || "");

    if (!sanitizedName) {
      return NextResponse.json(
        {
          success: false,
          error: "Name cannot be empty",
        },
        { status: 400 },
      );
    }

    // Create new item
    const newItem = {
      id: nextId++,
      name: sanitizedName,
      description: sanitizedDescription,
      createdAt: new Date().toISOString(),
    };

    items.push(newItem);

    return NextResponse.json(
      {
        success: true,
        data: newItem,
        message: "Item created successfully",
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create item",
      },
      { status: 500 },
    );
  }
}
