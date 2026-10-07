# Final Authenticated KBlog Architecture Audit

This document establishes the definitive Information Architecture (IA) and state rules for KBlog. It acts as the product blueprint before any visual implementation begins.

---

### A. Public Information Architecture
The unauthenticated experience exists solely to explain the product and convert visitors.
* **`/`** - KBlog Public Landing Page (Hero, Value proposition, CTA)
* **`/about`** - Our Story / Mission
* **`/membership`** - Membership tiers
* **`/contact`** - Support
* **`/auth/login`** - Sign in
* **`/auth/signup`** - Register account

---

### B. Authenticated Information Architecture
Once authenticated (and username is set), the user enters the application workspace.
* **`/` (Authenticated Home):** The personalized reading feed.
* **`/explore`:** Deliberate discovery (Search, Categories, Trending).
* **`/bookmarks`:** The user's saved reading list.
* **`/me/stories`:** The writer's workspace (Drafts, Published, Pending Review).
* **`/write`:** The editor interface.
* **`/settings`:** Private account configuration.
* **`/@:username`:** The public author profile.

---

### C. Final Sidebar
The sidebar will be stripped of its SaaS "dashboard" feel and reorganized around reading and writing. Account settings will be moved to a User Dropdown at the bottom of the sidebar.

**Primary CTA:**
* **[ Write ]** (Prominent button)

**Navigation:**
* Home
* Explore
* Bookmarks
* My Stories

**Role-Specific (Hidden for standard users):**
* Pending Reviews (Reviewers)
* Platform Admin (Admins)

**Bottom/Footer:**
* User Profile Dropdown (Settings, Sign Out)

---

### D. Authenticated Home
**Purpose:** Help someone read and discover KBlog content.
**Structure:**
* **"For You" / Latest Feed:** A continuous, editorial-style list of articles. Uses strong typography, abstract previews, author attribution, and read times.
* **No boxed cards everywhere:** Articles should flow naturally like a publication, rather than looking like admin widgets.
* **Right/Secondary Column (Optional):** "Recommended Categories" or "Writers to Follow" to aid discovery without cluttering the main feed.

---

### E. Writer Experience
"My Stories" will become a unified workspace replacing fragmented management pages.
* **`/me/stories`** will feature three distinct tabs: `Drafts`, `Published`, and `In Review`.
* **`/write`** will be a distraction-free Editor view. It should not contain the main sidebar, allowing the writer to focus purely on content creation.

---

### F. Account/Profile Experience
These two concepts must be permanently separated:
* **Settings (`/settings`):** Private. Where the user changes their email, password, and UI preferences.
* **Public Profile (`/@:username`):** Public-facing page displaying the author's published stories, bio, and avatar.

---

### G. Username State Machine
Username selection is a hard invariant. The flow is:
1. **Sign Up** -> Account created with `hasValidUsername = false`.
2. **Mandatory Setup** -> Redirected to `/onboarding/username`. User chooses an `@username`.
3. **Optional Personalization** -> Redirected to `/onboarding/interests`. Can be skipped.
4. **KBlog Home** -> Enters `/`.

---

### H. Route Protection Logic
The router must enforce the following strict rules:
* **State A (Unauthenticated):** Access to Public IA. Redirected to `/auth/login` if attempting to access Authenticated IA.
* **State B (Authenticated + No Username):** Forced to `/onboarding/username`. If they try to manually visit `/bookmarks` or `/explore`, the router captures the destination, redirects to `/onboarding/username`, and upon completion, returns them to their intended destination.
* **State C (Authenticated + Username):** Full access to Authenticated IA.

---

### I. Pages to Remove or Consolidate
* **Remove `/blog` (Repository):** The concept of a raw repository is redundant. Its feed will become Authenticated Home (`/`).
* **Remove `/trending` & `/categories` (Standalone):** These will be consolidated into the new `/explore` hub.
* **Remove `/my-submissions`:** Consolidated into `/me/stories`.
* **Remove `/onboarding` (Monolith):** Split into strict `/onboarding/username` and optional `/onboarding/interests`.

---

### J. Pages Requiring Redesign (Prioritized)
Implementation will follow this exact order:
1. **`App.tsx` & `ProtectedRoute.tsx`:** Implement the State B routing guard.
2. **`/onboarding/username`:** Build the mandatory identity gate.
3. **`Sidebar.tsx`:** Refactor the navigation to match the new IA and add the User Dropdown.
4. **`/` (Authenticated Home):** Redesign from the public landing page to the editorial feed.
5. **`/explore`:** Build the consolidated discovery hub.
6. **`/me/stories`:** Build the tabbed writer workspace.
