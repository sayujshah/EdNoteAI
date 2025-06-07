'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { BookOpen, User, CreditCard, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings, SubscriptionManager } from '@/components/subscription';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import DeleteAccountSupportModal from '@/components/DeleteAccountSupportModal';
import { ThemeSelector } from '@/components/ui/theme-selector';
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
  const [isModalOpen, setModalOpen] = useState(false)
  const [isDeleteSupportModalOpen, setDeleteSupportModalOpen] = useState(false)
  
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
          <div className="flex items-center gap-8">
            <Link href="/" className="relative flex items-center gap-2 hover:opacity-80 transition-opacity">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">EdNoteAI</span>
              <span className="absolute -top-1 left-full ml-1 inline-flex items-center px-1 py-0 text-[8px] font-medium text-gray-600 bg-gray-200 dark:text-gray-400 dark:bg-gray-700 rounded-sm">
                BETA
              </span>
            </Link>
            <span className="text-sm text-muted-foreground">/ Account</span>
          </div>
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
                  <Settings className="h-5 w-5" />
                    Security & Privacy
                </CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Password</h4>
                    <p className="text-sm text-muted-foreground">
                      Last updated: Not available
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setModalOpen(true)} className="px-3 py-1 text-sm border rounded hover:bg-muted">
                    Change Password
                  </Button>
                </div>
              </CardContent>

              <ChangePasswordModal
                isOpen={isModalOpen}
                onClose={() => setModalOpen(false)}
              />

              <DeleteAccountSupportModal
                isOpen={isDeleteSupportModalOpen}
                onClose={() => setDeleteSupportModalOpen(false)}
              />

              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive rounded-lg">
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium">Delete Account</h4>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data
                      <br />
                      <span className="text-xs text-muted-foreground">
                        NOTE: This action is irreversible and cannot be undone.
                      </span>
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => setDeleteSupportModalOpen(true)}
                  >
                    Delete Account
                  </Button>
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
                      <ThemeSelector />
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