# SaveState (MVP Definition)

> **One Click. Instant Focus.**

**Version:** 1.0.0  
**Status:** Approved Product Definition  
**Category:** Productivity / Student Workspace Management

---

## 🎯 1. Executive Summary & Problem
SaveState is a cross-platform workspace context manager that lets students and developers launch an entire project environment with a single click[cite: 1]. 

Students and developers lose 10–20 minutes every session rebuilding their workspace (opening IDEs, finding paths, restoring browser tabs, launching terminals)[cite: 1]. This "startup tax" causes context switching fatigue, procrastination, and delayed flow states[cite: 1]. SaveState removes this repetitive setup by restoring the entire workspace automatically[cite: 1].

*   **Primary Goal:** Reduce startup friction by 90%.
*   **The Magic Metric:** Time to First Keystroke (TTFK) < 60 seconds.

---

## 💻 2. Core MVP Scope (Version 1.0)
The MVP focus is purely local-first execution to solve startup friction[cite: 2].

*   **Project Profiles:** Create, edit, delete, and store reusable project configurations locally via JSON.
*   **Workspace Launcher:** One-click simultaneous execution of:
    *   **IDE:** (VS Code, IntelliJ, Android Studio, Cursor, etc. via executable path execution).
    *   **Project Folder:** Opens target repository directory.
    *   **Terminal:** Launches OS terminal (PowerShell, Bash, zsh) pre-navigated to the project directory.
    *   **Browser Session:** Restores saved documentation/research URLs in the default browser.
    *   **Notes:** Launching files/workspaces in applications like Obsidian or Notion.