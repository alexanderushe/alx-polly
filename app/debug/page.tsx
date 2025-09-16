"use client";

import { useState } from "react";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import {
  debugDatabaseSchema,
  createPoll,
  testUserPollAccess,
} from "../../lib/polls";
import { getCurrentUser } from "../../lib/auth";

export default function DebugPage() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setResults((prev) => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testDatabaseSchema = async () => {
    setLoading(true);
    addResult("Starting database schema test...");

    const result = await debugDatabaseSchema();
    if (result.error) {
      addResult(`❌ Database test failed: ${result.error}`);
    } else {
      addResult("✅ Database schema test passed");
    }

    setLoading(false);
  };

  const testAuthentication = async () => {
    setLoading(true);
    addResult("Testing authentication...");

    try {
      const user = await getCurrentUser();
      if (user) {
        addResult(`✅ User authenticated: ${user.email} (ID: ${user.id})`);
      } else {
        addResult("❌ No authenticated user found");
      }
    } catch (error) {
      addResult(`❌ Auth test failed: ${error}`);
    }

    setLoading(false);
  };

  const testRLSAccess = async () => {
    setLoading(true);
    addResult("Testing RLS access to polls table...");

    const result = await testUserPollAccess();
    if (result.error) {
      addResult(`❌ RLS access test failed: ${result.error}`);
      if (result.errorDetails) {
        addResult(
          `Error details: ${JSON.stringify(result.errorDetails, null, 2)}`,
        );
      }
    } else {
      addResult(
        "✅ RLS access test passed - can read and write to polls table",
      );
      if (result.testPoll) {
        addResult(
          `Created test poll: ${JSON.stringify(result.testPoll[0], null, 2)}`,
        );
      }
    }

    setLoading(false);
  };

  const testSimplePollCreation = async () => {
    setLoading(true);
    addResult("Testing simple poll creation (no scheduling)...");

    try {
      const result = await createPoll({
        question: "Debug Test Poll - " + Date.now(),
        options: ["Option 1", "Option 2"],
      });

      if (result.data) {
        addResult(
          `✅ Simple poll created successfully: ${JSON.stringify(result.data[0])}`,
        );
      } else {
        addResult(
          `❌ Simple poll creation failed: ${JSON.stringify(result.error)}`,
        );
      }
    } catch (error) {
      addResult(`❌ Simple poll creation exception: ${error}`);
    }

    setLoading(false);
  };

  const testScheduledPollCreation = async () => {
    setLoading(true);
    addResult("Testing scheduled poll creation...");

    try {
      const now = new Date();
      const startTime = new Date(now.getTime() + 60000).toISOString(); // 1 minute from now
      const endTime = new Date(now.getTime() + 3600000).toISOString(); // 1 hour from now

      addResult(`Start time: ${startTime}`);
      addResult(`End time: ${endTime}`);

      const result = await createPoll({
        question: "Scheduled Debug Test Poll - " + Date.now(),
        options: ["Option A", "Option B", "Option C"],
        start_time: startTime,
        end_time: endTime,
      });

      if (result.data) {
        addResult(
          `✅ Scheduled poll created successfully: ${JSON.stringify(result.data[0])}`,
        );
      } else {
        addResult(
          `❌ Scheduled poll creation failed: ${JSON.stringify(result.error)}`,
        );
      }
    } catch (error) {
      addResult(`❌ Scheduled poll creation exception: ${error}`);
    }

    setLoading(false);
  };

  const runAllTests = async () => {
    clearResults();
    await testAuthentication();
    await testDatabaseSchema();
    await testRLSAccess();
    await testSimplePollCreation();
    await testScheduledPollCreation();
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Debug Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Individual Tests</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={testAuthentication}
              disabled={loading}
              className="w-full"
            >
              Test Authentication
            </Button>
            <Button
              onClick={testDatabaseSchema}
              disabled={loading}
              className="w-full"
            >
              Test Database Schema
            </Button>
            <Button
              onClick={testRLSAccess}
              disabled={loading}
              className="w-full"
            >
              Test RLS Access
            </Button>
            <Button
              onClick={testSimplePollCreation}
              disabled={loading}
              className="w-full"
            >
              Test Simple Poll Creation
            </Button>
            <Button
              onClick={testScheduledPollCreation}
              disabled={loading}
              className="w-full"
            >
              Test Scheduled Poll Creation
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Batch Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              onClick={runAllTests}
              disabled={loading}
              variant="default"
              className="w-full"
            >
              Run All Tests
            </Button>
            <Button onClick={clearResults} variant="outline" className="w-full">
              Clear Results
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex items-center gap-2 mb-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Running tests...</span>
            </div>
          )}

          {results.length === 0 && !loading ? (
            <p className="text-gray-500 italic">
              No test results yet. Run a test to see output.
            </p>
          ) : (
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm">
          <p>
            This debug page helps diagnose issues with poll creation and
            scheduling:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <strong>Authentication Test:</strong> Verifies user is logged in
            </li>
            <li>
              <strong>Database Schema Test:</strong> Checks database connection
              and table structure
            </li>
            <li>
              <strong>RLS Access Test:</strong> Checks Row Level Security
              permissions for polls table
            </li>
            <li>
              <strong>Simple Poll Creation:</strong> Tests basic poll creation
              without scheduling
            </li>
            <li>
              <strong>Scheduled Poll Creation:</strong> Tests poll creation with
              start/end times
            </li>
          </ul>
          <p className="mt-4">
            <strong>Note:</strong> Make sure you're logged in before running
            tests. If you encounter errors, check the console for detailed error
            information.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
