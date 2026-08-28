# SmartLearn AI — Architecture

Companion to the `spec-*` documents. Those describe the intended design; this
describes what the code actually does after Phase 11.

---

## Layering

```
Route  →  Middleware  →  Controller  →  Service  →  Model / External API
```

- **Route** — path, HTTP method, auth, role, rate limiter, validators.
- **Middleware** — authenticate, authorize, sanitize, rate-limit, validate.
- **Controller** — parse request, call services, shape the response. No business rules.
- **Service** — the domain logic. Reusable, not tied to Express.
- **Model** — Mongoose schemas, indexes, and data-shape validation.

Cross-cutting concerns live in `utils/`: `AppError`, `logger`, `aiGuard`,
`apiResponse`, `queryHelper`, `validate`.

---

## Single sources of truth

Phase 11's main structural change. Each of these facts is now computed in exactly
one place, because duplicated definitions had drifted apart between phases.

| Fact | Owner | Note |
|---|---|---|
| Mastery thresholds & bands | `config/constants.js` | Previously re-declared per service |
| Mastery calculation | `services/mastery.service.js` | The only writer of `masteryScore` |
| Recommendation priority | `services/recommendationService.js` | Imports classification from mastery service |
| Quiz grading | `controllers/quizController.js` | Server-side only |
| AI output shape | `utils/aiGuard.js` | Validates before persistence |
| Error envelope | `middleware/errorHandler.js` | Single exit point |

---

## Mastery

**Canonical bands** (`MASTERY_THRESHOLDS`):

| Level | Score |
|---|---|
| Mastered | ≥ 80 |
| Good | ≥ 60 |
| Needs improvement | ≥ 40 |
| Weak | < 40 |

**Formula:**

```
masteryScore = round(recentScore × 0.6 + lifetimeAccuracy × 0.4)
lifetimeAccuracy = totalCorrect / (totalCorrect + totalIncorrect) × 100
```

Recency is weighted higher so the system adapts, but history prevents one unlucky
attempt from erasing an established standing. Lifetime accuracy is derived from
cumulative correct/incorrect *counts*, not an average of past averages — the
latter over-weights small early sessions.

Every scored activity — diagnostic assessment, practice, formal quiz, AI quiz —
calls `masteryService.recordActivity()`. Nothing else may write mastery fields.

---

## The adaptive loop

```
Assessment / Quiz / Practice
        ↓  recordActivity({ correct, incorrect })
Progress updated  (attemptCount, accuracy, masteryScore, masteryLevel)
        ↓  automatic
Recommendations regenerated  (priority re-ranked)
        ↓  read on demand
Dashboard · Study plan · Teacher analytics
```

Propagation is automatic: `recordActivity` refreshes recommendations itself, so no
page refresh or manual step is required. The refresh is wrapped in try/catch —
a recommendation failure logs a warning but never fails the student's submission,
because losing a quiz score is worse than a stale recommendation.

### Recommendation priority

Base score is `100 − masteryScore`, then:

- recent accuracy more than 10 points below lifetime → **+15** (declining)
- 3+ attempts while still Weak → **+25** (struggling)
- already Mastered → **−50** (retention only)

Top 5 are stored `active`; the previous set is marked `discarded`. Deterministic
and independent of the AI.

### Study plans

`generateDailyStudyPlan` is idempotent per day. An existing plan is **never**
silently regenerated — student progress against items (completed/skipped) must
survive a page refresh. Rebuilding requires an explicit `force`.

---

## Quiz grading

Grading is entirely server-side. The client sends only which option it selected.

`selectedOption` is a **zero-based index** into `question.options`, matching
`Question.correctAnswer`. Phase 11 changed this from option *text*; comparing text
to an index meant nothing could ever score correct.

Submission also:

- ignores duplicate answers for the same question (first wins), so a crafted
  payload cannot inflate a score;
- treats out-of-range indexes as unanswered;
- counts never-submitted questions as unanswered;
- rejects a second submission with `409`, guarding against double-click and retry;
- counts unanswered as incorrect for mastery — the knowledge was not demonstrated.

---

## Analytics definitions

Shared by teacher and admin dashboards so the same metric name means the same
thing in both places.

| Metric | Definition |
|---|---|
| Active student | Activity within the last 7 days (`ANALYTICS.ACTIVE_STUDENT_DAYS`) |
| Average mastery | Mean `Progress.masteryScore` across matched documents |
| Quiz accuracy | `correct / (correct + incorrect + unanswered)` |
| Completed topic | `masteryScore ≥ 60` (`TOPIC_COMPLETION_MASTERY`) |
| Mastered topic | `masteryScore ≥ 80` |

---

## AI boundary

The AI is a text generator, not an authority. It never determines
authorization, scores, mastery, publication state, or roles.

```
User input → sanitizePrompt() → provider → validateGeneratedBatch() → DB (unpublished)
                                                                          ↓
                                                        Teacher/admin review → publish
```

`ai.provider.js` is the only module that touches the API key. Provider errors are
logged there and re-thrown as generic messages; the controller converts them to a
`503` with a friendly note that learning progress is unaffected.

Fresh mastery is fetched per request, so the tutor never reasons from a stale
score after the student has improved.

---

## Data integrity

Historical records must stay interpretable after content changes:

- `QuizAttempt.quizTitleSnapshot` preserves the title at submission time.
- `totalQuestions` is snapshotted, so editing a quiz later does not retroactively
  change an old percentage.
- Content is unpublished/archived rather than hard-deleted where possible.

---

## Performance

- List endpoints use `.select()` projections and exclude large arrays
  (`answers`, `messages`, `questions`).
- List endpoints paginate with a capped `limit` (`PAGINATION.MAX_LIMIT = 100`).
- Read-only paths use `.lean()` to skip Mongoose document hydration.
- Indexes reflect real query patterns rather than being added per-field
  speculatively.

**Not measured.** No profiling or load testing was performed in Phase 11; these
are structural improvements, not verified wins.
