# Vercel Deployment Guide

Vercel is the native home for Next.js and the easiest way to get your new design live on `checkitsa.co.za`.

## Step 1: Install Vercel CLI
Run this in your terminal:
```bash
npm install -g vercel
```

## Step 2: Login
```bash
vercel login
```
*(This will open your browser to log in).*

## Step 3: Deploy
Run this in your project folder:
```bash
vercel
```
- **Set up and deploy?** [Y/n] `y`
- **Which scope?** (Select your name)
- **Link to existing project?** [y/N] `n`
- **What’s your project’s name?** `checkitsa`
- **In which directory?** `./`
- **Want to modify settings?** [y/N] `n`

## Step 4: Promote to Production
Once you've checked the preview URL and it looks good, run:
```bash
vercel --prod
```

---

### ⚠️ IMPORTANT: Database Fix
The current Login/Signup/Reports code is built for Cloudflare D1. It will **not work** on Vercel yet. 

**Next Steps**:
1. Run the steps above to get your **New Design** live.
2. Send me your **Supabase Project URL and API Key** (I'll show you where to get them) and I will update the code to make the database work again!
