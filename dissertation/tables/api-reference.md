# KBlog REST API Reference (auto-generated from server/routes)

| Method | Endpoint | Access | Handler |
|---|---|---|---|
| GET | /api/auth/check-username | auth | `checkUsernameAvailability` |
| POST | /api/auth/login | public | `loginUser` |
| GET | /api/auth/profile | auth | `getUserProfile` |
| PUT | /api/auth/profile | auth | `updateUserProfile` |
| POST | /api/auth/register | public | `registerUser` |
| GET | /api/categories | public | `getCategories` |
| PUT | /api/comments/:id | auth | `updateComment` |
| DELETE | /api/comments/:id | auth | `deleteComment` |
| POST | /api/comments/:id/like | auth | `toggleLikeComment` |
| POST | /api/comments/:id/replies | auth | `addReply` |
| POST | /api/comments/:id/replies/:replyId/like | auth | `toggleLikeReply` |
| GET | /api/submissions | opt-auth | `getSubmissions` |
| POST | /api/submissions | auth | `createSubmission` |
| GET | /api/submissions/:id | opt-auth | `getSubmissionById` |
| PUT | /api/submissions/:id | auth, author/admin | `updateSubmission` |
| DELETE | /api/submissions/:id | auth, author/admin | `deleteSubmission` |
| GET | /api/submissions/:id/comments | public | `getComments` |
| POST | /api/submissions/:id/comments | auth | `addComment` |
| POST | /api/submissions/:id/interact | auth | `interactSubmission` |
| POST | /api/submissions/:id/moderate | auth, reviewer+ | `moderateSingleSubmission` |
| POST | /api/submissions/:id/repost | auth | `toggleRepostSubmission` |
| PUT | /api/submissions/:id/status | auth, reviewer+ | `updateSubmissionStatus` |
| GET | /api/submissions/feed | opt-auth | `getSocialFeed` |
| GET | /api/submissions/moderation/audit | auth, reviewer+ | `getModerationAudit` |
| POST | /api/submissions/moderation/rescan-all | auth, reviewer+ | `rescanAllSubmissions` |
| GET | /api/submissions/popular/tags | public | `getPopularTags` |
| GET | /api/submissions/search/explore | opt-auth | `searchExplore` |
| POST | /api/submissions/upload | auth, upload | `inline` |
| GET | /api/users | auth | `inline` |
| GET | /api/users/:id | auth | `inline` |
| PUT | /api/users/:id | auth | `inline` |
| DELETE | /api/users/:id | auth | `inline` |
| POST | /api/users/:id/follow | auth | `inline` |
| PATCH | /api/users/:id/status | auth | `inline` |
| GET | /api/users/:identifier/comments | public | `inline` |
| GET | /api/users/:identifier/followers | opt-auth | `inline` |
| GET | /api/users/:identifier/following | opt-auth | `inline` |
| GET | /api/users/:identifier/likes | public | `inline` |
| GET | /api/users/:identifier/posts | public | `inline` |
| GET | /api/users/:identifier/reposts | public | `inline` |
| GET | /api/users/authors | public | `inline` |
| GET | /api/users/bookmark-folders | auth | `inline` |
| PUT | /api/users/bookmark-folders | auth | `inline` |
| DELETE | /api/users/bookmark-folders/:folderName | auth | `inline` |
| GET | /api/users/bookmarks | auth | `inline` |
| GET | /api/users/featured-authors | opt-auth | `inline` |
| GET | /api/users/profile/:identifier | opt-auth | `inline` |
| GET | /api/users/search | public | `inline` |
| POST | /api/users/upload | auth, upload | `inline` |
