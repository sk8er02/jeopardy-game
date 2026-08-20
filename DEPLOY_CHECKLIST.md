# 🎯 Your Deployment Checklist

You have GitHub + Vercel already connected. This is the fast path.

---

## ✅ Pre-Flight Check

- [ ] You have a GitHub account (authenticated with Vercel)
- [ ] You have a Vercel account (connected to GitHub)
- [ ] You're about to get an Anthropic API key

---

## 🔑 Step 1: Get Your OpenRouter API Key (1 min)

1. Go to: **https://openrouter.ai/**
2. Sign in (or create free account)
3. Click **"Keys"** (top right menu)
4. Your API key is already there or click **"Create Key"**
5. **Copy the key** (looks like: `sk-or-v0-xxx...`)
6. **Paste it somewhere temporarily** (notepad, etc.)

---

## 📁 Step 2: Create GitHub Repo + Push Code (3 min)

### 2a. Create GitHub Repo

Go to: **https://github.com/new**

```
Repository name: jeopardy-game
Visibility: Public
Click: Create repository
```

### 2b. Clone & Push (copy/paste these commands)

```bash
# Clone your new repo
git clone https://github.com/YOUR_USERNAME/jeopardy-game.git
cd jeopardy-game

# Create the folder structure
mkdir -p pages/api components

# Now copy these files into this directory:
# (Get them from https://github.com/your-backup or the outputs folder)
#
# Files to copy:
# - package.json
# - pages/index.js
# - pages/api/generate-clue.js
# - components/jeopardy-game.jsx
# - .env.local.example
# - .gitignore
# - README.md

# Then run these git commands:
git add .
git commit -m "Initial commit: AI Jeopardy with STT"
git push origin main
```

**Wait for push to complete** ✅

---

## 🚀 Step 3: Deploy to Vercel (1 min)

1. Go to: **https://vercel.com/dashboard**
2. Click **"Add New"** → **"Project"**
3. You should see `jeopardy-game` in the list
4. Click on it → Click **"Import"**

### On the configure screen:

Look for **"Environment Variables"** section:

```
Variable Name: OPENROUTER_API_KEY
Value: [PASTE YOUR KEY FROM STEP 1 HERE]
```

Click **"Add"** (or similar button)

Then click **"Deploy"**

**Wait for the build** (1-2 minutes)

---

## ✨ Step 4: You're Done!

You'll see:
- ✅ **"Congratulations"** message
- 📎 A link at the top like: `https://jeopardy-game-xyz.vercel.app`

**Click that link and test it works!**

Then send it to your friend. 🎉

---

## 🎤 Test the Game

1. Pick a category/amount
2. Click "Repeat Clue" to hear it
3. Click 🎤 "Speak Answer" 
4. Say your answer
5. See it populate the text field
6. Click "Submit"

---

## 🆘 If Something Goes Wrong

| Problem | Fix |
|---------|-----|
| "Repo not showing in Vercel" | Wait 30 sec, refresh page |
| "API Key error" | Double-check you pasted it correctly |
| "Build failed" | Check Vercel logs (click the deployment) |
| "Speech not working" | Use Chrome/Edge/Safari (not Firefox) |

---

## 🎯 File Locations

All these files are in: `/mnt/user-data/outputs/`

```
outputs/
├── package.json
├── .gitignore
├── README.md
├── QUICKSTART.md
├── VERCEL_DEPLOYMENT.md
├── pages/
│   ├── index.js
│   └── api/
│       └── generate-clue.js
└── components/
    └── jeopardy-game.jsx
```

---

## Done? Share Your Link!

Once deployed, send this to your friend:

```
Hey, play this: https://jeopardy-game-YOUR_ID.vercel.app

You can speak your answers with the mic button!
```

---

**Questions? DM me or check VERCEL_DEPLOYMENT.md for detailed troubleshooting.**
