# SmartLearn AI — Technical Specification
## Section 8: Smart Learning Algorithm

---

## 8.1 Mastery Score Calculation

Each student has one **Progress** document per topic. The `masteryScore` (0–100) is recalculated after every quiz attempt using a weighted formula:

```
masteryScore = (
  0.50 * recentQuizScore       +   // most recent quiz (highest weight)
  0.30 * rollingAverageScore   +   // average of last N quizzes
  0.20 * diagnosticScore           // initial diagnostic (anchor)
)
```

**Adjustments:**
- **Difficulty multiplier**: Hard quiz score × 1.1, Easy quiz score × 0.9 (capped at 100).
- **Recency decay**: Scores older than 14 days contribute with 80% weight.
- **Attempt count bonus**: After ≥ 3 attempts with consistent improvement, add +3 pts (confidence signal).

---

## 8.2 Mastery Levels

| Level | Score Range | Label | Action |
|---|---|---|---|
| **Mastered** | 80–100 | 🟢 Mastered | Move to next topic |
| **Good** | 60–79 | 🟡 Good | Optional revision, proceed |
| **Needs Improvement** | 40–59 | 🟠 Needs Improvement | Recommend 1 re-quiz + resources |
| **Weak** | 0–39 | 🔴 Weak | Force revisit — resources + quiz before proceeding |

These thresholds are **admin-configurable** via the Settings collection (see Section 5).

---

## 8.3 Weak Topic Detection

```
Algorithm: detectWeakTopics(studentId, courseId)

1. Load all Progress docs for student in course.
2. Filter where masteryLevel IN ['weak', 'needs_improvement'].
3. Sort by masteryScore ASC (lowest first = highest priority).
4. Return ranked list with: topicId, masteryScore, masteryLevel, lastAttemptAt.
```

**Edge cases:**
- Topics never attempted get `masteryScore = 0` (treated as Weak until assessed).
- Topics with `masteryScore = null` (not yet assessed) are scheduled for diagnostic.

---

## 8.4 Topic Priority Engine

Priority is calculated as a composite score:

```
priority = (
  (100 - masteryScore) * 0.5    // lower mastery = higher priority
  + prerequisitePenalty * 0.3   // blocked topics penalize dependents
  + daysSinceAttempt * 0.2      // older attempt = needs refreshing
)
```

Topics are sorted by priority descending to build the study plan task queue.

---

## 8.5 Next-Topic Recommendation Logic

```
Algorithm: recommend(studentId, courseId)

IF any topic.masteryLevel == 'weak':
    return { topic: weakest_topic, reason: 'weak' }

ELSE IF any topic.masteryLevel == 'needs_improvement':
    return { topic: lowest_ni_topic, reason: 'revision' }

ELSE IF all topics in subject are mastered:
    return { topic: first_unstarted_topic_in_next_subject, reason: 'next' }

ELSE:
    return { topic: next_sequential_topic_with_lowest_mastery, reason: 'next' }
```

**Conditions for "Mastered" progression:**
- `masteryScore >= masteryThreshold` (default 80, admin-configurable)
- At least 1 quiz attempt completed

---

## 8.6 Revision Recommendation

Revision is triggered when:
- `masteryScore >= 80` but `lastAttemptAt < NOW - 7 days` (spaced repetition signal).
- Logic: Surface 1 previously-mastered topic per study session for review.

---

## 8.7 Study Plan Generation

```
Input: courseId, dailyStudyMinutes, targetDate, currentMastery[]

1. Detect all topics needing attention (weak + needs_improvement + unstarted).
2. Sort by priority engine output.
3. Estimate time per topic:
   - Weak: estimatedMinutes * 1.5 (extra time)
   - Needs Improvement: estimatedMinutes
   - Unstarted: estimatedMinutes
4. Bin tasks into daily slots respecting dailyStudyMinutes.
5. Insert revision tasks every 5 days (spaced repetition).
6. Save as StudyPlan document.
```

For AI-assisted generation: pass the priority list + student profile to the AI prompt service, which enriches with contextual pacing (see Section 9).

---

## 8.8 ML Upgrade Path

The algorithm is designed for drop-in replacement:

| Current (Rule-based) | Future (ML) |
|---|---|
| Weighted formula | Learned weights from student cohort data |
| Hard thresholds | Probabilistic mastery estimation (IRT / BKT) |
| Sequential recommendation | Reinforcement learning reward on engagement |
| Revision on 7-day gap | Adaptive spaced repetition (SM-2 algorithm) |

All mastery and recommendation outputs go through `RecommendationService` — switching to an ML model requires only updating that service without changing the API or frontend.
