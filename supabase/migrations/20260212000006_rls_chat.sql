-- RLS for Chat History

ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- 1. chat_sessions
CREATE POLICY "Users can manage own sessions"
  ON public.chat_sessions
  FOR ALL
  USING (auth.uid() = user_id);

-- 2. chat_messages
-- Messages are owned by the session owner.
-- We check session ownership.
CREATE POLICY "Users can manage own messages"
  ON public.chat_messages
  FOR ALL
  USING (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = session_id
      and chat_sessions.user_id = auth.uid()
    )
  );
