-- Update the send_push_notification function to call the edge function
CREATE OR REPLACE FUNCTION send_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  subscription_record RECORD;
BEGIN
  -- For each subscription for the user, send a push notification
  FOR subscription_record IN 
    SELECT subscription 
    FROM push_subscriptions 
    WHERE user_id = NEW.user_id
  LOOP
    -- Call the edge function to send the push notification
    PERFORM net.http_post(
      url := 'https://qtcvtyakpxaxabxwbwsw.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claim.sub', true)
      ),
      body := jsonb_build_object(
        'subscription', subscription_record.subscription::jsonb,
        'notification', jsonb_build_object(
          'title', NEW.title,
          'body', NEW.content,
          'icon', '/logo192.png',
          'badge', '/notification-badge.png',
          'data', jsonb_build_object(
            'url', '/notifications',
            'notification_id', NEW.id
          )
        )
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
