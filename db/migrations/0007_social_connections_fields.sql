-- Add fields for Twitter and Instagram connections
-- Twitter needs: user_id, username
-- Instagram needs: instagram_business_account_id, username

ALTER TABLE social_connections ADD COLUMN external_user_id TEXT;
ALTER TABLE social_connections ADD COLUMN external_username TEXT;

-- external_user_id: Twitter user ID or Instagram Business Account ID
-- external_username: Twitter @handle or Instagram username
