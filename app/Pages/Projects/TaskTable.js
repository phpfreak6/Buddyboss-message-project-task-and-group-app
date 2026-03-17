import React, { Fragment, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { DataTable, IconButton } from 'react-native-paper';
import DraggableFlatList from 'react-native-draggable-flatlist';
import DefaultTaskInputRow from './DefaultTaskInputRow';

const TaskTable = ({
  taskTableColumns,
  tasks = [],
  listId,
  scrollPositions = {},
  setScrollPositions,
  rowHeights = {},
  setRowHeights,
  onTaskCreate,
  onDragEnd,
  styles: customStyles,
  emptyMessage = 'No tasks in this list.',
  enableDrag = true,
}) => {
  const [draggedTasks, setDraggedTasks] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState(null);

  // Parent tasks are those without a parent_id or with parent_id 0
  const parentTasks = tasks.filter(
    t => t && (!t.parent_id || t.parent_id === 0),
  );

  // Initialize draggedTasks when tasks change
  useEffect(() => {
    const validParentTasks = parentTasks.filter(t => t && (t.id || t.task_id));
    if (validParentTasks.length > 0) {
      const currentOrder = draggedTasks.length > 0 ? draggedTasks.filter(t => t) : validParentTasks;
      // Only update if the task count changed or tasks are different
      if (currentOrder.length !== validParentTasks.length || 
          currentOrder.some((task, idx) => {
            if (!task || !validParentTasks[idx]) return true;
            return (task.id || task.task_id) !== (validParentTasks[idx]?.id || validParentTasks[idx]?.task_id);
          })) {
        setDraggedTasks([...validParentTasks]);
      }
    } else {
      setDraggedTasks([]);
    }
  }, [tasks.length, parentTasks.length]);

  const getSubtasksForParent = parentTask => {
    if (!parentTask || !parentTask.id) return [];
    
    // Prefer explicit subtasks array if present
    if (Array.isArray(parentTask.subtasks) && parentTask.subtasks.length) {
      return parentTask.subtasks
        .filter(sub => sub) // Filter out any undefined subtasks
        .map(sub => {
          if (sub.subtaskData) {
            return {
              ...sub,
              ...sub.subtaskData,
              assignees:
                sub.assignees ||
                sub.subtaskData.assignees ||
                sub.assigned_users ||
                [],
            };
          }
          return sub;
        });
    }
    // Fallback: derive from parent_id relationship within this list
    return tasks.filter(st => st && st.parent_id === parentTask.id);
  };

  const hasAnyTasks = tasks.length > 0;
  const scrollX = scrollPositions[listId] || 0;
  const baseWidth = taskTableColumns[0].width;
  // Decrease width by 1 pixel for each pixel scrolled
  const minWidth = baseWidth * 0.4; // Minimum 40% of original width
  //const dynamicWidth = Math.max(baseWidth - scrollX, minWidth);
  const dynamicWidth = baseWidth;

  const renderFixedColumnRow = (task, isSubtask = false, dynamicWidth, listId, drag = null, isActive = false) => {
    if (!task) return null;
    
    const firstColumn = taskTableColumns[0];
    //const width = dynamicWidth !== undefined ? dynamicWidth : firstColumn.width;
    const width = firstColumn.width;
    const taskKey = task.id || task.task_id;
    const isDraggingThis = isActive || draggedTaskId === taskKey;
    
    return (
      <DataTable.Row
        key={taskKey}
        style={[
          isDraggingThis && {
            opacity: 0.8,
            backgroundColor: '#f5f5f5',
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            zIndex: 999,
          },
        ]}
        onLayout={event => {
          const { height } = event.nativeEvent.layout;
          setRowHeights(prev => {
            if (prev[taskKey] === height) return prev;
            return { ...prev, [taskKey]: height };
          });
        }}
      >
        <DataTable.Cell
          style={{
            width: width,
            maxWidth: width,
            flex: 0,
            alignItems: 'flex-start',
            overflow: 'hidden',
            paddingVertical: 8,
            marginLeft: (() => {
              const isMyTasks = listId === 'my-tasks';
              if (isSubtask) {
                return isMyTasks ? 20 : 10;
              }
              return isMyTasks ? 0 : -20;
            })(),
            paddingRight: 8
            
          }}
          numeric={false}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
            {!isSubtask && drag && (
              <TouchableOpacity
                onPressIn={drag}
                style={{
                  padding: 0,
                }}
                activeOpacity={0.7}
              >
                <IconButton
                  icon="drag"
                  size={18}
                  iconColor="#C4C4C4"
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              {firstColumn.renderCell(task, isSubtask, listId)}
            </View>
          </View>
        </DataTable.Cell>
      </DataTable.Row>
    );
  };

  const renderScrollableColumnsRow = (task, isSubtask = false, listId, isActive = false) => {
    if (!task) return null;
    
    const remainingColumns = taskTableColumns.slice(1);
    const taskKey = task.id || task.task_id;
    const rowHeight = rowHeights[taskKey];
    const isDraggingThis = isActive || draggedTaskId === taskKey;
    
    return (
      <DataTable.Row
        key={taskKey}
        style={[
          rowHeight ? { height: rowHeight } : null,
          isDraggingThis && {
            opacity: 0.8,
            backgroundColor: '#f5f5f5',
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            zIndex: 999,
          },
        ]}
      >
        {remainingColumns.map((column) => (
          <DataTable.Cell
            key={column.id}
            style={{
              width: column.width,
              flex: 0,
              alignItems: 'center',
            }}
            numeric={false}
          >
            {column.renderCell(task, isSubtask, listId)}
          </DataTable.Cell>
        ))}
      </DataTable.Row>
    );
  };

  const handleDragBegin = (taskId) => {
    if (!taskId) return;
    setIsDragging(true);
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = ({ data }) => {
   // console.log('TaskTable handleDragEnd called with', data?.length || 0, 'tasks');
    setIsDragging(false);
    setDraggedTaskId(null);
    setDraggedTasks(data);
    
    // Call parent's onDragEnd callback if provided
    if (onDragEnd) {
      //console.log('Calling onDragEnd callback with listId:', listId);
      onDragEnd({ data, listId });
    } else {
      console.warn('onDragEnd callback not provided');
    }
  };

  return (
    <View style={styles.wrapper}>
      {/* Table with fixed first column */}
      <View style={customStyles?.tableContainer || styles.tableContainer}>
        {/* Fixed first column */}
        <View style={[customStyles?.fixedColumn || styles.fixedColumn, { width: dynamicWidth }]}>
          <DataTable>
            <DataTable.Header>
              <DataTable.Title
                style={{
                  width: dynamicWidth,
                  maxWidth: dynamicWidth,
                  flex: 0,
                  textAlign: 'left',
                  overflow: 'hidden',
                }}
                numeric={false}
              >
                {taskTableColumns[0].label}
              </DataTable.Title>
            </DataTable.Header>

            {!hasAnyTasks ? (
              <DataTable.Row>
                <DataTable.Cell
                  style={{
                    width: dynamicWidth,
                    maxWidth: dynamicWidth,
                    flex: 0,
                    alignItems: 'flex-start',
                    overflow: 'hidden',
                  }}
                  numeric={false}
                >
                  <Text style={styles.taskListEmpty}>
                    {emptyMessage}
                  </Text>
                </DataTable.Cell>
              </DataTable.Row>
            ) : enableDrag ? (
              <View pointerEvents="box-none">
                <DraggableFlatList
                  data={draggedTasks.length > 0 ? draggedTasks.filter(t => t) : parentTasks.filter(t => t)}
                  keyExtractor={(item, index) => {
                    if (!item) return `task-${index}`;
                    return (item.id || item.task_id || index).toString();
                  }}
                  onDragBegin={({ item }) => {
                    if (item) {
                      handleDragBegin(item.id || item.task_id);
                    }
                  }}
                  onDragEnd={handleDragEnd}
                  renderItem={({ item: parent, drag, isActive }) => {
                    if (!parent) return null;
                    const subtasks = getSubtasksForParent(parent);
                    const parentKey = parent.id || parent.task_id;
                    return (
                      <Fragment key={parentKey}>
                        {renderFixedColumnRow(parent, false, dynamicWidth, listId, drag, isActive)}
                        {subtasks.map((sub, idx) => {
                          if (!sub) return null;
                          return (
                            <Fragment key={sub.id || sub.task_id || `subtask-${idx}`}>
                              {renderFixedColumnRow(sub, true, dynamicWidth, listId, null, false)}
                            </Fragment>
                          );
                        })}
                      </Fragment>
                    );
                  }}
                  scrollEnabled={false}
                  simultaneousHandlers={[]}
                  activationDistance={1}
                />
              </View>
            ) : (
              <View>
                <FlatList
                  data={parentTasks.filter(t => t)}
                  keyExtractor={(item, index) => {
                    if (!item) return `task-${index}`;
                    return (item.id || item.task_id || index).toString();
                  }}
                  renderItem={({ item: parent }) => {
                    if (!parent) return null;
                    const subtasks = getSubtasksForParent(parent);
                    const parentKey = parent.id || parent.task_id;
                    return (
                      <Fragment key={parentKey}>
                        {renderFixedColumnRow(parent, false, dynamicWidth, listId, null, false)}
                        {subtasks.map((sub, idx) => {
                          if (!sub) return null;
                          return (
                            <Fragment key={sub.id || sub.task_id || `subtask-${idx}`}>
                              {renderFixedColumnRow(sub, true, dynamicWidth, listId, null, false)}
                            </Fragment>
                          );
                        })}
                      </Fragment>
                    );
                  }}
                  scrollEnabled={false}
                />
              </View>
            )}
          </DataTable>
        </View>

        {/* Scrollable remaining columns */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          bounces={false}
          nestedScrollEnabled={true}
          style={customStyles?.scrollableColumns || styles.scrollableColumns}
          onScroll={(event) => {
            const scrollX = event.nativeEvent.contentOffset.x;
            setScrollPositions(prev => ({
              ...prev,
              [listId]: scrollX,
            }));
          }}
          scrollEventThrottle={16}
          directionalLockEnabled={true}
        >
          <View style={customStyles?.tableWrapper || styles.tableWrapper}>
            <DataTable>
              <DataTable.Header>
                {taskTableColumns.slice(1).map((column) => (
                  <DataTable.Title
                    key={column.id}
                    style={{
                      width: column.width,
                      flex: 0,
                      textAlign: 'left',
                    }}
                    numeric={false}
                  >
                    {column.label}
                  </DataTable.Title>
                ))}
              </DataTable.Header>

              {!hasAnyTasks ? (
                <DataTable.Row>
                  <DataTable.Cell
                    style={{
                      width: 100,
                      flex: 0,
                      alignItems: 'flex-start',
                    }}
                    numeric={false}
                  >
                    <Text style={customStyles?.taskListEmpty || styles.taskListEmpty}></Text>
                  </DataTable.Cell>
                </DataTable.Row>
              ) : (
                <View>
                  <FlatList
                    data={draggedTasks.length > 0 ? draggedTasks.filter(t => t) : parentTasks.filter(t => t)}
                    keyExtractor={(item, index) => {
                      if (!item) return `task-${index}`;
                      return (item.id || item.task_id || index).toString();
                    }}
                    renderItem={({ item: parent }) => {
                      if (!parent) return null;
                      const subtasks = getSubtasksForParent(parent);
                      const parentKey = parent.id || parent.task_id;
                      const isActive = draggedTaskId === parentKey;
                      return (
                        <Fragment key={parentKey}>
                          {renderScrollableColumnsRow(parent, false, listId, isActive)}
                          {subtasks.map((sub, idx) => {
                            if (!sub) return null;
                            return (
                              <Fragment key={sub.id || sub.task_id || `subtask-${idx}`}>
                                {renderScrollableColumnsRow(sub, true, listId, false)}
                              </Fragment>
                            );
                          })}
                        </Fragment>
                      );
                    }}
                    scrollEnabled={false}
                  />
                </View>
              )}
            </DataTable>
          </View>
        </ScrollView>
      </View>

      {/* Inline new task row */}
      {onTaskCreate && (
        <View style={customStyles?.newTaskRowContainer || styles.newTaskRowContainer}>
          <DefaultTaskInputRow onSave={onTaskCreate} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  tableContainer: {
    flexDirection: 'row',
    flex: 1,
    overflow: 'hidden',
  },
  fixedColumn: {
    flexShrink: 0,
    overflow: 'visible',
  },
  scrollableColumns: {
    flex: 1,
    overflow: 'visible',
  },
  tableWrapper: {
    flexDirection: 'row',
  },
  taskListEmpty: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    paddingTop: 10,
  },
  newTaskRowContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
});

export default TaskTable;
