-- Backfill metadata for old challenge notifications
UPDATE notifications
SET metadata = jsonb_set(
  COALESCE(metadata, '{}'),
  '{challenge_id}',
  to_jsonb(challenges.id)
)
FROM challenges
WHERE notifications.type = 'challenge_received'
  AND notifications.metadata IS NOT NULL
  AND notifications.metadata->>'challenge_id' IS NULL
  AND notifications.metadata->>'challenger_id' = challenges.challenger_id::text
  AND notifications.metadata->>'challenged_id' = challenges.challenged_id::text;