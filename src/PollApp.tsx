import { ArrowLeft, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Create } from "./components/Create";
import { PollView } from "./components/PollView";
import { decode, encode, type Poll, type SavedPoll } from "./lib/poll";
import { load, save } from "./lib/storage";

const KEY = "poll-tracker";
const PREFIX = "#poll=";

/** Polls live in the URL hash so a link carries every answer; this browser remembers the latest links */
export function PollApp() {
  const [poll, setPoll] = useState<Poll | null>(null);
  const [link, setLink] = useState("");
  const [saved, setSaved] = useState<SavedPoll[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  // Read the link once on mount: the hash and localStorage only exist in the browser.
  useEffect(() => {
    setSaved(load<SavedPoll[]>(KEY, []));
    const hash = window.location.hash;
    if (!hash.startsWith(PREFIX)) return setReady(true);
    decode(hash.slice(PREFIX.length)).then((p) => {
      if (p) {
        setPoll(p);
        setLink(window.location.href);
      } else setError("That poll link is broken or incomplete. Ask for the latest link.");
      setReady(true);
    });
  }, []);

  async function publish(p: Poll) {
    const hash = PREFIX + (await encode(p));
    const url = new URL(window.location.href);
    url.hash = hash;
    window.history.replaceState(null, "", url);
    setPoll(p);
    setLink(url.toString());
    const next = [{ title: p.title, hash, updatedAt: new Date().toISOString() }, ...saved.filter((s) => s.title !== p.title)].slice(0, 20);
    setSaved(next);
    save(KEY, next);
  }

  async function open(s: SavedPoll) {
    const p = await decode(s.hash.slice(PREFIX.length));
    if (!p) return;
    const url = new URL(window.location.href);
    url.hash = s.hash;
    window.history.replaceState(null, "", url);
    setPoll(p);
    setLink(url.toString());
  }

  function close() {
    const url = new URL(window.location.href);
    url.hash = "";
    window.history.replaceState(null, "", url);
    setPoll(null);
  }

  if (!ready) return <div className="h-full animate-pulse bg-slate-100" />;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-2xl flex-col gap-5 p-4">
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-800 ring-1 ring-rose-200">
            {error}
          </p>
        )}
        {poll ? (
          <>
            <button type="button" onClick={close} className="inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold text-fuchsia-900 underline hover:no-underline">
              <ArrowLeft size={16} aria-hidden="true" /> New poll
            </button>
            <PollView key={link} poll={poll} link={link} onVote={publish} />
          </>
        ) : (
          <>
            <Create onCreate={publish} />
            {saved.length > 0 && (
              <section aria-labelledby="saved-h" className="flex flex-col gap-2">
                <h2 id="saved-h" className="text-lg font-extrabold">
                  Your recent polls
                </h2>
                <ul className="flex flex-col gap-1">
                  {saved.map((s) => (
                    <li key={s.hash} className="flex items-center gap-2 rounded-xl bg-white pr-1 ring-1 ring-slate-200">
                      <button type="button" onClick={() => open(s)} className="min-h-12 flex-1 rounded-xl px-3 text-left font-semibold hover:bg-slate-50">
                        {s.title}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const next = saved.filter((x) => x.hash !== s.hash);
                          setSaved(next);
                          save(KEY, next);
                        }}
                        aria-label={`Forget ${s.title}`}
                        className="grid size-11 place-items-center rounded-xl text-slate-500 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 size={16} aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
