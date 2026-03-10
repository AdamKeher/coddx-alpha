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
  align-items: flex-start;
  padding: 10px 0;
  overflow-x: auto;
  min-height: calc(100vh - 100px);
  width: 100%;
  box-sizing: border-box;
`;

const selectedFile = (window && window['initialData'] ? window['initialData']['selectedFile'] : '') || 'TODO.md';
const fileArray = (window && window['initialData'] ? window['initialData']['fileList'] : 'TODO.md')
  .split(',')
  .map(str => str.trim());
const dataString = (window && window['initialData'] ? window['initialData']['dataString'] : '') || defaultDataString;
let data = parseMarkdown(dataString);

export default function TaskBoard({ vscode, initialData }) {
  const [state, setState] = useState(data);
  const [currentSelectedFile, setCurrentSelectedFile] = useState(selectedFile);
  const [currentFileList, setCurrentFileList] = useState(fileArray);
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const vscodeHelper = getVscodeHelper(vscode);

  React.useEffect(() => {
    const handleKeyDown = (ev: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const target = ev.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (ev.key === 'n' && ev.altKey) {
        // Implement new task shortcut if needed
      }
      if (ev.key === 'Delete' || ev.key === 'Backspace') {
        if (selectedTaskIds.length > 0) {
          const newState = { ...state };
          selectedTaskIds.forEach(id => {
            delete newState.tasks[id];
            Object.keys(newState.columns).forEach(colId => {
              newState.columns[colId].taskIds = newState.columns[colId].taskIds.filter(tid => tid !== id);
            });
          });
          updateStateAndSave(newState);
          setSelectedTaskIds([]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIds, state]);

  const handleSelectTask = (taskId: string, multi: boolean) => {
    if (multi) {
      setSelectedTaskIds(prev => prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]);
    } else {
      setSelectedTaskIds([taskId]);
    }
  };

  React.useEffect(() => {
    const handleMessage = (event) => {
      const message = event.data;
      switch (message.action) {
        case 'init':
          const initData = parseMarkdown(message.payload.dataString);
          setState(initData);
          setCurrentSelectedFile(message.payload.selectedFile);
          setCurrentFileList(message.payload.fileList.split(',').map(str => str.trim()));
          break;
        case 'updateData':
          const updatedData = parseMarkdown(message.dataString);
          setState(updatedData);
          if (message.selectedFile) {
            setCurrentSelectedFile(message.selectedFile);
          }
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const reloadFile = () => sendCommand(vscode, CommandAction.Load, currentSelectedFile);

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

  const updateTaskTimestamps = (task: TaskInterface, sourceColId: string, destColId: string) => {
    const now = new Date().toLocaleString();
    const isTodo = (id: string) => id.startsWith('Todo');
    const isDone = (id: string) => id.toLowerCase().indexOf('done') >= 0 || id.toLowerCase().indexOf('completed') >= 0 || id.toLowerCase().indexOf('cancelled') >= 0;
    const isInProgress = (id: string) => !isTodo(id) && !isDone(id);

    // Filter out Started and Completed. Also filter out Added if it exists.
    let lines = task.content.split('\n');
    lines = lines.filter(line => !line.startsWith('> Started:') && !line.startsWith('> Completed:') && !line.startsWith('> Added:'));
    
    // Handle Sub-Category tag
    if (isTodo(sourceColId) && !isTodo(destColId)) {
      // Moving FROM Todo TO something else: Record source sub-category
      // Filter out any existing sub-category tag first
      lines = lines.filter(line => !line.startsWith('> Sub-Category:'));
      lines.push(`> Sub-Category: ${sourceColId}`);
    } else if (isTodo(destColId)) {
      // Moving TO Todo: Remove sub-category tag
      lines = lines.filter(line => !line.startsWith('> Sub-Category:'));
    }

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

  return (
    <div>
      <ButtonBar
        vscodeHelper={vscodeHelper}
        fileArray={currentFileList}
        selectedFile={currentSelectedFile}
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
        onDragEnd={({ destination, source, draggableId, type, combine }) => {
          if (combine) {
            const newState = { ...state };
            const sourceCol = newState.columns[source.droppableId];
            const sourceTaskIds = Array.from(sourceCol.taskIds);
            sourceTaskIds.splice(source.index, 1);
            newState.columns[source.droppableId].taskIds = sourceTaskIds;

            const targetTask = newState.tasks[combine.draggableId];
            const draggedTask = newState.tasks[draggableId];
            
            // Nest the dragged task under the target task
            draggedTask.level = (targetTask.level || 0) + 1;
            
            // Find target task index and insert after it
            const destCol = newState.columns[combine.droppableId];
            const destTaskIds = Array.from(destCol.taskIds);
            const targetIdx = destTaskIds.indexOf(combine.draggableId);
            destTaskIds.splice(targetIdx + 1, 0, draggableId);
            newState.columns[combine.droppableId].taskIds = destTaskIds;

            updateStateAndSave(newState);
            return;
          }

          if (!destination) {
            return;
          }
          if (destination.droppableId === source.droppableId && destination.index === source.index) {
            return;
          }

          if (type === 'subcolumn') {
            const groupColId = source.droppableId.replace('subcolumns-', '');
            const group = renderedColumns.find(g => g.id === groupColId);
            if (!group || !group.subColumns) return;

            const newSubColumns = Array.from(group.subColumns);
            const [movedSubCol] = newSubColumns.splice(source.index, 1);
            newSubColumns.splice(destination.index, 0, movedSubCol);

            // Rebuild columnOrder
            const newColumnOrder: string[] = [];
            renderedColumns.forEach((g: any) => {
                if (g.id === groupColId) {
                    newSubColumns.forEach((sc: any) => newColumnOrder.push(sc.id));
                } else if (g.isGroup) {
                    g.subColumns.forEach((sc: any) => newColumnOrder.push(sc.id));
                } else {
                    newColumnOrder.push(g.id);
                }
            });

            const newState = {
                ...state,
                columnOrder: newColumnOrder
            };
            updateStateAndSave(newState);
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

            const taskToUpdate = state.tasks[draggableId];
            taskToUpdate.level = 0; // Reset level when moved normally (dragged out)

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
          taskToUpdate.level = 0; // Reset level when moved normally (dragged out)
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
                    selectedTaskIds={selectedTaskIds}
                    vscodeHelper={vscodeHelper}
                    onSelectTask={handleSelectTask}
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
                    onBackwardsTask={(task: TaskInterface, columnId: string) => {
                      const newState = { ...state };
                      const columnOrder = newState.columnOrder;
                      const currentColumnIdx = columnOrder.indexOf(columnId);
                      
                      if (currentColumnIdx <= 0) return;

                      let prevColumnIdx = currentColumnIdx - 1;
                      
                      // If moving back TO a Todo group from a non-Todo column, check for sub-category tag
                      if (!columnId.startsWith('Todo') && columnOrder[prevColumnIdx].startsWith('Todo')) {
                        const subCatLine = task.content.split('\n').find(l => l.startsWith('> Sub-Category:'));
                        if (subCatLine) {
                          const targetColId = subCatLine.replace('> Sub-Category:', '').trim();
                          if (newState.columns[targetColId]) {
                            prevColumnIdx = newState.columnOrder.indexOf(targetColId);
                          } else {
                            // Create the sub-category if it no longer exists.
                            newState.columns[targetColId] = {
                              id: targetColId,
                              title: targetColId,
                              taskIds: []
                            };
                            // Find where to insert it in columnOrder (after the last Todo column)
                            let lastTodoIdx = -1;
                            for (let i = 0; i < newState.columnOrder.length; i++) {
                              if (newState.columnOrder[i].startsWith('Todo')) {
                                lastTodoIdx = i;
                              }
                            }
                            newState.columnOrder.splice(lastTodoIdx + 1, 0, targetColId);
                            prevColumnIdx = lastTodoIdx + 1;
                          }
                        } else {
                          prevColumnIdx = columnOrder.findIndex(id => id.startsWith('Todo'));
                        }
                      }

                      const prevColumnKey = newState.columnOrder[prevColumnIdx];
                      if (!prevColumnKey) return;

                      updateTaskTimestamps(task, columnId, prevColumnKey);

                      // remove task from current column:
                      newState.columns[columnId].taskIds = newState.columns[columnId].taskIds.filter(
                        (taskId: string) => taskId !== task.id
                      );
                      // append task to the prev column:
                      newState.columns[prevColumnKey].taskIds.unshift(task.id);
                      updateStateAndSave(newState);
                    }}
                    onInProgressTask={(task: TaskInterface, columnId: string) => {
                      const newState = { ...state };
                      const columnOrder = newState.columnOrder;
                      const currentColumnIdx = columnOrder.indexOf(columnId);
                      
                      if (currentColumnIdx === -1) return;

                      let nextColumnIdx = currentColumnIdx + 1;
                      
                      // If we are in a Todo column, skip all other Todo columns to move to the next group
                      if (columnId.startsWith('Todo')) {
                        while (nextColumnIdx < columnOrder.length && columnOrder[nextColumnIdx].startsWith('Todo')) {
                          nextColumnIdx++;
                        }
                      }

                      if (nextColumnIdx >= columnOrder.length) return;

                      const nextColumnKey = columnOrder[nextColumnIdx];
                      const doneColumnKey = columnOrder[columnOrder.length - 1];
                      
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
                      const columnOrder = newState.columnOrder;
                      const doneColumnKey = columnOrder[columnOrder.length - 1];
                      
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
