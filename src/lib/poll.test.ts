import assert from "node:assert/strict";
import { test } from "node:test";
import { decode, encode, type Poll, ranking, vote } from "./poll.ts";

const poll: Poll = { v: 1, title: "Five-a-side", kind: "dates", options: ["2026-11-03", "2026-11-04", "2026-11-05"], votes: [] };

test("encode and decode round trip, junk is rejected", async () => {
  const p = vote(poll, { name: "Sam", answers: [2, 1, 0] });
  assert.deepEqual(await decode(await encode(p)), p);
  assert.equal(await decode("not-a-poll"), null);
});

test("vote replaces the same name and ranking prefers yes", () => {
  let p = vote(poll, { name: "Sam", answers: [2, 0, 1] });
  p = vote(p, { name: "sam", answers: [0, 2, 2] });
  p = vote(p, { name: "Jo", answers: [0, 2, 1] });
  assert.equal(p.votes.length, 2);
  assert.deepEqual(ranking(p).map((r) => r.index), [1, 2, 0]);
});
