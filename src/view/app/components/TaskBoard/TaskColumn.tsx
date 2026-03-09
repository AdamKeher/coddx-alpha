import * as React from 'react';
import styled from 'styled-components';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import Task, { TaskInterface } from './Task';

const { memo } = React;

const Container = styled.div<{ isDragging: boolean }>`
  min-height: 150px;
  margin: 0px;
  border-radius: 2px;
  width: 33.3vw;
  display: flex;
  flex-direction: column;
  background-color: ${props => (props.isDragging ? 'lightgreen' : 'inherit')};
`;
const Title = styled.div`
  padding: 5px;
  margin: 5px;
  > span {
    padding: 5px;
    background-color: var(--vscode-editor-selectionBackground);
    border-radius: 2px;
    color: var(--vscode-editor-selectionForeground);
  }
`; // or use: vscode-tab-activeBackground & vscode-tab-foreground
const List = styled.div<{ isDraggingOver: boolean }>`
  padding: 2px 5px;
  transition: background 0.1s;
  background-color: ${props => (props.isDraggingOver ? 'var(--vscode-tab-border)' : 'inherit ')};
  min-height: 20px;
`;

const SubTitle = styled.div`
  padding: 4px 8px;
  margin: 4px 5px 0 5px;
  font-size: 1em;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  opacity: 0.9;
  color: var(--vscode-editor-selectionForeground);
  border-left: 3px solid var(--vscode-editor-selectionBackground);
  background-color: rgba(255, 255, 255, 0.05);
`;

export interface ColumnInterface {
  id: string;
  title: string;
  isGroup?: boolean;
  subColumns?: ColumnInterface[];
}

interface ColumnProps {
  allTasks: { [key: string]: TaskInterface };
  columnIndex: number;
  column: ColumnInterface;
  isLast: boolean;
  onChangeTask: (idx: string, task: any) => void;
  onDeleteTask: (task: TaskInterface, columnId: string) => void;
  onInProgressTask: (task: TaskInterface, columnId: string) => void;
  onCompleteTask: (task: TaskInterface, columnId: string) => void;
  onMoveTask: (taskId: string, sourceColId: string, destColId: string, destIndex: number) => void;
}

export default memo(
  ({ column, allTasks, columnIndex, isLast, onChangeTask, onDeleteTask, onInProgressTask, onCompleteTask, onMoveTask }: ColumnProps) => {
    const subCols = column.subColumns || [column];

    return (
      <Draggable draggableId={column.id} index={columnIndex}>
        {(provided, snapshot) => (
          <Container
            {...provided.draggableProps}
            isDragging={snapshot.isDragging}
            ref={provided.innerRef}
          >
            <Title {...provided.dragHandleProps}>
              <span>{column.title.indexOf('✓') >= 0 ? <i className="fas fa-check-double" style={{marginRight: 5}} /> : null}{column.title.replace('✓', '').trim()}</span>
            </Title>
            
            {subCols.map((subCol, subIdx) => {
              const taskIds = subCol['taskIds'] || [];
              const tasks = taskIds.map(taskId => allTasks[taskId]);
              const showSubTitle = column.isGroup;
              let displayTitle = subCol.title.replace(column.title, '').replace(/^\s*-\s*/, '').trim();
              if (!displayTitle && column.isGroup) {
                displayTitle = "General";
              }
              
              return (
                <React.Fragment key={subCol.id}>
                  {showSubTitle && <SubTitle>{displayTitle}</SubTitle>}
                  <Droppable droppableId={subCol.id} type="task">
                    {(provided, snapshot) => (
                      <List ref={provided.innerRef} {...provided.droppableProps} isDraggingOver={snapshot.isDraggingOver}>
                        {tasks.map((t, i) => {
                          if (!t || !t.id) {
                            return null;
                          }
                          const taskCol = { ...subCol, isLast };
                          
                          const canMoveUp = subIdx > 0 || i > 0;
                          const canMoveDown = subIdx < subCols.length - 1 || i < taskIds.length - 1;

                          return (
                            <Task
                              key={t.id}
                              column={taskCol}
                              columnIndex={columnIndex}
                              task={t}
                              index={i}
                              canMoveUp={column.isGroup && canMoveUp}
                              canMoveDown={column.isGroup && canMoveDown}
                              onMoveUp={() => {
                                if (i > 0) {
                                  onMoveTask(t.id, subCol.id, subCol.id, i - 1);
                                } else if (subIdx > 0) {
                                  const prevCol = subCols[subIdx - 1];
                                  onMoveTask(t.id, subCol.id, prevCol.id, (prevCol['taskIds'] || []).length);
                                }
                              }}
                              onMoveDown={() => {
                                if (i < taskIds.length - 1) {
                                  onMoveTask(t.id, subCol.id, subCol.id, i + 1);
                                } else if (subIdx < subCols.length - 1) {
                                  const nextCol = subCols[subIdx + 1];
                                  onMoveTask(t.id, subCol.id, nextCol.id, 0);
                                }
                              }}
                              onChangeTitle={(newTitle: string) => {
                                t.content = newTitle;
                                const categoryMatch = newTitle.match(/^([^:\s]+):/);
                                if (categoryMatch) {
                                  t.category = categoryMatch[1];
                                } else {
                                  delete t.category;
                                }
                                onChangeTask(t.id, t);
                              }}
                              onDelete={(task: TaskInterface) => onDeleteTask(task, subCol.id)}
                              onInProgress={(task: TaskInterface) => onInProgressTask(task, subCol.id)}
                              onComplete={(task: TaskInterface) => onCompleteTask(task, subCol.id)}
                              onChangeTask={onChangeTask}
                            />
                          );
                        })}
                        {provided.placeholder}
                      </List>
                    )}
                  </Droppable>
                </React.Fragment>
              );
            })}
          </Container>
        )}
      </Draggable>
    );
  }
);
