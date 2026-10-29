import { CalendarDays, ListChecks, Plus, X } from "lucide-react";
import { useState } from "react";
import type { Poll, PollKind } from "../lib/poll";
import { card, field, primary } from "./ui";

export function Create({ onCreate }: { onCreate: (p: Poll) => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<PollKind>("dates");
  const [options, setOptions] = useState<string[]>([]);
  const [draft, setDraft] = useState("");

  function addOption(e: React.FormEvent) {
    e.preventDefault();
    const o = draft.trim().slice(0, 60);
    if (!o || options.includes(o) || options.length >= 30) return;
    setOptions(kind === "dates" ? [...options, o].sort() : [...options, o]);
    setDraft("");
  }

  return (
    <section aria-labelledby="create-h" className={`${card} flex flex-col gap-4`}>
      <h2 id="create-h" className="text-xl font-extrabold">
        New poll
      </h2>
      <label className="flex flex-col gap-1 text-sm font-semibold">
        Question
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="When can everyone do five-a-side?"
          className={field}
          required
        />
      </label>
      <fieldset className="flex gap-2">
        <legend className="mb-1 text-sm font-semibold">Choosing</legend>
        {(
          [
            ["dates", "Dates", CalendarDays],
            ["options", "Options", ListChecks],
          ] as const
        ).map(([id, text, Icon]) => (
          <label
            key={id}
            className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl text-sm font-semibold ring-1 ring-slate-300 has-checked:bg-fuchsia-800 has-checked:text-white has-focus-visible:outline-2 has-focus-visible:outline-fuchsia-800"
          >
            <input
              type="radio"
              name="kind"
              checked={kind === id}
              onChange={() => {
                setKind(id);
                setOptions([]);
              }}
              className="sr-only"
            />
            <Icon size={16} aria-hidden="true" /> {text}
          </label>
        ))}
      </fieldset>
      <form onSubmit={addOption} className="flex gap-2">
        <label htmlFor="option" className="sr-only">
          {kind === "dates" ? "Add a date" : "Add an option"}
        </label>
        <input
          id="option"
          type={kind === "dates" ? "date" : "text"}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Bowling, climbing, pub quiz…"
          className={`${field} flex-1`}
        />
        <button type="submit" className={primary}>
          <Plus size={16} aria-hidden="true" /> Add
        </button>
      </form>
      {options.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {options.map((o) => (
            <li
              key={o}
              className="flex items-center gap-1 rounded-full bg-fuchsia-50 py-1 pl-3 pr-1 text-sm font-semibold text-fuchsia-900 ring-1 ring-fuchsia-200"
            >
              {o}
              <button
                type="button"
                onClick={() => setOptions(options.filter((x) => x !== o))}
                aria-label={`Remove ${o}`}
                className="grid size-8 place-items-center rounded-full hover:bg-fuchsia-100"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        disabled={!title.trim() || options.length < 2}
        onClick={() =>
          onCreate({ v: 1, title: title.trim().slice(0, 80), kind, options, votes: [] })
        }
        className={primary}
      >
        Create poll with {options.length} {kind === "dates" ? "dates" : "options"}
      </button>
    </section>
  );
}
