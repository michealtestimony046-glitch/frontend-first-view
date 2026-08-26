import { useEffect, useState, type FormEvent } from "react";
import {
  CalendarClock,
  Check,
  CircleAlert,
  MessageSquarePlus,
  Save,
  ShieldCheck,
  UserPlus,
  X,
} from "lucide-react";
import type { AdminAlphaParticipant, AlphaRewardTier } from "@/lib/api-client";

const REWARD_OPTIONS: Array<{
  value: Exclude<AlphaRewardTier, "NONE">;
  label: string;
  description: string;
}> = [
  {
    value: "ALPHA_PARTICIPANT",
    label: "Alpha participant",
    description: "Starter access + unlimited runs for 90 days",
  },
  {
    value: "INTERVIEW_PARTICIPANT",
    label: "Interview participant",
    description: "Starter access + unlimited runs for 90 days + 1 month",
  },
  {
    value: "WINNER",
    label: "Winner",
    description: "Starter access + unlimited runs for 90 days + 2 months",
  },
];

type ParticipantDraft = {
  displayName: string;
  participatedInTesting: boolean;
  tasksCompleted: string;
  importantIssues: string;
  featuresRequested: string;
  likedUseful: string;
  joinedLiveInterview: boolean;
  interviewKeyPoints: string;
  participationQuality: string;
  winnerStatus: boolean;
};

const draftFor = (row?: AdminAlphaParticipant): ParticipantDraft => {
  const participant = row?.alphaParticipant;
  return {
    displayName: participant?.displayName || row?.fullName || "",
    participatedInTesting: participant?.participatedInTesting || false,
    tasksCompleted: participant?.tasksCompleted || "",
    importantIssues: participant?.importantIssues || "",
    featuresRequested: participant?.featuresRequested || "",
    likedUseful: participant?.likedUseful || "",
    joinedLiveInterview: participant?.joinedLiveInterview || false,
    interviewKeyPoints: participant?.interviewKeyPoints || "",
    participationQuality: participant?.participationQuality
      ? String(participant.participationQuality)
      : "",
    winnerStatus: participant?.winnerStatus || false,
  };
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString() : "—");

export function AdminAlphaEventTab({
  rows,
  canManageRewards,
  busyId,
  onGrant,
  onRevoke,
  onSaveParticipant,
  onAddFeedback,
}: {
  rows: AdminAlphaParticipant[];
  canManageRewards: boolean;
  busyId: string | null;
  onGrant: (data: {
    email: string;
    tier: Exclude<AlphaRewardTier, "NONE">;
    startAt?: string;
    reason?: string;
  }) => Promise<void>;
  onRevoke: (grantId: string) => Promise<void>;
  onSaveParticipant: (
    userId: string,
    data: Omit<ParticipantDraft, "participationQuality"> & { participationQuality?: number },
  ) => Promise<void>;
  onAddFeedback: (userId: string, note: string) => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(rows[0]?.id || null);
  const [email, setEmail] = useState("");
  const [tier, setTier] = useState<Exclude<AlphaRewardTier, "NONE">>("ALPHA_PARTICIPANT");
  const [startAt, setStartAt] = useState("");
  const [reason, setReason] = useState("");
  const [draft, setDraft] = useState<ParticipantDraft>(draftFor(rows[0]));
  const [feedback, setFeedback] = useState("");

  const visibleRows = rows.filter((row) => {
    const needle = search.trim().toLowerCase();
    return (
      !needle ||
      row.email.toLowerCase().includes(needle) ||
      (row.fullName || "").toLowerCase().includes(needle)
    );
  });
  const selected = rows.find((row) => row.id === selectedUserId) || visibleRows[0];

  useEffect(() => {
    if (!selected) return;
    setSelectedUserId(selected.id);
    setDraft(draftFor(selected));
    setFeedback("");
  }, [selected]);

  const submitGrant = async (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim() || !canManageRewards) return;
    await onGrant({
      email: email.trim(),
      tier,
      startAt: startAt ? new Date(startAt).toISOString() : undefined,
      reason: reason.trim() || undefined,
    });
    setEmail("");
    setReason("");
    setStartAt("");
  };

  const saveParticipant = async () => {
    if (!selected) return;
    await onSaveParticipant(selected.id, {
      ...draft,
      participationQuality: draft.participationQuality
        ? Number(draft.participationQuality)
        : undefined,
    });
  };

  const submitFeedback = async (event: FormEvent) => {
    event.preventDefault();
    if (!selected || !feedback.trim()) return;
    await onAddFeedback(selected.id, feedback.trim());
    setFeedback("");
  };

  return (
    <div className="space-y-5">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary">
          Private alpha / event operations
        </div>
        <h2 className="mt-2 font-display text-xl font-semibold">Alpha Testing Event</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Staff-only rewards and participant research. Rewards use the central run-limit gate,
          expire automatically, and waive customer charging while retaining measured AI and
          infrastructure cost.
        </p>
      </div>

      <section className="surface-card overflow-hidden">
        <header className="flex items-start gap-3 border-b border-border px-5 py-4">
          <UserPlus className="mt-0.5 h-4 w-4 text-primary" />
          <div>
            <h3 className="font-display text-base font-semibold">Grant a reward by email</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              The current latest public tier snapshot is Starter. Provider capacity, policy safety,
              browser budgets, and the two-queued-run workspace limit still apply.
            </p>
          </div>
        </header>
        <form className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-5" onSubmit={submitGrant}>
          <label className="grid gap-1.5 text-xs text-muted-foreground xl:col-span-2">
            Client email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="participant@example.com"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              required
              disabled={!canManageRewards}
            />
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            Reward level
            <select
              value={tier}
              onChange={(event) => setTier(event.target.value as Exclude<AlphaRewardTier, "NONE">)}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              disabled={!canManageRewards}
            >
              {REWARD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            Starts at (optional)
            <input
              value={startAt}
              onChange={(event) => setStartAt(event.target.value)}
              type="datetime-local"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              disabled={!canManageRewards}
            />
          </label>
          <label className="grid gap-1.5 text-xs text-muted-foreground">
            Reason (optional)
            <input
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Interview cohort"
              className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
              disabled={!canManageRewards}
            />
          </label>
          <div className="flex items-end xl:col-span-5">
            <button
              type="submit"
              disabled={!canManageRewards || busyId === "alpha-grant" || !email.trim()}
              className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
            >
              <UserPlus className="h-3.5 w-3.5" />
              {busyId === "alpha-grant" ? "Granting…" : "Grant reward"}
            </button>
            {!canManageRewards && (
              <span className="ml-3 text-xs text-muted-foreground">
                Only Owner or Operations Admin can grant or revoke rewards.
              </span>
            )}
          </div>
        </form>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]">
        <section className="surface-card overflow-hidden">
          <header className="border-b border-border px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-display text-base font-semibold">Participant directory</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Search by email or name. All records are staff-only.
                </p>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {visibleRows.length} shown
              </span>
            </div>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search email or name"
              className="mt-3 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
            />
          </header>
          <div className="max-h-[38rem] divide-y divide-border overflow-y-auto">
            {visibleRows.length === 0 ? (
              <p className="p-5 text-sm text-muted-foreground">
                No client accounts match this search.
              </p>
            ) : (
              visibleRows.map((row) => (
                <button
                  type="button"
                  key={row.id}
                  onClick={() => setSelectedUserId(row.id)}
                  className={`block w-full px-5 py-4 text-left hover:bg-accent/40 ${selected?.id === row.id ? "bg-primary/5" : ""}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground">
                        {row.fullName || "Unnamed client"}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground">{row.email}</div>
                    </div>
                    {row.activeReward ? (
                      <span className="shrink-0 rounded-full border border-success/30 bg-success/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-success">
                        active reward
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        normal tier
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>
                      {row.alphaParticipant?.participatedInTesting
                        ? "participated"
                        : "not marked participated"}
                    </span>
                    <span>·</span>
                    <span>{row.alphaParticipant?.feedback.length || 0} feedback entries</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        <section className="surface-card overflow-hidden">
          {!selected ? (
            <div className="p-8 text-sm text-muted-foreground">
              Select a client participant to manage the event record.
            </div>
          ) : (
            <>
              <header className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h3 className="font-display text-base font-semibold">
                      {selected.fullName || "Unnamed client"}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selected.email} · account {selected.accountStatus}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {selected.activeReward ? (
                    <>
                      <div className="font-mono uppercase tracking-wider text-success">
                        {selected.activeReward.tier.replaceAll("_", " ")}
                      </div>
                      <div>expires {formatDate(selected.activeReward.expiresAt)}</div>
                      <button
                        type="button"
                        onClick={() => void onRevoke(selected.activeReward!.id)}
                        disabled={
                          !canManageRewards || busyId === `alpha-revoke-${selected.activeReward.id}`
                        }
                        className="mt-2 inline-flex items-center gap-1 rounded-md border border-destructive/30 px-2 py-1 text-[11px] font-medium text-destructive disabled:opacity-40"
                      >
                        <X className="h-3 w-3" />
                        Revoke
                      </button>
                    </>
                  ) : (
                    <div className="font-mono uppercase tracking-wider text-muted-foreground">
                      No active reward
                    </div>
                  )}
                </div>
              </header>
              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1.5 text-xs text-muted-foreground">
                    Name / username
                    <input
                      value={draft.displayName}
                      onChange={(event) => setDraft({ ...draft, displayName: event.target.value })}
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </label>
                  <label className="grid gap-1.5 text-xs text-muted-foreground">
                    Quality rating (1–5)
                    <input
                      value={draft.participationQuality}
                      onChange={(event) =>
                        setDraft({ ...draft, participationQuality: event.target.value })
                      }
                      type="number"
                      min="1"
                      max="5"
                      className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </label>
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-foreground">
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.participatedInTesting}
                      onChange={(event) =>
                        setDraft({ ...draft, participatedInTesting: event.target.checked })
                      }
                    />
                    Participated in testing
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.joinedLiveInterview}
                      onChange={(event) =>
                        setDraft({ ...draft, joinedLiveInterview: event.target.checked })
                      }
                    />
                    Joined live interview
                  </label>
                  <label className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={draft.winnerStatus}
                      onChange={(event) =>
                        setDraft({ ...draft, winnerStatus: event.target.checked })
                      }
                    />
                    Winner status
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {(
                    [
                      ["tasksCompleted", "Tasks completed"],
                      ["importantIssues", "Important issues / complaints"],
                      ["featuresRequested", "Features or improvements requested"],
                      ["likedUseful", "What they liked / found useful"],
                      ["interviewKeyPoints", "Interview key points"],
                    ] as const
                  ).map(([key, label]) => (
                    <label key={key} className="grid gap-1.5 text-xs text-muted-foreground">
                      {label}
                      <textarea
                        value={draft[key]}
                        onChange={(event) => setDraft({ ...draft, [key]: event.target.value })}
                        rows={3}
                        className="resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </label>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void saveParticipant()}
                  disabled={busyId === `alpha-participant-${selected.id}`}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                  {busyId === `alpha-participant-${selected.id}`
                    ? "Saving…"
                    : "Save participant record"}
                </button>
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <MessageSquarePlus className="h-4 w-4 text-primary" />
                    <h4 className="font-display text-sm font-semibold">Feedback history</h4>
                  </div>
                  <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={submitFeedback}>
                    <textarea
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      rows={2}
                      placeholder="Record what the participant said…"
                      className="min-h-12 flex-1 resize-y rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={!feedback.trim() || busyId === `alpha-feedback-${selected.id}`}
                      className="inline-flex h-fit items-center justify-center gap-2 rounded-md border border-primary/30 px-3 py-2 text-xs font-semibold text-primary disabled:opacity-40"
                    >
                      <MessageSquarePlus className="h-3.5 w-3.5" />
                      Add feedback
                    </button>
                  </form>
                  <div className="mt-3 divide-y divide-border">
                    {(selected.alphaParticipant?.feedback || []).map((entry) => (
                      <div key={entry.id} className="py-3 text-xs">
                        <div className="flex items-center justify-between gap-3 text-muted-foreground">
                          <span>{entry.author?.fullName || entry.author?.email || "Staff"}</span>
                          <span>{formatDate(entry.createdAt)}</span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                          {entry.note}
                        </p>
                      </div>
                    ))}
                    {!selected.alphaParticipant?.feedback.length && (
                      <p className="py-3 text-xs text-muted-foreground">No feedback entries yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
        Rewards are not public pricing tiers. They expire automatically, are never self-service, and
        their measured cost remains visible only to staff.
      </div>
    </div>
  );
}
