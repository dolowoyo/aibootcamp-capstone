# Fixture generation prompt — STARS diagnosis scenarios

Per `docs/constitution.md` principle VII (fabricated data only, prompt committed beside it).

**Prompt used to fabricate `startup.json`, `turnaround.json`,
`blended-turnaround-realignment.json`, and `thin-ambiguous.json`:**

> Write four short, first-person role-intake narratives (80-400 words each) for a fictional
> new leader describing the situation they've just stepped into, for use as canned test
> fixtures standing in for an LLM's STARS classification (Watkins' *The First 90 Days*:
> Startup, Turnaround, Accelerated Growth, Realignment, Sustaining Success). No real company,
> person, or statistic — everything fabricated. For each narrative, also produce: a dominant
> STARS type, an optional secondary type (only for the blended one), a confidence level (low/
> medium/high), a one-paragraph rationale that quotes or closely paraphrases specific language
> from the narrative itself (never generic boilerplate), and 2 evidence excerpts that are
> *exact, literal substrings* of the narrative. One narrative must be unambiguously Startup
> (building something from nothing). One must be unambiguously Turnaround (reversing a
> demonstrable decline). One must give comparable evidentiary weight to two types at once
> (Turnaround + Realignment) so a blend is the honest read. One must be generic onboarding
> language with no distinguishing signal for any type, to exercise the low-confidence,
> limited-evidence fallback path.

All four scenario files below were authored directly against this prompt's brief; no real
person, company, or dataset was used or referenced.
