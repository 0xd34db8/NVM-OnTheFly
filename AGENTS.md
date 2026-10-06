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

# Commit Message Workflow

**Writing Commits to .gitmessage:**
When changes are substantial enough to warrant a commit, agents should generate the commit message and add it to the `.gitmessage` file.
- **Append, Do NOT Overwrite:** Always ADD (append) new commit messages. You must NEVER overwrite any previous text already present in `.gitmessage`.