'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, User, CreditCard, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings, SubscriptionManager } from '@/components/subscription';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function AccountPage() {
  return (
    <AccountPageContent />
  );
}

function AccountPageContent() {
  const auth = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <BookOpen className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">EdNoteAI</span>
            <span className="text-sm text-muted-foreground ml-2">/ Account</span>
          </Link>
          <nav className="flex items-center gap-6">
            <Link href="/dashboard/library" className="text-sm font-medium hover:text-primary">
              Library
            </Link>
            <Link href="/dashboard/upload" className="text-sm font-medium hover:text-primary">
              Upload
            </Link>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your account, subscription, and personal preferences all in one place.
            </p>
          </div>
          
          {/* Main Content with Tabs */}
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 max-w-2xl">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
              <TabsTrigger value="subscription" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Subscription</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Preferences</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <ProfileSettings />
            </TabsContent>

            {/* Subscription Tab */}
            <TabsContent value="subscription" className="space-y-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold tracking-tight">Subscription Management</h2>
                <p className="text-muted-foreground mt-1">
                  Manage your subscription plan, view usage statistics, and update billing information.
                </p>
              </div>
              <SubscriptionManager />
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Change Password</h4>
                        <p className="text-sm text-muted-foreground">
                          Update your account password
                        </p>
                      </div>
                      <button className="px-3 py-1 text-sm border rounded hover:bg-muted">
                        Change
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Two-Factor Authentication</h4>
                        <p className="text-sm text-muted-foreground">
                          Add an extra layer of security to your account
                        </p>
                      </div>
                      <button className="px-3 py-1 text-sm border rounded hover:bg-muted">
                        Enable
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Active Sessions</h4>
                        <p className="text-sm text-muted-foreground">
                          Manage devices that are signed in to your account
                        </p>
                      </div>
                      <button className="px-3 py-1 text-sm border rounded hover:bg-muted">
                        View
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Email Notifications</h4>
                        <p className="text-sm text-muted-foreground">
                          Receive email updates about your account and transcriptions
                        </p>
                      </div>
                      <button className="px-3 py-1 text-sm border rounded hover:bg-muted">
                        Configure
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Theme Preference</h4>
                        <p className="text-sm text-muted-foreground">
                          Choose your preferred theme (light, dark, or system)
                        </p>
                      </div>
                      <button className="px-3 py-1 text-sm border rounded hover:bg-muted">
                        Change
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <h4 className="text-sm font-medium">Default Note Format</h4>
                        <p className="text-sm text-muted-foreground">
                          Set your preferred note generation format
                        </p>
                      </div>
                      <button className="px-3 py-1 text-sm border rounded hover:bg-muted">
                        Set
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 