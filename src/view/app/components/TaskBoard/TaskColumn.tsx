import * as React from 'react';
import styled from 'styled-components';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import Task, { TaskInterface } from './Task';
import { updateTaskMetadata } from './Helpers';

const { memo, useState } = React;

const Container = styled.div<{ isDragging: boolean; isCollapsed?: boolean }>`
  min-height: 150px;
  margin: 0px 4px;
  border-radius: 4px;
  flex: ${props => (props.isCollapsed ? '0 0 50px' : '1')};
  min-width: ${props => (props.isCollapsed ? '50px' : '300px')};
  display: flex;
  flex-direction: column;
  background-color: ${props => (props.isDragging ? 'var(--vscode-editor-selectionBackground)' : 'rgba(0,0,0,0.1)')};
  transition: all 0.2s ease-in-out;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Title = styled.div<{ isCollapsed?: boolean }>`
  padding: 8px 12px;
  margin: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  writing-mode: ${props => (props.isCollapsed ? 'vertical-rl' : 'horizontal-tb')};
  height: ${props => (props.isCollapsed ? '100%' : 'auto')};

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  > span {
    font-weight: bold;
    font-size: 1.1em;
    text-transform: uppercase;
    letter-spacing: 1px;
    display: flex;
    align-items: center;
    color: var(--vscode-editor-foreground);
  }

  .col-toggle-icon {
    opacity: 0.5;
    transition: transform 0.2s;
    ${props => props.isCollapsed && `
      transform: rotate(180deg);
      margin-top: 10px;
    `}
  }
`;

const ColumnContent = styled.div<{ isCollapsed?: boolean }>`
  display: ${props => (props.isCollapsed ? 'none' : 'block')};
`;
const List = styled.div<{ isDraggingOver: boolean; isCollapsed?: boolean }>`
  padding: 2px 5px;
  transition: background 0.1s;
  background-color: ${props => (props.isDraggingOver ? 'var(--vscode-tab-border)' : 'inherit ')};
  min-height: 20px;
  ${props => props.isCollapsed && `
    height: 0;
    min-height: 0;
    overflow: hidden;
    padding: 0;
  `}
`;

const SubTitle = styled.div<{ isGeneral?: boolean }>`
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
  cursor: ${props => props.isGeneral ? 'not-allowed' : 'grab'};
  display: flex;
  align-items: center;
  justify-content: space-between;

  &:hover {
    background-color: ${props => props.isGeneral ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.1)'};
  }

  .toggle-icon {
    cursor: pointer;
    padding: 2px 6px;
    font-size: 0.8em;
    opacity: 0.6;
    &:hover {
      opacity: 1;
    }
  }
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
  selectedTaskIds: string[];
  vscodeHelper: any;
  onSelectTask: (taskId: string, multi: boolean) => void;
  onChangeTask: (idx: string, task: any) => void;
  onDeleteTask: (task: TaskInterface, columnId: string) => void;
  onInProgressTask: (task: TaskInterface, columnId: string) => void;
  onBackwardsTask: (task: TaskInterface, columnId: string) => void;
  onCompleteTask: (task: TaskInterface, columnId: string) => void;
  onMoveTask: (taskId: string, sourceColId: string, destColId: string, destIndex: number) => void;
}

export default memo(
  ({ column, allTasks, columnIndex, isLast, selectedTaskIds, vscodeHelper, onSelectTask, onChangeTask, onDeleteTask, onInProgressTask, onBackwardsTask, onCompleteTask, onMoveTask }: ColumnProps) => {
    const subCols = column.subColumns || [column];
    const savedState = vscodeHelper.getState();
    const [collapsedSections, setCollapsedSections] = useState<string[]>(savedState.collapsedSections || []);
    const [isColumnCollapsed, setIsColumnCollapsed] = useState(
      savedState.isColumnCollapsed?.[column.id] ?? column.title.toLowerCase().includes('archived')
    );

    const toggleSection = (id: string) => {
      const newSections = collapsedSections.includes(id) 
        ? collapsedSections.filter(s => s !== id) 
        : [...collapsedSections, id];
      setCollapsedSections(newSections);
      vscodeHelper.setState({ ...vscodeHelper.getState(), collapsedSections: newSections });
    };

    const toggleColumn = () => {
      const newState = !isColumnCollapsed;
      setIsColumnCollapsed(newState);
      const currentState = vscodeHelper.getState();
      vscodeHelper.setState({
        ...currentState,
        isColumnCollapsed: {
          ...(currentState.isColumnCollapsed || {}),
          [column.id]: newState
        }
      });
    };

    return (
      <Draggable draggableId={column.id} index={columnIndex}>
        {(provided, snapshot) => (
          <Container
            {...provided.draggableProps}
            isDragging={snapshot.isDragging}
            isCollapsed={isColumnCollapsed}
            ref={provided.innerRef}
          >
            <Title 
              {...provided.dragHandleProps} 
              isCollapsed={isColumnCollapsed}
              onClick={toggleColumn}
            >
              <span>
                {column.title.indexOf('✓') >= 0 ? <i className="fas fa-check-double" style={{marginRight: 8}} /> : null}
                {column.title.replace('✓', '').trim()}
              </span>
              <span className="col-toggle-icon">
                <i className="fas fa-chevron-left" />
              </span>
            </Title>
            
            <ColumnContent isCollapsed={isColumnCollapsed}>
              {column.isGroup ? (
                <Droppable droppableId={`subcolumns-${column.id}`} type="subcolumn" direction="vertical">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {subCols.map((subCol, subIdx) => {
                        const taskIds = subCol['taskIds'] || [];
                        const tasks = taskIds.map(taskId => allTasks[taskId]);
                        let displayTitle = subCol.title.replace(column.title, '').replace(/^\s*-\s*/, '').trim();
                        const isGeneral = !displayTitle;
                        if (isGeneral) {
                          displayTitle = "General";
                        }
                        
                        const isCollapsed = collapsedSections.includes(subCol.id);

                        return (
                          <Draggable key={subCol.id} draggableId={subCol.id} index={subIdx} isDragDisabled={isGeneral}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={{
                                  ...provided.draggableProps.style,
                                  opacity: snapshot.isDragging ? 0.5 : 1
                                }}
                              >
                                <SubTitle {...provided.dragHandleProps} isGeneral={isGeneral}>
                                  <span>{displayTitle}</span>
                                  <span 
                                    className="toggle-icon" 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleSection(subCol.id);
                                    }}
                                  >
                                    <i className={`fas ${isCollapsed ? 'fa-chevron-down' : 'fa-chevron-up'}`} />
                                  </span>
                                </SubTitle>
                                <Droppable droppableId={subCol.id} type="task" isCombineEnabled>
                                  {(provided, snapshot) => (
                                    <List 
                                      ref={provided.innerRef} 
                                      {...provided.droppableProps} 
                                      isDraggingOver={snapshot.isDraggingOver}
                                      isCollapsed={isCollapsed}
                                    >
                                      {!isCollapsed && tasks.map((t, i) => {
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
                                            isSelected={selectedTaskIds.includes(t.id)}
                                            vscodeHelper={vscodeHelper}
                                            onSelect={onSelectTask}
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
                                              updateTaskMetadata(t, newTitle);
                                              onChangeTask(t.id, t);
                                            }}
                                            onDelete={(task: TaskInterface) => onDeleteTask(task, subCol.id)}
                                            onInProgress={(task: TaskInterface) => onInProgressTask(task, subCol.id)}
                                            onBackwards={(task: TaskInterface) => onBackwardsTask(task, subCol.id)}
                                            onComplete={(task: TaskInterface) => onCompleteTask(task, subCol.id)}
                                            onChangeTask={onChangeTask}
                                          />
                                        );
                                      })}
                                      {provided.placeholder}
                                    </List>
                                  )}
                                </Droppable>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              ) : (
                subCols.map((subCol, subIdx) => {
                  const taskIds = subCol['taskIds'] || [];
                  const tasks = taskIds.map(taskId => allTasks[taskId]);
                  
                  return (
                    <Droppable key={subCol.id} droppableId={subCol.id} type="task" isCombineEnabled>
                      {(provided, snapshot) => (
                        <List ref={provided.innerRef} {...provided.droppableProps} isDraggingOver={snapshot.isDraggingOver}>
                          {tasks.map((t, i) => {
                            if (!t || !t.id) {
                              return null;
                            }
                            const taskCol = { ...subCol, isLast };

                            return (
                              <Task
                                key={t.id}
                                column={taskCol}
                                columnIndex={columnIndex}
                                task={t}
                                index={i}
                                isSelected={selectedTaskIds.includes(t.id)}
                                vscodeHelper={vscodeHelper}
                                onSelect={onSelectTask}
                                onChangeTitle={(newTitle: string) => {
                                  updateTaskMetadata(t, newTitle);
                                  onChangeTask(t.id, t);
                                }}
                                onDelete={(task: TaskInterface) => onDeleteTask(task, subCol.id)}
                                onInProgress={(task: TaskInterface) => onInProgressTask(task, subCol.id)}
                                onBackwards={(task: TaskInterface) => onBackwardsTask(task, subCol.id)}
                                onComplete={(task: TaskInterface) => onCompleteTask(task, subCol.id)}
                                onChangeTask={onChangeTask}
                              />
                            );
                          })}
                          {provided.placeholder}
                        </List>
                      )}
                    </Droppable>
                  );
                })
              )}
            </ColumnContent>
          </Container>
        )}
      </Draggable>
    );
  }
);
