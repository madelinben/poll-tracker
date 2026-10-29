import { Check, CircleHelp, Copy, Share2, X } from "lucide-react";
import { useState } from "react";
import { type Answer, label, type Poll, ranking, vote } from "../lib/poll";
import { card, field, ghost, primary } from "./ui";

const ANSWERS = [
  { value: 2, text: "Yes", Icon: Check, on: "has-checked:bg-emerald-700 has-checked:ring-emerald-700" },
  { value: 1, text: "Maybe", Icon: CircleHelp, on: "has-checked:bg-amber-600 has-checked:ring-amber-600" },
  { value: 0, text: "No", Icon: X, on: "has-checked:bg-slate-700 has-checked:ring-slate-700" },
] as const;

const CELL = {
  2: { Icon: Check, text: "yes", style: "bg-emerald-100 text-emerald-900" },
  1: { Icon: CircleHelp, text: "maybe", style: "bg-amber-100 text-amber-900" },
  0: { Icon: X, text: "no", style: "bg-slate-100 text-slate-500" },
} satisfies Record<Answer, unknown>;

interface Props {
  poll: Poll;
  link: string;
  onVote: (p: Poll) => void;
}

export function PollView({ poll, link, onVote }: Props) {
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState<Answer[]>(poll.options.map(() => 0));
  const [status, setStatus] = useState("");
  const top = ranking(poll)[0];
  const best = top && top.score > 0 ? top.index : -1;

  async function share() {
    try {
      if (navigator.share) await navigator.share({ title: poll.title, url: link });
      else {
        await navigator.clipboard.writeText(link);
        setStatus("Link copied. Paste it in the group chat.");
      }
    } catch {}
  }

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-2xl font-extrabold">{poll.title}</h2>

      <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-slate-200">
        <table className="w-full text-sm">
          <caption className="sr-only">Answers so far</caption>
          <thead>
            <tr className="bg-slate-50 text-slate-700">
              <th scope="col" className="px-3 py-2 text-left">{poll.kind === "dates" ? "Date" : "Option"}</th>
              {poll.votes.map((v) => (
                <th key={v.name} scope="col" className="px-2 py-2 font-semibold">{v.name}</th>
              ))}
              <th scope="col" className="px-3 py-2 text-right">Yes</th>
            </tr>
          </thead>
          <tbody>
            {poll.options.map((_, i) => (
              <tr key={poll.options[i]} className={`border-t border-slate-100 ${i === best ? "bg-fuchsia-50" : ""}`}>
                <th scope="row" className="px-3 py-2 text-left font-semibold">
                  {label(poll, i)}
                  {i === best && <span className="ml-2 rounded-full bg-fuchsia-800 px-2 py-0.5 text-xs text-white">best</span>}
                </th>
                {poll.votes.map((v) => {
                  const c = CELL[v.answers[i] ?? 0];
                  return (
                    <td key={v.name} className="px-2 py-1 text-center">
                      <span className={`inline-grid size-8 place-items-center rounded-lg ${c.style}`}>
                        <c.Icon size={16} aria-hidden="true" />
                        <span className="sr-only">{c.text}</span>
                      </span>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right font-bold tabular-nums">{poll.votes.filter((v) => v.answers[i] === 2).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onVote(vote(poll, { name: name.trim().slice(0, 30), answers }));
          setStatus("Saved. Share the updated link so everyone sees your answers.");
        }}
        className={`${card} flex flex-col gap-3`}
      >
        <h3 className="text-lg font-extrabold">Add your answers</h3>
        <label className="flex flex-col gap-1 text-sm font-semibold">
          Your name
          <input value={name} onChange={(e) => setName(e.target.value)} className={field} required />
        </label>
        {poll.options.map((_, i) => (
          <fieldset key={poll.options[i]} className="flex flex-wrap items-center gap-2">
            <legend className="mb-1 w-full text-sm font-semibold">{label(poll, i)}</legend>
            {ANSWERS.map((a) => (
              <label key={a.value} className={`flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl text-sm font-semibold ring-1 ring-slate-300 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-fuchsia-800 ${a.on}`}>
                <input
                  type="radio"
                  name={`answer-${i}`}
                  checked={answers[i] === a.value}
                  onChange={() => setAnswers(answers.map((x, j) => (j === i ? a.value : x)))}
                  className="sr-only"
                />
                <a.Icon size={14} aria-hidden="true" /> {a.text}
              </label>
            ))}
          </fieldset>
        ))}
        <button type="submit" className={primary}>
          Save my answers
        </button>
      </form>

      <div className={`${card} flex flex-col gap-2`}>
        <p className="text-sm text-slate-700">
          No sign-up and nothing stored on a server: the answers live in the link. Share the latest link after answering.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={share} className={primary}>
            <Share2 size={16} aria-hidden="true" /> Share link
          </button>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(link);
                setStatus("Link copied.");
              } catch {}
            }}
            className={ghost}
          >
            <Copy size={16} aria-hidden="true" /> Copy link
          </button>
        </div>
        <p role="status" className="text-sm font-semibold text-emerald-800 empty:hidden">
          {status}
        </p>
      </div>
    </div>
  );
}
