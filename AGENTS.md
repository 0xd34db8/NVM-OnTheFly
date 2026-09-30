# NVM Mode Fallback Rule

**Respect Current Mode:**
When determining file paths or executing commands, ALWAYS respect the `currentMode` (e.g., `nvm-sh` vs `nvm-windows`) rather than relying solely on `process.platform === 'win32'`. 

Windows users may use `nvm-sh` (via Git Bash or WSL). In these fallback scenarios, `process.platform` will be `'win32'`, but the logic must use the Unix/`nvm-sh` pathways and locations (e.g., `~/.nvm/versions/node/...` instead of `%APPDATA%\nvm\...`).

Do not assume `win32` guarantees an `nvm-windows` environment!

# Stream Parsing vs Polling

**Avoid Redundant Fetch Calls:**
When implementing actions that modify state (e.g.: installing, uninstalling a node version or global package, etc.), DO NOT make follow-up calls to `fetchState()` or `fetchPackages()` to refresh the UI. 
These functions execute heavy, blocking commands like `nvm ls` or `npm ls -g` which cause the UI to freeze and output redundant text to the terminal console.

Instead, rely on the stream output sent by the backend. Use `nvmStore.ts` to parse the stream logs (e.g., `Uninstalled node...`, `Now using node...`) and instantly mutate the local Zustand store. This guarantees lightning-fast, optimistic UI updates without extra terminal clutter.

# Commit Message Syntax

**Standard Format:**
When generating commit messages for this repository, ALWAYS use the following plain-text format. Do NOT use markdown. Start with a lowercase commit type (e.g. `feat:`, `fix:`, `chore:`), followed by a brief description. Then, on the next lines, provide a bulleted list of specific changes using an indent and single hyphens (`- `).

Example:
```text
feat: improve package management and download UX
- Optimistic UI on Global Pkgs uninstall
- Display size of each package in global packages & the total size of all pacakges
- Show npm version sizes on the Version Manager page & Download page
```
