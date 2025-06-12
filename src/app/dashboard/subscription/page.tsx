'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

export default function SubscriptionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'canceled'>('loading');
  const [message, setMessage] = useState('');
  const [planName, setPlanName] = useState('');

  useEffect(() => {
    const handleSubscriptionResult = async () => {
      const success = searchParams.get('success');
      const canceled = searchParams.get('canceled');
      const sessionId = searchParams.get('session_id');

      if (canceled === 'true') {
        setStatus('canceled');
        setMessage('Subscription was canceled. You can try again anytime.');
        return;
      }

      if (success === 'true') {
        try {
          // Give Stripe time to process the subscription (2 seconds)
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // First try to sync subscription from Stripe data
          setMessage('Syncing your subscription...');
          
          const syncResponse = await fetch('/api/subscription/sync-from-stripe', {
            method: 'POST'
          });
          
          if (syncResponse.ok) {
            const syncData = await syncResponse.json();
            console.log('Sync response:', syncData);
            
            if (syncData.success && syncData.subscription) {
              setStatus('success');
              setPlanName(syncData.subscription.planName);
              setMessage(`Welcome to ${syncData.subscription.planName}! Your subscription is now active.`);
              
              // Redirect to library after showing success message
              setTimeout(() => {
                router.push('/dashboard/library?subscribed=true');
              }, 3000);
              return;
            }
          }
          
          // Fallback: Check subscription status directly
          setMessage('Checking your subscription status...');
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const response = await fetch('/api/subscription/status');
          const subscriptionData = await response.json();

          if (response.ok && subscriptionData.subscription && 
              subscriptionData.subscription.status === 'active') {
            setStatus('success');
            setPlanName(subscriptionData.plan?.name || 'Premium');
            setMessage(`Welcome to ${subscriptionData.plan?.name || 'Premium'}! Your subscription is now active.`);
            
            // Redirect to library after showing success message
            setTimeout(() => {
              router.push('/dashboard/library?subscribed=true');
            }, 3000);
          } else {
            // Subscription might still be processing
            setStatus('loading');
            setMessage('Your subscription is still being processed. This may take a few moments...');
            
            // Retry after a longer delay
            setTimeout(() => {
              window.location.reload();
            }, 5000);
          }
        } catch (error) {
          console.error('Error checking subscription:', error);
          setStatus('error');
          setMessage('There was an issue processing your subscription. Please contact support if this persists.');
        }
      } else {
        setStatus('error');
        setMessage('Invalid subscription result. Please contact support.');
      }
    };

    handleSubscriptionResult();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Processing Subscription
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {message || 'Please wait while we set up your account...'}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Subscription Successful!
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>
              <div className="flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                <span>Redirecting to your library</span>
                <ArrowRight className="h-4 w-4 ml-2" />
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/library')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Go to Library
                </button>
                <button
                  onClick={async () => {
                    // Try syncing one more time
                    try {
                      const syncResponse = await fetch('/api/subscription/sync-from-stripe', {
                        method: 'POST'
                      });
                      if (syncResponse.ok) {
                        window.location.reload();
                      }
                    } catch (error) {
                      console.error('Manual sync failed:', error);
                    }
                  }}
                  className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg transition-colors"
                >
                  Try Syncing Again
                </button>
              </div>
            </>
          )}

          {status === 'canceled' && (
            <>
              <XCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Subscription Canceled
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard/library')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Go to Library
                </button>
                <button
                  onClick={() => router.push('/dashboard/account')}
                  className="w-full bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-6 py-2 rounded-lg transition-colors"
                >
                  View Subscription Plans
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 