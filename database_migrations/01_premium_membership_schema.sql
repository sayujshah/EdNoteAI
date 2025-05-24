-- =====================================================
-- EdNoteAI Premium Membership Database Schema
-- =====================================================

-- 1. SUBSCRIPTION PLANS TABLE
-- Defines the available subscription tiers and their limits
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- 'Free', 'Student', 'Professional'
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Monthly price in USD
    price_yearly DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Yearly price in USD (with discount)
    max_upload_duration_minutes INTEGER NOT NULL DEFAULT 10, -- Max upload duration in minutes
    monthly_credits INTEGER NOT NULL DEFAULT 3, -- Monthly credits for transcription/note generation
    can_save_notes BOOLEAN NOT NULL DEFAULT FALSE, -- Can save notes to library
    stripe_price_id_monthly VARCHAR(255), -- Stripe price ID for monthly billing
    stripe_price_id_yearly VARCHAR(255), -- Stripe price ID for yearly billing
    features JSONB DEFAULT '[]'::jsonb, -- Additional features as JSON array
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. USER SUBSCRIPTIONS TABLE
-- Tracks each user's current subscription status
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES subscription_plans(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'active', 'canceled', 'past_due', 'unpaid'
    billing_cycle VARCHAR(10) NOT NULL DEFAULT 'monthly', -- 'monthly', 'yearly'
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
    stripe_subscription_id VARCHAR(255) UNIQUE, -- Stripe subscription ID
    stripe_customer_id VARCHAR(255), -- Stripe customer ID
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- One active subscription per user
);

-- 3. USAGE TRACKING TABLE
-- Tracks user's monthly usage for credit limits
CREATE TABLE IF NOT EXISTS user_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month INTEGER NOT NULL, -- Month (1-12)
    year INTEGER NOT NULL, -- Year (e.g., 2024)
    credits_used INTEGER NOT NULL DEFAULT 0, -- Credits used this month
    total_upload_minutes DECIMAL(10,2) NOT NULL DEFAULT 0.00, -- Total minutes uploaded this month
    transcriptions_count INTEGER NOT NULL DEFAULT 0, -- Number of transcriptions this month
    notes_generated_count INTEGER NOT NULL DEFAULT 0, -- Number of notes generated this month
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, month, year) -- One record per user per month
);

-- 4. PAYMENT HISTORY TABLE
-- Tracks all payment transactions
CREATE TABLE IF NOT EXISTS payment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE SET NULL,
    stripe_payment_intent_id VARCHAR(255) UNIQUE,
    stripe_invoice_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL, -- Amount in USD
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    status VARCHAR(20) NOT NULL, -- 'succeeded', 'pending', 'failed', 'canceled'
    payment_method VARCHAR(50), -- 'card', 'bank_transfer', etc.
    description TEXT,
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ADD SUBSCRIPTION FIELDS TO EXISTING TABLES
-- Add plan tracking to videos table for usage monitoring
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS duration_minutes DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS credits_consumed INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Note: Cannot modify auth.users table in Supabase (permission denied)
-- Plan information will be retrieved via the get_user_plan_limits() function

-- 6. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_user_usage_user_month_year ON user_usage(user_id, month, year);
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_videos_uploaded_at ON videos(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_videos_lesson_uploaded ON videos(lesson_id, uploaded_at);

-- 7. INSERT DEFAULT SUBSCRIPTION PLANS
INSERT INTO subscription_plans (name, price_monthly, price_yearly, max_upload_duration_minutes, monthly_credits, can_save_notes, features) 
VALUES 
    ('Free', 0.00, 0.00, 10, 3, FALSE, '["Basic transcription", "Basic note generation"]'),
    ('Student', 9.99, 99.99, 120, -1, TRUE, '["Extended uploads (2 hours)", "Unlimited credits", "Save to library", "LaTeX support", "Priority support"]'),
    ('Professional', 14.99, 149.99, 480, -1, TRUE, '["Extended uploads (8 hours)", "Unlimited credits", "Save to library", "LaTeX support", "Priority support", "Priority processing", "API access", "Team collaboration"]')
ON CONFLICT (name) DO NOTHING;

-- 8. CREATE FUNCTIONS FOR BUSINESS LOGIC

-- Function to get user's current plan limits
CREATE OR REPLACE FUNCTION get_user_plan_limits(p_user_id UUID)
RETURNS TABLE (
    plan_name VARCHAR(50),
    max_upload_duration_minutes INTEGER,
    monthly_credits INTEGER,
    can_save_notes BOOLEAN,
    credits_used_this_month INTEGER,
    credits_remaining INTEGER
) AS $$
DECLARE
    current_month INTEGER := EXTRACT(MONTH FROM NOW());
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
BEGIN
    RETURN QUERY
    SELECT 
        sp.name,
        sp.max_upload_duration_minutes,
        sp.monthly_credits,
        sp.can_save_notes,
        COALESCE(uu.credits_used, 0),
        CASE 
            WHEN sp.monthly_credits = -1 THEN -1 -- Unlimited
            ELSE GREATEST(0, sp.monthly_credits - COALESCE(uu.credits_used, 0))
        END
    FROM user_subscriptions us
    JOIN subscription_plans sp ON us.plan_id = sp.id
    LEFT JOIN user_usage uu ON uu.user_id = p_user_id 
        AND uu.month = current_month 
        AND uu.year = current_year
    WHERE us.user_id = p_user_id 
        AND us.status = 'active'
        AND us.current_period_end > NOW()
    UNION ALL
    -- Default to Free plan if no active subscription
    SELECT 
        'Free'::VARCHAR(50),
        10,
        3,
        FALSE,
        COALESCE(uu.credits_used, 0),
        GREATEST(0, 3 - COALESCE(uu.credits_used, 0))
    FROM user_usage uu
    WHERE uu.user_id = p_user_id 
        AND uu.month = current_month 
        AND uu.year = current_year
        AND NOT EXISTS (
            SELECT 1 FROM user_subscriptions us 
            WHERE us.user_id = p_user_id 
                AND us.status = 'active' 
                AND us.current_period_end > NOW()
        )
    UNION ALL
    -- Default free plan for new users
    SELECT 
        'Free'::VARCHAR(50),
        10,
        3,
        FALSE,
        0,
        3
    WHERE NOT EXISTS (
        SELECT 1 FROM user_subscriptions us 
        WHERE us.user_id = p_user_id 
            AND us.status = 'active' 
            AND us.current_period_end > NOW()
    ) AND NOT EXISTS (
        SELECT 1 FROM user_usage uu 
        WHERE uu.user_id = p_user_id 
            AND uu.month = current_month 
            AND uu.year = current_year
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to consume credits
CREATE OR REPLACE FUNCTION consume_user_credits(p_user_id UUID, p_credits INTEGER DEFAULT 1)
RETURNS BOOLEAN AS $$
DECLARE
    current_month INTEGER := EXTRACT(MONTH FROM NOW());
    current_year INTEGER := EXTRACT(YEAR FROM NOW());
    available_credits INTEGER;
BEGIN
    -- Get current available credits
    SELECT credits_remaining INTO available_credits 
    FROM get_user_plan_limits(p_user_id);
    
    -- Check if user has enough credits (-1 means unlimited)
    IF available_credits = -1 OR available_credits >= p_credits THEN
        -- Update or insert usage record
        INSERT INTO user_usage (user_id, month, year, credits_used)
        VALUES (p_user_id, current_month, current_year, p_credits)
        ON CONFLICT (user_id, month, year)
        DO UPDATE SET 
            credits_used = user_usage.credits_used + p_credits,
            updated_at = NOW();
        
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. CREATE ROW LEVEL SECURITY POLICIES

-- Enable RLS on new tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- Subscription plans are readable by all authenticated users
CREATE POLICY "Subscription plans are viewable by all users" ON subscription_plans
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can only see their own subscription data
CREATE POLICY "Users can view their own subscription" ON user_subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own usage" ON user_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own payment history" ON payment_history
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all data (for Stripe webhooks, etc.)
CREATE POLICY "Service role can manage subscriptions" ON user_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage usage" ON user_usage
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage payments" ON payment_history
    FOR ALL USING (auth.role() = 'service_role');

-- 10. CREATE TRIGGERS FOR AUTOMATIC UPDATES

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at 
    BEFORE UPDATE ON subscription_plans 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at 
    BEFORE UPDATE ON user_subscriptions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_usage_updated_at 
    BEFORE UPDATE ON user_usage 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration Complete
-- ===================================================== 