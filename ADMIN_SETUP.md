# Admin panel — one-time setup (≈ 10 minutes)

The admin panel stores everything (text, photos, destinations, packages, services, enquiries, team) in a free
[Supabase](https://supabase.com) project. Do this once; after that the owner manages the site entirely from
`https://<your-site>/admin`.

## 1. Create the Supabase project

1. Sign up at <https://supabase.com> → **New project** (free plan is fine). Pick a region close to India (e.g. Mumbai).
2. Wait for it to finish provisioning.

## 2. Create the database

1. Open `supabase/setup.sql` from this repository.
2. On the **last line**, replace `owner@example.com` with the owner's real email address.
3. Supabase dashboard → **SQL Editor** → **New query** → paste the whole file → **Run**.
   You should see "Success. No rows returned". (Running it again later is safe.)

## 3. Allow sign-in links back to your site

Supabase dashboard → **Authentication → URL Configuration**:

- **Site URL**: `https://rockyjaat47.github.io/skyhigh-travel/`
- **Redirect URLs** → add `https://rockyjaat47.github.io/skyhigh-travel/admin/` (with the trailing slash) and, for local
  work, `http://localhost:5173/admin/`

Optional but recommended: **Authentication → Providers → Email** → turn **off** "Allow new users to sign up".
Invites from the admin Team page still work because they're sent by an owner.

> The free Supabase email sender is limited to a few emails per hour. For a team, add your own SMTP under
> **Authentication → Emails → SMTP settings** (e.g. Zoho, Gmail Workspace, Brevo).

## 4. Connect the website

Supabase dashboard → **Project Settings → API** → copy **Project URL** and the **anon / public** key.
(Never use the `service_role` key in this project.)

Then in a terminal inside this repository:

```bash
gh secret set VITE_SUPABASE_URL --repo rockyjaat47/skyhigh-travel
```

```bash
gh secret set VITE_SUPABASE_ANON_KEY --repo rockyjaat47/skyhigh-travel
```

(Each command asks you to paste the value.) Or add them in GitHub → repository → **Settings → Secrets and variables →
Actions → New repository secret**.

Redeploy: GitHub → **Actions → Build & deploy to GitHub Pages → Run workflow** (or push any commit).

## 5. First sign-in

1. Open `https://rockyjaat47.github.io/skyhigh-travel/admin`.
2. Enter the owner email from step 2 → **Email me a sign-in link** → open the link from your inbox.
3. You're in as **Owner**. Go to **Destinations**, **Packages** and **Services** and click **Import starter content**
   once on each, so the existing content becomes editable.
4. Invite staff from **Team** (Editor = can edit everything; Owner = can also delete and manage the team).

Done. Every change saved in the admin appears on the live website immediately — no rebuild needed.

---

### What lives where

| Thing | Stored in |
| --- | --- |
| Page text, headings, FAQ, legal, contact details, SEO | `site_settings` table |
| Destinations, packages, services | `destinations`, `packages`, `services` tables |
| Uploaded photos | Storage bucket `media` (public read, team-only upload) |
| Enquiries from the website form | `enquiries` table (public can only *submit*, never read) |
| Team & roles | `admin_users`, `admin_invites` |

Security is enforced in the database (Row Level Security), not in the browser. The anon key is safe to publish — it
can only do what the policies allow.

### Backups

Supabase free projects pause after a week of no visits and have limited backups. Before going live, consider the Pro
plan, or periodically export: **Database → Backups**, and in the admin **Enquiries → Export CSV**.
