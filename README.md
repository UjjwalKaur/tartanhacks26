# Root'd
Connecting life signals (sleep, stress, activity, routines) to spending behavior to improve financial and overall wellbeing.

## Why this exists
Most personal finance tools explain what you spent, not why you spent it.

In real life, spending often spikes after:
- poor sleep
- stress
- low physical activity
- disrupted routines
- emotional highs or lows
- social events and convenience decisions

The problem is that these triggers are usually invisible in financial dashboards. When you only see a list of transactions, you miss the underlying patterns that drive behavior, and you repeat them.

Root'd is built to solve that gap by turning scattered life data into a coherent “mosaic” that helps a user understand:
- what’s happening in their life
- how it correlates with spending changes (especially wants spending)
- what small, actionable experiments might reduce overspending while improving wellbeing

This is not about judging purchases. It’s about clarity and control.

---

## The core issue we’re solving
**Goal:** Identify and explain connections between life events or daily signals and increases in spending.

Examples of the kinds of questions we want to answer:
- “Do I spend more on convenience food after short sleep?”
- “Do my stress days correlate with higher wants spending?”
- “Does higher resting heart rate (strain proxy) precede an increase in shopping or delivery?”
- “Are my ‘big spend’ days clustered around certain moods, routines, or weekends?”

Most people already have the data needed to answer these questions, but it lives in separate silos:
- transactions (finance)
- wearable data (health)
- mood or journaling signals (mental wellbeing)

Root'd links them.

---

## How we’re solving it
### 1) Merge multi-domain data into daily “life snapshots”
We normalize and align:
- transactions → daily totals (needs vs wants vs income)
- wearable signals → sleep, exercise, steps, active calories, resting HR
- mood or video sentiment → sentiment score, stress score, dominant emotions

Then we produce daily rows like:
- total spend
- wants spend
- sleep hours
- stress score
- activity minutes

This makes it possible to compare signals across domains on the same timeline.

### 2) Detect “out-of-pattern” days (anomalies) without needing huge datasets
We use robust statistics (median + MAD) to flag unusually high wants-spending days and identify nearby co-signals:
- low sleep
- low exercise
- elevated resting HR
- higher stress

Because early-stage datasets are often small, our thresholds adapt dynamically so the experience still works for demos and MVP testing.

### 3) Explain the “why” with Dedalus
Charts are useful, but many users want a clear explanation.

We generate a structured payload:
- last N days of merged metrics
- correlation and trend highlights
- top anomaly days and their context
- summary cards (simple metrics users can understand quickly)

Then we send that payload to Dedalus to produce:
- an explanation of patterns
- hypotheses about likely triggers
- practical recommendations for next week
- plain-language guidance without medical claims

The goal is an AI coach that can turn analytics into behavior change.

---

## How this improves financial and overall wellbeing
When users can see the relationship between life state and spending, they can intervene earlier.

Instead of:
- “I overspent again”

They get:
- “On days after <6 hours sleep, my wants spending rises. When I add a 20-minute walk, it drops.”

That enables:
- better budgeting that accounts for real human behavior
- fewer stress-driven purchases
- improved routines (sleep, activity, planning meals)
- less guilt and more agency
- healthier financial habits that reinforce healthier daily habits

Financial wellbeing and health are tightly linked. Root'd treats them as connected systems, not separate apps.

---

## Themes and awards alignment

### Most significant innovation crossing at least two fields
Root'd is intentionally multi-domain:

- Finance: transaction categorization, daily spend patterns, needs vs wants analysis
- Healthcare and wellbeing: sleep, activity, resting HR, stress signals from wearables
- Mental health signals: mood and sentiment summaries (video or journaling style inputs)

Most tools stop at one domain. We treat the user’s life as an interconnected system where health and behavior affect financial outcomes.

### Most significant technological innovation that disrupts the status quo
The status quo for personal finance is:
- show transactions
- show budgets
- show month-to-date totals
- maybe suggest generic “cut spending” advice

Root'd disrupts this by:
- explaining behavior drivers, not just outcomes
- using multi-signal inference and anomaly context
- shifting from static dashboards to adaptive, narrative explanations
- delivering personalized “next week experiments” instead of generic tips

This is a move from reporting to coaching.

### Most significant product or business model with societal impact
The societal impact comes from scaling better decision-making.

If users can reduce stress-spending, improve sleep routines, and avoid convenience spending cycles, the downstream effects include:
- reduced financial insecurity
- better mental wellbeing (less guilt, anxiety, and shame loops)
- improved health habits (sleep and activity improvements)
- stronger long-term resilience

This approach can also support:
- employers and wellness programs (optional integrations)
- financial institutions seeking improved outcomes for customers
- preventative health programs where financial stress is a risk factor

At scale, the model helps people stabilize both finances and wellbeing.

### Award for exceptional use of MCPs, local tools, or custom Dedalus tooling
Root'd is designed as a tool-driven pipeline rather than a “chatbot with vibes.”

We use:
- local computation tools for aggregation, correlations, and anomaly scoring
- a structured payload contract to Dedalus for consistent outputs
- a dedicated insights summary API route for clean separation of UI and inference
- extensible “signals” so new data sources can plug into the same pipeline

This makes Dedalus more reliable and testable:
- the model is grounded by computed features
- outputs are explainable and reproducible
- debugging is straightforward because the AI sees an explicit data schema

---

## What’s in this repo (high level)
- Dashboard view with a “life mosaic" layout
- Insights page:
  - charts (trends, stacked spend, scatter relationships)
  - anomaly detection
  - Dedalus-generated explanation
- Mock datasets in `public/mock/` for fast iteration:
  - `transactions.json`
  - `watch_daily.json`
  - `video_sentiment.json`

---

## How it works (data flow)
1) User uploads json files of transaction and watch data
2) Aggregate transactions into daily totals
3) Merge daily spend + watch + sentiment by date
4) Compute:
   - correlations (e.g., sleep vs next-day wants)
   - anomaly days (robust z-score style)
5) Send summary payload to Dedalus for narrative explanation
6) Render:
   - explanation panel
   - charts
   - cards
   - anomaly highlights

---

## Vision
Root'd is building toward a world where personal finance is not separate from life.

Instead of optimizing only dollars, we optimize:
- stability
- energy
- stress
- routines
- long-term health
- and the spending outcomes that follow

If we can help people understand the causes of overspending, we can help them prevent it, gently and sustainably.

---

## Disclaimer
Root'd provides informational insights and behavior suggestions. It does not provide medical advice and should not be used as a diagnostic tool.
