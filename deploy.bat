@echo off
setlocal
cd /d "%~dp0"

echo ==========================================
echo  SnapWord - Deploy to GitHub Pages
echo ==========================================
echo.

REM ---- 1. Make sure we are on main ----
for /f "delims=" %%b in ('git rev-parse --abbrev-ref HEAD') do set CUR=%%b
if not "%CUR%"=="main" (
  echo [1/5] Switching to main branch...
  git checkout main || goto :fail
) else (
  echo [1/5] Already on main
)

REM ---- 2. Commit and push source changes (if any) ----
echo [2/5] Committing source changes and pushing main...
git add -A
git diff --cached --quiet && (
  echo      No source changes, skipping commit
) || (
  git -c user.name="SnapWord Dev" -c user.email="dev@snapword.local" commit -m "Update app" || goto :fail
)
git push origin main || goto :fail

REM ---- 3. Build ----
echo [3/5] Building production bundle...
call npm run build || goto :fail

REM ---- 4. Update gh-pages via worktree (does not touch this folder) ----
echo [4/5] Updating gh-pages branch...
if exist .deploy rmdir /s /q .deploy
git worktree prune
git fetch origin gh-pages || goto :fail
git branch -f gh-pages origin/gh-pages
git worktree add --force .deploy gh-pages || goto :fail

REM Mirror dist into the worktree, but NEVER touch the .git gitfile
robocopy dist .deploy /MIR /XF .git /NFL /NDL /NJH /NJS >nul
if %errorlevel% gtr 7 (
  git worktree remove --force .deploy
  goto :fail
)
echo node_modules> .deploy\.gitignore
echo dist>> .deploy\.gitignore
type nul > .deploy\.nojekyll

pushd .deploy
git add -A
git diff --cached --quiet && (
  echo      Build output unchanged, skipping deploy commit
  popd
) || (
  git -c user.name="SnapWord Dev" -c user.email="dev@snapword.local" commit -m "Deploy to GitHub Pages" || (popd & git worktree remove --force .deploy & goto :fail)
  popd
  git push -f origin gh-pages || (git worktree remove --force .deploy & goto :fail)
)
git worktree remove --force .deploy

REM ---- 5. Done ----
echo.
echo [5/5] Deploy complete!
echo      URL: https://kevinwong127.github.io/snapword/
echo      (GitHub Pages takes about 1 minute to go live)
echo.
pause
exit /b 0

:fail
echo.
echo DEPLOY FAILED - send the error above back for troubleshooting.
git worktree prune
if exist .deploy git worktree remove --force .deploy
pause
exit /b 1
