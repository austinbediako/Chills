UNIVERSITY OF GHANA

COLLEGE OF BASIC AND APPLIED SCIENCES

![](figures/X6.png){width="1.7in"}

**KBLOG: A SOCIAL PUBLISHING PLATFORM WITH PERSONALIZED FEED RECOMMENDATION, EDITORIAL REVIEW WORKFLOW AND TRANSPARENT MACHINE MODERATION**

BY

**YAKUBU ABDUL RASHID (11116448)**

\newpage

A PROJECT SUBMITTED TO THE DEPARTMENT OF COMPUTER SCIENCE IN PARTIAL FULFILMENT OF THE REQUIREMENTS FOR THE AWARD OF THE DEGREE OF BACHELOR OF SCIENCE IN COMPUTER SCIENCE

DEPARTMENT OF COMPUTER SCIENCE

**OCTOBER, 2026**

\newpage

# DECLARATION

**STUDENT**

Name: YAKUBU ABDUL RASHID     Signature: ____________     Date: 9th October 2026

**SUPERVISOR**

Name: MARK ATTAH MENSAH     Signature: ____________     Date: 9th October 2026


\newpage

# ABSTRACT

**Context:** Online publishing is dominated by platforms that either offer distribution without ownership, or ownership without discovery and governance. Communities that wish to host their own long-form discourse must assemble it from mismatched tools.

**Aim:** This project designed, implemented and evaluated KBlog, a community-scale social publishing platform integrating three capabilities absent as a combination in existing systems: a personalised "For You" feed adapted from Twitter/X's published recommendation architecture; an explicit editorial review state machine; and an automated content-moderation engine that is fully auditable and operates under human authority.

**Method:** Following the waterfall lifecycle, requirements were specified and the system designed in UML and data-flow models, then implemented as a React/Redux progressive web application backed by a stateless Express API and MongoDB Atlas, and evaluated through executed functional test cases, measured moderation outputs, API timing samples and bundle analysis on a seeded dataset of 110 published stories.

**Result:** All high-priority requirements passed their tests. The full recommendation pipeline executed in ~15 ms per request. Moderation testing quantified both correct severity discrimination and a genuine false negative (paraphrased hate speech scoring CLEAN), empirically validating the hybrid machine-triage/human-decision design.

**Conclusion:** Production feed architecture transfers meaningfully to community scale even when the learned ranking model is replaced by a transparent heuristic; and lexical moderation is defensible precisely because its measured blind spots are caught by the human editorial gate it feeds.

**Keywords:** social publishing; recommender systems; content moderation; editorial workflow; progressive web application; MERN stack

\newpage

# DEDICATION

This work is dedicated to my family, whose constant support and encouragement made this project possible, and to every student who writes and hopes to be read.

\newpage

# ACKNOWLEDGEMENT

I thank God for the strength to complete this work.

I am deeply grateful to my supervisor, **Mr. Mark Attah Mensah**, for his guidance, patience, and constructive feedback throughout this project.

My thanks go to the lecturers and staff of the Department of Computer Science for the knowledge that made this project possible, and to my friends and colleagues who tested the platform and offered honest criticism.

Finally, I thank my family for their unwavering support throughout my studies.

\newpage

[[TOC]]

\newpage

[[LOF]]

\newpage

[[LOT]]

\newpage

# LIST OF ABBREVIATIONS

| Abbreviation | Meaning |
|---|---|
| API | Application Programming Interface |
| CDN | Content Delivery Network |
| CMS | Content Management System |
| CSS | Cascading Style Sheets |
| DFD | Data Flow Diagram |
| ER | Entity–Relationship |
| HTML | HyperText Markup Language |
| IA | Information Architecture |
| JWT | JSON Web Token |
| MERN | MongoDB, Express, React, Node.js |
| NFR | Non-Functional Requirement |
| ODM | Object Document Mapper |
| PWA | Progressive Web Application |
| RBAC | Role-Based Access Control |
| REST | Representational State Transfer |
| SPA | Single Page Application |
| SUS | System Usability Scale |
| TOC | Table of Contents |
| UML | Unified Modeling Language |
| URL | Uniform Resource Locator |

\newpage
