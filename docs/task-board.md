# AK74 Task Board: Features & Documentation

The AK74 Task Board is a powerful, developer-centric Kanban interface for VS Code that transforms your simple `TODO.md` files into a rich, interactive project management tool.

## 🚀 Key Features

### 1. ✨ AI-Powered Task Refinement
Elevate your productivity with the **Magic Button (✨)**. 
- **Inline Refinement:** Automatically improve task descriptions or break down complex tasks into actionable sub-steps using AI.
- **Accept/Reject Workflow:** Review AI suggestions before they are applied to your `TODO.md` file.

### 2. 📊 Dynamic Activity Bar & Sidebar
Keep track of your progress without even opening the board.
- **Real-Time Stats:** View counts for "Todo", "In Progress", and "Completed" tasks directly in the VS Code Activity Bar.
- **Progress Badge:** The Activity Bar icon shows a badge with the number of tasks currently in progress.
- **Quick Launch:** One-click access to the full Task Board from the sidebar.

### 3. 🏗️ Advanced Kanban Interface
- **Smooth Drag & Drop:** Move tasks between columns or reorder columns and sub-columns effortlessly.
- **Task Nesting:** Drag a task onto another to create a nested hierarchy, perfect for sub-tasks and project breakdowns.
- **Sub-Category Preservation:** AK74 intelligently remembers which "Todo" sub-category a task came from. If you move a task from "In Progress" back to "Todo", it returns to its original home automatically.

### 4. ⏱️ Smart Automatic Timestamps
Never lose track of when work happened. AK74 automatically appends metadata to your tasks:
- `> Added:` When the task was created.
- `> Started:` When the task was moved to an "In Progress" column.
- `> Completed:` When the task was moved to the "Done" column.

### 5. 🎨 Rich Visuals & Prioritization
- **Priority Badges:** Use `!p1`, `!p2` in your task titles to get high-visibility priority badges.
- **Bug Tracking:** Mark tasks as bugs to apply a distinct striped "emergency" visual style.
- **Auto-Coloring:** Categories (e.g., `feature:`, `refactor:`) are automatically color-coded for quick visual scanning.
- **Markdown Titles:** Use full Markdown syntax in task titles, including bold text, hyperlinks, and even small images.

### 6. 📝 Detailed Multi-Line Tasks
- **Collapsible Descriptions:** Keep your board clean by collapsing long task descriptions.
- **Interactive Sub-tasks:** Use standard Markdown checkboxes (`[ ]`, `[x]`) or parens (`( )`, `(x)`) in your task descriptions. They are fully interactive and can be toggled directly from the board.
- **Bulleted Lists:** Full support for nested bullet points and tab-indented content.

---

## 🛠️ How it Works: The TODO.md Format

AK74 is built on top of the open [TODO.md](https://bit.ly/2JdEuET) standard. This means your task board is:
- **Portable:** Your project management lives in a plain text file.
- **Git-Friendly:** Commit your `TODO.md` alongside your code. View changes and resolve conflicts just like any other file.
- **Compatible:** Perfectly readable on GitHub, GitLab, and Bitbucket.

### Example Syntax:
```markdown
### Todo: UI
- [ ] Implement dark mode !p1 feature:ui
  > Added: 2026-03-10
  * Use CSS variables
  * Support system theme

### In Progress
- [ ] Fix memory leak !p1
  > Added: 2026-03-09
  > Started: 2026-03-10
  > Sub-Category: Todo: Backend
```

---

## ⚙️ Configuration

### Multiple Task Lists
Manage multiple boards in the same workspace by adding them to your VS Code settings:
```json
"ak74.taskBoard.fileList": "TODO.md, docs/BACKLOG.md, personal/TASKS.md"
```

### Keyboard Shortcuts
- **`Enter`**: Edit selected task.
- **`Space`**: Select task (use `Ctrl/Shift` for multi-select).
- **`Arrow Keys`**: Move tasks between columns or navigate the board.
- **`Delete/Backspace`**: Delete selected task(s).
- **`Alt + N`**: Create a new task.

---

## 💡 Tips & Tricks
- **Quick Labels:** Use `@name` to assign tasks or `#tag` for custom labels.
- **Search & Filter:** Use the top search bar to filter by category, priority, or content in real-time.
- **Archive:** Move completed tasks to an "Archived" column to keep your board fast and focused. The archived section is collapsed by default to save space.
