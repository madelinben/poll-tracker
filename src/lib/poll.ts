export type PollKind = "dates" | "options";
/** 0 no, 1 maybe, 2 yes */
export type Answer = 0 | 1 | 2;

export interface Vote {
  name: string;
  answers: Answer[];
}

export interface Poll {
  v: 1;
  title: string;
  kind: PollKind;
  /** yyyy-mm-dd for dates, free text otherwise */
  options: string[];
  votes: Vote[];
}

export interface SavedPoll {
  title: string;
  hash: string;
  updatedAt: string;
}

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromBase64Url = (text: string) =>
  Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

async function pipe(
  bytes: Uint8Array<ArrayBuffer>,
  stream: CompressionStream | DecompressionStream
): Promise<Uint8Array> {
  return new Uint8Array(
    await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()
  );
}

/** Poll to a short URL-safe string: JSON, deflated by the browser, base64url */
export async function encode(poll: Poll): Promise<string> {
  return toBase64Url(
    await pipe(new TextEncoder().encode(JSON.stringify(poll)), new CompressionStream("deflate-raw"))
  );
}

/** Null for anything that is not a poll link (links are untrusted input) */
export async function decode(text: string): Promise<Poll | null> {
  try {
    const raw: unknown = JSON.parse(
      new TextDecoder().decode(
        await pipe(fromBase64Url(text), new DecompressionStream("deflate-raw"))
      )
    );
    if (typeof raw !== "object" || raw === null) return null;
    const p = raw as Partial<Poll>;
    if (
      p.v !== 1 ||
      typeof p.title !== "string" ||
      !Array.isArray(p.options) ||
      !Array.isArray(p.votes)
    )
      return null;
    const n = p.options.length;
    const votes = p.votes.flatMap((v): Vote[] =>
      typeof v?.name === "string" && Array.isArray(v.answers)
        ? [
            {
              name: v.name.slice(0, 30),
              answers: Array.from(
                { length: n },
                (_, i): Answer => (v.answers[i] === 2 ? 2 : v.answers[i] === 1 ? 1 : 0)
              ),
            },
          ]
        : []
    );
    return {
      v: 1,
      title: p.title.slice(0, 80),
      kind: p.kind === "dates" ? "dates" : "options",
      options: p.options.map((o) => String(o).slice(0, 60)).slice(0, 30),
      votes: votes.slice(0, 100),
    };
  } catch {
    return null;
  }
}

/** Add or replace a person's answers (names match case-insensitively) */
export function vote(poll: Poll, v: Vote): Poll {
  const others = poll.votes.filter((x) => x.name.toLowerCase() !== v.name.toLowerCase());
  return { ...poll, votes: [...others, v] };
}

/** Score per option (yes 2, maybe 1); best first ties broken by fewer noes */
export function ranking(
  poll: Poll
): { index: number; yes: number; maybe: number; score: number }[] {
  return poll.options
    .map((_, index) => {
      const answers = poll.votes.map((v) => v.answers[index] ?? 0);
      const yes = answers.filter((a) => a === 2).length;
      const maybe = answers.filter((a) => a === 1).length;
      return { index, yes, maybe, score: yes * 2 + maybe };
    })
    .sort((a, b) => b.score - a.score || b.yes - a.yes || a.index - b.index);
}

export function label(poll: Poll, i: number): string {
  const o = poll.options[i] ?? "";
  return poll.kind === "dates"
    ? new Date(`${o}T12:00:00Z`).toLocaleDateString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })
    : o;
}
