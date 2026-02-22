// Place this file at: src/app/components/MessagingSystem.tsx

import { supabase } from "@/lib/supabaseClient";

/**
 * Creates or reuses a conversation ID for two users about an item.
 * Call this from your item card when user clicks "Message Finder".
 */
export function getConversationId(
  item: { id: string; title: string },
  currentUser: { uid: string; displayName: string },
  otherUser: { uid: string; displayName: string }
): string {
  const participants = [currentUser.uid, otherUser.uid].sort();
  return `${item.id}_${participants.join("_")}`;
}