import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for demonstration (use a database in production)
let items: { id: number; name: string; description: string; createdAt: string }[] = [
  {
    id: 1,
    name: 'Sample Item 1',
    description: 'This is a sample item',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    name: 'Sample Item 2',
    description: 'This is another sample item',
    createdAt: new Date().toISOString(),
  },
];

let nextId = 3;

// GET /api/items - Retrieve all items
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve items',
      },
      { status: 500 }
    );
  }
}

// POST /api/items - Create a new item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Name is required and must be a string',
        },
        { status: 400 }
      );
    }

    // Create new item
    const newItem = {
      id: nextId++,
      name: body.name.trim(),
      description: body.description || '',
      createdAt: new Date().toISOString(),
    };

    items.push(newItem);

    return NextResponse.json(
      {
        success: true,
        data: newItem,
        message: 'Item created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create item',
      },
      { status: 500 }
    );
  }
}
