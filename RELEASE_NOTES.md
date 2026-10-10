release: v2.0.3

### Features
* **Engine Setup:** Add fallback UI to install nvm engine if missing
  - Created EngineSetup view to offer installation of nvm-windows or nvm-sh
  - Implemented IPC handlers for downloading and running nvm-windows setup via PowerShell
  - Implemented IPC handlers for downloading and running nvm-sh install script via bash
  - Updated App layout to conditionally render EngineSetup when no engine is detected

### Bug Fixes
* **Engine Detection:** Improve engine detection and UI on install prompt
  - Fix nvm-sh fallback incorrectly detecting missing nvm installations
  - Allow access to Settings page when no NVM engine is detected

### Maintenance & Security
* **Dependencies:** Resolve deprecations and critical vulnerabilities
  - Replace deprecated sudo-prompt with @vscode/sudo-prompt
  - Approve install scripts for electron and esbuild to fix missing binary issues
  - Update vite, electron-vite, electron, and electron-builder to resolve Critical (tar) and High vulnerabilities
  - Fix Node [DEP0190] shell warning in src/main/nvm.ts by properly passing command strings to spawn
  - Switch to @vitejs/plugin-react-swc to resolve invalid jsx schema warnings from Vite 8

### Documentation
* **README:** Add logo and demo video to README
* **Assets:** Update logo asset

### CI/CD
* **Release:** Add release notes configuration
