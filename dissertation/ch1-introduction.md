# CHAPTER ONE: INTRODUCTION

## 1.1 Introduction

This dissertation reports the design, implementation and evaluation of **KBlog**, a full-stack social publishing platform. Key terms used throughout: a *social publishing platform* is a web application in which users author long-form content and distribute it through social mechanisms — follows, feeds, likes, comments, reposts; an *editorial workflow* is the set of states and review decisions a piece of content passes through before publication; a *recommendation pipeline* is the staged software process that selects and ranks feed items for a user; *content moderation* is the evaluation of user-generated content against safety policy, here performed by an automated lexical engine subject to human review.

**Key terms.** *Story*: the unit of publication — a titled, categorised piece with abstract, rich-text body, optional cover image, and computed read time. *Draft*: a story not yet submitted, invisible to all but its author. *Editorial review*: the human gate that transitions a pending submission to published or revisions-requested. *Machine moderation*: the automated safety scan that grades content into CLEAN/MILD/FLAGGED/CRITICAL and attaches an inspectable record. *For-You feed*: the personalised story ranking produced by the recommendation pipeline. *In-network*: content from authors the reader follows; *out-of-network*: all else. *Interaction*: a like, bookmark, or repost — one document per (user, story, type). *Reviewer/Admin*: privileged roles that gate publication and manage members.

## 1.2 Background

Publishing on the web has passed through three broad phases: personal homepages and blogs (open but undistributed), centralised platforms such as Medium (distributed but closed and unowned), and subscription newsletters such as Substack (owned but weakly networked) (Blood, 2000; Rosen, 2006). Each phase traded one property for another — openness, reach, or control. Communities and institutions that want to host their own long-form discourse — a university cohort, a professional community — currently assemble it from mismatched parts: a CMS for writing, social media for distribution, and manual processes for quality control.

Two recent developments make a better synthesis feasible for a project of this scale. First, Twitter/X's release of its recommendation algorithm (March 2023) made the internal architecture of a production feed — candidate sourcing, feature hydration, multi-action scoring, heuristic filtering — publicly legible for the first time, providing a reference design. Second, the content moderation literature has matured into a consensus position: automated classifiers should *triage* and *surface*, while accountable humans retain decision authority (Gorwa, Binns & Katzenbach, 2020; Gillespie, 2018). KBlog applies both developments to the publishing-platform problem.

Students produce substantial written work — essays, reflections, project write-ups, creative pieces — but that work lives in three dead ends: submitted to a course LMS and seen only by the marker; posted to a personal blog nobody reads; or posted to a mainstream platform where it competes with the open web under rules the institution does not set. The result is that a university community has no shared venue where student writing is visible, discoverable, reviewed, and governed on the community's own terms.

Digital publishing has bifurcated into two unsatisfying extremes for student writers. On one side, self-hosted blogs (WordPress, Ghost) give ownership but no audience: a student who publishes to a personal blog reaches nobody without separately building a social following — the cold-start problem. On the other, mainstream social platforms (Medium, LinkedIn, X) give distribution but surrender control: opaque recommendation decides visibility, opaque moderation decides acceptability, and the institution has no governance over how its students' work circulates. KBlog occupies the gap between them — a shared, institution-governed platform where distribution is algorithmic but inspectable, and publication carries an editorial quality signal.

## 1.3 Problem Statement

Community-scale publishing lacks a platform that combines four properties simultaneously: (a) a personalised, ranked reading feed rather than a reverse-chronological list; (b) an explicit editorial quality workflow with reviewer decisions and notes; (c) automated content safety that is transparent and auditable rather than a black-box vendor service; and (d) deployment as an ownable, installable web application rather than tenancy on a commercial platform. Existing systems each satisfy a subset (§2.3); no accessible system satisfies all four. The problem this project addresses is therefore an *integration* problem: to design and build, at community scale, a platform that demonstrates all four properties working as one coherent system — and to evaluate honestly where small-scale approximations of industrial techniques succeed and fail.

Existing platforms resolve each of these deficits individually but none resolves them together for a bounded academic community. The gap is therefore integrative rather than novel in any single mechanism: combine community-scale recommendation (solving cold-start discovery), editorial review (solving the quality signal), and inspectable moderation (solving governance accountability) in one institution-governed system — and demonstrate that this combination is achievable at student scale with mainstream tooling.

## 1.4 Research Questions

1. Can the staged feed architecture of production social platforms (candidate sourcing → filtering → multi-action scoring → diversity re-ranking) be meaningfully instantiated at community scale without machine-learning infrastructure?
2. Can an auditable lexical moderation engine, embedded in an editorial state machine, provide a defensible hybrid governance model — and where does it fail?
3. Do the two mechanisms integrate into a coherent, usable, deployable publishing platform satisfying a realistic requirements set?

The problem decomposes into three concrete deficits observed in existing platforms, each developed against the literature in Chapter Two:

1. **Distribution without discovery.** Existing blog platforms publish but do not recommend; a new writer's work is invisible without an external audience. No mechanism exists to connect writing to interested readers inside the community.
2. **Moderation without accountability.** Platforms moderate opaquely at scale; decisions cannot be inspected, explained, or appealed by the community they govern. For an academic community this is indefensible — moderation must be explainable.
3. **Publishing without quality signal.** Open publishing treats all content identically; there is no editorial distinction between a draft and a reviewed piece, so readers cannot calibrate trust and writers receive no structured feedback.

## 1.5 Aim and Objectives

**Aim.** To design, implement and evaluate KBlog: a community-scale social publishing platform integrating a personalised recommendation feed, an editorial review workflow, and transparent automated moderation.

**Specific objectives:**

1. To specify requirements and design the architecture, data model and behaviour of the platform (Ch. 3).
2. To implement the platform: React SPA + PWA client, Express REST API, MongoDB persistence, JWT security, media pipeline (Ch. 4).
3. To implement a personalised feed adapted from Twitter's published recommendation architecture (§3.8, §4.4).
4. To implement an auditable machine moderation engine integrated with a human editorial state machine (§3.9, §4.5).
5. To evaluate the implementation through executed test cases, measured moderation outputs and performance measurements (§4.7).

The aim is to *design, implement, and evaluate* a community-governed social publishing platform for student writing. The objectives decompose as: (1) implement the platform core — accounts, profiles, compose/draft/publish, feeds, engagement; (2) implement the editorial workflow — the six-state review machine with dual quality gates; (3) implement the personalised feed — the staged pipeline adapted from published industrial architecture; (4) implement transparent machine moderation — deterministic, inspectable, human-supervised; (5) implement the social layer — follows, likes, comments, reposts, bookmark folders; (6) secure the system — password hashing, stateless auth, role gates, input validation; and (7) evaluate the result — executed functional/security tests, measured moderation and performance evidence, and honest reporting of every failure found.

## 1.6 Scope and Limitations

The project covers the platform itself — authoring, social interactions, feeds, review, moderation, administration — deployed to commodity cloud services. It does **not** implement: real ML ranking (the heuristic scorer is a documented approximation); a vendor moderation API (deliberately avoided); monetisation (the Membership page is informational); or mobile-native apps (the PWA covers this scope). Evaluation uses a seeded dataset and scripted measurements, not live user telemetry; a questionnaire-based user study is identified as future work rather than simulated.

The scope is deliberately bounded on four axes. **Functional scope**: the system covers the publish-discuss-discover loop (write, review, distribute, interact, save); features outside that loop — notifications, messaging, monetisation — are out of scope by decision. **Technical scope**: the personalised feed is a heuristic realisation of a published industrial architecture, not a trained recommender; likewise the moderation engine is a deterministic lexicon, not a learned classifier — both are honest baseline implementations, and their measured limits are reported. **Evaluation scope**: testing is black-box and performance is measured on the seeded development corpus; no live user study was conducted (the instrument exists in Appendix D). **Deployment scope**: the system is validated on the documented local/cloud stack; enterprise hardening (rate-limiting at edge, audit-log retention, HA) is acknowledged as future work.

## 1.7 Methodology (Brief)

The project followed the Waterfall lifecycle — requirements, analysis, design, implementation, testing, deployment — justified in §3.1 by the well-understood domain, single-developer context and correctness-critical governance components. Design is documented in UML and data-flow models; evidence of correctness is produced by executing the running system rather than by assertion.

The waterfall lifecycle was applied as the organising structure — requirements → analysis → design → implementation → testing → deployment — with the pragmatic allowance Royce himself recommended: feedback between adjacent phases was permitted (pipeline parameters tuned during implementation folded back into design documentation), but no completed phase was re-opened wholesale. The phases and their concrete outputs are mapped in §3.1.

## 1.8 Organisation of the Dissertation

The document follows the five-chapter undergraduate structure: **Chapter One** states the problem and approach; **Chapter Two** reviews the literature and comparable systems and establishes the research gap; **Chapter Three** presents the methodology, requirements, and full design (architecture, data, behaviour, algorithms); **Chapter Four** documents the implementation and reports all measured evidence — including the failures; **Chapter Five** draws conclusions, states limitations, and sets the agenda for future work. Appendices carry the supporting evidence: screenshots, the complete API reference, test outputs, the evaluation instrument, deployment notes, and the full test matrix.

Chapter Two reviews the relevant literature and existing systems, establishing the research gap. Chapter Three presents the analysis and design: requirements, architecture, data model, UML/DFD models, and the design of the recommendation and moderation subsystems. Chapter Four documents the implementation and evaluates the system against the requirements using executed test cases, measured results and screenshots. Chapter Five summarises findings, states recommendations, and identifies future work. References follow APA style; appendices carry extended screenshots, the full API reference, extended test results and supporting technical material.
