import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseS3CleanupOptions {
  videoId: string;
  isProcessingComplete: boolean;
  enabled?: boolean;
}

export function useS3Cleanup({ videoId, isProcessingComplete, enabled = true }: UseS3CleanupOptions) {
  const cleanupTriggeredRef = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackCleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  const triggerCleanup = async (reason: string) => {
    // Prevent multiple cleanup calls
    if (cleanupTriggeredRef.current) {
      console.log('S3 cleanup already triggered, skipping');
      return;
    }

    cleanupTriggeredRef.current = true;
    console.log(`Triggering S3 cleanup for video ${videoId}, reason: ${reason}`);

    try {
      const response = await fetch(`/api/media/${videoId}/cleanup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      console.log('S3 cleanup result:', result);

      if (response.ok) {
        if (result.status === 'success') {
          console.log('S3 file successfully cleaned up');
        } else if (result.status === 'pending') {
          console.log('Processing not complete, cleanup skipped');
          // Reset flag to allow retry later
          cleanupTriggeredRef.current = false;
        }
      } else {
        console.error('S3 cleanup failed:', result.error);
        // Reset flag to allow retry
        cleanupTriggeredRef.current = false;
      }
    } catch (error) {
      console.error('Error during S3 cleanup:', error);
      // Reset flag to allow retry
      cleanupTriggeredRef.current = false;
    }
  };

  // Delayed cleanup - gives user a chance to return to the page
  const scheduleDelayedCleanup = () => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
    }

    cleanupTimeoutRef.current = setTimeout(() => {
      triggerCleanup('delayed after page visibility change');
    }, 30000); // 30 seconds delay
  };

  const cancelScheduledCleanup = () => {
    if (cleanupTimeoutRef.current) {
      clearTimeout(cleanupTimeoutRef.current);
      cleanupTimeoutRef.current = null;
    }
  };

  const scheduleFallbackCleanup = () => {
    if (fallbackCleanupTimeoutRef.current) {
      clearTimeout(fallbackCleanupTimeoutRef.current);
    }

    // Schedule fallback cleanup after 5 minutes of being on the analysis page
    fallbackCleanupTimeoutRef.current = setTimeout(() => {
      triggerCleanup('fallback timeout after processing complete');
    }, 5 * 60 * 1000); // 5 minutes
  };

  const cancelFallbackCleanup = () => {
    if (fallbackCleanupTimeoutRef.current) {
      clearTimeout(fallbackCleanupTimeoutRef.current);
      fallbackCleanupTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    if (!enabled || !videoId) return;

    const handleBeforeUnload = () => {
      // For immediate navigation away or tab close
      if (isProcessingComplete) {
        // Use sendBeacon for reliability during page unload
        const data = JSON.stringify({});
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(`/api/media/${videoId}/cleanup`, blob);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page became hidden (tab switch, minimize, etc.)
        if (isProcessingComplete) {
          scheduleDelayedCleanup();
        }
      } else {
        // Page became visible again
        cancelScheduledCleanup();
      }
    };

    const handlePageHide = () => {
      // Page is being unloaded
      if (isProcessingComplete) {
        triggerCleanup('page hide');
      }
    };

    // Handle browser back/forward/refresh navigation
    const handlePopState = () => {
      if (isProcessingComplete) {
        triggerCleanup('browser navigation');
      }
    };

    // Set up event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('popstate', handlePopState);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('popstate', handlePopState);
      
      // Cancel any scheduled cleanup
      cancelScheduledCleanup();
      cancelFallbackCleanup();
    };
  }, [videoId, isProcessingComplete, enabled]);

  // Schedule fallback cleanup when processing completes
  useEffect(() => {
    if (!enabled || !videoId) return;

    if (isProcessingComplete) {
      console.log(`Processing complete for video ${videoId}, scheduling fallback cleanup`);
      scheduleFallbackCleanup();
    } else {
      cancelFallbackCleanup();
    }

    return () => {
      cancelFallbackCleanup();
    };
  }, [isProcessingComplete, enabled, videoId]);

  // Manual cleanup function for explicit calls
  const manualCleanup = () => {
    if (isProcessingComplete) {
      triggerCleanup('manual');
    }
  };

  return { manualCleanup };
} 