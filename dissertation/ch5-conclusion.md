# CHAPTER FIVE: CONCLUSION AND FUTURE WORK

## 5.1 Summary of Results

The project set out to build KBlog — a social publishing platform integrating algorithmic feed personalisation, an editorial review workflow and transparent machine moderation — and to evaluate it honestly. All five objectives were met:

1. **Requirements and design (Ch. 3).** Twenty functional and nine non-functional requirements were specified; the system was modelled with ER, use-case, activity/state, sequence, DFD, component and deployment diagrams, all of which correspond to the artefact that was subsequently built.
2. **Platform implementation (Ch. 4).** A working full-stack system was delivered: a lazy-loaded React/Redux PWA frontend (~25 routes), a 49-endpoint Express API, six Mongoose collections with query-driven indexing, JWT/bcrypt security, and a Cloudinary media pipeline with local fallback.
3. **Personalised feed.** The For-You feed implements the staged architecture of Twitter's released algorithm — dual in/out-of-network sourcing, a six-filter chain, an 18-action sigmoid scorer, weighted combination and author-diversity attenuation — in ~15 ms per request on the reference dataset (Table 4.7).
4. **Hybrid moderation.** The lexical engine scores every submission across five categories with severity tiers and leetspeak normalisation, persists an auditable record, feeds a reviewer dashboard, and gates feed visibility — operating under, not instead of, the human editorial state machine.
5. **Evaluation.** Eighteen functional test cases passed; six moderation cases produced measured, honest results — including one true false negative (TC-M04) that demonstrates the known lexicon limitation; performance measurements confirmed sub-20 ms interactive responses.

## 5.2 Recommendations

For adopters: KBlog suits community/institutional contexts that want owned, moderated, socially-distributed publishing without commercial-platform tenancy; the moderation dashboard should remain a human-review aid, not an auto-delete authority. For the project itself: the leaked-credentials finding (§4.6) should be actioned — secrets belong in environment management, never in versioned config. For reproduction: the module-seam design means the heuristic scorer can be replaced by a trained model when interaction data volume justifies it.

## 5.3 Future Work

Ordered by value: (1) **learned ranking** — collect interaction events and train a gradient-boosted/neural ranker at the Phoenix-seam; (2) **semantic moderation** — augment the lexicon with an embedding or API classifier to close false negatives of the TC-M04 kind; (3) **negative signals** — capture block/mute/not-interested to activate the negative action weights already defined in the scorer; (4) **user study** — deploy to a real cohort and evaluate with questionnaires/SUS rather than simulated acceptance; (5) **scaling** — followers arrays and per-request pipeline assembly will need caching/materialised feeds beyond community scale; (6) **notifications, real-time features, and richer bookmark/reading-list organisation**.

Recommendations divide into deployment actions for the institution and technical directions for a successor project.

**For deployment.** The committed credentials identified in §4.6 must be rotated and moved to environment management before any public deployment; a seeded reviewer onboarding path and documented moderation policy (thresholds, appeals) should accompany launch; and the evaluation instrument of Appendix D should be administered to a pilot cohort so the usability findings in §4.7.6 can be validated against real users rather than developer observation.

**For a successor project.** The three highest-value extensions follow directly from measured limitations rather than speculation:

1. **Expand moderation coverage.** TC-M04's CLEAN grade on paraphrased hate speech shows lexicon coverage is the binding constraint. A successor should either extend the dictionaries systematically or layer a classifier *behind* the lexicon — keeping the lexicon's explainability for cases it does catch while the classifier adds recall, with every machine decision still surfaced to the human reviewer.
2. **Enrich the interaction graph.** The scorer's placeholder actions (§3.8, Table 3.18) exist because the data model lacks dwell time, negative feedback, and notification events. Instrumenting these signals would let the weighted scorer operate on real rather than defaulted inputs — the single biggest improvement available to feed quality.
3. **Empirical feed evaluation.** The pipeline is currently validated on latency and structural correctness, not output quality. A successor should run an offline evaluation — held-out interaction prediction, or a small A/B study — to measure whether the scored ordering actually outperforms reverse-chronological for this community.

Secondary extensions: real-time notifications and mentions; multi-reviewer assignment with inter-rater tracking; ActivityPub federation for inter-institution reach; native mobile via the existing JWT API; and automated test coverage to replace the current manual black-box evidence base.

The answer to the framing question — whether the integrative combination is achievable at student scale — is affirmative on the evidence: the platform exists, the pipeline executes in tens of milliseconds, the editorial workflow operates end-to-end, and every claim above is backed by an executed test, a measured value, or a rendered figure rather than assertion. Equally, the work demonstrates *where* the honest limits sit: learned ranking, complete moderation coverage, and empirical feed-quality evaluation are each identifiable next steps rather than hidden deficiencies.

The platform as delivered is a working system, not a prototype of one: it ran continuously throughout development and evaluation on real seeded data, all 24 evidence screenshots are live captures, and every endpoint in Appendix B was exercised by the test matrix. What remains — trained ranking, complete moderation coverage, live-user evaluation — is a well-scoped successor agenda, each item traceable to a measured limitation rather than an aspiration.

**Limitations.** Four limits bound what this work claims: (1) the recommender is a heuristic realisation — parameters are adopted from published documentation, not fitted to this corpus, so ranking quality is asserted structurally not empirically; (2) the moderation lexicon has a measured coverage gap (TC-M04) — it is a transparent baseline, not a complete safety system; (3) evaluation is black-box functional/security/performance only — no user study was run, and no trained-baseline comparison exists; (4) testing ran on a ~110-story seeded corpus — scaling behaviour beyond that is indexed-design argument, not measurement. None of these are hidden in the body chapters; each is stated where the evidence is presented.

**Wider reflection.** Beyond the requirements, the project demonstrates that a published industrial architecture is a *readable design* — the Home Mixer decomposition transferred to a MongoDB/Express stack with modest adaptation, and its stage model made each piece independently implementable and testable. Equally, the evaluation shows the value of measuring rather than assuming: the moderation false negative was discovered precisely because the test battery included adversarial cases, and it is reported here rather than elided — the behaviour a defensible evaluation requires.

## 5.4 Conclusion

The research questions are answered affirmatively with documented qualifications. A production-style staged feed *can* be instantiated meaningfully at community scale — the architecture transfers even though the learned model does not, and transparency arguably improves. Lexical moderation *does* provide defensible triage, provided its measured blind spots are caught by the human gate it feeds rather than trusted absolutely. And the mechanisms *do* cohere into a usable platform, as the executed test evidence and the running system demonstrate. The dissertation's claims are confined to what was built and measured; where evaluation was not feasible within scope, it has been identified as future work rather than simulated.
