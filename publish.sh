#!/usr/bin/env bash
# One-shot publisher: creates the GitHub repo and pushes this folder to it.
# Usage:  bash publish.sh
#
# Tries the GitHub CLI first (gh). If gh isn't installed, falls back to
# prompting for a GitHub Personal Access Token with `repo` scope.

set -euo pipefail

REPO_NAME="real-books-for-real-kids"
VISIBILITY="public"   # change to "private" if you'd rather keep it private

cd "$(dirname "$0")"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Error: this folder isn't a git repo. Re-run init first."
  exit 1
fi

# Clean up any stale lock files left behind by the sandbox.
rm -f .git/index.lock .git/HEAD.lock .git/objects/maintenance.lock 2>/dev/null || true
find .git/objects -name "tmp_obj_*" -type f -delete 2>/dev/null || true

if [[ -z "$(git log --oneline 2>/dev/null)" ]]; then
  echo "Error: no commits yet. Make a commit first."
  exit 1
fi

# Include this publish script itself in the repo if it isn't already tracked.
if ! git ls-files --error-unmatch publish.sh >/dev/null 2>&1; then
  git add publish.sh
  git commit -q -m "Add publish.sh one-shot publisher" || true
fi

# --- Path 1: gh CLI ---------------------------------------------------------
if command -v gh >/dev/null 2>&1; then
  echo "Found gh CLI."
  if ! gh auth status >/dev/null 2>&1; then
    echo "Logging you into GitHub (browser will open) ..."
    gh auth login -h github.com -p https -w
  fi
  echo "Creating $REPO_NAME on GitHub and pushing ..."
  gh repo create "$REPO_NAME" --"$VISIBILITY" --source=. --remote=origin --push
  USER=$(gh api user --jq .login)
  echo ""
  echo "✓ Published: https://github.com/$USER/$REPO_NAME"
  echo "  GitHub Pages will go live at: https://$USER.github.io/$REPO_NAME/"
  echo "  (Settings → Pages → Source: GitHub Actions — usually auto-detected)"
  exit 0
fi

# --- Path 2: Personal Access Token ------------------------------------------
echo "gh CLI not found. Falling back to token-based push."
echo ""
echo "Open https://github.com/settings/tokens/new in your browser."
echo "  • Note:    'real-books deploy'"
echo "  • Scope:   check 'repo'  (only)"
echo "  • Expiry:  30 days is plenty"
echo "Click 'Generate token' and copy the token (starts with ghp_)."
echo ""
read -srp "Paste token: " TOKEN
echo ""
read -p  "Your GitHub username: " USER

echo "Creating $REPO_NAME on GitHub ..."
PRIVATE=$([[ "$VISIBILITY" == "private" ]] && echo true || echo false)
curl -sSf -X POST \
  -H "Authorization: token $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/user/repos \
  -d "{\"name\":\"$REPO_NAME\",\"private\":$PRIVATE,\"description\":\"AI-powered digital picture book platform for kids ages 0–6\"}" \
  >/dev/null

echo "Pushing ..."
git remote remove origin 2>/dev/null || true
git remote add origin "https://$USER:$TOKEN@github.com/$USER/$REPO_NAME.git"
git push -u origin main
# Replace the credential-bearing remote with a clean URL.
git remote set-url origin "https://github.com/$USER/$REPO_NAME.git"

echo ""
echo "✓ Published: https://github.com/$USER/$REPO_NAME"
echo "  GitHub Pages will go live at: https://$USER.github.io/$REPO_NAME/"
echo ""
echo "One-time Pages setup (only needed once):"
echo "  Open the repo → Settings → Pages → Source: 'GitHub Actions'."
echo "  The deploy.yml workflow will then build and publish on every push."
