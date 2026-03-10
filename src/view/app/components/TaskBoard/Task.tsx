import * as React from 'react';
import styled from 'styled-components';
import { Draggable } from 'react-beautiful-dnd';
import TextareaAutosize from 'react-autosize-textarea';
import { DragIcon, isDoneColumn, isArchivedColumn, isTodoColumn, isInProgressColumn } from './Helpers';
import TaskMenu from './TaskMenu';
import { parseInline } from 'marked';

const { memo } = React;

export interface TaskInterface {
  id: string;
  content: string;
  done: boolean;
  hasCheckbox?: boolean;
  matched?: boolean;
  level?: number;
  category?: string;
  priority?: string;
  isBug?: boolean;
}

const getCategoryColor = (category?: string) => {
  if (!category) return { bg: '#333', fg: 'var(--vscode-tab-foreground)' };

  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  let h = Math.abs(hash) % 360;
  return { bg: `hsl(${h}, 45%, 35%)`, fg: '#fff' };
};

const TaskContainer = styled.div<{ isDragging: boolean; level?: number; isSelected?: boolean; category?: string }>`
  position: relative;
  border-radius: 4px;
  margin-left: ${props => (props.level || 0) * 20 + 5}px;
  margin-bottom: 8px;
  background-color: ${props => getCategoryColor(props.category).bg};
  color: ${props => getCategoryColor(props.category).fg};
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
  overflow: hidden;
  border: ${props => props.isSelected ? '2px solid var(--vscode-focusBorder)' : '1px solid rgba(255,255,255,0.1)'};
  box-shadow: ${props => props.isSelected ? '0 0 10px var(--vscode-focusBorder)' : 'none'};
  box-sizing: border-box;
  z-index: ${props => props.isSelected ? 5 : 1};
  display: flex;

  ${props => (props.level || 0) > 0 && `
    background-color: rgba(255, 255, 255, 0.05);
    border-left: 3px solid rgba(255, 255, 255, 0.2);
  `}

  &:hover {
    filter: brightness(1.1);
    box-shadow: 
      ${props => props.isSelected ? '0 0 10px var(--vscode-focusBorder),' : ''}
      0 4px 12px rgba(0, 0, 0, 0.5);
    z-index: 10;
  }
`;

const PrioritySidebar = styled.div<{ priority?: string; isBug?: boolean }>`
  width: 28px;
  background: ${props => {
    if (props.priority === '!p1') return '#e51400';
    if (props.priority === '!p2') return '#d18e00';
    if (props.isBug) return 'repeating-linear-gradient(45deg, #e51400, #e51400 6px, #ffffff 6px, #ffffff 12px)';
    return '#555';
  }};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 0;
  gap: 4px;
  flex-shrink: 0;
  opacity: 0.8;
  cursor: grab;
  &:active {
    cursor: grabbing;
  }
`;

const Handle = styled.span`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.5);
  margin-bottom: 2px;
`;

const TaskContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Prevent flex overflow */
`;

const TaskHeader = styled.div`
  font-size: 0.85em;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 8px 10px 0px 10px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 8px;
  color: inherit;
  filter: brightness(1.2);

  .header-icon {
    font-size: 1.1em;
    opacity: 0.9;
  }
  
  .status-icons {
    margin-left: auto;
    display: flex;
    gap: 8px;
    align-items: center;
  }
`;

const TaskDisplay = styled.div`
  box-sizing: border-box;
  width: 100%;
  padding: 6px 0;
  background-color: inherit;
  color: inherit;
  border: 1px solid transparent;
  font-family: inherit;
  white-space: pre-wrap;
  flex: 1;
`;

const DescriptionContainer = styled.div<{ isCollapsed: boolean }>`
  padding: 6px 8px 8px 8px;
  display: ${props => props.isCollapsed ? 'none' : 'block'};
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  background-color: rgba(0, 0, 0, 0.1);
`;

const PriorityBadge = styled.span<{ priority: string }>`
  padding: 2px;
  border-radius: 3px;
  font-size: 0.6em;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.3);
  writing-mode: vertical-lr;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ToggleDescIcon = styled.span`
  margin-left: auto;
  cursor: pointer;
  padding: 2px 4px;
  opacity: 0.6;
  &:hover {
    opacity: 1;
  }
`;

const CheckboxIcon = styled.span<{ checked: boolean }>`
  margin-right: 6px;
  cursor: pointer;
  opacity: 0.8;
  &:hover {
    opacity: 1;
  }
`;

const StyledTextarea = styled(TextareaAutosize)`
  resize: none;
  box-sizing: border-box;
  width: 100%;
  background-color: inherit;
  color: inherit;
  border: 1px solid transparent;
  margin-top: 1px;
  margin-bottom: 3px;
  font-family: inherit;
`;

const ActionWrapper = styled.div<{ hasTimestamps?: boolean }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 2px 6px;
  background-color: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  /* Reserving space to prevent layout jumping on hover */
  opacity: ${props => props.hasTimestamps ? 1 : 0};
  visibility: ${props => props.hasTimestamps ? 'visible' : 'hidden'};
  transition: opacity 0.2s ease, visibility 0.2s ease;
`;

const AiDraftSection = styled.div`
  margin: 0 8px 8px 8px;
  border-radius: 4px;
  border: 1px solid rgba(138, 180, 248, 0.4);
  background-color: rgba(138, 180, 248, 0.08);
  overflow: hidden;
`;

const AiDraftLabel = styled.div`
  font-size: 0.75em;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  padding: 4px 8px;
  background-color: rgba(138, 180, 248, 0.15);
  color: rgba(138, 180, 248, 0.9);
  border-bottom: 1px solid rgba(138, 180, 248, 0.2);
  display: flex;
  align-items: center;
  gap: 6px;
`;

const AiDraftContent = styled.div`
  padding: 6px 8px;
  white-space: pre-wrap;
  font-family: inherit;
  font-size: 0.95em;
  color: rgba(255, 255, 255, 0.9);
`;

const AiDraftActions = styled.div`
  display: flex;
  gap: 6px;
  padding: 4px 8px 6px 8px;
  border-top: 1px solid rgba(138, 180, 248, 0.15);
`;

const AiAcceptBtn = styled.button`
  padding: 3px 10px;
  font-size: 0.8em;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  background-color: rgba(100, 200, 120, 0.3);
  color: #8eda9f;
  border: 1px solid rgba(100, 200, 120, 0.4);
  &:hover {
    background-color: rgba(100, 200, 120, 0.5);
  }
`;

const AiRejectBtn = styled.button`
  padding: 3px 10px;
  font-size: 0.8em;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  background-color: rgba(220, 80, 80, 0.2);
  color: #e88;
  border: 1px solid rgba(220, 80, 80, 0.35);
  &:hover {
    background-color: rgba(220, 80, 80, 0.35);
  }
`;

const AiErrorText = styled.div`
  padding: 6px 8px;
  font-size: 0.82em;
  color: #e88;
  font-style: italic;
`;

const TaskWrapper = styled.div`
  display: flex;
  flex-direction: column;
  background-color: inherit;
  [draggable] {
    margin: 0;
  }
  &:hover {
    ${ActionWrapper} {
      opacity: 1;
      visibility: visible;
    }
  }
`;

const MainRow = styled.div`
  display: flex;
  align-items: center;
  padding: 4px;
  padding-right: 8px;
`;

const TaskTimestamps = styled.div`
  font-size: 0.85em;
  opacity: 0.7;
  font-style: italic;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 4px;
`;

const ActionIcon = styled.span<{ disabled?: boolean }>`
  font-size: 0.9em;
  padding: 2px 6px;
  margin: 0 3px;
  cursor: ${props => props.disabled ? 'default' : 'pointer'};
  background-color: rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 4px;
  transition: background 0.1s;
  opacity: ${props => props.disabled ? 0.3 : 1};
  pointer-events: ${props => props.disabled ? 'none' : 'auto'};
  &:hover {
    background-color: ${props => props.disabled ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)'};
  }
`;

interface TaskProps {
  column: any;
  columnIndex: number;
  task: TaskInterface;
  index: number;
  isSelected?: boolean;
  onSelect?: (taskId: string, multi: boolean) => void;
  onChangeTitle: (title: string) => void;
  onDelete: (task: TaskInterface) => void;
  onInProgress: (task: TaskInterface) => void;
  onBackwards: (task: TaskInterface) => void;
  onComplete: (task: TaskInterface) => void;
  onChangeTask: (id: string, task: TaskInterface) => void;
  vscodeHelper: any;
  onMoveUp?: (task: TaskInterface) => void;
  onMoveDown?: (task: TaskInterface) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

export default memo(
  ({
    column,
    columnIndex,
    task,
    index,
    isSelected,
    onSelect,
    onChangeTitle,
    onDelete,
    onInProgress,
    onBackwards,
    onComplete,
    onChangeTask,
    vscodeHelper,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown
  }: TaskProps) => {
    // mainKey is used to force re-render StyledTextarea as it doesn't auto re-render as expected.
    const [mainKey, setMainKey] = React.useState('key_' + Math.random());
    const [isEditing, setIsEditing] = React.useState(false);
    const savedState = vscodeHelper.getState();
    const [isCollapsed, setIsCollapsed] = React.useState(savedState.isTaskCollapsed?.[task.id] ?? true);
    const [menuActive, setMenuActive] = React.useState('');
    const inputRef: React.RefObject<HTMLTextAreaElement> = React.createRef();
    const [aiLoading, setAiLoading] = React.useState(false);
    const [aiDraft, setAiDraft] = React.useState<string | null>(null);
    const [aiError, setAiError] = React.useState<string | null>(null);

    const toggleCollapsed = (e) => {
      e.stopPropagation();
      const newState = !isCollapsed;
      setIsCollapsed(newState);
      const currentState = vscodeHelper.getState();
      vscodeHelper.setState({
        ...currentState,
        isTaskCollapsed: {
          ...(currentState.isTaskCollapsed || {}),
          [task.id]: newState
        }
      });
    };

    React.useEffect(() => {
      // on did mount
      if (window['isCreatingTask'] === true) {
        // after clicking on "+ New Task" button => auto focus when creating task
        window['isCreatingTask'] = false;
        setIsEditing(true);
      }
    }, []);

    React.useEffect(() => {
      if (isEditing === true) {
        // when editing, auto set the cursor at the end:
        inputRef.current.setSelectionRange(inputRef.current.value.length, inputRef.current.value.length);
      }
    }, [isEditing]);

    React.useEffect(() => {
      const handleMessage = (event: MessageEvent) => {
        const msg = event.data;
        if (msg.action === 'aiRefineResponse' && msg.taskId === task.id) {
          setAiLoading(false);
          if (msg.error) {
            setAiError(msg.error);
          } else {
            setAiDraft(msg.result);
          }
        }
      };
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }, [task.id]);

    const handleAiRefine = (e: React.MouseEvent) => {
      e.stopPropagation();
      setAiLoading(true);
      setAiDraft(null);
      setAiError(null);
      vscodeHelper.aiRefine(task.id, task.content);
    };

    const handleAiAccept = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (aiDraft) {
        onChangeTask(task.id, { ...task, content: aiDraft });
        setMainKey('key_' + Math.random());
      }
      setAiDraft(null);
      setAiError(null);
    };

    const handleAiReject = (e: React.MouseEvent) => {
      e.stopPropagation();
      setAiDraft(null);
      setAiError(null);
    };

    const isHidden = task.matched === false; // filtered by SearchInput's value
    if (isHidden) {
      return null;
    }

    const contentLines = (task.content || '').split('\n');
    const title = contentLines[0];
    const descriptionLines = contentLines.slice(1);
    const hasDescription = descriptionLines.some(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.startsWith('> Started:') && 
             !trimmed.startsWith('> Completed:');
    });

    let displayTitle = title;
    if (task.category && displayTitle.startsWith(task.category + ':')) {
      displayTitle = displayTitle.substring(task.category.length + 1).trim();
    }

    const toggleSubtask = (lineIdx: number) => {
      const lines = [...contentLines];
      const line = lines[lineIdx];
      if (line.includes('( )')) {
        lines[lineIdx] = line.replace('( )', '(x)');
      } else if (line.includes('(x)')) {
        lines[lineIdx] = line.replace('(x)', '( )');
      }
      onChangeTask(task.id, { ...task, content: lines.join('\n') });
    };

    const handleKeyDown = (ev: React.KeyboardEvent) => {
      if (isEditing) return;

      switch (ev.key) {
        case 'Enter':
          setIsEditing(true);
          ev.preventDefault();
          break;
        case ' ':
          onSelect && onSelect(task.id, ev.ctrlKey || ev.metaKey || ev.shiftKey);
          ev.preventDefault();
          break;
        case 'ArrowRight':
          if (isSelected) onInProgress(task);
          break;
        case 'ArrowLeft':
          if (isSelected) onBackwards(task);
          break;
        case 'Delete':
        case 'Backspace':
          if (isSelected) onDelete(task);
          break;
      }
    };

    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <TaskContainer
            {...provided.draggableProps}
            ref={provided.innerRef}
            isDragging={snapshot.isDragging}
            level={task.level}
            isSelected={isSelected}
            category={task.category}
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onClick={(ev) => {
              if (ev.detail === 2) { // Double click to edit
                setIsEditing(true);
              } else if (onSelect) {
                onSelect(task.id, ev.ctrlKey || ev.metaKey || ev.shiftKey);
              }
            }}
          >
            <PrioritySidebar priority={task.priority} isBug={task.isBug} {...provided.dragHandleProps}>
              <Handle>
                <DragIcon />
              </Handle>
              {task.priority && (
                <PriorityBadge priority={task.priority}>
                  {task.priority.replace('!', '').toUpperCase()}
                </PriorityBadge>
              )}
              {task.isBug && (
                <PriorityBadge priority="!p1" style={{ backgroundColor: '#e51400' }}>
                  BUG
                </PriorityBadge>
              )}
            </PrioritySidebar>

            <TaskContentArea>
              {!isEditing && (
                <TaskHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isTodoColumn(column.title) && <i className="far fa-square header-icon" />}
                    {isInProgressColumn(column.title) && <i className="far fa-circle header-icon" />}
                    {isDoneColumn(column.title) && <i className="far fa-check-square header-icon" />}
                    {isArchivedColumn(column.title) && <i className="fas fa-file-archive header-icon" />}
                    {!isTodoColumn(column.title) && !isInProgressColumn(column.title) && !isDoneColumn(column.title) && !isArchivedColumn(column.title) && (
                       <i className={`fas ${task.category ? 'fa-tag' : 'fa-tasks'} header-icon`} />
                    )}
                    {task.category || 'Task'}
                  </div>
                </TaskHeader>
              )}
              <TaskWrapper>
                <MainRow>
                  {isEditing ? (
                    <StyledTextarea
                      placeholder="New Task"
                      autoFocus={true}
                      key={mainKey}
                      ref={inputRef}
                      onKeyDown={ev => {
                        if (ev.keyCode === 13 && !ev.shiftKey) {
                          ev.preventDefault(); // Enter (without Shift) finishes editing
                          setIsEditing(false);
                        }
                      }}
                      style={{ paddingLeft: task.level > 0 ? 10 : 0 }}
                      onChange={(ev: any) => onChangeTitle(ev.target.value)}
                      onFocus={() => {
                        setIsEditing(true);
                        setMenuActive('');
                      }}
                      onBlur={() => {
                        if (menuActive === '' || menuActive === 'MENU') {
                          setIsEditing(false);
                        }
                      }}
                    >
                      {task.content}
                    </StyledTextarea>
                  ) : (
                    <>
                      <TaskDisplay
                        dangerouslySetInnerHTML={{ __html: parseInline(displayTitle || '&nbsp;') }}
                      />
                      {hasDescription && (
                        <ToggleDescIcon onClick={toggleCollapsed}>
                          <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'}`} />
                        </ToggleDescIcon>
                      )}
                    </>
                  )}
                </MainRow>

                {!isEditing && !isCollapsed && hasDescription && (
                  <DescriptionContainer isCollapsed={isCollapsed}>
                    {contentLines.slice(1).map((line, idx) => {
                      const lineIdx = idx + 1;
                      const isChecklist = line.includes('( )') || line.includes('(x)');
                      const isChecked = line.includes('(x)');
                      const timestampLine = line.startsWith('> Started:') || line.startsWith('> Completed:');

                      if (timestampLine) return null;

                      return (
                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', margin: '4px 0' }}>
                          {isChecklist && (
                            <CheckboxIcon 
                              checked={isChecked} 
                              onClick={(e) => { e.stopPropagation(); toggleSubtask(lineIdx); }}
                            >
                              <i className={`far fa-${isChecked ? 'dot-circle' : 'circle'}`} />
                            </CheckboxIcon>
                          )}
                          <span 
                            style={{ opacity: timestampLine ? 0.6 : 1, fontStyle: timestampLine ? 'italic' : 'normal' }}
                            dangerouslySetInnerHTML={{ __html: parseInline(line.replace(/\([ x]\)/, '').trim()) }}
                          />
                        </div>
                      );
                    })}
                  </DescriptionContainer>
                )}

                {isEditing ? (
                  <ActionWrapper>
                    <div />
                    <div style={{ display: 'flex' }}>
                      <ActionIcon
                        data-type="action-icon"
                        onMouseOver={() => setMenuActive('MENU')}
                        onClick={() => {
                          setMenuActive('');
                          setIsEditing(false);
                        }}
                      >
                        <i className="fas fa-bars" />
                      </ActionIcon>
                    </div>
                    {menuActive && (
                      <TaskMenu
                        task={task}
                        menuActive={menuActive}
                        setMenuActive={setMenuActive}
                        onChangeTask={onChangeTask}
                        setMainKey={setMainKey}
                        setIsEditing={setIsEditing}
                      />
                    )}
                  </ActionWrapper>
                ) : (
                  <ActionWrapper hasTimestamps={task.content && (task.content.includes('> Started:') || task.content.includes('> Completed:'))}>
                    <TaskTimestamps>
                      {task.content && task.content.split('\n')
                        .filter(line => line.startsWith('> Started:') || line.startsWith('> Completed:'))
                        .map((line, idx) => (
                          <span key={idx}>{line.replace('> ', '')}</span>
                        ))
                      }
                    </TaskTimestamps>
                    <div style={{ display: 'flex' }}>
                      <ActionIcon
                        data-type="action-icon"
                        disabled={aiLoading}
                        title="AI Refine"
                        onClick={handleAiRefine}
                        style={{ opacity: aiLoading ? 0.5 : 1 }}
                      >
                        {aiLoading ? <i className="fas fa-spinner fa-spin" /> : '✨'}
                      </ActionIcon>
                      {columnIndex > 0 && (
                        <ActionIcon data-type="action-icon" onClick={() => onBackwards(task)}>
                          <i className="fas fa-arrow-left" />
                        </ActionIcon>
                      )}
                      {onMoveUp && (
                        <ActionIcon
                          data-type="action-icon"
                          disabled={!canMoveUp}
                          onClick={() => canMoveUp && onMoveUp(task)}
                        >
                          <i className="fas fa-chevron-up" />
                        </ActionIcon>
                      )}
                      {onMoveDown && (
                        <ActionIcon
                          data-type="action-icon"
                          disabled={!canMoveDown}
                          onClick={() => canMoveDown && onMoveDown(task)}
                        >
                          <i className="fas fa-chevron-down" />
                        </ActionIcon>
                      )}
                      {(!task.done || !column.isLast) && (
                        <ActionIcon data-type="action-icon" onClick={() => onInProgress(task)}>
                          <i className="fas fa-arrow-right" />
                        </ActionIcon>
                      )}
                      {!task.done && (
                        <ActionIcon data-type="action-icon" onClick={() => onComplete(task)}>
                          <i className="fas fa-check" />
                        </ActionIcon>
                      )}
                      <ActionIcon data-type="action-icon" onClick={() => onDelete(task)}>
                        <i className="fas fa-times" />
                      </ActionIcon>
                    </div>
                  </ActionWrapper>
                )}
              </TaskWrapper>

            {(aiDraft || aiError) && (
              <AiDraftSection onClick={e => e.stopPropagation()}>
                <AiDraftLabel>
                  ✨ AI Suggestion
                </AiDraftLabel>
                {aiError ? (
                  <AiErrorText>{aiError}</AiErrorText>
                ) : (
                  <>
                    <AiDraftContent>{aiDraft}</AiDraftContent>
                    <AiDraftActions>
                      <AiAcceptBtn onClick={handleAiAccept}>Accept</AiAcceptBtn>
                      <AiRejectBtn onClick={handleAiReject}>Reject</AiRejectBtn>
                    </AiDraftActions>
                  </>
                )}
                {aiError && (
                  <AiDraftActions>
                    <AiRejectBtn onClick={handleAiReject}>Dismiss</AiRejectBtn>
                  </AiDraftActions>
                )}
              </AiDraftSection>
            )}
            </TaskContentArea>
          </TaskContainer>
        )}
      </Draggable>
    );
  }
);
