import * as React from 'react';
import styled from 'styled-components';
import { CommandAction } from '../../model';
import { sendCommand, getVscodeHelper } from '../../Utils';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { parseMarkdown, defaultDataString, getMarkdown } from './Helpers';

import { TaskInterface } from './Task';
import TaskColumn from './TaskColumn';
import ButtonBar from './ButtonBar';

// import '@atlaskit/css-reset';
import '../../index.css';
import './TaskBoard.css';
const { useState } = React;

const Columns = styled.div`
  display: flex;
`;

const selectedFile = (window && window['initialData'] ? window['initialData']['selectedFile'] : '') || 'TODO.md';
const fileArray = (window && window['initialData'] ? window['initialData']['fileList'] : 'TODO.md')
  .split(',')
  .map(str => str.trim());
const dataString = (window && window['initialData'] ? window['initialData']['dataString'] : '') || defaultDataString;
let data = parseMarkdown(dataString);

export default function TaskBoard({ vscode, initialData }) {
  const [state, setState] = useState(data);
  const vscodeHelper = getVscodeHelper(vscode);

  const reloadFile = () => sendCommand(vscode, CommandAction.Load, selectedFile);

  const renderedColumns = [];
  let currentGroup = null;

  state.columnOrder.forEach((id) => {
    const col = state.columns[id];
    if (id.startsWith('Todo')) {
      if (!currentGroup) {
        currentGroup = {
          id: id, // use first Todo as ID
          title: 'Todo',
          isGroup: true,
          subColumns: [col]
        };
        renderedColumns.push(currentGroup);
      } else {
        currentGroup.subColumns.push(col);
      }
    } else {
      currentGroup = null;
      renderedColumns.push({ ...col, isGroup: false });
    }
  });

  React.useEffect(() => {
    reloadFile();
  }, []);

  const updateTaskTimestamps = (task: TaskInterface, sourceColId: string, destColId: string) => {
    const now = new Date().toLocaleString();
    const isTodo = (id: string) => id.startsWith('Todo');
    const isDone = (id: string) => id.toLowerCase().indexOf('done') >= 0 || id.toLowerCase().indexOf('completed') >= 0 || id.toLowerCase().indexOf('cancelled') >= 0;
    const isInProgress = (id: string) => !isTodo(id) && !isDone(id);

    // Filter out Started and Completed. Also filter out Added if it exists.
    let lines = task.content.split('\n');
    lines = lines.filter(line => !line.startsWith('> Started:') && !line.startsWith('> Completed:') && !line.startsWith('> Added:'));
    
    // If it already had a Started timestamp, we need to decide whether to keep it
    const originalLines = task.content.split('\n');
    const existingStarted = originalLines.find(l => l.startsWith('> Started:'));

    if (isInProgress(destColId)) {
      // Moving to In Progress: 
      if (existingStarted) {
        // Keep existing Started timestamp if we have one
        lines.push(existingStarted);
      } else if (isTodo(sourceColId)) {
        // Only add new Started if coming from Todo
        lines.push(`> Started: ${now}`);
      }
    } else if (isDone(destColId)) {
      // Moving to Done: 
      if (existingStarted) {
        lines.push(existingStarted);
      } else {
        lines.push(`> Started: ${now}`);
      }
      lines.push(`> Completed: ${now}`);
    }

    task.content = lines.join('\n').trim();
  };

  const updateStateAndSave = newState => {
    setState(newState);
    vscodeHelper.saveList(getMarkdown(newState));
  };

  // const [msg, setMsg] = useState('');
  // window.addEventListener('message', event => {
  //   setMsg(JSON.stringify(event));
  //   // const message = event.data; // The JSON data our extension sent
  //   // switch (message.command) {
  //   //     case 'load':
  //   //       break;
  //   // }
  // });
  return (
    <div>
      <ButtonBar
        vscodeHelper={vscodeHelper}
        fileArray={fileArray}
        selectedFile={selectedFile}
        data={state}
        onLoadData={newData => {
          data = newData;
          setState(newData);
        }}
        onSave={dataStr => {
          vscodeHelper.saveList(dataStr);
        }}
        onRefresh={() => reloadFile()}
        onOpenFile={() => sendCommand(vscode, CommandAction.OpenFile, '')}
        onSearch={searchTerm => {
          const searchTermStr = searchTerm.toLowerCase();
          // console.log('search: ', searchTerm);
          const newState = { ...state };
          Object.keys(newState.tasks).forEach(taskId => {
            const t = newState.tasks[taskId];
            newState.tasks[taskId].matched = t.content.toLowerCase().indexOf(searchTermStr) >= 0;
          });
          updateStateAndSave(newState);
        }}
        onSelectFile={selectedOpt => {
          sendCommand(vscode, CommandAction.Load, selectedOpt.value);
        }}
      />
      <DragDropContext
        onDragEnd={({ destination, source, draggableId, type }) => {
          if (!destination) {
            return;
          }
          if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
          }

          if (type === 'column') {
            // Find the actual index in columnOrder for the group
            const sourceGroup = renderedColumns[source.index];
            const destGroup = renderedColumns[destination.index];
            
            const sourceIndexInOrder = state.columnOrder.indexOf(sourceGroup.id);

            // Move all sub-columns of the group
            const itemsToMove = sourceGroup.subColumns ? sourceGroup.subColumns.map(c => c.id) : [sourceGroup.id];
            
            const tempOrder = Array.from(state.columnOrder);
            const removed = tempOrder.splice(sourceIndexInOrder, itemsToMove.length);
            
            // Recalculate dest index after removal
            let newDestIndex = tempOrder.indexOf(destGroup.id);
            if (destination.index > source.index && destGroup.subColumns) {
                newDestIndex += destGroup.subColumns.length - 1;
            }
            if (destination.index > source.index) newDestIndex += 1;

            tempOrder.splice(newDestIndex, 0, ...removed);

            const newState = {
              ...state,
              columnOrder: tempOrder
            };
            updateStateAndSave(newState);
            return;
          }

          const startcol = state.columns[source.droppableId];
          const endcol = state.columns[destination.droppableId];

          // console.log("startcol", startcol);
          // if (!startcol) {
          //   return;
          // }

          if (startcol === endcol) {
            const tasks = Array.from(startcol.taskIds);
            tasks.splice(source.index, 1);
            tasks.splice(destination.index, 0, draggableId);

            const newCol = {
              ...startcol,
              taskIds: tasks
            };

            const newState = {
              ...state,
              columns: {
                ...state.columns,
                [newCol.id]: newCol
              }
            };

            // setState(newState);
            updateStateAndSave(newState);
            return;
          }
          
          const startTaskIds = Array.from(startcol.taskIds);
          startTaskIds.splice(source.index, 1);
          const newStart = {
            ...startcol,
            taskIds: startTaskIds
          };
          const endTaskIds = Array.from(endcol.taskIds);
          endTaskIds.splice(destination.index, 0, draggableId);
          const newEnd = {
            ...endcol,
            taskIds: endTaskIds
          };

          const taskToUpdate = state.tasks[draggableId];
          updateTaskTimestamps(taskToUpdate, startcol.id, endcol.id);

          const newState = {
            ...state,
            columns: {
              ...state.columns,
              [newStart.id]: newStart,
              [newEnd.id]: newEnd
            }
          };
          updateStateAndSave(newState);
          return;
        }}
      >
        <Droppable droppableId="columns" direction="horizontal" type="column">
          {provided => (
            <Columns {...provided.droppableProps} ref={provided.innerRef}>
              {renderedColumns.map((group, idx) => {
                const isLast = idx === renderedColumns.length - 1;
                // If it's a group, we pass the group info
                return (
                  <TaskColumn
                    key={group.id}
                    column={group}
                    columnIndex={idx}
                    isLast={isLast}
                    allTasks={state.tasks} // Pass all tasks to the column
                    onChangeTask={(id: string, newTask: TaskInterface) => {
                      const newState = {
                        ...state,
                        tasks: {
                            ...state.tasks,
                            [id]: newTask
                        }
                      };
                      updateStateAndSave(newState);
                    }}
                    onDeleteTask={(task: TaskInterface, columnId: string) => {
                      const newState = { ...state };
                      delete newState.tasks[task.id];
                      newState.columns[columnId].taskIds = newState.columns[columnId].taskIds.filter(
                        (taskId: string) => taskId !== task.id
                      );
                      updateStateAndSave(newState);
                    }}
                    onInProgressTask={(task: TaskInterface, columnId: string) => {
                      const newState = { ...state };
                      const columnKeys = Object.keys(newState.columns);
                      const currentColumnIdx = Object.keys(newState.columns).findIndex(
                        (id: string) => id === columnId
                      );
                      const doneColumnKey = columnKeys[columnKeys.length - 1];
                      const nextColumnKey = columnKeys[currentColumnIdx + 1];
                      
                      updateTaskTimestamps(task, columnId, nextColumnKey);

                      if (nextColumnKey === doneColumnKey) {
                        task.done = true; // user moved this task to the right column and reached Done Column.
                      }
                      // remove task from current column:
                      newState.columns[columnId].taskIds = newState.columns[columnId].taskIds.filter(
                        (taskId: string) => taskId !== task.id
                      );
                      // append task to the next column:
                      newState.columns[nextColumnKey].taskIds.unshift(task.id);
                      updateStateAndSave(newState);
                    }}
                    onCompleteTask={(task: TaskInterface, columnId: string) => {
                      task.done = true;
                      const newState = { ...state };
                      const columnKeys = Object.keys(newState.columns);
                      const doneColumnKey = columnKeys[columnKeys.length - 1];
                      
                      updateTaskTimestamps(task, columnId, doneColumnKey);

                      // remove task from current column:
                      newState.columns[columnId].taskIds = newState.columns[columnId].taskIds.filter(
                        (taskId: string) => taskId !== task.id
                      );
                      // append task to the top of Done column:
                      newState.columns[doneColumnKey].taskIds.unshift(task.id);
                      updateStateAndSave(newState);
                    }}
                    onMoveTask={(taskId: string, sourceColId: string, destColId: string, destIndex: number) => {
                      const newState = { ...state };
                      
                      // Remove from source
                      const sourceCol = newState.columns[sourceColId];
                      const newSourceTaskIds = Array.from(sourceCol.taskIds);
                      const taskIdx = newSourceTaskIds.indexOf(taskId);
                      newSourceTaskIds.splice(taskIdx, 1);
                      newState.columns[sourceColId] = {
                        ...sourceCol,
                        taskIds: newSourceTaskIds
                      };
                      
                      // Add to dest
                      const destCol = newState.columns[destColId];
                      const newDestTaskIds = Array.from(destCol.taskIds);
                      newDestTaskIds.splice(destIndex, 0, taskId);
                      newState.columns[destColId] = {
                        ...destCol,
                        taskIds: newDestTaskIds
                      };

                      const taskToMove = newState.tasks[taskId];
                      updateTaskTimestamps(taskToMove, sourceColId, destColId);
                      
                      updateStateAndSave(newState);
                    }}
                  />
                );
              })}
              {provided.placeholder}
            </Columns>
          )}
        </Droppable>
      </DragDropContext>
      {/* <pre>{msg}</pre> */}
    </div>
  );
}
