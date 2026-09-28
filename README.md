# NVM: OnTheFly!

NVM: OnTheFly is a desktop GUI for managing Node Version Manager (NVM) environments NATIVELY


> [!IMPORTANT]
> This application does **not** act like a regular standalone manager that creates its own isolated folders, symlinks, or custom configuration files. Instead, it acts as a direct GUI wrapper that **hooks natively into your existing `nvm-sh` and `nvm-windows` installations**. Any change you make in the GUI is exactly what would happen if you typed it in the terminal, meaning zero lock-in and 100% compatibility with your current setup!

## Features & Abilities

- **Visual Node Version Management**: View your installed Node.js versions and all available remote versions to download, directly from an intuitive UI table.
- **Install & Uninstall**: Quickly install new Node versions or remove old ones with one click. Uninstallations are protected by a confirmation prompt.
- **Set Active Version**: Easily switch your system's default Node.js version by clicking the "Use" button.
- **Global Package Migration**: When installing a new Node version, the GUI provides a prompt allowing you to seamlessly migrate your globally installed NPM packages from an older installed version (using NVM's `--reinstall-packages-from=` flag).
- **Global Package Viewer**: Click the package inventory icon to instantly list all global packages installed on the current default Node version.
- **Dual NVM Engine Support**: Automatically detects `nvm-windows` installations, with a fallback to `nvm-sh` (via Git Bash). The UI allows you to hot-swap between these CLI interfaces if both are installed.
- **Real-time Terminal Logs**: Features a drop-down terminal console that streams `stdout` and `stderr` directly from background commands (like package listing or downloading Node versions).
- **Adaptive Theming**: Fully responsive Dark and Light modes that can be manually toggled via the settings drawer, dynamically styling the app and logos.

---

### Current Bugs:

- **State Sync Issue**: The true global state fails to reflect properly on the frontend when updated via `USE`. 
  - **Workaround Description**: 
    - To fix the UI delay, we implemented a **client-side state override**. When a user clicks 'USE', the frontend (`NodeList.vue`) saves the `pendingUseVersion`.
    - Once the backend replies with a success code via IPC, the frontend intentionally **skips** refreshing the state from the system (`await getInstalledData()`).
    - Instead, it directly iterates through the local reactive table (`rows.value.installedData`) and manually sets `use = 1` for the clicked version and `use = 0` for all others.
    - **Why it's unsafe**: This forces the UI to look correct immediately, but it introduces a risk of state desynchronization. If the backend silently fails to write the alias file, or if a user modifies the default version in a separate terminal window, the application UI will incorrectly display the overridden version as active. Consequently, the user can even incorrectly click 'uninstall' or 'use' on the true system default version (which is now incorrectly un-grayed in the UI).