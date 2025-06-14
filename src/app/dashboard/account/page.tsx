'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, User, CreditCard, Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileSettings, SubscriptionManager } from '@/components/subscription';
import ChangePasswordMFAModal from '@/components/ChangePasswordMFAModal';
import DeleteAccountMFAModal from '@/components/DeleteAccountMFAModal';
import EmailPreferencesModal from '@/components/EmailPreferencesModal';
import { ThemeSelector } from '@/components/ui/theme-selector';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';

export default function AccountPage() {
  return (
    <AccountPageContent />
  );
}

function AccountPageContent() {
  const auth = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isModalOpen, setModalOpen] = useState(false)
  const [isDeleteMFAModalOpen, setDeleteMFAModalOpen] = useState(false)
  const [isEmailPreferencesModalOpen, setEmailPreferencesModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile');

  // Handle URL parameters for section switching
  useEffect(() => {
    const section = searchParams.get('section');
    if (section === 'billing') {
      setActiveTab('subscription');
      // Clean up URL without triggering navigation
      window.history.replaceState(null, '', '/dashboard/account');
    }
  }, [searchParams]);
  
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                    onClick={() => setDeleteMFAModalOpen(true)}
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
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setEmailPreferencesModalOpen(true)}
                        className="px-3 py-1 text-sm border rounded hover:bg-muted"
                      >
                        Configure
                      </Button>
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

          {/* Modals - render outside of tabs so they can be triggered from any tab */}
          <ChangePasswordMFAModal
            isOpen={isModalOpen}
            onClose={() => setModalOpen(false)}
          />

          <DeleteAccountMFAModal
            isOpen={isDeleteMFAModalOpen}
            onClose={() => setDeleteMFAModalOpen(false)}
          />

          <EmailPreferencesModal
            isOpen={isEmailPreferencesModalOpen}
            onClose={() => setEmailPreferencesModalOpen(false)}
          />
        </div>
      </main>
    </div>
  );
} 