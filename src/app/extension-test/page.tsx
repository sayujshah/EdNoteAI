'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function ExtensionTestPage() {
  const { user, session } = useAuth();
  const [testResult, setTestResult] = useState<string | null>(null);

  const testExtensionCommunication = () => {
    if (!session?.access_token) {
      setTestResult('❌ No authentication token available');
      return;
    }

    // Send test message to extension
    window.postMessage({
      type: 'EDNOTEAI_AUTH_SUCCESS',
      token: session.access_token,
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.user_metadata?.full_name || user?.email?.split('@')[0]
      }
    }, window.location.origin);

    setTestResult('✅ Test message sent to extension! Check browser console for details.');
  };

  const testLogout = () => {
    window.postMessage({
      type: 'EDNOTEAI_AUTH_LOGOUT'
    }, window.location.origin);

    setTestResult('✅ Logout message sent to extension!');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Extension Integration Test</h1>
        <p className="text-muted-foreground">
          This page helps test the communication between EdNoteAI website and the Chrome extension.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
            <CardDescription>Current user authentication state</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              {user ? (
                <Badge variant="default" className="bg-green-500">✅ Authenticated</Badge>
              ) : (
                <Badge variant="destructive">❌ Not Authenticated</Badge>
              )}
            </div>
            
            {user && (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">User ID:</span>
                  <span className="font-mono text-sm">{user.id}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Name:</span>
                  <span>{user.user_metadata?.full_name || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Token Available:</span>
                  {session?.access_token ? (
                    <Badge variant="default" className="bg-green-500">✅ Yes</Badge>
                  ) : (
                    <Badge variant="destructive">❌ No</Badge>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Extension Communication Test */}
        <Card>
          <CardHeader>
            <CardTitle>Extension Communication Test</CardTitle>
            <CardDescription>
              Test sending authentication data to the Chrome extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={testExtensionCommunication}
                disabled={!user || !session?.access_token}
                className="flex-1"
              >
                🧩 Test Extension Auth
              </Button>
              <Button 
                onClick={testLogout}
                variant="outline"
                className="flex-1"
              >
                🚪 Test Extension Logout
              </Button>
            </div>
            
            {testResult && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{testResult}</p>
              </div>
            )}
            
            <div className="text-sm text-muted-foreground">
              <p><strong>Instructions:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Install the EdNoteAI Chrome extension</li>
                <li>Open the extension popup</li>
                <li>Click "Test Extension Auth" above</li>
                <li>Check if the extension shows "authenticated" status</li>
              </ol>
            </div>
          </CardContent>
        </Card>

        {/* Extension Login Test */}
        <Card>
          <CardHeader>
            <CardTitle>Extension Login Flow Test</CardTitle>
            <CardDescription>
              Test the complete login flow from the extension
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Test Extension Login Flow:</h4>
                <div className="space-y-2 text-sm">
                  <p>1. <Link href="/login?extension=true" className="text-blue-500 hover:underline">
                    Click here to simulate extension login
                  </Link></p>
                  <p>2. Sign in normally on the login page</p>
                  <p>3. Extension should automatically detect authentication</p>
                  <p>4. Tab should show success message and close automatically</p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>💡 Tip:</strong> Open browser developer tools (F12) and check the Console tab 
                  to see detailed logs of extension communication.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Browser Console Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>How to monitor extension communication</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <p><strong>To debug extension communication:</strong></p>
              <ol className="list-decimal list-inside space-y-1">
                <li>Open browser Developer Tools (F12)</li>
                <li>Go to the Console tab</li>
                <li>Look for messages starting with "✅" or "🔄"</li>
                <li>Check for any error messages in red</li>
              </ol>
              
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-md">
                <p className="font-mono text-xs">
                  Expected console messages:<br/>
                  ✅ Notified extension of successful authentication<br/>
                  🔄 Extension requested auth token<br/>
                  ✅ Notified extension of logout
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 