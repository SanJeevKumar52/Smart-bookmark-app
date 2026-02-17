# Smart Bookmark App

A production-ready, realtime bookmark management application built using **Next.js, Supabase, and Google OAuth**.
This app demonstrates secure authentication, realtime database synchronization, strict row-level security, and modern full-stack architecture.

Live Demo: https://smart-bookmark-app-rho-seven.vercel.app/

---

#  Features

## Authentication

* Google OAuth login via Supabase Auth
* Secure session handling
* Automatic redirect based on auth state
* Cross-tab session synchronization handled properly

## Bookmark Management (CRUD)

* Create bookmarks
* View bookmarks
* Delete bookmarks
* User-specific data isolation

## Realtime Sync

* Instant updates across tabs, browsers, and devices
* User-scoped realtime channels
* No duplicate events
* Proper subscription lifecycle management

## Security

* Row Level Security (RLS) enabled
* Strict per-user access control
* Users cannot read or modify other users’ data

## Production Deployment

* Hosted on Vercel
* Supabase production database
* Google OAuth configured for production domain

---

#  Technical Architecture

## Frontend

* Next.js 16 (App Router)
* Supabase JS Client
* TailwindCSS

## Backend (Managed)

* Supabase Auth
* Supabase PostgreSQL
* Supabase Realtime

## Infrastructure

* Vercel (Hosting)
* Supabase (Backend as a Service)
* Google Cloud OAuth

---

#  Database Schema

## bookmarks table

| Column     | Type      | Description       |
| ---------- | --------- | ----------------- |
| id         | uuid      | Primary key       |
| title      | text      | Bookmark title    |
| url        | text      | Bookmark URL      |
| user_id    | uuid      | Owner user ID     |
| created_at | timestamp | Created timestamp |

---

#  Row Level Security Policies

Enabled policies:

### SELECT

```
auth.uid() = user_id
```

### INSERT

```
auth.uid() = user_id
```

### DELETE

```
auth.uid() = user_id
```

Ensures complete data isolation.

---

#  Realtime Implementation

Each user subscribes to their own realtime channel:

```
channel: bookmarks-{user_id}
```

Events handled:

* INSERT
* DELETE

Prevented issues:

* Cross-user data leakage
* Duplicate events
* Missing realtime updates
* Cross-tab session conflicts

---

#  Problems Faced and Solutions

During development, several real-world challenges were encountered related to authentication, realtime synchronization, database security, and production deployment. Each problem required careful debugging and architectural improvements.

---

##  Problem 1: Cross-User Data Access (Security Issue)

### Issue
Initially, all authenticated users could read and delete bookmarks belonging to other users.

### Root Cause
Row Level Security (RLS) was not enabled in Supabase, allowing unrestricted database access.

### Solution
Enabled Row Level Security and created user-specific policies:

```sql
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
ON bookmarks FOR DELETE
USING (auth.uid() = user_id);
```

###  Result
Each user can now only access their own bookmarks, ensuring complete data isolation.

---

##  Problem 2: Realtime Events Leaking Across Users

### Issue
Realtime updates from one user appeared in other users' dashboards.

### Root Cause
A global realtime channel was used:

```js
.channel("bookmarks-channel")
```

This subscribed to all database events.

### Solution
Implemented user-scoped realtime channels:

```js
.channel(`bookmarks-${user.id}`)
```

and filtered events:

```js
filter: `user_id=eq.${user.id}`
```

###  Result
Realtime updates are now securely isolated per user.

---

## Problem 3: Realtime DELETE Not Syncing Across Browsers

### Issue
Deleting a bookmark in one browser did not update other browsers in realtime.

### Root Cause
`DELETE` events were not explicitly subscribed.

### Solution
Added `DELETE` event subscription:

```js
.on("postgres_changes", {
  event: "DELETE",
  schema: "public",
  table: "bookmarks",
  filter: `user_id=eq.${user.id}`
}, handler)
```

###  Result
Delete events now sync instantly across all browsers and tabs.

---

##  Problem 4: First Realtime Event Missing

### Issue
The first bookmark insert was not reflected in realtime.

### Root Cause
Realtime subscription was initialized after the insert operation.

### Solution
Changed initialization sequence:

```
1. Get session
2. Subscribe to realtime
3. Fetch initial bookmarks
```

###  Result
All realtime events are now captured reliably.

---

##  Problem 5: Duplicate Realtime Events

### Issue
Duplicate bookmark entries appeared due to multiple subscriptions.

### Root Cause
Realtime channels were not cleaned up on component unmount.

### Solution

```js
return () => {
  supabase.removeChannel(channel);
};
```

### Result
Duplicate events were eliminated.

---

##  Problem 6: OAuth Login Failed in Production

### Issue
Google OAuth worked locally but failed in production deployment.

### Root Cause
Production domain was not configured in Google OAuth and Supabase settings.

### Solution
Added production redirect URL:

```
https://PROJECT.supabase.co/auth/v1/callback
```

Configured Supabase Site URL:

```
https://smart-bookmark-app.vercel.app
```

###  Result
Authentication works correctly in production.

---

##  Problem 7: Incorrect Page After Login

### Issue
Default Next.js page appeared after login instead of the dashboard.

### Root Cause
Root route had no authentication redirect logic.

### Solution
Added session-based redirect:

```js
if (session) router.push("/dashboard");
else router.push("/login");
```

###  Result
Correct navigation flow after login.

---

##  Problem 8: Cross-Tab Session Synchronization Issues

### Issue
Multiple tabs caused inconsistent session state.

### Root Cause
Session was not verified before initializing subscriptions.

### Solution
Ensured session readiness:

```js
const { data: { session } } =
  await supabase.auth.getSession();
```

###  Result
Session state is consistent across all tabs.

---

#  Environment Variables

Create `.env.local`

```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

#  Local Development

Install dependencies

```
npm install
```

Run dev server

```
npm run dev
```

Open

```
http://localhost:3000
```

---

# Deployment

Hosted on Vercel

Deployment Steps:

* Push to GitHub
* Import repo in Vercel
* Add environment variables
* Deploy

---

# Engineering Concepts Demonstrated

* Authentication flow design
* Realtime system design
* Database security (RLS)
* Production deployment
* OAuth integration
* State synchronization
* Event driven architecture
* Debugging distributed realtime systems

---

#  Author

Sanjeev Kumar
Full Stack Developer

GitHub: https://github.com/SanjeevKumar52

---

#  Why this project is valuable

This project demonstrates production-level skills required for:

* Full Stack Developer roles
* Realtime system development
* Secure SaaS application architecture
* Modern Next.js and Supabase integration

---

#  License

MIT License
