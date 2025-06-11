import { useEffect, useRef } from 'react';

interface UseS3CleanupOptions {
  videoId: string;
  isProcessingComplete: boolean;
  enabled?: boolean;
}

export function useS3Cleanup({ videoId, isProcessingComplete, enabled = true }: UseS3CleanupOptions) {
  const cleanupTriggeredRef = useRef(false);
  const cleanupTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  useEffect(() => {
    if (!enabled || !videoId) return;

    const handleBeforeUnload = () => {
      // For immediate navigation away or tab close
      if (isProcessingComplete) {
        // Use sendBeacon for reliability during page unload
        navigator.sendBeacon(`/api/media/${videoId}/cleanup`, JSON.stringify({}));
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

    // Set up event listeners
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      // Cleanup event listeners
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      
      // Cancel any scheduled cleanup
      cancelScheduledCleanup();
    };
  }, [videoId, isProcessingComplete, enabled]);

  // Manual cleanup function for explicit calls
  const manualCleanup = () => {
    if (isProcessingComplete) {
      triggerCleanup('manual');
    }
  };

  return { manualCleanup };
} 