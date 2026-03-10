import * as React from 'react';
import { TaskInterface } from './Task';

export const defaultDataString = `# AK74: TODO.md Kanban Task Board

AK74 manages tasks and save them as TODO.md.
<em>[Forked from original Coddx project](https://github.com/AdamKeher/coddx-alpha)</em>

### Todo

### In Progress

### Done ✓

`;

export const isTodoColumn = (columnName: string) => {
  if (!columnName) {
    return false;
  }
  return columnName.toLowerCase().startsWith('todo');
};

export const isInProgressColumn = (columnName: string) => {
  if (!columnName) {
    return false;
  }
  return !isTodoColumn(columnName) && !isDoneColumn(columnName) && !isArchivedColumn(columnName);
};

export const isDoneColumn = (columnName: string) => {
  if (!columnName) {
    return false;
  }
  const lowerColName = columnName.toLowerCase();
  return lowerColName.indexOf('[x]') >= 0 || lowerColName.indexOf('✓') >= 0 || lowerColName.indexOf('done') >= 0 || lowerColName.indexOf('completed') >= 0;
};

export const isArchivedColumn = (columnName: string) => {
  if (!columnName) {
    return false;
  }
  const lowerColName = columnName.toLowerCase();
  return lowerColName.indexOf('archive') >= 0 || lowerColName.indexOf('archived') >= 0;
};

export function getMarkdown(data) {
  let md = '';
  for (const colKey of data.columnOrder) {
    const col = data.columns[colKey];
    if (!col) continue;

    md += '### ' + col.title + '\n\n';

    let checkboxStr = '[ ] ';
    if (isDoneColumn(col.title)) {
      checkboxStr = '[x] ';
    }

    col.taskIds.forEach((taskId: string) => {
      const task: TaskInterface = data.tasks[taskId];
      if (!task) {
        return;
      }
      const indent = '  '.repeat(task.level || 0);
      const content = (task.content || '').trim();
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (index === 0) {
          const priorityStr = task.priority ? task.priority + ' ' : '';
          const bugStr = task.isBug ? '!bug ' : '';
          md += indent + '- ' + (task.hasCheckbox === false ? '' : checkboxStr) + priorityStr + bugStr + line + '  \n';
        } else {
          md += indent + '  ' + line + '  \n';
        }
      });
    });
    md += '\n';
  }
  return (data.precontent || '') + md;
}

export function updateTaskMetadata(task: TaskInterface, title: string) {
  task.content = title;
  
  const priorityMatch = title.match(/(!p[12])(?=\s|:|$)/);
  if (priorityMatch) {
    task.priority = priorityMatch[1];
    task.content = task.content.replace(priorityMatch[1], '').trim();
  } else {
    delete task.priority;
  }

  const bugMatch = task.content.match(/(!bug)(?=\s|:|$)/);
  if (bugMatch) {
    task.isBug = true;
    task.content = task.content.replace(bugMatch[1], '').trim();
  } else {
    delete task.isBug;
  }

  const categoryMatch = task.content.match(/^([^:\s]+)\s*:/);
  if (categoryMatch) {
    task.category = categoryMatch[1];
  } else {
    delete task.category;
  }
}

export function parseMarkdown(md: string) {
  const output = {
    projectName: '',
    precontent: '',
    tasks: {},
    columns: {},
    columnOrder: []
  };

  if (!md) return output;

  let lastColName = '';
  const lines = md.split('\n');
  let taskNum = 0;
  let currentTask: TaskInterface | null = null;
  let listFound = false;

  lines.forEach(line => {
    if (line.startsWith('### ')) {
      listFound = true;
      lastColName = line.replace('### ', '').trim();
      if (!output.columns[lastColName]) {
        output.columns[lastColName] = {
          id: lastColName,
          title: lastColName,
          taskIds: []
        };
        output.columnOrder.push(lastColName);
      }
      currentTask = null;
      return;
    }

    if (!listFound) {
      if (line.startsWith('# ')) {
        output.projectName = line.replace('# ', '').trim();
      }
      output.precontent += line + '\n';
      return;
    }

    const trimmedLine = line.trim();
    const isNewTask = line.match(/^(\s*)[-*]\s*\[[ xX]\]\s/);
    
    if (isNewTask) {
      taskNum++;
      const id = `task${taskNum}`;
      const hasCheckbox = true;
      const level = Math.floor(isNewTask[1].length / 2);
      
      let title = line
        .replace(/^(\s*[-*]\s*\[[ xX]\]\s*)/, '')
        .trim();

      const task: TaskInterface = {
        id,
        content: title,
        hasCheckbox,
        done: isDoneColumn(lastColName),
        level
      };
      
      updateTaskMetadata(task, title);

      output.tasks[id] = task;
      if (lastColName && output.columns[lastColName]) {
        output.columns[lastColName].taskIds.push(id);
      }
      currentTask = task;
    } else if (currentTask && trimmedLine) {
      const baseIndent = (currentTask.level || 0) * 2 + 2;
      // Safer indentation stripping: only strip leading spaces up to baseIndent
      const subLine = line.replace(new RegExp(`^\\s{0,${baseIndent}}`), '').replace(/\s\s$/, '');
      currentTask.content += '\n' + subLine;
    }
  });
  
  return output;
}

export function DragIcon(props: any) {
  return (
    <svg {...props} style={{ width: '1em', height: '1em' }} viewBox="0 0 1024 1024" version="1.1">
      <path
        d="M384 128h85.333333v85.333333H384V128m170.666667 0h85.333333v85.333333h-85.333333V128M384 298.666667h85.333333v85.333333H384V298.666667m170.666667 0h85.333333v85.333333h-85.333333V298.666667m-170.666667 170.666666h85.333333v85.333334H384v-85.333334m170.666667 0h85.333333v85.333334h-85.333333v-85.333334m-170.666667 170.666667h85.333333v85.333333H384v-85.333333m170.666667 0h85.333333v85.333333h-85.333333v-85.333333m-170.666667 170.666667h85.333333v85.333333H384v-85.333333m170.666667 0h85.333333v85.333333h-85.333333v-85.333333z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SearchIcon(props: any) {
  return (
    <svg {...props} width="16" height="16" x="0px" y="0px" viewBox="0 0 511.999 511.999">
      <g>
        <g>
          <path
            d="M508.874,478.708L360.142,329.976c28.21-34.827,45.191-79.103,45.191-127.309c0-111.75-90.917-202.667-202.667-202.667 S0,90.917,0,202.667s90.917,202.667,202.667,202.667c48.206,0,92.482-16.982,127.309-45.191l148.732,148.732 c4.167,4.165,10.919,4.165,15.086,0l15.081-15.082C513.04,489.627,513.04,482.873,508.874,478.708z M202.667,362.667 c-88.229,0-160-71.771-160-160s71.771-160,160-160s160,71.771,160,160S290.896,362.667,202.667,362.667z"
            fill="currentColor"
          />
        </g>
      </g>
    </svg>
  );
}
