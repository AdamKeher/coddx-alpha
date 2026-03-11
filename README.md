# AK74: The Ultimate TODO.md Kanban Board for VS Code

[![Version](https://img.shields.io/visual-studio-marketplace/v/AdamKeher.ak74)](https://marketplace.visualstudio.com/items?itemName=AdamKeher.ak74)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/AdamKeher.ak74)](https://marketplace.visualstudio.com/items?itemName=AdamKeher.ak74)

**AK74** is a high-performance, developer-first Kanban task board that brings project management directly into your VS Code workflow. It's not just a board; it's a productivity engine built on the simple, portable `TODO.md` standard.

## ✨ Why AK74 Kanban?

- **Magic AI Refinement (✨):** Use built-in AI to refine your tasks, break them into sub-steps, and improve descriptions instantly.
- **Smart Activity Sidebar:** View real-time stats (Todo, In Progress, Done) and a task count badge directly in your VS Code Activity Bar.
- **Automatic Metadata:** AK74 handles the "paperwork" by automatically adding `Added`, `Started`, and `Completed` timestamps to your `TODO.md`.
- **Developer-Centric UX:** Fully keyboard-navigable, with multi-select support, real-time search, and smooth drag-and-drop.
- **Rich Visual Organization:** Automatic color-coding for categories, priority badges (`!p1`, `!p2`), and a dedicated "Bug" style for urgent fixes.

<p align="center">
  <img src="docs/media/ak74-kanban-demo.gif" alt="AK74 Demo" />
</p>

## 🚀 Features at a Glance

| Feature                    | Description                                                                         |
| :------------------------- | :---------------------------------------------------------------------------------- |
| **TODO.md Based**          | Your tasks live in a plain text file—portable, git-friendly, and GitHub-compatible. |
| **Multi-line Support**     | Write detailed task descriptions with Markdown, nested lists, and sub-tasks.        |
| **Advanced DnD**           | Drag and drop tasks, columns, and sub-columns. Even nest tasks within tasks.        |
| **Sub-Category Smartness** | AK74 remembers where tasks came from, preserving your organizational structure.     |
| **Collapsible Sections**   | Keep your board clean with collapsible tasks, categories, and archived columns.     |
| **Deep Integration**       | Seamlessly works with multiple task lists across your entire workspace.             |

## 🛠 Usage

1. **Create a Task List:** If you don't have a `TODO.md` file yet, open the Command Palette and type: `AK74: Create default TODO.md`. This will create a new task list from a pre-defined template.
2. **Open the Board:** Open the Command Palette (`F1` or `Ctrl+Shift+P`) and type: `AK74: TODO.md Kanban Task Board`.
3. **Interactive Management:** Drag, drop, and edit tasks. Every change is instantly synced to your `TODO.md` file.
4. **Sidebar Stats:** Click the AK74 icon in the Activity Bar to see a quick summary of your current progress.

## ⚙️ Customization

In your workspace `settings.json`, you can define multiple task lists:
```json
"ak74.taskBoard.fileList": "TODO.md, docs/BACKLOG.md"
```

---

## 📖 Learn More
For a deep dive into all features, keyboard shortcuts, and the `TODO.md` format, check out the **[Feature Guide](docs/task-board.md)**.

## 🤝 Support & Feedback
- **Found a bug?** [Open an issue](https://github.com/AdamKeher/coddx-alpha/issues)
- **Enjoying AK74?** Leave a review on the [Marketplace](https://marketplace.visualstudio.com/items?itemName=AdamKeher.ak74)!

---

*AK74 is an enhanced fork of the original [Coddx](https://github.com/coddx-hq/coddx-alpha) project.*
