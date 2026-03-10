# Project

Project Description

<em>[TODO.md spec & Kanban Board](https://bit.ly/3fCwKfM)</em>

### Todo

- [ ] feat: add spelling and grammar checking when editing a task  
- [ ] docs: update docs with new screen captures, capabilities list and .mov file  
- [ ] ui: add hyperlinks
- [ ] task: make * entries bulleted lists. Support nested entries
- [ ] task: add nested checkbox support to ( ) sub task items

### In Progress

- [x] feat: Add a Magic Button (✨) to provide an interactive, inline assistant for refining task content.
    Its goals are:
    ( ) One-Click Optimization: Provide a single entry point on every task card to trigger a professional rewrite of the task's
     title and description.
    ( ) Inline Drafting: Display the suggested rewrite directly within the task's existing layout, allowing the user to compare the
     new version against the original in real-time.
    ( ) Non-Destructive Workflow: Ensure the original content is never replaced automatically; the assistant only provides a "draft"
     that exists alongside the original until a decision is made.
    ( ) User-Centric Validation: Empower the user with an explicit Accept/Reject prompt.
       ( ) Accept instantly updates the task with the new text.
       ( ) Reject dismisses the suggestion and restores the task to its previous state.
    ( ) Visual Feedback: Provide clear, immediate state changes (such as loading indicators) so the user knows the assistant is
     processing the request. 
     
    We want to take a No-API Key approach which shifts the responsibility of AI processing from our extension to the VS Code editor itself. Here is the high-level strategy:

    ( ) VS Code as the "Broker" us vscode.lm
    Instead of our extension talking directly to an AI server (which would require a personal key to prove who is paying), it simply sends a request to the VS Code editor. Think of VS Code as a central exchange that knows how to route AI requests.
    ( ) Leveraging Existing AI "Brains"
    The approach relies on whatever AI "brains" the user already has installed and signed into.
        ( ) If a user has GitHub Copilot or Gemini for VS Code active, they have already gone through the effort of authenticating and subscribing.
        ( ) Our extension "borrows" that existing connection through a secure, built-in bridge provided by VS Code.
    ( ) Zero-Configuration for the User
    From the user's perspective, there is no setup. If they are already using an AI assistant in VS Code, our "Magic Button" simply wakes up and starts working. It uses the user's existing identity and permissions, so they don't have to manage a separate set of secret keys or credit card balances for our extension.
    ( ) Privacy and Security
    Because the request never leaves the secure environment of the editor to a third-party service we control, the user’s data stays within the same trust boundary they already established with their primary AI provider (like Google or GitHub). VS Code handles the "handshake" between our extension and the AI model securely.
    ( ) possibly use selectChatModels to provide a application wide drop down to choose the desired model
    ( ) possibly use:
        ( ) LanguageModelChat: The actual interface representing the chosen model, which provides the sendRequest method to perform the
     query.
        ( ) LanguageModelChatMessage: The interface used to structure the prompt as a conversation (User or Assistant messages) before
     sending it to the model.
 

### Done ✓

- [x] ui: fix persistence of collapsed state for category columns, sub-categories and tasks. the state of these should persist when the Task Board is closed and reopened.  
  > Started: 3/10/2026, 11:44:37 AM  
  > Completed: 3/10/2026, 12:41:41 PM  
- [x] ui: move the timestamps inside the footer and make them left aligned with the task body text and use a slightly larger font size.  This should save some verical realestate  
  > Started: 3/10/2026, 11:44:26 AM  
  > Completed: 3/10/2026, 12:37:09 PM  
- [x] ui: Tasks should have an icon left of the Header text indicating their current status based on which column they are in.  
  1. When a task is in the "Todo" column the task should have a "unchecked box" icon in the header  
  2. When a task is in the "In Progress" column the task should have a "unchecked" icon in the the header.  
  3. When a task is in the "Done" column the task should have a "ticked checkbox" icon in the header.  
  4. When a task is in the "Archived" column the tasks should have a (folder/file) icon in the header.  
  > Started: 3/10/2026, 11:44:34 AM  
  > Completed: 3/10/2026, 12:36:08 PM  
- [x] ui: fix dragging tasks. When you grab the file with the side bar / gripper, it no longer reliably reorders the task. When you grab a task, sometimes it moves, mostly when you grab and drag, it just highlights text in the task.  
  If you try to reorder the general subcategory, it will start to drag the entire column. You can't move the General (default) sub-category and a mouse cursor (/) symbol should be shown.  
  > Started: 3/10/2026, 1:52:24 AM  
  > Completed: 3/10/2026, 11:40:03 AM  

### Archived


