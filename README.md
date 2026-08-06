# Lead CRM

A simple, self-hosted CRM for managing leads with a Business Development team.

- **Admins** upload leads (CSV or one-by-one), assign them to BD reps, and see everything.
- **BD reps** log in and see only the leads assigned to them, move each through the pipeline, and log notes and follow-ups.
- **Pipeline:** New → Contacted → Qualified → Won / Lost.

Built with Next.js and Supabase. Both have free tiers that comfortably cover a small team. Total hosting cost: **$0**.

---

## What you'll set up (about 20 minutes, no coding required)

1. A **Supabase** project — your database and logins (free).
2. A **Vercel** project — hosts the app (free).

You'll copy two keys from Supabase into Vercel. That's the only "technical" part.

---

## Step 1 — Create the database (Supabase)

1. Go to **https://supabase.com** → sign up → **New project**.
2. Give it a name, set a database password (save it somewhere), pick a region near your team, and create it. Wait ~2 minutes for it to finish provisioning.
3. In the left sidebar open **SQL Editor** → **New query**.
4. Open the file **`supabase/schema.sql`** from this project, copy **all** of it, paste it into the editor, and click **Run**. You should see "Success. No rows returned."
5. In the left sidebar open **Project Settings** (gear icon) → **API**. Keep this tab open — you'll need two values in Step 3:
   - **Project URL**
   - **anon public** key (under "Project API keys")

### Turn off email confirmation (recommended for a small internal team)

So your reps can sign in immediately without a confirmation email:

- **Authentication** → **Sign In / Providers** → **Email** → turn **Confirm email** off → Save.

(If you leave it on, each person must click a confirmation link before their first sign-in. Either works.)

---

## Step 2 — Put the code on GitHub

Vercel deploys from a GitHub repo.

1. Create a free account at **https://github.com** if you don't have one.
2. Create a **new repository** (name it e.g. `lead-crm`).
3. Upload this project's files to it. Easiest path if you're not using git:
   - On your new empty repo page, click **uploading an existing file**.
   - Drag in all the files and folders from this project **except** `node_modules` and `.next` (you don't need those — they're rebuilt automatically).
   - Commit.

> Prefer the command line? From this folder:
> ```
> git init && git add . && git commit -m "Lead CRM"
> git branch -M main
> git remote add origin https://github.com/YOUR_USERNAME/lead-crm.git
> git push -u origin main
> ```

---

## Step 3 — Deploy (Vercel)

1. Go to **https://vercel.com** → sign up **with GitHub**.
2. **Add New… → Project** → import the `lead-crm` repo.
3. Before clicking Deploy, expand **Environment Variables** and add these two (from Step 1.5):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | your Project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon public key |

4. Click **Deploy**. After a minute or two you'll get a live URL like `https://lead-crm-xxxx.vercel.app`.

---

## Step 4 — First login = admin

1. Open your Vercel URL and click **Create one** to make an account.
2. **The very first account created automatically becomes the admin.** Make sure that's you.
3. Share the same URL with your BD reps. When they sign up, they join as **BD reps** and only see leads you assign to them. You can promote anyone to admin later from the **Team** page.

---

## Using it day to day

- **Add leads** (admin): *Add leads* → *Import CSV* (any spreadsheet with a header row — the columns are matched automatically, and you confirm the mapping) or *Add one* for a single lead.
- **Assign**: on the *Leads* table or a lead's page, pick a rep from the "Assigned to" dropdown.
- **Work the pipeline**: change a lead's status right from the table, or open a lead to edit details, set a **next follow-up date**, and log **notes**.
- **Dashboard**: pipeline counts, won value, and follow-ups due — scoped to what each person is allowed to see.

---

## Running it locally (optional)

```
npm install
cp .env.local.example .env.local     # then paste your two Supabase keys into it
npm run dev                          # open http://localhost:3000
```

---

## A note on the free tiers

Supabase's free tier pauses a project after a stretch of inactivity — one visit wakes it back up. For a team using it regularly this won't come up. If you outgrow the free tiers, both services scale up cheaply, and nothing about your data or setup has to change.

## Common questions

- **A rep says they see no leads.** They only see leads *assigned to them*. Assign some from the Leads table.
- **"Import failed" on CSV.** Make sure the file is a `.csv` with a header row, and that the **Name** column is mapped (it's required).
- **Forgot who's admin / need another admin.** Any admin can open **Team** and promote a rep.
