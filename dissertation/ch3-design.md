# CHAPTER THREE: SYSTEM ANALYSIS AND DESIGN

## 3.1 Methodology Adopted

The development of KBlog followed the **Waterfall software development lifecycle**, in which the project progressed through discrete, sequentially ordered phases — requirements specification, system analysis, design, implementation, testing, and deployment — with the output of each phase forming the verified input of the next. The waterfall model, first described by Royce (1970) and subsequently formalised in standard software engineering texts (Sommerville, 2016), was selected for three reasons specific to this project.

First, the problem domain was well understood at the outset: the functional shape of a social publishing platform (accounts, posts, feeds, moderation, review) is established in the literature and in comparable systems reviewed in Chapter Two, so the large-scale speculative requirements discovery that motivates highly iterative models was unnecessary. Second, the project was executed by a single developer against a fixed assessment deadline, making the predictability and phase-delimited milestones of waterfall preferable to the ceremony overhead of agile frameworks such as Scrum, which presuppose a team. Third, the system's correctness-critical components — the editorial state machine, role-based access control, and the moderation gate — benefit from being fully specified *before* implementation, since defects in these areas are architectural rather than cosmetic.

In practice, the waterfall was applied pragmatically rather than dogmatically. As Royce himself observed, pure single-pass sequential development is an idealisation; limited feedback between adjacent phases occurred (for example, design refinements discovered during implementation of the recommendation pipeline were folded back into the design documentation), but no phase was re-opened wholesale once its successor had begun. The project's phases and their concrete outputs are summarised in Table 3.1 and Figure 3.1.

**Table 3.1 — Waterfall phases and outputs for the KBlog project**

| Phase | Activities | Concrete output |
|---|---|---|
| 1. Requirements | Stakeholder roles identified; functional/non-functional requirements catalogued | Requirements tables (§3.2) |
| 2. Analysis | Use-case modelling; data requirements; feasibility review of stack options | Use-case model (§3.7), ER model (§3.6) |
| 3. Design | Architecture selection; database schema; UML behavioural/structural models; UI design | Figures 3.1–3.12 |
| 4. Implementation | MERN-style build: React SPA, Express API, MongoDB, Cloudinary; recommendation & moderation services | Working system (Ch. 4) |
| 5. Testing | Test-case design and execution across auth, CRUD, RBAC, workflow, moderation, feed | Test evidence (§4.7) |
| 6. Deployment | Vercel (frontend), Render (API), MongoDB Atlas, Cloudinary | Live system (§4.6) |

![Figure 3.1 — Waterfall lifecycle as applied to the project](figures/waterfall.png)

## 3.2 Requirements Analysis

Requirements were elicited from the project brief, the product blueprint prepared during analysis (the internal information-architecture audit), and the constraints identified in the literature review. They are divided into functional requirements (FR) — behaviours the system must exhibit — and non-functional requirements (NFR) — qualities the system must possess.

**Elicitation methods.** Three complementary techniques produced the catalogue below: *document analysis* of the comparable platforms in §2.3 (each missing capability became a candidate requirement); *scenario walking* of the target-user journeys (visitor → member → writer → reviewer); and *constraint analysis* of the academic deployment context (institutional governance, explainable moderation, bounded corpus). Pressman's guidance that requirements should be verifiable was applied as a filter — every retained requirement can be checked by an executable test or a rendered artefact, which is why the verification matrix in §4.7 exists.

### 3.2.1 Functional requirements

**Table 3.2 — Functional requirements**

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | Visitors shall be able to register an account with name, email, gender and password | High |
| FR-02 | Registered users shall authenticate via email/password and receive a session token | High |
| FR-03 | New accounts shall be assigned a reserved `pending-*` username and shall be required to choose a unique public username before accessing the application | High |
| FR-04 | The system shall optionally allow new users to select interest categories/tags during onboarding | Medium |
| FR-05 | Authenticated users ("students") shall compose stories in a rich-text editor supporting a cover image, abstract, category and tags | High |
| FR-06 | Authors shall save work as drafts and submit drafts for editorial review | High |
| FR-07 | The system shall manage story lifecycle states: DRAFT → PENDING_REVIEW → REVISIONS_REQUESTED → APPROVED → PUBLISHED → ARCHIVED | High |
| FR-08 | Every submitted story shall be automatically scanned by the machine moderation engine and assigned a safety grade | High |
| FR-09 | Reviewers and admins shall view the review queue, read submissions, attach review notes, and approve or request revisions | High |
| FR-10 | Published stories shall appear in public discovery surfaces (Explore, category and tag views, author profiles) | High |
| FR-11 | Authenticated readers shall receive a personalised "For You" feed ranked by the recommendation pipeline | High |
| FR-12 | The system shall provide a reverse-chronological "Following" social feed including reposts | Medium |
| FR-13 | Readers shall interact with stories via likes, comments (with replies), reposts and bookmarks organised into folders | High |
| FR-14 | Users shall follow and unfollow authors; follower relationships shall influence feed ranking | Medium |
| FR-15 | The system shall provide full-text search across story title, abstract, content and tags | Medium |
| FR-16 | Admins shall list, activate and deactivate user accounts, and manage categories | Medium |
| FR-17 | Reviewers/admins shall run a machine-audit view of moderation scores across published stories and re-scan on demand | Medium |
| FR-18 | Users shall upload avatars, cover images and story images, stored on Cloudinary with a local-disk fallback | Medium |
| FR-19 | The system shall display author profiles aggregating posts, reposts, likes, comments and follower/following lists | Medium |
| FR-20 | The application shall be installable and provide an app-shell experience via a PWA manifest and service worker | Low |

### 3.2.2 Non-functional requirements

**Table 3.3 — Non-functional requirements**

| ID | Requirement | Target / realisation |
|---|---|---|
| NFR-01 | *Security*: passwords hashed with bcrypt (cost 10); stateless JWT bearer auth; role checks server-side; route guards client-side | Implemented (§3.11, §4.7) |
| NFR-02 | *Performance*: interactive endpoints should respond in well under 1 s on the reference dataset | Measured 0–15 ms avg locally (§4.7) |
| NFR-03 | *Scalability*: stateless API; feed assembled per-request from indexed queries | Compound indexes (§3.6.3) |
| NFR-04 | *Usability*: responsive layout including mobile bottom navigation; keyboard shortcuts; dark/light theme | Implemented (§4.2) |
| NFR-05 | *Reliability*: upload pipeline must degrade to local disk if Cloudinary is unavailable | Implemented |
| NFR-06 | *Maintainability*: TypeScript frontend, modular Express routers, pipeline stages isolated per file | Codebase structure (§4.3) |
| NFR-07 | *Portability*: deployable to commodity PaaS (Vercel + Render + Atlas) with no bespoke infra | Deployment (§4.6) |
| NFR-08 | *Safety*: no PENDING/flagged content may appear in public feeds | `moderationVisibilityFilter`, status filters |
| NFR-09 | *Auditability*: moderation scores and review notes persisted for inspection | Embedded moderation doc; ReviewNote model |

**Requirements elicitation.** Requirements were derived from three sources: (1) the platform survey in §2.3 — each comparable system's missing capability became a candidate requirement (e.g., Medium's opaque curation → explainable moderation); (2) the target-users analysis — a student writer needs distribution without an existing audience (→ personalised feed) and feedback (→ review notes), a reader needs discovery (→ explore/search) and curation trust (→ editorial signal); (3) institutional constraints — governance must stay in-community (→ self-hosted, role-gated admin). Each requirement in Tables 3.2/3.3 is traceable to one or more of these sources rather than assumed.

### 3.2.3 Requirements prioritisation and rationale

Requirements were prioritised using a MoSCoW-style classification implicit in the phasing of Table 3.1. The *must-have* cluster — registration, authentication, draft/publish/review workflow, feeds, likes, comments, bookmarks — constitutes the minimum viable platform; every one traces to a use case in §3.7 and at least one executed test in §4.7. The *should-have* cluster — reposts, bookmark folders, machine moderation, personalised feed, dark mode, keyboard shortcuts — materially differentiates the system and all were implemented; the personalised feed and moderation engine are, in fact, the project's principal technical contributions. The *could-have* items surfaced during analysis but consciously deferred — real-time notifications, mentions, multi-reviewer assignment, native mobile apps — are recorded in §5.3 as future work rather than silently dropped.

Three requirements deserve explicit rationale:

- **FR-7 editorial review** exists because the platform is a *curated* student showcase, not an open forum; publication is a quality signal, which requires a gate. This decision shaped the entire submission state machine.
- **NFR-4 explainability** was elevated to a first-class requirement rather than a nicety: for machine moderation to be defensible in an academic setting, its decisions must be inspectable, which ruled out opaque third-party classifiers and motivated the deterministic lexicon design of §3.9.
- **FR-12 personalised feed** was scoped to a *heuristic* adaptation of published industrial architectures (§2.4) — the objective is demonstrating the architecture faithfully on real data, not matching a trained model's accuracy; this scoping is what made the requirement achievable within the project's resources.

## 3.3 System Architecture

KBlog is a three-tier client–server web application, shown in Figure 3.2.

- **Client tier.** A React 18 single-page application (TypeScript, Vite) rendered in the browser. Routing is declarative (React Router v6) with lazy-loaded page bundles; global state lives in a Redux Toolkit store (auth, submissions, comments, UI slices); domain hooks (`useAuth`, `useSubmissions`, `useComments`, `useCategories`, `useAuthors`) encapsulate data access over an axios HTTP layer. The app is a PWA: `manifest.json` enables installation and `public/sw.js` provides an app-shell service worker.
- **Application tier.** A stateless Express API on Node.js. Cross-cutting middleware (CORS, JSON body parsing, JWT verification via `authMiddleware`, validation via express-validator, error handling via `errorMiddleware`) fronts five REST routers. Two domain services sit behind the routers: the **recommendation service** (personalised feed assembly) and the **moderation service** (lexical safety scoring). Media upload middleware integrates Cloudinary with a local `server/uploads/` fallback.
- **Data and media tier.** MongoDB Atlas stores six collections (users, submissions, comments, categories, interactions, reviewnotes) accessed through Mongoose models; Cloudinary serves images.

![Figure 3.2 — Three-tier system architecture](figures/architecture.png)

The separation is deliberately strict: the client never accesses the database, the API holds all authorisation decisions, and the two intelligent services are self-contained modules that can be replaced (e.g., the heuristic scorer by a learned model) without touching HTTP plumbing.

**Tier responsibilities.** The presentation tier (React SPA) owns rendering, client routing, session persistence, and all interaction feedback — but holds no business rules; every authorisation decision is re-made server-side. The application tier (Express) owns the request lifecycle: middleware → routing → controller → service → model; services own the two domain engines (recommendation, moderation) so controllers stay thin. The data tier (MongoDB) owns persistence and index-supported query plans; Cloudinary sits beside it as the media tier. The boundary that matters is tier-1↔tier-2: a JSON contract with 49 endpoints (Appendix B) — nothing crosses it that is not serialisable, which is what makes the SPA replaceable by a mobile client without touching the backend.

**Request paths.** Two request classes dominate: *mutating* writes (compose, interact, review) traverse validation → service side-effects → persistence → normalised response; *reading* requests traverse optional-auth hydration → query composition → projection → paginated envelope. The feed path is the only read that fans out into a multi-stage pipeline; all other reads are direct model queries with `.populate()` joins.

**Quality attributes.** The architecture was shaped by four quality attributes ordered by this system's priorities: *correctness of governance* first (no un-reviewed content reaches readers — drives the state machine and shadow-draft rules), *inspectability* second (every automated decision decomposes into visible evidence), *responsiveness* third (feed within a 100 ms budget — drives the index and bounded-query design), and *deployability* fourth (two deployable units, environment-driven config). Where attributes conflicted, the ordering resolved them — e.g., synchronous moderation on write costs ~ms of write latency but guarantees the governance invariant, an easy trade under this ordering.

## 3.4 Input Design

Principal system inputs and their validation/verification rules:

**Table 3.4 — Input design**

| Input | Channel | Constraints & validation |
|---|---|---|
| Registration: name, username, email, password, gender | `/api/auth/register` | express-validator chains; unique email; password ≥ 6 chars; bcrypt-hashed before persist |
| Login: email + password | `/api/auth/login` | bcrypt comparison; generic failure message (no user-enumeration hint) |
| Username choice | `/api/auth/check-username` | ≥3 chars, lowercase, unique; live availability check during onboarding |
| Story: title, abstract, content, category, tags, cover | `POST /api/submissions` | title ≤150 chars; abstract ≤500 chars; content required; HTML from Quill sanitised downstream by moderation normaliser |
| Image uploads | `POST /api/submissions/upload`, `/api/users/upload` | multer file filter; Cloudinary transform; local fallback path |
| Comment / reply | `POST /api/comments` | author derived from JWT (not client-supplied); parent comment for threading |
| Interaction | `POST /api/submissions/:id/interact` | type ∈ {like, bookmark, repost, view}; toggling semantics |
| Review decision | `PUT /api/submissions/:id/status` | reviewer role required; status enum enforced by Mongoose |
| Profile edits | `PUT /api/auth/profile` | owner-only; password change re-hashes |
| Bookmark folders | `/api/users/bookmark-folders*` | owner-scoped; delete migrates items to "General" |

A consistent design rule is applied throughout: **identity fields are always taken from the verified JWT, never from request bodies** — a client cannot impersonate an author or reviewer by forging IDs.

Validation rules follow a defence-in-depth pattern: every rule enforced on the client (for feedback speed) is re-enforced server-side (for security), since client checks are trivially bypassed. File inputs are constrained at the multer layer (image mime-type whitelist, 5 MB ceiling) before any persistence occurs, and the Cloudinary path means the API server never stores user binaries locally in production.

### 3.4.1 Field-level input specifications

Each input surface was specified to field level; the rules below are enforced client-side for feedback and re-enforced by express-validator on the server (§3.4).

**Table 3.5 — Registration form fields (`RegisterForm`)**

| Field | Type | Rules | Error surface |
|---|---|---|---|
| name | text | required, non-empty | inline message |
| email | email | required, RFC email format | inline message |
| password | password | required, min length enforced server-side | inline message |
| confirmPassword | password | must equal password | inline message |
| terms | checkbox | must be accepted to submit | disabled submit |

**Table 3.6 — Story editor fields (`WritePage`)**

| Field | Type | Rules | Derived data |
|---|---|---|---|
| title | text | required | slug auto-derived |
| abstract | textarea | required; shown as card preview | — |
| content | rich text (React Quill) | required; sanitised on write | readTime at 200 wpm |
| category | select | from `/api/categories` | feed facet |
| tags | tag input | list; searchable | text index + interest match |
| cover image | file | image MIME, ≤5 MB (multer) | Cloudinary URL stored |
| status action | two submit paths | Save draft vs Publish | isDraft / PENDING_REVIEW |

**Table 3.7 — Other input surfaces**

| Surface | Fields | Notes |
|---|---|---|
| Login | email, password | client format check then server verify (Figures 4.9–4.10) |
| Username setup | username | regex + reserved rules + uniqueness via check-username |
| Onboarding | interest selection | seeds recommendation preferences |
| Profile | name, bio, avatar, cover | avatar/cover via ImageCropModal → upload |
| Comment | content | threaded; replies embed in parent comment |
| Review decision | status + note | ReviewNote written on every transition |
| Folder | folder name | bookmarks organise under named folders |

## 3.5 Output Design

System outputs were designed around reading quality and administrative clarity:

- **Feed items** — story card projections: title, abstract, author (username, avatar), cover image, category, computed read time, engagement counts, and a preview of top comments (hydrated post-selection by `previewCommentsHydrator`).
- **Feed payloads** — paginated `{ items, page, totalPages, hasMore }` envelopes; "for-you" pages are keyed by a client-supplied `seenIds` cursor to suppress repeats (previously-served filter).
- **Editorial outputs** — the review queue returns stories with embedded moderation subdocuments (per-category scores, matched terms, grade, summary) so the human reviewer sees *why* the machine flagged an item.
- **Machine audit output** — aggregate counts (published, verified clean, flagged, critical, 18+, racist) plus per-story metric rows.
- **API errors** — a single `errorMiddleware` normalises Mongoose/validation/JWT errors into consistent `{ message }` JSON responses.
- **Computed metadata** — `readTime` ("N min read", at 200 wpm) is generated on save; slugs are URL-safe derivations of titles.

**Per-screen output specifications.** In addition to the payload shapes above, each output surface was specified:

| Surface | Contents | Format |
|---|---|---|
| Home (authed) | featured post, recent rail, trending categories, featured authors | card grid, paginated rail |
| /feed | ranked story cards + viewer flags + preview comments | `{items,page,totalPages,hasMore}` |
| /explore | story cards + tag/category facets + search | same envelope |
| /blog/:slug | full body, author card, comment thread | rendered rich text |
| /reviews | pending items + moderation record per item | queue list + audit tab |
| /me/stories | stories grouped by workflow status | status-grouped list |
| Machine audit | corpus counters + per-story metric rows | dashboard table |
| Bookmarks | items grouped by folder | folder sections |
| Profile | identity fields + own/followed content tabs | tabbed sections |
| Toasts | action feedback (saved, published, errors) | transient `{message}` |

## 3.6 Database Design

### 3.6.1 Entity–relationship model

Six Mongoose collections make up the persistent store. Figure 3.3 shows the entity–relationship model; Table 3.8 summarises cardinalities.

![Figure 3.3 — Entity–relationship diagram](figures/er-diagram.png)

**Table 3.8 — Entity relationships**

| Relationship | Cardinality | Implementation |
|---|---|---|
| User authors Submission | 1:N | `Submission.author → User` |
| User writes Comment; Submission has Comments | 1:N each | `Comment.author`, `Comment.submission` |
| Comment replies to Comment | 1:N (self) | `Comment.parent` |
| User performs Interaction on Submission | N:M reified | `Interaction(user, submission, type)` |
| Category classifies Submission | 1:N | `Submission.category` |
| Reviewer writes ReviewNote on Submission | 1:N | `ReviewNote.reviewer`, `.submission` |
| User follows User | N:M self | `followers[]`/`following[]` ObjectId arrays |
| Submission drafts of Submission | 1:1 | `draftOf`/`draftRef` pair |

### 3.6.2 Notable schema decisions

1. **Embedded moderation subdocument on Submission.** Moderation results (overall score, grade, labels, per-category `{score, flagged, matches[]}`, callback timestamp) are stored *inside* the story document. Rationale: moderation is written once at submission/rescan and read on every feed/review request; embedding avoids a per-request join and keeps the audit trail attached to the audited artefact.
2. **Draft/published split via `isDraft` + `draftOf`/`draftRef`.** Editing a published story creates a linked draft revision rather than mutating the live document, so the public article is never exposed in a half-edited state; publishing the draft swaps references.
3. **Social graph as ID arrays on User.** Followers/following arrays trade unbounded-array risk for read simplicity — the feed's in-network source and follow toggles need direct membership tests, which arrays satisfy at community scale; the cap is noted as a scaling limitation (§5.3).
4. **Interaction as a separate collection.** Rather than counters only, interactions are reified documents, enabling per-user state (did *I* like/bookmark this?), bookmark folders, and future event sourcing for the recommender.

The design makes several deliberate denormalisation choices, each a space-for-simplicity trade: `likeCount`-style engagement figures are hydrated at read time rather than stored (avoiding count-drift bugs); comment replies embed in the parent comment (one read per thread) rather than referencing separate documents; `readTime` and `slug` are materialised on write rather than computed per render; and the `moderation` subdocument is embedded on the story itself so every read carries the safety record without a join. Conversely, followers/following are stored as ID arrays on the user — a graph adjacency list — because the alternative (a separate edge collection) would add a join to the hottest read (feed context). The `draftOf` shadow-draft mechanism is the most consequential choice: editing a published story creates a copy, keeping the invariant that *public text is always reviewed text* without blocking authors mid-edit.

### 3.6.3 Index strategy

Indexes were designed from query shapes, not by rote:

**Table 3.9 — Indexes**

| Collection | Index | Served query |
|---|---|---|
| submissions | `{title, abstract, content, tags: text}` | Explore full-text search (FR-15) |
| submissions | `{status:1, author:1}` | "My Stories" per-author dashboards |
| submissions | `{status:1, isDraft:1, createdAt:-1}` | Out-of-network candidate sourcing (recency scan) |
| submissions | `{status:1, isDraft:1, author:1, createdAt:-1}` | In-network sourcing (per-author recency) |
| submissions | `{status:1, isDraft:1, category:1, createdAt:-1}` | Category feeds / explore facets |
| submissions | `{tags:1, status:1, isDraft:1}` | Tag-overlap features and tag pages |
| users | `username` (unique), `email` (unique) | login, profile resolution, username check |

Each index exists because a measured or designed hot path requires it: the text index serves `GET /search/explore` queries; `(status, author)` serves the author's My Stories grouping and the admin author drill-down; the status+date index serves the broad-recent and pending-queue reads (both filter on status then sort by recency); `(author, createdAt)` serves profile post lists; and the `(submission,user,type)` unique index on interactions is not merely a performance index but a *correctness constraint* — it is what makes the like/bookmark upsert idempotent under retries and double-clicks. The compound indexes were deliberately kept few because each write pays for every index on its collection; the reads they serve are the ones exercised by the pipeline and the main views.

### 3.6.4 Schema field reference

The following tables specify every persisted field, its type, constraints and design purpose. (Types are Mongoose types; `FK` denotes an ObjectId reference.)

**Table 3.10 — `users` collection**

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| username | String | required, unique, ≥3 chars, lowercase | public handle (`/@username` routes) |
| email | String | required, unique, regex-validated | login identity |
| password | String | required, ≥6 chars | bcrypt hash only — never stored or returned plain |
| name | String | required | display name |
| bio | String | default '' | profile biography |
| avatar | String | default '' | Cloudinary/local URL |
| role | String | enum: student/reviewer/admin, default student | RBAC decisions |
| isActive | Boolean | default true | admin deactivation preserves data |
| gender | String | required enum: male/female/other | registration attribute |
| coverImage | String | default '' | profile cover |
| followers / following | FK[] → User | — | social graph (§3.6.2.3) |
| timestamps | Date | auto | createdAt/updatedAt |

**Table 3.11 — `submissions` collection**

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| title | String | required, ≤150 chars | headline |
| slug | String | required, unique, lowercase | URL identity (`/blog/:slug`) |
| abstract | String | required, ≤500 chars | preview/summary text |
| content | String | required | Quill HTML body |
| author | FK → User | required | ownership |
| status | String | enum 6 states, default DRAFT | editorial state machine (Fig. 3.5) |
| isDraft | Boolean | default false | draft/published discrimination used by feed queries |
| draftOf / draftRef | FK → Submission | nullable | draft-of-published-post link (§3.6.2.2) |
| category | FK → Category | — | classification, feed feature |
| tags | String[] | trimmed | discovery + scorer features |
| image | String | default '' | cover URL |
| readTime | String | computed pre-save | "N min read" at 200 wpm |
| moderation | embedded doc | — | safety record (Table 3.12) |
| timestamps | Date | auto | recency scoring, chronological views |

**Table 3.12 — `submissions.moderation` embedded subdocument**

| Field | Type | Purpose |
|---|---|---|
| overallScore | Number (0–100) | composite safety score |
| grade | String | CLEAN / MILD / FLAGGED / CRITICAL |
| flagged | Boolean | visibility gate input |
| labels | String[] | violated category names |
| summary | String | human-readable verdict shown to reviewers |
| categories.{sexist, sexual, explicit, eighteenPlus, racist}.{score, flagged, matches[]} | sub-docs | per-category detail with matched terms |
| callbackTriggeredAt | Date | audit timestamp for the machine log |

**Table 3.13 — `comments` collection**

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| submission | FK → Submission | required | parent story |
| user | FK → User | required | author (from JWT) |
| content | String | required, trimmed | comment body |
| likes | Number | default 0 | denormalised count |
| likedBy | FK[] → User | — | per-user like state |
| replies | embedded[] {user, content, date, likedBy[]} | — | one-level thread (document-local, atomic) |
| isFlagged | Boolean | default false | moderation flag |

**Table 3.14 — `interactions` collection**

| Field | Type | Constraints | Purpose |
|---|---|---|---|
| submission | FK → Submission | required | target story |
| user | FK → User | required | actor |
| type | String | enum LIKE/BOOKMARK/REPOST | action kind |
| quote | String | — | quote-repost text |
| folder | String | default 'General' | bookmark organisation |

*Indexes:* `{submission,user,type}` unique — makes every interaction idempotent by construction; `{user,type,folder}`, `{user,type,createdAt:-1}`, `{submission,type,createdAt:-1}` serve bookmark lists, history hydration and count queries.

**Table 3.15 — `categories` and `reviewnotes` collections**

| Collection | Fields | Purpose |
|---|---|---|
| categories | name, slug, description | story classification; seeded with 10 domains |
| reviewnotes | submission FK, reviewer FK, note, decision | persistent editorial feedback trail |

## 3.7 Behavioural Design (UML)

### 3.7.1 Use-case model

Three actors participate: **Visitor**, **Student** (the default authenticated role — the platform's readers/writers), and **Reviewer/Admin**. Figure 3.4 gives the use-case diagram.

![Figure 3.4 — Use-case diagram](figures/usecase.png)

Selected use-case descriptions:

**UC-07 Submit story for review.** *Actor:* Student. *Precondition:* story saved as DRAFT. *Main flow:* (1) author opens draft in `/write`; (2) completes title/abstract/category/tags and cover; (3) submits; (4) system runs machine moderation, records grade; (5) status → PENDING_REVIEW; story appears in review queue and in the author's "In Review" tab. *Alternate:* missing required fields → 400 with validation messages; moderation CRITICAL → still queued but visibly flagged to reviewers.

**UC-12 Review pending submission.** *Actor:* Reviewer/Admin. *Main flow:* (1) open review queue; (2) inspect story + machine grade + matched terms; (3) approve or request revisions with a note; (4) system transitions status and persists the ReviewNote. *Alternate:* no action — item stays pending.

**UC-11 Read For-You feed.** *Actor:* Student. *Main flow:* (1) open `/feed`; (2) client requests page with seen-IDs cursor; (3) pipeline returns ranked items; (4) UI renders; (5) scroll → next page. *Alternate:* unauthenticated → server falls back to non-personalised ordering (optionalAuth).

**Table 3.16 — Complete use-case catalogue**

| UC | Name | Actor | Trigger | Success post-condition | Key alternates |
|---|---|---|---|---|---|
| UC-01 | Browse public surfaces | Visitor | visit /, /about, /membership, /contact | public pages rendered | none |
| UC-02 | Register / authenticate | Visitor | submit form | account created / session issued; user stored client-side | validation errors; duplicate email; wrong password (generic failure) |
| UC-03 | Username onboarding | Student (pending) | first login | unique username claimed; router releases State B | name taken → live availability error |
| UC-04 | Interest selection | Student | after username | preferred categories saved (skippable) | skip → proceed |
| UC-05 | Read For-You feed | Student | open /feed | ranked page returned; scroll paginates | logged-out → non-personalised fallback |
| UC-06 | Explore / search | any | open /explore, query, facet | text-index results, category/tag facets | no results state |
| UC-07 | Compose & submit story | Student | /write + submit | draft saved; on submit → PENDING_REVIEW + moderation record | validation 400; upload failure |
| UC-08 | Manage stories | Student | /me/stories tabs | drafts/published/in-review listed; edit/delete | edit published → linked draft |
| UC-09 | Interact | Student | like/comment/repost/bookmark | Interaction upserted; counts updated | duplicate → toggle off |
| UC-10 | Bookmark folders | Student | dropdown on bookmark | item filed to folder; folders renamed/deleted | delete folder → items to General |
| UC-11 | Follow author | Student | follow button | mutual graph edge; feeds re-personalise | unfollow toggles |
| UC-12 | Review submission | Reviewer/Admin | /reviews queue | approve/request revisions + ReviewNote | moderation context shown |
| UC-13 | Machine audit | Reviewer/Admin | /reviews audit view | aggregate counts; per-story metrics; rescan | rescan recomputes grades |
| UC-14 | Manage authors | Admin | /authors | activate/deactivate accounts | deactivation preserves content |
| UC-15 | Manage categories | Admin | category endpoints | category created/listed | — |
| UC-16 | Manage profile | Student | /profile | name/bio/avatar/cover updated; password changed | re-hash on password change |

### 3.7.1a Use-case narratives (remaining catalogue)

The three use cases above are detailed in full; the remaining catalogue entries are narrated below at the same level of precision.

**UC-01 Browse public surfaces.** *Actor:* Visitor. *Precondition:* none. *Main flow:* (1) navigate to `/`, `/about`, `/membership`, or `/contact`; (2) the layout shell renders without auth checks; (3) content displays immediately — no data fetch is gated. *Post-condition:* the visitor can evaluate the platform and reach `/auth/signup`. These routes deliberately sit outside `ProtectedRoute` so the platform presents an open front door.

**UC-02 Register / authenticate.** *Actor:* Visitor. *Main flow:* (1) submit registration (name/email/password/confirm/terms); (2) server validates, hashes, persists, issues JWT; (3) client stores `{user,token}` and lands on onboarding. *Alternates:* field errors → inline (Figure 4.10); duplicate email/username → server error surfaced; login with bad credentials → generic failure (Figure 4.9) — deliberately non-specific per standard practice.

**UC-03 Username onboarding.** *Actor:* Student (pending). *Precondition:* account exists with `pending-*` username. *Main flow:* (1) any navigation is intercepted to `/onboarding/username`; (2) entry triggers live `check-username`; (3) a valid unique name commits; (4) the router releases the gate. *Alternates:* taken/reserved names produce availability errors without a round trip per keystroke beyond debounce.

**UC-04 Interest selection.** *Actor:* Student. *Main flow:* (1) after username, select preferred categories; (2) saved to the user record; (3) seeds the recommender's preference context (§3.8.1). *Alternate:* skipping is permitted — the pipeline still works via the broad-recent pool, though personalisation is weaker: an honest graceful-degradation design.

**UC-05 Compose / save draft.** *Actor:* Student. *Main flow:* (1) open `/write`; (2) author title/abstract/body/category/tags/cover; (3) Save Draft persists `isDraft=true`; (4) story appears in My Stories under Drafts. *Alternates:* cover upload fails → story still saves without image; autosave is manual (documented gap, §5.3).

**UC-06 Edit published story.** *Actor:* Student. *Main flow:* (1) open published story in editor; (2) changes save into a `draftOf` shadow document; (3) the live story is untouched until the author chooses to re-submit through review. *Post-condition:* readers never see un-reviewed edits — the shadow-draft rule.

**UC-08 Comment / reply / like.** *Actor:* Student. *Main flow:* (1) on any story, add a comment; (2) replies embed in the parent; (3) likes toggle on comments and replies independently. *Post-condition:* thread persisted in one document; counts denormalised for display.

**UC-09 Follow / unfollow.** *Actor:* Student. *Main flow:* (1) follow from author card or profile; (2) `followers`/`following` arrays update; (3) the author's content becomes eligible for the viewer's in-network source and following feed. *Alternate:* unfollow removes the edge symmetrically.

**UC-10 Bookmark / organise folders.** *Actor:* Student. *Main flow:* (1) bookmark any story — default folder; (2) `BookmarkDropdown` assigns/reassigns folders; (3) folder deletion migrates contents rather than orphaning them. *Post-condition:* saved library is personally organised.

**UC-13 Explore / search.** *Actor:* any. *Main flow:* (1) `/explore` renders discovery facets; (2) `q` text queries hit the `$text` index; (3) category/tag filters compose with pagination. *Post-condition:* discovery operates only over `PUBLISHED ∧ ¬isDraft` — drafts and revisions-in-flight are invisible.

**UC-14 Admin: manage members.** *Actor:* Admin. *Main flow:* (1) `/authors` console lists members with search; (2) role change and active-toggle apply via PATCH endpoints; (3) every action re-verifies `isAdmin` server-side. *Alternates:* non-admin access is refused at both router and middleware layers (defence in depth, TC-SEC03).

**UC-15 Audit machine moderation.** *Actor:* Reviewer/Admin. *Main flow:* (1) open the audit dashboard (Figure 4.8); (2) review corpus counters and per-story rows; (3) optionally trigger `rescan-all` after a lexicon update or `POST /:id/moderate` for a single item. *Post-condition:* moderation is inspectable corpus-wide, not just per-submission.

Each use case was traced to at least one functional requirement (Table 3.2) and one test case (Table 4.5), giving a requirements → design → test traceability chain.

### 3.7.2 Activity: submission lifecycle

Figure 3.5 models the editorial state machine — the heart of the platform's governance design. Walking it: a new story enters DRAFT on first save (no machine or human involvement — drafts are private working documents). The submit transition runs the machine scan synchronously — every published-or-pending story therefore carries a `moderation` record by construction — and lands in PENDING_REVIEW. From there only two exits exist: a reviewer approve transition to PUBLISHED, or a revisions transition to REVISIONS_REQUESTED carrying a mandatory ReviewNote. A revisions exit does not return to PENDING automatically — the author must re-submit, so reviewer attention is never spent on items the author has not finished revising. PUBLISHED has a single exit, ARCHIVED (author or admin), which preserves the record but removes it from feeds — a reversible takedown rather than deletion. Editing a PUBLISHED story does not transition it; it forks a shadow draft per §3.6.2, and the fork must re-enter at submit — meaning no path exists from un-reviewed text to public visibility. Machine moderation executes inside the submit transition; human review gates the PUBLISHED state.

![Figure 3.5 — Submission lifecycle activity/state diagram](figures/state-submission.png)

### 3.7.3 Activity: authentication & onboarding state machine

The client router implements three hard authentication states (Figure 3.6), mirroring the IA audit: State A (unauthenticated) may only reach public surfaces; State B (authenticated but `pending-*` username) is confined to `/onboarding/username`, with the originally requested destination captured and restored after setup; State C grants full access. This prevents anonymous or half-registered identities from interacting with the social graph.

![Figure 3.6 — Authentication/onboarding state diagram](figures/state-onboarding.png)

### 3.7.4 Sequence diagrams

Three interaction traces are specified:

- **Figure 3.7 — Authentication:** covers both registration and login paths. Registration flows `registerUser` → bcrypt hash → document insert → JWT issuance, returning `{user, token}` to the client, which stores the payload and attaches `Authorization: Bearer` on every subsequent request. Login follows the same issue path after `bcrypt.compare`. On each protected call the `protect` middleware verifies the signature and expiry, hydrates `req.user` from the token's `id` claim, and short-circuits with 401 on any failure — the failure path is drawn explicitly because it is the route the security tests (§4.7.5) exercise.
- **Figure 3.8 — Publish flow:** the critical write path. The editor first POSTs any cover image to `/upload` (multer → Cloudinary, URL returned for embedding), then POSTs the story: the controller computes `readTime`, invokes the moderation scan synchronously, persists with `status=PENDING_REVIEW`, and returns. Separately, the reviewer's `PUT /:id/status` decision transitions the record to `PUBLISHED` or `REVISIONS_REQUESTED` and writes a `ReviewNote` — two distinct transactions joined by the queue, reflecting that review is asynchronous.
- **Figure 3.9 — For-You feed:** collapses §3.8's 16-stage pipeline into a timed lifeline: context hydration, parallel candidate sourcing, the filter chain, engagement hydration, scoring, diversity re-rank, top-K selection and preview hydration — annotated to show which stages touch the database (hydration and sourcing) versus which are pure in-memory transforms (filters, scorers).
- **Figure 3.10 — Interaction:** shows the three engagement primitives as `POST /:id/interact` upserts against the unique `(submission,user,type)` index — the index that makes double-like and duplicate-bookmark impossible by construction — plus the comment path (`POST /:id/comments` with embedded replies) and the follow edge on `users` that feeds the in-network source.

![Figure 3.7 — Sequence: authentication and session](figures/seq-auth.png)
![Figure 3.8 — Sequence: compose → moderate → review → publish](figures/seq-publish.png)
![Figure 3.9 — Sequence: personalised feed request](figures/seq-feed.png)
![Figure 3.10 — Sequence: social interactions](figures/seq-interaction.png)

### 3.7.5 Data-flow diagrams

Figure 3.11 (Level 0) situates the system among its external entities; Figure 3.12 (Level 1) decomposes it into six numbered processes with named data stores.

![Figure 3.11 — DFD Level 0 (context)](figures/dfd0.png)
![Figure 3.12 — DFD Level 1](figures/dfd1.png)

**DFD walkthrough.** Level 0 shows four external entities — Visitor, Student, Reviewer/Admin, and Cloudinary (media) — exchanging flows with the single KBlog process: credentials and content in, rendered content and decisions out. Level 1 decomposes into six processes: P1 Identity (register/login/profile against D1 users), P2 Composition (draft/publish writes to D2 submissions, media to Cloudinary), P3 Governance (machine scan on write, human review decisions to D4 reviewnotes, status back to D2), P4 Distribution (feed and explore reads over D2+D3 interactions, personalisation via D1 follow graph and history), P5 Engagement (comments to D5, interactions to D3), and P6 Administration (member/author management). The diagram is significant for what it makes explicit: *every* public read of story data passes through either P3's gate or P4's filter — there is no path from D2 to a reader that bypasses governance.

## 3.8 Recommendation Pipeline Design

The "For You" feed is built as a multi-stage pipeline adapted, at small scale, from the architecture Twitter/X released in March 2023 (`the-algorithm`: Home Mixer / Product Mixer lineage), where a request fans out to candidate sources, is filtered by heuristics, scored by an engagement-probability model, and re-ranked for diversity. The KBlog instantiation keeps the stage decomposition but replaces distributed services and learned models with MongoDB queries and a transparent heuristic scorer — appropriate for a community corpus of hundreds of stories rather than hundreds of millions.

**Stage 1 — Context hydration.** `hydrateUserContext` resolves the viewer's follows, up to 20 preferred tags and 10 preferred categories (derived from interaction history), and serving history.

**Stage 2 — Candidate sourcing (pool ≈150).** Two sources run in parallel: *in-network* (stories by followed authors, ≤14 days old) and *out-of-network* (global published corpus, ≤21 days). This mirrors Twitter's in/out-of-network split and guarantees both relevance and discovery.

**Stage 3 — Filter chain.** Six ordered filters: `coreDataHydrationFilter` (attach author/category), `dropDuplicates`, `ageFilter` (≤30 days hard cap), `selfPostFilter` (never rank one's own work), `previouslyServedFilter` (suppress already-seen IDs supplied as a cursor), and `moderationVisibilityFilter` (drop flagged/critical items).

**Stage 4 — Engagement hydration.** Like/comment/repost counts and viewer-specific flags (e.g., `isFollowingAuthor`) are attached for scoring.

**Stage 5 — Scoring.** Three scorers compose:

1. `phoenixScore` — a stand-in for the heavy ranker: per candidate it emits 18 predicted *action probabilities* (favorite, reply, repost, click, profile-click, share, dwell, quote, follow-author, plus negative actions currently zeroed as the data model doesn't capture them). Each probability is a sigmoid over a weighted logit of interpretable features — tag overlap, category match, exponential recency decay (half-life ≈72 h), normalised popularity, author popularity, follow relation, image presence, comment/repost density (Figure 3.14).
2. `weightedScore` — linear combination `Σ actionᵢ × ACTION_WEIGHTSᵢ` (e.g., repost 1.2, favorite 1.0, click 0.25; negative actions negative), producing the ranking score.
3. `authorDiversityScore` — multiplicative attenuation (decay 0.85, floor 0.55) on repeat authors within a page, preventing single-author domination.

**Stage 6 — Selection & post-hydration.** `selectTopK` pages the ranked list (default page size 12 from a 150-candidate pool), then preview comments are hydrated and a final visibility check re-applied before returning.

![Figure 3.13 — Recommendation pipeline](figures/rec-pipeline.png)
![Figure 3.14 — Phoenix-style scorer data flow](figures/phoenix-scorer.png)

**Table 3.17 — Pipeline parameters (from `params.js`)**

| Parameter | Value | Role |
|---|---|---|
| `CANDIDATE_POOL_SIZE` | 150 | candidates per request |
| `RESULT_SIZE` | 12 | default page |
| `MAX_POST_AGE_DAYS` | 30 | age filter hard cap |
| `IN_NETWORK_DAYS` / `OUT_OF_NETWORK_DAYS` | 14 / 21 | source windows |
| `TOP_TAGS_LIMIT` / `TOP_CATEGORIES_LIMIT` | 20 / 10 | context size |
| `AUTHOR_DIVERSITY_DECAY` / `_FLOOR` | 0.85 / 0.55 | diversity attenuation |
| `FEATURE_WEIGHTS` | followed 0.55, tag 0.35, category 0.25, recency 0.30, popularity 0.20, comment density 0.15, image 0.05, author pop. 0.10 | logit weights |

### 3.8.1 User-context hydration (detail)

`hydrateUserContext` assembles the personalisation context in two passes. First it loads the viewer's `following` set. Then it reads the viewer's last 50 `Interaction` rows and last 50 `Comment` rows (each populating the referenced submission's author, tags, category and timestamp), merges them into a single recency-ordered *action sequence* (`actionSequence`, ≤50 rows), and derives three artefacts used downstream:

- **interaction ID sets** — `likedSubmissionIds`, `repostedSubmissionIds`, `commentedSubmissionIds`, consumed by the previously-served filter and per-candidate flags;
- **preferredTags** — the top 20 tags by frequency across the action sequence;
- **preferredCategories** — the top 10 categories by frequency.

This is a deliberately simple implicit-feedback profile: no embeddings, just counting — chosen because the corpus is small and interpretability aids the defence, while the interface (`context → sources`) matches the industrial design so a richer profile can replace it later.

### 3.8.2 Candidate sourcing (detail)

**In-network** issues two parallel queries: recent PUBLISHED non-draft posts by followed authors (≤14 days), and recent REPOST interactions by followed authors, each shaped into a candidate object:

```
{ _id: 'post_<id>' | 'repost_<id>', feedType, createdAt,
  submission, repostUser?, quote?, source: 'in-network' }
```

The repost channel means amplification by followed users is itself a ranking signal, exactly as on X.

**Out-of-network** excludes followed authors and the viewer, then runs two pools in parallel: an *interest pool* (posts matching `preferredTags` or `preferredCategories`, ≤21 days) and a *broad recent pool* (all published, ≤21 days) — the latter guaranteeing discovery content for new or logged-out users and cold-start coverage. Results are deduplicated by submission ID before the pool is returned.

### 3.8.3 Scoring pseudocode

```
procedure runRecommendationPipeline(user, page, limit, seenIds):
    ctx ← hydrateUserContext(user)
    inNet   ← getInNetworkCandidates(ctx, 75)
    outNet  ← getOutOfNetworkCandidates(ctx, 75)
    cand    ← inNet ++ outNet                        // ≤150
    cand    ← coreDataHydrationFilter(cand)          // attach author+category docs
    cand    ← dropDuplicates(cand)                   // post vs repost of same story
    cand    ← ageFilter(cand)                        // createdAt ≥ now−30d
    cand    ← selfPostFilter(cand, ctx)              // author ≠ viewer
    cand    ← previouslyServedFilter(cand, seenIds)  // no repeats across pages
    cand    ← moderationVisibilityFilter(cand)       // drop flagged/critical
    cand    ← hydrateEngagement(cand, user)          // like/comment/repost counts
    cand    ← phoenixScore(cand, ctx)                // 18 action probabilities
    cand    ← weightedScore(cand)                    // Σ actionᵢ·wᵢ
    cand    ← authorDiversityScore(cand)             // ×(0.45·0.85ᵏ + 0.55)
    sel     ← selectTopK(cand, page, limit)          // slice + pagination meta
    sel     ← hydratePreviewComments(sel)            // top comments per item
    sel     ← moderationVisibilityFilter(sel)        // final safety re-check
    return sel

function phoenixScore(c, ctx):
    overlap     ← |c.tags ∩ ctx.preferredTags| / |c.tags|
    catMatch    ← c.category ∈ ctx.preferredCategories
    recency     ← exp(−hours(c.createdAt)/72)
    popularity  ← min(1, (likes + 2·comments + 3·reposts)/50)
    authorPop   ← min(1, followers/1000)
    for each action a in ACTIONS:
        logit_a ← base_a + Σ featureⱼ · wⱼ_a        // see FEATURE_WEIGHTS
        score_a ← clamp(σ(scale_a · logit_a))
    return 18-vector of action probabilities
```

**Table 3.18 — Phoenix action scores and derivation**

| Action | Logit composition (simplified) | Clamp |
|---|---|---|
| favorite | 0.05 + 0.55·follow + 0.35·tag + 0.25·cat + 0.30·recency + 0.20·pop + 0.05·img + 0.10·authorPop | σ(4x) |
| reply | 0.02 + 0.15·commentDensity + 0.25·tag + 0.15·cat | σ(5x) |
| repost | 0.03 + 0.33·follow + 0.4·repostDensity + 0.2·tag + 0.1·pop | σ(4x) |
| click | 0.1 + 0.2·recency + 0.2·follow + 0.1·pop | σ(3x) |
| profileClick | 0.02 + 0.10·authorPop + 0.1·follow | σ(3x) |
| followAuthor | 0.02 + 0.2·tag + 0.10·authorPop (−2 if already following) | σ(3x) |
| share | 0.5·repost + 0.2·favorite | direct |
| quote | 0.8·repost | direct |
| photoExpand | 0.1 + 0.15·tag (0 if no image) | direct |
| dwell | min(readMins/10, 1) | direct |
| negative actions (notInterested, block, mute, report) | 0 — signals not yet captured | — |

**Table 3.19 — Final combination weights (ACTION_WEIGHTS)**

| Group | Weights |
|---|---|
| Strong positive | repost 1.2, favorite 1.0, quote 1.0, share 1.0 |
| Medium positive | reply 0.9, followAuthor 0.5, shareDM 0.4, shareCopy 0.4, dwell 0.3 |
| Weak positive | click 0.25, photoExpand 0.2, profileClick 0.15 |
| Negative (inactive) | notInterested −1.2, block −2.0, mute −1.5, report −2.5 |

**Diversity attenuation.** After weighted scoring, items are sorted and the k-th item from the same author in a page is multiplied by `0.45·0.85ᵏ + 0.55` — the second post scores ≈93%, the third ≈88%, asymptotically approaching the 55% floor, keeping single-author floods out while never fully suppressing a prolific writer.

## 3.9 Moderation Engine Design

`moderationService.js` implements a lexical safety scorer (Figure 3.15). Input text is normalised twice — HTML-stripped plain text and a leetspeak-deobfuscated variant (@→a, 0→o, 1/!→i, 3→e, +→t) — then evaluated against five category dictionaries (sexist, sexual, explicit, 18+/adult, racist/hate), each with *severe* and *moderate* regex tiers. A category score (0–100) combines hit counts and tier severity; the overall score is `max·0.85 + mean(others)·0.15`, deliberately dominated by the worst category. Grades: **CRITICAL ≥70**, **FLAGGED ≥40 or any label**, **MILD ≥20**, else **CLEAN**. Results persist on the submission (score, grade, labels, matched terms per category) and feed three consumers: the review queue (human context), the feed's `moderationVisibilityFilter`, and the Machine Audits dashboard (aggregate counts, rescan).

![Figure 3.15 — Moderation scoring flow](figures/moderation-flow.png)

**Scoring mechanics.** Within `evaluateCategory`, pattern hits are weighted by tier and location: a *severe* match in title/tags contributes 45 points per hit (30 in body), a *moderate* match 20 (10 in body) — the rationale being that a slur in a title or tag is a stronger intent signal than one in a body quotation. Category scores cap at 100 and flag at ≥30. Deduplication of matched terms (a `Set`) means repeated identical hits are recorded once as evidence while still counting toward the score.

**Table 3.20 — Moderation scoring weights**

| Tier | Location | Points per match | Flag threshold |
|---|---|---|---|
| severe | title / tags | 45 | score ≥ 30 → category flagged |
| severe | body | 30 | |
| moderate | title / tags | 20 | |
| moderate | body | 10 | |

**Table 3.21 — Grade boundaries**

| Grade | Condition | Consequence |
|---|---|---|
| CRITICAL | overall ≥ 70 | hidden from feeds; visible to reviewers |
| FLAGGED | overall ≥ 40 or any category label | hidden from feeds; reviewer attention |
| MILD | overall ≥ 20 | visible; surfaced in audit view |
| CLEAN | else | unrestricted |

The design knowingly trades coverage for transparency: lexical approaches are interpretable and auditable (every flag shows its matched terms — important in an educational deployment) but miss paraphrased hate speech, a limitation quantified in §4.7 and discussed against the literature (Schmidt & Wiegand, 2017; Gorwa et al., 2020).

**Worked example.** Consider a story whose body contains one severe-tier explicit term and one moderate-tier explicit term, with clean title and tags (the TC-M02 case). Per the weights of Table 3.20: rawScore = 30 (severe body) + 10 (moderate body) = 40 in the EXPLICIT category, capped at 40 (< 100, no clamping) → category flagged at ≥30 → label `EXPLICIT` attached. Composite: overallScore = round(40 × 0.85 + (0+0+0+0)/4 × 0.15) = 34. Grade resolution (Table 3.21): overall 34 is below the FLAGGED threshold of 40, *but* a non-empty labels array forces FLAGGED regardless — a deliberately conservative rule, since any flagged category means a human must see the item. The resulting record — `{grade: FLAGGED, overallScore: 34, labels: [EXPLICIT], matches: [...], categoryScores: {EXPLICIT: 40}}` — is exactly what the review queue renders. Two properties of the arithmetic are worth noting: title/tag matches weigh 1.5–2× body matches (45/30, 20/10), reflecting that framing vocabulary signals intent more strongly than incidental body text; and the 85/15 composite means residual categories can only ever contribute 15 points — a single severe category dominates, matching the "severity over breadth" triage intuition.

**Design rationale and known limits.** Three properties motivated the lexicon-plus-pattern design over an external classifier: (1) *inspectability* — every flag decomposes to named terms, categories and weights, which a human reviewer can verify; (2) *zero external dependency* — no API quota, latency, or data-sharing concern; (3) *determinism* — identical input always yields identical grade, making test cases reproducible. The design's limits are equally explicit and are stated here rather than discovered later: coverage is bounded by dictionary vocabulary (a slur or coded phrase outside the lexicon scores zero — the failure demonstrated by TC-M04); context is invisible (quoting a term for criticism is indistinguishable from using it); and only the five configured categories exist — spam, harassment-targeting and non-toxicity harms are out of scope. These limits justify the architecture choice to treat machine output as *triage for human review* rather than an autonomous decision, and they define the concrete extension path in §5.3.

## 3.10 Component, Deployment and Network Design

Figure 3.16 maps the frontend's module structure — lazy pages, shared components, the Redux store, hooks, and the axios service layer — to the API. Figure 3.17 shows deployment: Vercel serves the static SPA (with SPA rewrites to `index.html` for client routing), Render hosts the stateless Node process, Atlas the database, Cloudinary the media. Figure 3.18 depicts the PWA app-shell/service-worker relationship, and Figure 3.19 the site map as routed (including legacy redirects preserving old `/blog`, `/categories`, `/tags` URLs). Figure 3.20 shows the media upload pipeline's dual-storage strategy.

![Figure 3.16 — Component diagram](figures/component-diagram.png)
![Figure 3.17 — Deployment diagram](figures/deployment.png)
![Figure 3.18 — PWA service worker](figures/pwa-sw.png)
![Figure 3.19 — Site map / routing tree](figures/sitemap.png)
![Figure 3.20 — Media upload pipeline](figures/upload-pipeline.png)

**Component model.** Figure 3.16 (component diagram) shows the deployable decomposition: the SPA package (routes, slices, components, services layer) communicates with the API package (middleware chain → routers → controllers → services → models) over JSON/HTTP only — there is no shared code or shared memory between tiers, which is what permits independent deployment and the multi-client roadmap. The recommendation service is the only component with an internal pipeline structure; everything else follows the standard controller-model shape.

**Deployment model.** Figure 3.17 shows the physical mapping: the SPA as a static build behind a CDN edge, the API as a Node service, Atlas for persistence, Cloudinary for media. Development collapses the same topology onto one host — Vite serves the SPA and proxies `/api` to Express — so dev and production differ only in hosting, not architecture.

## 3.11 Security Design

Defence in depth operates at three levels (Figure 3.21): (1) **client guards** — `ProtectedRoute`/`PublicRoute`/`AdminRoute` enforce the authentication state machine before rendering; (2) **server guards** — `protect` verifies the JWT and hydrates `req.user`, then role middleware (`isReviewer`, `isAuthorOrAdmin`, admin checks) gates privileged routes — every authorisation decision is server-side; (3) **data layer** — bcrypt hashing (cost 10), Mongoose schema validation, and unique indexes. JWTs are stateless bearer tokens; the server stores no sessions, matching the horizontal-scaling NFR.

![Figure 3.21 — Authorisation flow](figures/authz-flow.png)

**Threat model summary.** The design considers five threat classes. (1) *Credential theft*: mitigated by bcrypt (10-round salting) and password exclusion from serialised output — a database leak yields hashes, not passwords. (2) *Session hijacking*: JWTs carry 30-day expiry and are transmitted as Bearer headers; the remaining exposure (XSS exfiltration of localStorage tokens) is mitigated by output encoding at the React layer, which escapes rendered content by default. (3) *Privilege escalation*: role checks are enforced per-route server-side (§4.7.5 TC-SEC03/04), never trusted to client UI state. (4) *Injection*: Mongoose parameterised queries and express-validator input schemas prevent both NoSQL injection and malformed-state writes. (5) *Content attacks*: the moderation engine addresses harmful content, while React's escaping handles stored-XSS in user-authored rich text rendered via sanitised HTML. No mechanism is presented as complete; the design goal is defence in depth commensurate with a student-community deployment.

**Authorisation flow.** Figure 3.21 traces the decision chain: every request first resolves identity (`protect` or `optionalAuth`), then the route's guard predicates evaluate — ownership (`isAuthorOrAdmin` compares `req.user._id` to the resource's author), role (`isReviewer`, `isAdmin` check `req.user.role`), and resource state (e.g., drafts visible only to author). The design principle is *authorisation at the boundary, never in the UI*: client route guards mirror the server checks for UX, but every server decision stands alone — the property verified by TC-SEC03/04 hitting the API directly.

## 3.12 Hardware and Software Requirements

**Table 3.22 — Requirements**

| Layer | Minimum |
|---|---|
| Server | Node.js ≥18, 512 MB RAM, any Linux container (Render free tier used); MongoDB Atlas M0 |
| Client | Modern browser (Chrome/Firefox/Safari), ~4 MB app bundle, optional PWA install |
| Dev environment | VS Code, pnpm/npm, Git; Vite dev server :5173, API :5005 |
| External services | Cloudinary free tier; optional local-disk uploads |

## 3.13 Supplementary Behavioural Diagrams

Two further traces complete the behavioural model. Figure 3.22 details the onboarding handshake designed in §3.7.3: the `pending-*` assignment at registration, the router's confinement of incomplete accounts, the live `check-username` availability call, the profile commit that clears the flag, and the restored original destination — the full state-A→B→C transition as timed interactions. Figure 3.23 decomposes the review decision itself: the queue item rendered with its machine record, the three human exits (approve / request revisions / defer), the mandatory note, the author's resubmission path with its fresh machine rescan, and the published state opening the item to every reader's candidate pools.

![Figure 3.22 — Sequence: onboarding gate and username claim](figures/seq-onboarding.png)
![Figure 3.23 — Activity: review decision and resubmission loop](figures/activity-review.png)

Three further views complete the structural model. Figure 3.24 is the class model of the persistence layer — the six Mongoose schemas with their principal fields and the relationships that the ER diagram abstracts: note `toJSON()` on User (the password-stripping serialiser), the `draftOf` self-reference on Submission, and the embedded replies array on Comment. Figure 3.25 refines the governance and distribution processes of DFD-1 (P3/P4) into their data flows — the only diagram showing explicitly that machine scan feeds P3 and that D3 interactions join D2 inside P4 for both feeds and recommendations. Figure 3.26 explodes the recommendation service into its actual module structure — the orchestrator, context hydrator, two sources, six filters, two hydrators, three scorers, selector and parameter file — showing that the pipeline's 16 stages are a decomposition of one bounded component, not a distributed system.

![Figure 3.24 — Class diagram: persistence model](figures/class-diagram.png)
![Figure 3.25 — DFD Level 2: governance and distribution](figures/dfd2.png)
![Figure 3.26 — Recommendation service internal structure](figures/component-rec.png)

Two final structural views close the design model. Figure 3.27 decomposes the SPA into its internal layers — router/guards, lazy pages, shared components, the four-slice store, the axios service layer, and the theme/hooks layer — showing the single outward dependency on the API over JSON. Figure 3.28 is the compose activity as the writer experiences it: optional cover upload, then the two-submit fork whose publish branch runs moderation synchronously before the story enters PENDING_REVIEW — the branch point the state machine of Figure 3.5 abstracts.

![Figure 3.27 — SPA component layers](figures/component-frontend.png)
![Figure 3.28 — Activity: compose and submit](figures/activity-compose.png)

## 3.14 Alternative Designs Considered

Design decisions were made against explicit alternatives; the rejected options are recorded for completeness.

| Decision | Chosen | Alternatives rejected | Rationale |
|---|---|---|---|
| Persistence | MongoDB/Mongoose | PostgreSQL; Firebase | Document model fits heterogeneous content + embedded moderation subdocs; team's existing Atlas deployment; single-language stack |
| API style | REST/JSON | GraphQL; RPC | Predictability, tooling, and the bounded query surface (Appendix B); GraphQL's flexibility unneeded at this scale |
| Auth | stateless JWT | server sessions; OAuth-only | Sessions add server state inconsistent with multi-client roadmap; OAuth defers identity to third parties the institution does not control |
| Feed | heuristic Home-Mixer adaptation | trained model; pure chronological | Training data does not exist; chronological is the baseline the design improves on, not a peer |
| Moderation | deterministic lexicon | Perspective API; no moderation | Opaque service fails the explainability requirement; unmoderated fails the curation requirement |
| Frontend | React SPA + Redux | server-rendered; Vue | Frequent interaction favours SPA; Redux's single store simplifies the auth + feed coordination |
| Delivery | Vite + PWA | native app; Electron | Zero install friction for the target users; installable via PWA anyway |

**Design completeness check.** Every behavioural requirement in Table 3.2 is covered by at least one diagram or table in this chapter: the two state machines cover auth/onboarding and the editorial lifecycle; the four sequence diagrams cover the highest-value interactions; the DFD set covers data movement; the schema tables cover persistence completely (all six collections, every field); and the two algorithm sections specify the engines to implementation precision — pseudocode, parameters, and worked examples included. The reader can implement every subsystem from this chapter alone, which is the standard the design stage of a waterfall lifecycle must meet.

## 3.15 Chapter Summary

This chapter specified KBlog end-to-end: 20 functional and 9 non-functional requirements; a three-tier architecture; validated input/output contracts; a six-collection database with query-driven indexing; use-case, activity, sequence, DFD, component and deployment models; and the two intellectual cores — the staged recommendation pipeline and the lexical moderation engine. Chapter Four reports the implementation built to this design and its empirical evaluation.
