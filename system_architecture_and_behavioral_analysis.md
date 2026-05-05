# PlayTrace: Behavioral Decision System Architecture & Analysis

## SECTION 1 — SYSTEM OVERVIEW

PlayTrace is a full-stack behavioral decision system designed to observe, measure, and analyze human decision-making under simulated pressure. Unlike traditional surveys that ask users how they *would* behave, this system forces users to make consecutive, state-dependent choices with immediate consequences. The core problem it solves is bridging the gap between stated intent and actual behavior by using interaction design—time pressure, resource tradeoffs, and risk calibration—as a behavioral measurement tool.

The end-to-end flow of the system is strictly structured:
1. **Onboarding:** Establishes context, collects baseline participant data (e.g., background, hours spent gaming), and obtains explicit consent. This phase sets the psychological tone of the simulation.
2. **Decisions:** Users navigate through a branching narrative of 10 scenarios. Each scenario requires selecting an intent (the "what") and calibrating the risk/intensity (the "how"), all while managing passive time decay and tracking systemic resource metrics (Stability, Coherence, Buffer).
3. **Logging:** Every interaction, including hesitation time on the calibration dial and ultimate decision commitments, is asynchronously streamed to a backend database.
4. **Metrics:** The system calculates real-time system metrics (to drive the simulation state) and post-session behavioral profiles (to evaluate the user).
5. **Dashboard:** Users receive an immediate, detailed psychological profile breakdown ("Steady Strategist", "Risk Taker", etc.) accompanied by data visualizations of their session.
6. **Feedback:** A low-friction inline mechanism collects user sentiment about the accuracy of their generated profile, creating a ground-truth validation loop.

## SECTION 2 — FRONTEND MECHANICS

The frontend is a React-based application that emphasizes a state-driven, step-based decision engine.

### Step-Based Decision System & Branching Logic
The interaction loop is driven by `ScenarioEngine.tsx`. Rather than hardcoding linear transitions, the engine relies on a centralized `SCENARIO_MAP` and `getNextScenarioId` function. When a user commits to an action:
- The system checks if the `Action` contains an explicit `next` branch target.
- If no explicit branch is defined, it falls back to a linear progression (`ORDERED_IDS`).
- If no further scenarios exist, the session resolves and transitions to the dashboard.
This directed-graph approach allows for dynamic consequences, such as "Pattern Breaker" stochastic events or high-priority interrupt scenarios, without breaking the underlying architecture.

### State Management
The system eschews complex external state libraries for a tightly controlled React Context + Reducer (`EngineStateProvider` in `stateManager.tsx`):
- **`currentScenario`**: An index tracking the user's progress.
- **`history`**: An append-only array of `DecisionRecord` objects containing pre- and post-decision metrics, decision latency, and raw risk calibrations.
- **`metrics`**: The real-time systemic state (Stability, Trust/Coherence, Buffer).
The `EngineState` acts as the single source of truth, dictating UI rendering, time limit adaptations, and scenario text formatting. 

### How Decisions Are Captured
A decision is not merely a click. It is captured as a multi-dimensional `DecisionRecord`. 
When a user selects an action, they must use a slider to calibrate risk (0 to 100%). The `commitDecision` function measures:
- `decisionTimeMs`: Total time taken from scenario render to commit.
- `hesitationMs`: The time between first touching the calibration dial and finalizing the commit.
- `pressure`: The ratio of remaining time when the decision was executed.
- `tags`: Semantic behavioral markers attached to the chosen action (e.g., `["ethical", "cautious"]`).

### UI Design and Behavioral Influence
- **Timers:** A passive decay interval aggressively counts down, visually changing colors (from neutral to amber to red) as time dwindles. This enforces cognitive load.
- **Sliders:** Forcing a two-step "Select Intent -> Calibrate Execution" flow breaks automatic responses. The slider requires deliberate fine-motor input, capturing hesitation and revealing confidence gaps.
- **Wording:** Interface text avoids gamified language ("Health", "Score") in favor of sterile, high-stakes terminology ("Structural Integrity", "Buffer Capital", "Commit"), priming the user for serious deliberation.

## SECTION 3 — BACKEND ARCHITECTURE

The backend utilizes Vercel Serverless Functions built with TypeScript to provide a highly scalable, stateless API layer. 

### API Endpoints
- **`/api/start-session`**: Generates a unique `sessionId` (UUID) and inserts an initial record into the database. This creates the relational anchor for all subsequent events.
- **`/api/log-decision`**: A high-frequency endpoint that receives lightweight `DecisionLogEntry` payloads (stepId, choice, tags, timestamp) and stores them individually.
- **`/api/submit-feedback`**: Captures user ratings and qualitative context regarding their dashboard profile.
- **`/api/get-results`**: Aggregates the raw events for a specific `sessionId` into high-level behavioral scores (riskScore, ethicsScore, consistencyScore).

### Request/Response Flow & Serverless Rationale
The application fires asynchronous `POST` requests to `/api/log-decision` in the background (fire-and-forget) to ensure the user's UI thread is never blocked by network latency. 
Serverless architecture is uniquely suited for this system because the workload is highly bursty. A single user generates a rapid succession of API calls over 8 minutes, followed by silence. Serverless scales instantly to handle concurrent session bursts without the overhead of maintaining a persistent, idle Node.js server.

## SECTION 4 — DATABASE DESIGN (MongoDB)

The data layer uses MongoDB, leveraging its schema-less flexibility to store rich, nested telemetry data.

### Collections
1. **`sessions`**: Stores the `sessionId` and the initialization timestamp.
2. **`events`**: The core telemetry store. Every individual decision, interrupt, and interaction is saved as a discrete document.
3. **`feedback`**: Stores post-session validation ratings tied to the `sessionId`.

### Architecture Rationale
**Individual Event Storage vs. Aggregation:** 
Events are stored as individual documents rather than pushing them into an array within the `sessions` document. This design choice prevents document size limits and avoids costly atomic array updates (`$push`) under high concurrency. More importantly, it unlocks advanced timeseries analysis. 
Because `sessionId` serves as the foreign key linking `sessions`, `events`, and `feedback`, researchers can easily query "all 'cautious' tagged events across all sessions where feedback was highly rated" or reconstruct the exact timeline of a single user's session event-by-event.

## SECTION 5 — DATA PIPELINE

1. **User Action:** The user finalizes a slider position and clicks "Commit".
2. **State Update & Async Dispatch:** The frontend reducer immediately updates the local `EngineState`. Concurrently, `commitDecision` invokes `logDecision()`, issuing a non-blocking `fetch` to `/api/log-decision`.
3. **Database Write:** The Vercel serverless function connects to MongoDB (using a cached `clientPromise` to prevent connection exhaustion) and inserts the document into the `events` collection.
4. **Semantic Tagging:** Each logged event contains `tags` (e.g., `["risk", "selfish"]`). These tags abstract the specific UI choice into universal behavioral markers, allowing the pipeline to analyze behavior across entirely different scenarios.
5. **Raw Data Preservation:** The database stores exact timestamps, raw tag arrays, and unmutated decision IDs. By deferring aggregation to the read phase (`/api/get-results` or post-processing scripts), the system ensures that if the mathematical models for calculating "Risk" or "Ethics" change in the future, the historical data remains perfectly valid and re-processable.

## SECTION 6 — METRICS ENGINE

The system computes metrics at two levels: real-time gameplay metrics and post-session behavioral profiling.

### Computation Logic
The backend `/api/get-results` processes the raw event stream into normalized scores:
- **`riskScore`**: The ratio of events tagged "risk" to total events.
- **`ethicsScore`**: A comparative ratio of "ethical" vs. "selfish" tagged choices.
- **`consistencyScore`**: A binary or spectrum evaluation determining if the dominant behavioral pattern in the first half of the session matches the second half.

The frontend (`metricsCalculator.ts`) runs a more complex heuristic model:
- **Risk Preference & Variance**: Calculates the mean risk slider value and its standard deviation (variance).
- **Adaptability**: Uses Pearson Correlation between escalating time pressure and risk levels. If risk increases as pressure increases, adaptability is high.
- **Confidence Gap**: Computes the ratio of `hesitationMs` (fiddling with the dial) to total `decisionTimeMs`.

### Trade-offs: Ratios and Simple Scoring
Ratios (e.g., `ethicalCount / (ethicalCount + selfishCount)`) are used because they normalize data regardless of how many scenarios a user actually completed (accounting for drop-offs). 
**Limitations:** Simple scoring risks flattening complex behaviors. A user who makes 5 aggressively selfish choices and 5 aggressively ethical choices might average out to a 0.5 `ethicsScore`, appearing identical to a user who made 10 neutral choices. The mathematical simplicity guarantees fast computation but sacrifices the nuance of bimodality.

## SECTION 7 — CLASSIFICATION LOGIC

The `metricsCalculator.ts` distills complex metrics into a human-readable `BehaviorProfile` (e.g., "Steady Strategist", "Risk Taker").

### Threshold-Based Mapping
The system uses cascading `if/else` thresholds prioritizing extremes. 
For example, if the ratio of "risk" + "selfish" tags exceeds 40%, or if the raw risk calibration is high (>58%) and decision time is fast (<5000ms), they are classified as a "Risk Taker". If consistency is very high (>72%), conflict is low, and no extreme tags dominate, they become a "Steady Strategist".

### Clustering Issues
Threshold-based systems often suffer from gravity wells—if thresholds are slightly miscalibrated, 80% of users might fall into "Balanced Operator" or "Steady Strategist" simply by regressing to the mean. 
**Improving Differentiation:** To prevent clustering, the system could adopt K-Means clustering or percentile-based ranking (e.g., "You took more risks than 85% of users") instead of static numerical thresholds. Additionally, analyzing the *sequence* of tags (Markov chains) rather than just the aggregate count would provide deeper separation between user types.

## SECTION 8 — BEHAVIORAL THEORY

PlayTrace is rooted in the idea that observed behavior under constraint is more accurate than self-reported intent.

### Core Theoretical Pillars
- **Revealed Preference:** By forcing tradeoffs (e.g., increasing System Stability at the cost of Trust), the system measures what the user inherently values most when they cannot have everything.
- **Risk vs. Safety:** Risk is measured not just by narrative choice, but by the physical calibration of the slider. Extreme values represent overconfidence; middle values represent hedging.
- **Ethics vs. Self-Interest:** Scenarios are designed to pit immediate, localized success against broader, systemic ethical considerations, mirroring real-world corporate or operational dilemmas.
- **Consistency Over Time:** True behavioral mapping requires seeing if a user's moral framework holds up as system resources deplete. A user who is "Ethical" at 100% Buffer but "Selfish" at 10% Buffer is highly adaptable and pressure-sensitive.

### Context and Cognitive Load
Narrative framing directly alters behavior. Indirect, soft wording allows users to rationalize selfish behavior. Sterile, direct wording forces them to confront the reality of their choice. 
Furthermore, the passive time decay artificially induces **Cognitive Load**. As the timer drains, executive function decreases, and users revert to baseline heuristics—instinctive behavior rather than calculated posturing.

## SECTION 9 — UX AS MEASUREMENT

In this system, the User Interface is the scientific instrument. 

- **Timers:** The visual shift of the timer bar from green to amber to red acts as a psychological stressor. It tests whether the user's risk calibration changes when they feel rushed.
- **Sliders:** The calibration dial is a continuous measurement tool. Capturing *when* the user touches the dial vs. *when* they commit provides a quantifiable metric for "Hesitation". A user who selects an intent in 1 second but spends 6 seconds adjusting the dial is experiencing high internal conflict.
- **Wording:** The austere, terminal-like typography and layout force a serious, analytical posture. 
If the UX is poorly designed (e.g., laggy sliders, unclear text), the data is poisoned. A high `decisionTimeMs` might reflect confusion rather than deep deliberation. Subtle changes—like making the slider default to 50% vs 0%—can introduce anchoring bias.

## SECTION 10 — LIMITATIONS

A rigorous assessment requires acknowledging systemic blind spots:
1. **Anchoring Bias:** Because the risk slider defaults to 50% (Balanced), users experiencing high cognitive load or fatigue will naturally default to the center, falsely inflating the "Steady Strategist" classification.
2. **Artificial Stakes:** No matter the narrative severity, the user ultimately knows it is a simulation. The physiological response to simulated pressure is a fraction of real-world stakes.
3. **Data Unreliability:** `decisionTimeMs` assumes the user is actively staring at the screen. If a user receives a text message during a scenario, their decision time spikes, falsely suggesting "Cautious Analysis" or "Hesitation".
4. **Interpretation Breakage:** The correlation between "fast decision + high risk" and "recklessness" is an assumption. It could equally represent "extreme domain expertise and high confidence."

## SECTION 11 — IMPROVEMENTS

To evolve the system into a more rigorous analytical tool, several architectural and conceptual improvements are necessary:

1. **Better Metrics:** Implement dynamic baselining. Instead of static thresholds (e.g., >5000ms is "slow"), compare user decision times against the global moving average for that specific scenario.
2. **Advanced Classification:** Replace static cascading `if` statements with a lightweight machine learning model (e.g., a Random Forest classifier) trained on validated user feedback to identify complex, non-linear behavioral archetypes.
3. **Improved Scenario Design:** Introduce "Trap" scenarios—choices that seem obviously correct but have hidden, delayed consequences—to test long-term strategic foresight versus short-term gratification. 
4. **Validation Mechanics:** Expand the `ParticipantClassifier` to collect a standard psychometric baseline (e.g., a mini Big Five personality inventory) before the session. This would allow the system to statistically correlate the observed simulation data against established psychological frameworks, proving the system's external validity.
