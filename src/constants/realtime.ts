/**
 * Shared Realtime channel names. Presence (unlike postgres_changes) is keyed by
 * channel name rather than table — both the judge tracker and the admin subscriber
 * must join the same one.
 */
export const JUDGE_PRESENCE_CHANNEL = "judge-presence";

export type JudgePresencePayload = {
  judgeId: string;
  name: string;
  email: string;
  /** Set when the judge is on /judge/programs/[id]; otherwise they are on the dashboard. */
  programId: string | null;
  onlineAt: string;
};
