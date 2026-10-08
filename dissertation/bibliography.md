# KBlog Dissertation — Annotated Bibliography (APA 7)

Verified sources for each Chapter 2 section. Citations to be formatted APA 7th ed.
[V] = bibliographic details verified via web during research phase.

## 2.1 Digital publishing & blogging platforms

- Doctorow, C. (2023). The "enshittification" of platforms — platform decay lifecycle. (Pluralistic blog / *The Internet Con*, Verso.) — motivation for independent/creator-owned platforms.
- Blood, R. (2000). Weblogs: A history and perspective. *Rebecca's Pocket*. — foundational history of blogging.
- Rosen, J. (2006). The people formerly known as the audience. *PressThink*. — shift from consumption to participation; grounds the "everyone is an author" premise.
- Statista/DataReportal Digital 2024/2025 reports — internet & social media usage statistics for Ghana/Africa (verify current edition before citing).
- Pew Research Center. Social media fact sheet (latest edition). — consumption patterns.

## 2.2 Review of existing systems (the required "similar systems" review)

- Medium — medium.com; membership paywall model; editorial curation; limitations: closed platform, monetization limits, weak local discovery. Cite: Medium Help/About pages + critical analyses (e.g., Owen, T. analyses of Medium's pivots, *OneZero*/press coverage).
- Substack — substack.com; newsletter+subscription model; strengths: direct monetization, ownership; drawbacks: email-centric, no rich feed/discovery, no editorial review. Cite: Substack About + business coverage.
- WordPress.com / Ghost — self-publishing CMS; strengths: control, extensibility; drawbacks: no built-in social graph/recommendation feed; admin overhead. Cite the "State of the Word" / Ghost documentation.
- Optional 4th: X (Twitter) Articles/long-form — shows convergence of social feed + long-form publishing that KBlog emulates.
- Comparison table to produce: discovery mechanism, moderation approach, monetization, content ownership, review workflow, recommendation personalization, PWA/mobile — columns per platform.

## 2.3 Recommender systems

- [V] Ricci, F., Rokach, L., & Shapira, B. (Eds.). (2022). *Recommender Systems Handbook* (3rd ed.). Springer US. https://doi.org/10.1007/978-1-0716-2197-4
- [V] Covington, P., Adams, J., & Sargin, E. (2016). Deep neural networks for YouTube recommendations. *Proc. 10th ACM Conf. on Recommender Systems (RecSys '16)*, 191–198. https://doi.org/10.1145/2959100.2959190 — two-stage candidate-generation → ranking; direct precedent for KBlog's pipeline.
- [V] Twitter/X Engineering. (2023). *the-algorithm* — open-sourced recommendation system. github.com/twitter/the-algorithm — Home Mixer stages (candidate generation → feature hydration → scoring → filters/heuristics → mixing). KBlog's pipeline is a deliberate small-scale adaptation; cite repo + Twitter Engineering blog post "Twitter's Recommendation Algorithm" (March 31, 2023).
- Koren, Y., Bell, R., & Volinsky, C. (2009). Matrix factorization techniques for recommender systems. *Computer*, 42(8), 30–37. — classic CF baseline.
- Resnick, P., & Varian, H. R. (1997). Recommender systems. *Communications of the ACM*, 40(3), 56–58. — founding definition.
- Burke, R. (2002). Hybrid recommender systems: Survey and experiments. *User Modeling and User-Adapted Interaction*, 12, 331–370. — hybrid approaches; KBlog blends content-based (tag/category overlap) + social (in-network) signals.
- Schein, A. I., Popescul, A., Ungar, L. H., & Pennock, D. M. (2002). Methods and metrics for cold-start recommendation. *SIGIR '02*. — cold-start; relevant to KBlog's interest-onboarding step.
- Sharma, A., et al. / or Narayanan, A. (2023). "How Twitter's algorithm works" analyses — use for interpreting the open-source release (verify specific source).

## 2.4 Content moderation

- [V] Gorwa, R., Binns, R., & Katzenbach, C. (2020). Algorithmic content moderation: Technical and political challenges in the automation of platform governance. *Big Data & Society*, 7(1). https://doi.org/10.1177/2053951719897945
- [V] Jigsaw/Google. *Perspective API* documentation — ML toxicity probability scoring (note: service announced for sunset after 2026 — a point for the lit review on tool longevity). developers.perspectiveapi.com
- Gillespie, T. (2018). *Custodians of the Internet*. Yale University Press. — moderation as constitutive platform function.
- Schmidt, A., & Wiegand, M. (2017). A survey on hate speech detection using NLP. *Proc. LAW @ EACL*, 1–10. — lexicon vs ML approaches; supports KBlog's lexicon choice & its limits.
- Grimmelmann, J. (2015). The virtues of moderation. *Yale Journal of Law & Technology*, 17. — human vs machine moderation roles; justifies hybrid machine-scan + human review design.

## 2.5 Web technologies

- Fielding, R. T. (2000). *Architectural styles and the design of network-based software architectures* (PhD diss., UC Irvine). — REST.
- [V] Jones, M., Bradley, J., & Sakimura, N. (2015). *JSON Web Token (JWT)*, RFC 7519. IETF.
- [V] Provos, N., & Mazières, D. (1999). A future-adaptable password scheme. *USENIX ATC '99*, Monterey. — bcrypt.
- MongoDB, Inc. *MongoDB data modeling / Mongoose ODM documentation*.
- React docs (react.dev), Redux Toolkit docs, Express.js docs, Vite docs — official technical references.
- Google Developers. *Progressive Web Apps / Workbox documentation*; Richard & LePage (2020), "Progressive Web Apps", *IEEE Internet Computing* or W3C manifest spec.
- Ramachandran/MDN — SPA architecture references (verify specific title).

## 2.6 Software engineering methodology & modelling (also used in Ch. 3)

- Royce, W. W. (1970). Managing the development of large software systems. *Proc. IEEE WESCON*. — original waterfall description.
- Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson. — waterfall model, requirements engineering.
- Fowler, M. (2004). *UML Distilled* (3rd ed.). Addison-Wesley. — diagram notation conventions.
- OMG. *UML 2.5.1 Specification* (2017).
- Pressman, R., & Maxim, B. (2020). *Software Engineering: A Practitioner's Approach* (9th ed.). McGraw-Hill. — requirements & testing chapters.

## 2.7 Editorial workflows & scholarly/campus publishing context

- Bornmann, L. (2011). Scientific peer review. *Annual Review of Information Science and Technology*, 45. — peer-review workflow analogue for the review queue.
- Ware, M., & Mabe, M. (2015). *The STM Report* (4th ed.). — editorial/publishing workflow norms.
- Literature on campus media/student publishing in Ghana and West Africa — TO RESEARCH during drafting (search: "student journalism Ghana universities digital media", MFWA reports, Ghana Journalists Association materials).

## Gap statement (to be developed in §2.7)
Existing platforms offer publishing *or* social discovery *or* moderation, but none combine (a) a Twitter-scale two-stage personalized feed adapted to a small community corpus, (b) a machine-first/human-second hybrid safety workflow embedded in an editorial review state machine, and (c) a campus/community-oriented publishing context — delivered as an installable PWA. KBlog's contribution is the integration and honest engineering evaluation of these mechanisms at modest scale.
