import { createClient } from '@/utils/supabase/server';
import type { 
  SubscriptionPlan, 
  UserSubscription, 
  UserUsage, 
  UserPlanLimits,
  UploadValidation,
  FeatureAccess 
} from '@/lib/types/subscription';

// =====================================================
// Subscription Service
// =====================================================

export class SubscriptionService {
  
  /**
   * Get all available subscription plans
   */
  static async getPlans(): Promise<SubscriptionPlan[]> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly');

    if (error) {
      throw new Error(`Failed to fetch plans: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a user's current subscription and plan limits
   */
  static async getUserSubscriptionStatus(userId: string): Promise<{
    subscription: UserSubscription | null;
    limits: UserPlanLimits;
    usage: UserUsage;
  }> {
    const supabase = await createClient();
    
    // Get user's plan limits using the database function
    const { data: limitsData, error: limitsError } = await supabase
      .rpc('get_user_plan_limits', { p_user_id: userId });

    if (limitsError) {
      throw new Error(`Failed to fetch user limits: ${limitsError.message}`);
    }

    const limits = limitsData?.[0] || {
      plan_name: 'Free' as const,
      max_upload_duration_minutes: 10,
      monthly_credits: 3,
      can_save_notes: false,
      credits_used_this_month: 0,
      credits_remaining: 3
    };

    // Get current subscription
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .single();

    // Get current month usage
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    
    const { data: usage, error: usageError } = await supabase
      .from('user_usage')
      .select('*')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .eq('year', currentYear)
      .single();

    const defaultUsage: UserUsage = {
      id: '',
      user_id: userId,
      month: currentMonth,
      year: currentYear,
      credits_used: 0,
      total_upload_minutes: 0,
      transcriptions_count: 0,
      notes_generated_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return {
      subscription: subError ? null : subscription,
      limits,
      usage: usageError ? defaultUsage : usage
    };
  }

  /**
   * Check if a user can upload a file with given duration
   */
  static async validateUpload(userId: string, durationMinutes: number): Promise<UploadValidation> {
    try {
      const { limits } = await this.getUserSubscriptionStatus(userId);
      
      // Check duration limit
      if (durationMinutes > limits.max_upload_duration_minutes) {
        return {
          canUpload: false,
          reason: 'duration_exceeded',
          maxDurationMinutes: limits.max_upload_duration_minutes,
          creditsRemaining: limits.credits_remaining
        };
      }

      // Check credits (unlimited = -1)
      if (limits.credits_remaining !== -1 && limits.credits_remaining < 1) {
        return {
          canUpload: false,
          reason: 'no_credits',
          maxDurationMinutes: limits.max_upload_duration_minutes,
          creditsRemaining: limits.credits_remaining
        };
      }

      return {
        canUpload: true,
        maxDurationMinutes: limits.max_upload_duration_minutes,
        creditsRemaining: limits.credits_remaining
      };
    } catch (error) {
      console.error('Error validating upload:', error);
      throw error;
    }
  }

  /**
   * Consume credits for transcription/note generation
   */
  static async consumeCredits(userId: string, credits: number = 1): Promise<boolean> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .rpc('consume_user_credits', { 
        p_user_id: userId, 
        p_credits: credits 
      });

    if (error) {
      throw new Error(`Failed to consume credits: ${error.message}`);
    }

    return data === true;
  }

  /**
   * Get user's feature access based on their plan
   */
  static async getUserFeatureAccess(userId: string): Promise<FeatureAccess> {
    const { limits } = await this.getUserSubscriptionStatus(userId);
    
    return {
      canSaveNotes: limits.can_save_notes,
      canUploadLongVideos: limits.max_upload_duration_minutes > 10,
      hasUnlimitedCredits: limits.monthly_credits === -1,
      maxUploadDurationMinutes: limits.max_upload_duration_minutes,
      monthlyCredits: limits.monthly_credits
    };
  }

  /**
   * Update user's usage statistics
   */
  static async updateUsage(
    userId: string, 
    updates: {
      uploadMinutes?: number;
      transcriptionsCount?: number;
      notesCount?: number;
    }
  ): Promise<void> {
    const supabase = await createClient();
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const updateData: any = {};
    if (updates.uploadMinutes !== undefined) {
      updateData.total_upload_minutes = updates.uploadMinutes;
    }
    if (updates.transcriptionsCount !== undefined) {
      updateData.transcriptions_count = updates.transcriptionsCount;
    }
    if (updates.notesCount !== undefined) {
      updateData.notes_generated_count = updates.notesCount;
    }

    const { error } = await supabase
      .from('user_usage')
      .upsert({
        user_id: userId,
        month: currentMonth,
        year: currentYear,
        ...updateData
      }, {
        onConflict: 'user_id,month,year'
      });

    if (error) {
      throw new Error(`Failed to update usage: ${error.message}`);
    }
  }

  /**
   * Check if user can save notes (premium feature)
   */
  static async canSaveNotes(userId: string): Promise<boolean> {
    const { limits } = await this.getUserSubscriptionStatus(userId);
    return limits.can_save_notes;
  }

  /**
   * Get usage statistics with percentages
   */
  static async getUsageStats(userId: string): Promise<{
    creditsUsed: number;
    creditsLimit: number;
    creditsPercentage: number;
    uploadMinutes: number;
    uploadLimit: number;
    uploadPercentage: number;
  }> {
    const { limits, usage } = await this.getUserSubscriptionStatus(userId);
    
    const creditsPercentage = limits.monthly_credits === -1 
      ? -1 // Unlimited
      : Math.round((limits.credits_used_this_month / limits.monthly_credits) * 100);

    const uploadPercentage = limits.max_upload_duration_minutes === -1
      ? -1 // Unlimited
      : Math.round((usage.total_upload_minutes / limits.max_upload_duration_minutes) * 100);

    return {
      creditsUsed: limits.credits_used_this_month,
      creditsLimit: limits.monthly_credits,
      creditsPercentage,
      uploadMinutes: usage.total_upload_minutes,
      uploadLimit: limits.max_upload_duration_minutes,
      uploadPercentage
    };
  }

  /**
   * Get plan by name
   */
  static async getPlanByName(planName: 'Free' | 'Student' | 'Professional'): Promise<SubscriptionPlan | null> {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .eq('is_active', true)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  /**
   * Check if user has an active subscription
   */
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    const { subscription } = await this.getUserSubscriptionStatus(userId);
    return subscription !== null;
  }

  /**
   * Get user's current plan name
   */
  static async getCurrentPlanName(userId: string): Promise<'Free' | 'Student' | 'Professional'> {
    const { limits } = await this.getUserSubscriptionStatus(userId);
    return limits.plan_name;
  }
} 