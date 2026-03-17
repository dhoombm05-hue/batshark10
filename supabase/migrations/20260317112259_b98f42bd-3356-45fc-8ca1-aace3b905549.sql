-- Allow conversation participants to update is_read on messages in their conversations
DROP POLICY IF EXISTS "Sender can update own messages" ON private_messages;

CREATE POLICY "Participants can update messages in own conversations"
ON private_messages FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM private_conversations c
    WHERE c.id = private_messages.conversation_id
    AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
  )
);