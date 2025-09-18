# 🗳️ Poll API Functions Documentation

This document provides comprehensive documentation for the new client-side functions that enable voting on polls and retrieving poll results.

## Overview

Two new client-side functions have been implemented to extend the polling functionality:

1. **🗳️ `castVote(pollId, option)`** - Cast a vote on an existing poll
2. **📊 `getPollResults(pollId)`** - Retrieve poll results with vote counts and percentages

These functions are located in `lib/pollApi.ts` and provide a clean, type-safe interface for interacting with the poll voting system.

## 📋 Table of Contents

- [Installation & Setup](#installation--setup)
- [Function Reference](#function-reference)
  - [castVote()](#-castvotepollid-option)
  - [getPollResults()](#-getpollresultspollid)
- [API Endpoints](#api-endpoints)
- [Type Definitions](#type-definitions)
- [Usage Examples](#usage-examples)
- [Error Handling](#error-handling)
- [Utility Functions](#utility-functions)
- [Demo Page](#demo-page)

## Installation & Setup

The functions are ready to use in your Next.js application. Simply import them from the `lib/pollApi.ts` module:

```typescript
import { castVote, getPollResults } from '../lib/pollApi';
```

### Prerequisites

- User must be authenticated (functions require valid session)
- Polls must exist in the database
- Supabase client properly configured

## Function Reference

### 🗳️ `castVote(pollId, option)`

Casts a vote on an existing poll for the authenticated user.

#### Parameters

| Parameter | Type     | Required | Description |
|-----------|----------|----------|-------------|
| `pollId`  | `string` | Yes      | The ID of the poll to vote on |
| `option`  | `string` | Yes      | The option to vote for (must match one of the poll's options) |

#### Returns

`Promise<ApiResponse<Vote>>`

#### Example

```typescript
const result = await castVote("123", "Option 1");
if (result.success) {
  console.log("Vote cast successfully:", result.data);
  console.log("Vote ID:", result.data.id);
  console.log("Timestamp:", result.data.created_at);
} else {
  console.error("Failed to cast vote:", result.error);
}
```

#### Possible Errors

- `401 Unauthorized` - User not logged in
- `404 Not Found` - Poll doesn't exist
- `400 Bad Request` - Invalid option or missing parameters
- `409 Conflict` - User has already voted on this poll
- `500 Internal Server Error` - Database or server error

### 📊 `getPollResults(pollId)`

Retrieves comprehensive poll results including vote counts, percentages, and user voting status.

#### Parameters

| Parameter | Type     | Required | Description |
|-----------|----------|----------|-------------|
| `pollId`  | `string` | Yes      | The ID of the poll to get results for |

#### Returns

`Promise<ApiResponse<PollResultsResponse>>`

#### Example

```typescript
const result = await getPollResults("123");
if (result.success) {
  const { poll, results, totalVotes, hasUserVoted, userVote } = result.data;
  
  console.log(`Poll: ${poll.question}`);
  console.log(`Total votes: ${totalVotes}`);
  console.log(`User voted: ${hasUserVoted ? `Yes (${userVote})` : 'No'}`);
  
  results.forEach(result => {
    console.log(`${result.option}: ${result.votes} votes (${result.percentage}%)`);
  });
} else {
  console.error("Failed to get results:", result.error);
}
```

## API Endpoints

The client-side functions interact with the following REST API endpoints:

### POST `/api/polls/[pollId]/vote`

Casts a vote on a specific poll.

**Request Body:**
```json
{
  "option": "Option 1"
}
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "poll_id": 123,
    "option": "Option 1",
    "voter_id": "user-uuid",
    "created_at": "2024-01-15T10:30:00.000Z"
  },
  "message": "Vote cast successfully"
}
```

### GET `/api/polls/[pollId]/results`

Retrieves poll results with comprehensive statistics.

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "poll": {
      "id": 123,
      "question": "What's your favorite color?",
      "options": ["Red", "Blue", "Green"],
      "created_at": "2024-01-15T10:00:00.000Z",
      "start_time": null,
      "end_time": null
    },
    "results": [
      {
        "option": "Blue",
        "votes": 15,
        "percentage": 50
      },
      {
        "option": "Red",
        "votes": 10,
        "percentage": 33
      },
      {
        "option": "Green",
        "votes": 5,
        "percentage": 17
      }
    ],
    "totalVotes": 30,
    "userVote": "Blue",
    "hasUserVoted": true
  }
}
```

## Type Definitions

### Vote

```typescript
interface Vote {
  id: number;
  poll_id: number;
  option: string;
  voter_id: string;
  created_at: string;
}
```

### PollResult

```typescript
interface PollResult {
  option: string;
  votes: number;
  percentage: number;
}
```

### PollResultsResponse

```typescript
interface PollResultsResponse {
  poll: {
    id: number;
    question: string;
    options: string[];
    created_at: string;
    start_time: string | null;
    end_time: string | null;
  };
  results: PollResult[];
  totalVotes: number;
  userVote: string | null;
  hasUserVoted: boolean;
}
```

### ApiResponse

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: string;
}
```

## Usage Examples

### Basic Voting Flow

```typescript
import { castVote, getPollResults } from '../lib/pollApi';

// Cast a vote
const voteResult = await castVote("123", "Option 2");
if (voteResult.success) {
  // Vote successful, now get updated results
  const resultsData = await getPollResults("123");
  if (resultsData.success) {
    // Display results to user
    displayResults(resultsData.data);
  }
}
```

### React Component Example

```typescript
'use client';

import { useState } from 'react';
import { castVote, getPollResults, PollResultsResponse } from '../lib/pollApi';

export function VotingComponent({ pollId }: { pollId: string }) {
  const [selectedOption, setSelectedOption] = useState('');
  const [results, setResults] = useState<PollResultsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVote = async () => {
    setLoading(true);
    const result = await castVote(pollId, selectedOption);
    
    if (result.success) {
      // Refresh results after voting
      const resultsData = await getPollResults(pollId);
      if (resultsData.success) {
        setResults(resultsData.data);
      }
    }
    setLoading(false);
  };

  const loadResults = async () => {
    setLoading(true);
    const result = await getPollResults(pollId);
    if (result.success) {
      setResults(result.data);
    }
    setLoading(false);
  };

  return (
    <div>
      {/* Voting interface */}
      <button onClick={handleVote} disabled={loading}>
        Vote
      </button>
      
      {/* Results display */}
      <button onClick={loadResults} disabled={loading}>
        Show Results
      </button>
      
      {results && (
        <div>
          <h3>{results.poll.question}</h3>
          {results.results.map(result => (
            <div key={result.option}>
              {result.option}: {result.votes} votes ({result.percentage}%)
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Error Handling

Both functions provide comprehensive error handling with specific error messages:

### Common Error Patterns

```typescript
const result = await castVote(pollId, option);

if (!result.success) {
  switch (result.error) {
    case 'Unauthorized':
      // Redirect to login
      router.push('/login');
      break;
    case 'You have already voted on this poll':
      // Show message that user already voted
      showMessage('You have already voted on this poll');
      break;
    case 'Poll not found':
      // Handle missing poll
      showError('This poll no longer exists');
      break;
    default:
      // Generic error handling
      showError(result.error || 'An error occurred');
  }
}
```

### Network Error Handling

```typescript
try {
  const result = await getPollResults(pollId);
  // Handle result...
} catch (error) {
  // Handle network/unexpected errors
  console.error('Network error:', error);
  showError('Unable to connect. Please check your internet connection.');
}
```

## Utility Functions

The `lib/pollApi.ts` file also includes helpful utility functions:

### `isPollActive(poll)`

Checks if a poll is currently active based on start and end times.

```typescript
import { isPollActive } from '../lib/pollApi';

if (isPollActive(poll)) {
  // Allow voting
} else {
  // Show inactive message
}
```

### `formatPollResults(results)`

Formats poll results by sorting by vote count and rounding percentages.

```typescript
import { formatPollResults } from '../lib/pollApi';

const formattedResults = formatPollResults(results.results);
// Results are now sorted by vote count (highest first)
```

### `getWinningOptions(results)`

Returns the winning option(s) from poll results (handles ties).

```typescript
import { getWinningOptions } from '../lib/pollApi';

const winners = getWinningOptions(results.results);
console.log('Winning options:', winners.join(', '));
```

## Demo Page

A comprehensive demo page is available at `/poll-api-demo` that showcases both functions in action:

### Features

- **Poll Selection**: Browse and select from available polls
- **Live Voting**: Cast votes using the `castVote()` function
- **Real-time Results**: View results using the `getPollResults()` function
- **Visual Charts**: See vote percentages with progress bars
- **User Status**: Check if you've voted and what you voted for
- **Error Handling**: Demonstrates proper error handling
- **Responsive Design**: Works on desktop and mobile

### Access

Visit `http://localhost:3000/poll-api-demo` to see the functions in action.

## Database Schema

The functions work with the following database tables:

### `polls` Table

```sql
CREATE TABLE polls (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  creator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ
);
```

### `votes` Table

```sql
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  poll_id INTEGER REFERENCES polls(id),
  option TEXT NOT NULL,
  voter_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Security Considerations

- **Authentication Required**: All endpoints require user authentication
- **Authorization**: Users can only vote once per poll
- **Validation**: Options are validated against the poll's available options
- **RLS Enabled**: Row Level Security is enabled on both tables
- **SQL Injection Prevention**: All queries use parameterized statements

## Performance Notes

- **Efficient Queries**: Results endpoint uses aggregation for optimal performance
- **Caching**: Consider implementing client-side caching for frequently accessed results
- **Pagination**: For polls with many votes, consider implementing pagination
- **Real-time Updates**: Consider WebSocket integration for live result updates

## Contributing

When extending these functions:

1. **Maintain Type Safety**: Always use proper TypeScript types
2. **Error Handling**: Provide clear, actionable error messages
3. **Documentation**: Update this documentation for any changes
4. **Testing**: Add tests for new functionality
5. **Consistency**: Follow the established patterns and naming conventions

## Support

For issues or questions regarding these functions:

1. Check the [API-IMPLEMENTATIONS.md](./API-IMPLEMENTATIONS.md) file
2. Review the demo page implementation
3. Check the browser console for detailed error messages
4. Verify authentication status and poll existence

## Changelog

### Version 1.0.0 (Current)

- ✅ Initial implementation of `castVote()` function
- ✅ Initial implementation of `getPollResults()` function
- ✅ Comprehensive error handling
- ✅ Type definitions and documentation
- ✅ Demo page with full functionality
- ✅ Utility functions for poll management
- ✅ REST API endpoints for voting and results

### Future Enhancements

- 🔄 Real-time result updates via WebSockets
- 📊 Advanced analytics and reporting
- 🔒 Enhanced security features
- 📱 Mobile-optimized voting interface
- 🎨 Customizable result visualizations