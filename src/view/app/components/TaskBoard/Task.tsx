import * as React from 'react';
import styled from 'styled-components';
import { Draggable } from 'react-beautiful-dnd';
import TextareaAutosize from 'react-autosize-textarea';
import { DragIcon } from './Helpers';
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
}

const getCategoryColor = (category?: string, isDragging?: boolean) => {
  if (isDragging) return { bg: '#eef', fg: '#333', outline: '#aaf' };
  if (!category) return { bg: '#333', fg: 'var(--vscode-tab-foreground)', outline: '#555' };

  const catLower = category.toLowerCase();
  if (catLower === 'bug' || catLower === 'fix') {
    return { bg: '#e51400', fg: '#fff', outline: '#ff5f52' }; // Bright Red, lighter red outline
  }

  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Generate a hue from 0 to 360
  let h = Math.abs(hash) % 360;
  
  // Avoid the red/pink zone (approx 340 to 20) so 'bug'/'fix' stay unique
  if (h > 340 || h < 20) {
    h = (h + 40) % 360;
  }

  // Use consistent Saturation and Lightness for a professional, readable look with white text
  return { 
    bg: `hsl(${h}, 45%, 35%)`, 
    fg: '#fff',
    outline: `hsl(${h}, 70%, 60%)` // Lighter tint for the outline
  };
};

const TaskContainer = styled.div<{ isDragging: boolean; category?: string }>`
  position: relative;
  border-radius: 4px;
  margin-left: 5px;
  margin-bottom: 8px;
  background-color: ${props => getCategoryColor(props.category, props.isDragging).bg};
  color: ${props => getCategoryColor(props.category, props.isDragging).fg};
  transition: all 0.2s ease;
  overflow: visible; /* Changed from hidden to show shadow/scale */
  border: none;
  box-sizing: border-box;
  z-index: 1;

  &:hover {
    filter: brightness(1.15);
    transform: scale(1.02) translateY(-2px);
    box-shadow: 
      0 0 0 5px ${props => getCategoryColor(props.category, props.isDragging).outline},
      0 8px 16px rgba(0, 0, 0, 0.4);
    z-index: 10;
  }
`;

const Handle = styled.span`
  display: flex;
  margin-right: 5px;
`;

const TaskDisplay = styled.div`
  box-sizing: border-box;
  width: 100%;
  padding: 3px 0 3px 0;
  margin-bottom: 2px;
  background-color: inherit;
  color: inherit;
  border: 1px solid transparent;
  font-family: inherit;
  white-space: pre-wrap;
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

const ActionWrapper = styled.div`
  display: none;
  justify-content: flex-end;
  padding: 4px 6px;
  background-color: rgba(0, 0, 0, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
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
      display: flex;
    }
  }
`;

const MainRow = styled.div`
  display: flex;
  align-items: center;
  padding: 4px;
  padding-right: 8px;
`;

const CategoryIcon = styled.span`
  margin-right: 6px;
  font-size: 0.9em;
  opacity: 0.9;
`;

const TaskTimestamps = styled.div`
  padding: 2px 8px 6px 32px;
  font-size: 0.75em;
  opacity: 0.7;
  font-style: italic;
  display: flex;
  flex-direction: column;
  gap: 2px;
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

const TickMark = styled.span`
  font-size: 1em;
  color: #ddd;
  margin-right: 3px;
`;

interface TaskProps {
  column: any;
  columnIndex: number;
  task: TaskInterface;
  index: number;
  onChangeTitle: (title: string) => void;
  onDelete: (task: TaskInterface) => void;
  onInProgress: (task: TaskInterface) => void;
  onComplete: (task: TaskInterface) => void;
  onChangeTask: (id: string, task: TaskInterface) => void;
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
    onChangeTitle,
    onDelete,
    onInProgress,
    onComplete,
    onChangeTask,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown
  }: TaskProps) => {
    // mainKey is used to force re-render StyledTextarea as it doesn't auto re-render as expected.
    const [mainKey, setMainKey] = React.useState('key_' + Math.random());
    const [isEditing, setIsEditing] = React.useState(false);
    const [menuActive, setMenuActive] = React.useState('');
    const inputRef: React.RefObject<HTMLTextAreaElement> = React.createRef();

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

    const isHidden = task.matched === false; // filtered by SearchInput's value
    if (isHidden) {
      return null;
    }

    // console.log('column.title', column.title);
    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided, snapshot) => (
          <TaskContainer
            {...provided.draggableProps}
            // {...provided.dragHandleProps}
            ref={provided.innerRef}
            isDragging={snapshot.isDragging}
            category={task.category}
          >
            <TaskWrapper>
              <MainRow>
                <Handle {...provided.dragHandleProps}>
                  <DragIcon />
                </Handle>
                <TickMark>{column.title.indexOf('✓') >= 0 ? <i className="fas fa-check-circle" /> : ''}</TickMark>
                {(task.category?.toLowerCase() === 'bug' || task.category?.toLowerCase() === 'fix') && (
                  <CategoryIcon title={task.category}>
                    <i className="fas fa-bug" />
                  </CategoryIcon>
                )}

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
                      // Shift + Enter will allow a new line by default
                    }}
                    style={{ paddingLeft: task.level > 0 ? 10 : 0 }}
                    onChange={(ev: any) => onChangeTitle(ev.target.value)}
                    onFocus={() => {
                      setIsEditing(true);
                      setMenuActive('');
                    }}
                    onClick={() => {
                      setMenuActive('');
                    }}
                    onBlur={() => {
                      if (menuActive === '' || menuActive === 'MENU') {
                        // e.g. if user is focusing in EMOJI menu, don't exit out of editing:
                        setIsEditing(false);
                      }
                    }}
                  >
                    {task.content}
                  </StyledTextarea>
                ) : (
                  <TaskDisplay
                    dangerouslySetInnerHTML={{ __html: parseInline(task.content || '&nbsp;') }}
                    onClick={ev => {
                      if (ev.target.tagName.toUpperCase() === 'A') {
                        // user clicked on a hyperlink <a> tag, let it behaves normally.
                      } else {
                        setIsEditing(true);
                      }
                    }}
                  />
                )}
              </MainRow>

              {(!isEditing && task.content && (task.content.includes('> Started:') || task.content.includes('> Completed:'))) && (
                <TaskTimestamps>
                  {task.content.split('\n')
                    .filter(line => line.startsWith('> Started:') || line.startsWith('> Completed:'))
                    .map((line, idx) => (
                      <span key={idx}>{line.replace('> ', '')}</span>
                    ))
                  }
                </TaskTimestamps>
              )}

              {isEditing ? (
                <ActionWrapper>
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
                <ActionWrapper>
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
                  {/* TODO: don't show Tick icon on the first column => need column index? */}
                  {!task.done && (
                    <ActionIcon data-type="action-icon" onClick={() => onComplete(task)}>
                      <i className="fas fa-check" />
                    </ActionIcon>
                  )}
                  <ActionIcon data-type="action-icon" onClick={() => onDelete(task)}>
                    <i className="fas fa-times" />
                  </ActionIcon>
                </ActionWrapper>
              )}
            </TaskWrapper>
          </TaskContainer>
        )}
      </Draggable>
    );
  }
);
