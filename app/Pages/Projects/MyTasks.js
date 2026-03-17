import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { IconButton } from 'react-native-paper';
import { connect } from 'react-redux';
import { ViewLayout } from '@/Pages/Layouts';
import agent from '@/agent';
import { AssigneeCell, DueDateCell, PriorityCell, ActionsCell } from './TaskRow';
import StatusDropdown from '@/components/StatusDropdown';
import TaskDetailModal from './TaskDetailModal';
import TaskTable from './TaskTable';

const PAGE_SIZE = 50;

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
});

const MyTasks = ({ navigation, currentUser, route }) => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [scrollPositions, setScrollPositions] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const [isAddTaskModalVisible, setIsAddTaskModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [projects, setProjects] = useState([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [taskLists, setTaskLists] = useState([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState(null);
  const [isLoadingTaskLists, setIsLoadingTaskLists] = useState(false);
  const [newTaskDueDate, setNewTaskDueDate] = useState(null);
  const [newTaskPriority, setNewTaskPriority] = useState(0);
  const [assignToMe, setAssignToMe] = useState(true);
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectItems, setProjectItems] = useState([]);
  const [taskListPickerOpen, setTaskListPickerOpen] = useState(false);
  const [taskListItems, setTaskListItems] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    pageSize: PAGE_SIZE,
    hasNext: false,
    hasPrev: false,
  });

  useEffect(() => {
    navigation.setOptions({
      title: 'My Tasks',
    });
  }, [navigation]);

  const fetchTasks = useCallback(
    async (pageNumber = 1) => {
      setIsLoading(true);
      try {
        const filter = showCompletedTasks ? 'all' : 'active';
        const response = await agent.Tasks.getMyTasks({
          filter,
          search: searchQuery,
          limit: PAGE_SIZE,
          page: pageNumber,
        });

        if (response && response.data) {
          if (response.data.tasks && response.data.pagination) {
            setTasks(response.data.tasks);
            const apiPagination = response.data.pagination;
            setPagination({
              currentPage: apiPagination.currentPage || pageNumber,
              totalPages: apiPagination.totalPages || 1,
              totalCount: apiPagination.totalCount || 0,
              pageSize: apiPagination.pageSize || PAGE_SIZE,
              hasNext: (apiPagination.currentPage || pageNumber) < (apiPagination.totalPages || 1),
              hasPrev: (apiPagination.currentPage || pageNumber) > 1,
            });
          } else if (Array.isArray(response.data)) {
            setTasks(response.data);
            setPagination(prev => ({
              ...prev,
              currentPage: pageNumber,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            }));
          } else {
            setTasks([]);
          }
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error('Failed to fetch tasks', err);
        setTasks([]);
      } finally {
        setIsLoading(false);
      }
    },
    [searchQuery, showCompletedTasks],
  );

  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
    fetchTasks(1);
  }, [fetchTasks]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTasks(1);
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery, showCompletedTasks, fetchTasks]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchTasks(1);
    setIsRefreshing(false);
  };

  const handlePageChange = async direction => {
    if (direction === 'next' && pagination.hasNext && !isLoading) {
      const nextPage = pagination.currentPage + 1;
      await fetchTasks(nextPage);
    } else if (direction === 'prev' && pagination.hasPrev && !isLoading) {
      const prevPage = pagination.currentPage - 1;
      await fetchTasks(prevPage);
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      const projectId = task.project_id;
      const taskListId = task.task_list_id;
      if (!projectId) {
        return;
      }
      await agent.Tasks.updateTask(projectId, task.id, {
        status: newStatus,
        action: 'update_status',
        task_list_id: taskListId,
      });
      await fetchTasks(pagination.currentPage);
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const openTaskDetail = (projectId, taskId) => {
    setSelectedProjectId(projectId);
    setSelectedTaskId(taskId);
  };

  // If navigated from a notification with an initial task,
  // open the task detail modal automatically.
  useEffect(() => {
    const initialTask = route?.params?.initialTask;
    if (
      initialTask &&
      initialTask.projectId &&
      initialTask.taskId
    ) {
      openTaskDetail(initialTask.projectId, initialTask.taskId);
      // Clear the param so the modal doesn't reopen on focus changes
      navigation.setParams({
        ...route.params,
        initialTask: undefined,
      });
    }
  }, [route?.params?.initialTask, navigation]);

  const closeTaskDetail = () => {
    setSelectedTaskId(null);
    setSelectedProjectId(null);
    fetchTasks(pagination.currentPage);
  };

  const currentUserId =
    currentUser?.user?.id || currentUser?.ID || currentUser?.id;

  const fetchProjectsForModal = useCallback(async () => {
    if (isLoadingProjects || projects.length > 0) {
      return;
    }
    try {
      setIsLoadingProjects(true);
      const response = await agent.Projects.getProjects({
        filter: 'active',
        search: '',
        limit: 100,
        page: 1,
      });
      if (response && response.data && response.data.projects) {
        setProjects(response.data.projects);
        const items = response.data.projects.map(project => ({
          label: project.title || project.name,
          value: project.id,
        }));
        setProjectItems(items);
      } else {
        setProjects([]);
        setProjectItems([]);
      }
    } catch (err) {
      console.error('Failed to load projects for new task', err);
      Alert.alert('Error', 'Failed to load projects. Please try again.');
    } finally {
      setIsLoadingProjects(false);
    }
  }, [isLoadingProjects, projects.length]);

  const fetchTaskListsForModal = useCallback(
    async projectId => {
      if (!projectId) return;
      try {
        setIsLoadingTaskLists(true);
        const response = await agent.Tasks.getTaskLists(projectId);
        if (response && response.data) {
          const lists = Array.isArray(response.data)
            ? response.data
            : [response.data];
          setTaskLists(lists);
          const items = lists.map(list => ({
            label: list.title || list.name || 'Task list',
            value: list.id,
          }));
          setTaskListItems(items);
          if (lists.length > 0) {
            setSelectedTaskListId(lists[0].id);
          } else {
            setSelectedTaskListId(null);
          }
        } else {
          setTaskLists([]);
          setTaskListItems([]);
          setSelectedTaskListId(null);
        }
      } catch (err) {
        console.error('Failed to load task lists for new task', err);
        Alert.alert('Error', 'Failed to load task lists. Please try again.');
      } finally {
        setIsLoadingTaskLists(false);
      }
    },
    [],
  );

  const openAddTaskModal = async () => {
    setIsAddTaskModalVisible(true);
    await fetchProjectsForModal();
  };

  const resetAddTaskState = () => {
    setNewTaskTitle('');
    setSelectedProject(null);
    setSelectedProjectId(null);
    setTaskLists([]);
    setSelectedTaskListId(null);
    setNewTaskDueDate(null);
    setNewTaskPriority(0);
    setAssignToMe(true);
    setIsCreatingTask(false);
  };

  const closeAddTaskModal = () => {
    setIsAddTaskModalVisible(false);
    resetAddTaskState();
  };

  const handleCreateTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Required', 'Please enter a task name.');
      return;
    }
    if (!selectedProjectId) {
      Alert.alert('Required', 'Please select a project.');
      return;
    }
    if (!selectedTaskListId) {
      Alert.alert('Required', 'Please select a task list.');
      return;
    }

    try {
      setIsCreatingTask(true);
      const createData = {
        title: newTaskTitle.trim(),
        description: '',
        task_list_id: selectedTaskListId,
        due_date: newTaskDueDate || undefined,
        assignees:
          assignToMe && currentUserId ? [currentUserId] : undefined,
        priority: newTaskPriority || 0,
      };

      const response = await agent.Tasks.createTask(
        selectedProjectId,
        createData,
      );
      if (response && response.data) {
        closeAddTaskModal();
        await fetchTasks(pagination.currentPage);
      } else {
        Alert.alert('Error', 'Failed to create task. Please try again.');
      }
    } catch (err) {
      console.error('Failed to create task', err);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const taskTableColumns = useMemo(
    () => [
      {
        id: 'name',
        label: 'Name',
        width: 280,
        numeric: false,
        renderCell: (task, isSubtask /* listId not used here */) => {
          const title = task.title || task.name || 'Untitled task';
          const projectId = task.project_id;

          const onTitlePress = () => {
            if (projectId) {
              openTaskDetail(projectId, task.id);
            }
          };

          return (
            <View style={styles.nameCell}>
              <StatusDropdown
                currentStatus={task.status ?? 0}
                onStatusChange={status => handleStatusChange(task, status)}
                size="medium"
                buttonStyle={styles.statusButton}
              />
              <TouchableOpacity
                style={styles.taskTitleTouchable}
                onPress={onTitlePress}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.taskTitle,
                    isSubtask && styles.subtaskTitle,
                    task.status === 1 && styles.completedTaskTitle,
                  ]}
                  numberOfLines={5}
                  ellipsizeMode="tail"
                >
                  {title}
                </Text>
              </TouchableOpacity>
            </View>
          );
        },
      },
      {
        id: 'assignee',
        label: 'Assignee',
        width: 110,
        numeric: false,
        renderCell: (task, isSubtask) => (
          <AssigneeCell
            task={task}
            projectId={task.project_id}
            taskListId={task.task_list_id}
            projectUsers={task.project?.users || []}
            currentUser={currentUser}
            onUpdate={() => fetchTasks(pagination.currentPage)}
            isSubtask={isSubtask}
          />
        ),
      },
      {
        id: 'dueDate',
        label: 'Due-date',
        width: 120,
        numeric: false,
        renderCell: (task, isSubtask) => (
          <DueDateCell
            task={task}
            projectId={task.project_id}
            taskListId={task.task_list_id}
            onUpdate={() => fetchTasks(pagination.currentPage)}
            isSubtask={isSubtask}
          />
        ),
      },
      {
        id: 'priority',
        label: 'Priority',
        width: 60,
        numeric: false,
        renderCell: (task, isSubtask) => (
          <PriorityCell
            task={task}
            projectId={task.project_id}
            taskListId={task.task_list_id}
            onUpdate={() => fetchTasks(pagination.currentPage)}
            isSubtask={isSubtask}
          />
        ),
      },
      {
        id: 'actions',
        label: '',
        width: 60,
        numeric: false,
        renderCell: (task, isSubtask) => (
          <ActionsCell
            task={task}
            projectId={task.project_id}
            taskListId={task.task_list_id}
            currentUser={currentUser}
            onDelete={() => fetchTasks(pagination.currentPage)}
            onUpdate={() => fetchTasks(pagination.currentPage)}
            onView={taskId => {
              if (task.project_id) {
                openTaskDetail(task.project_id, taskId);
              }
            }}
            isSubtask={isSubtask}
          />
        ),
      },
    ],
    [currentUser, fetchTasks, pagination.currentPage],
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTopRow}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity
          style={styles.addTaskButton}
          activeOpacity={0.8}
          onPress={openAddTaskModal}
        >
          <IconButton
            icon="plus"
            size={18}
            iconColor="#ffffff"
            style={styles.addTaskButtonIcon}
          />
          <Text style={styles.addTaskButtonText}>Add task</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) {
      return null;
    }
    return (
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.pageButton,
            !pagination.hasPrev && styles.pageButtonDisabled,
          ]}
          disabled={!pagination.hasPrev || isLoading}
          onPress={() => handlePageChange('prev')}
        >
          <IconButton
            icon="chevron-left"
            size={20}
            iconColor={pagination.hasPrev ? '#111827' : '#9ca3af'}
            style={styles.pageButtonIcon}
          />
        </TouchableOpacity>
        <Text style={styles.pageInfoText}>
          Page {pagination.currentPage} of {pagination.totalPages}
        </Text>
        <TouchableOpacity
          style={[
            styles.pageButton,
            !pagination.hasNext && styles.pageButtonDisabled,
          ]}
          disabled={!pagination.hasNext || isLoading}
          onPress={() => handlePageChange('next')}
        >
          <IconButton
            icon="chevron-right"
            size={20}
            iconColor={pagination.hasNext ? '#111827' : '#9ca3af'}
            style={styles.pageButtonIcon}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const hasTasks = tasks && tasks.length > 0;

  return (
    <ViewLayout noMargin>
      <View style={styles.container}>
        {isLoading && !hasTasks ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ff7a08" />
            <Text style={styles.loaderText}>Loading tasks...</Text>
          </View>
        ) : !hasTasks ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No tasks found. {searchQuery ? 'Try a different search term.' : 'You have no tasks assigned yet.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            refreshControl={
              <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
            }
            nestedScrollEnabled
          >
            {renderHeader()}
            <View style={styles.taskListSection}>
              <TaskTable
                taskTableColumns={taskTableColumns}
                tasks={tasks}
                listId="my-tasks"
                scrollPositions={scrollPositions}
                setScrollPositions={setScrollPositions}
                rowHeights={rowHeights}
                setRowHeights={setRowHeights}
                onTaskCreate={null}
                onDragEnd={undefined}
                enableDrag={false}
                styles={styles}
                emptyMessage="No tasks found."
              />
            </View>
            {renderFooter()}
          </ScrollView>
        )}

        <TaskDetailModal
          visible={!!selectedTaskId && !!selectedProjectId}
          taskId={selectedTaskId}
          projectId={selectedProjectId}
          currentUserId={currentUser?.user?.id || currentUser?.ID || currentUser?.id}
          onClose={closeTaskDetail}
          onOpenSubtaskDetail={(projId, tid) => {
            setSelectedProjectId(projId);
            setSelectedTaskId(tid);
          }}
          onRefreshMainTaskData={async () => {
            await fetchTasks(pagination.currentPage);
          }}
          onNotFound={closeTaskDetail}
        />

        <Modal
          visible={isAddTaskModalVisible}
          transparent
          animationType="slide"
          onRequestClose={closeAddTaskModal}
        >
          <KeyboardAvoidingView
            style={styles.addModalKeyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <TouchableOpacity
              activeOpacity={1}
              style={styles.addModalOverlay}
              onPress={closeAddTaskModal}
            >
              <TouchableOpacity
                activeOpacity={1}
                style={styles.addModalContent}
                onPress={e => e.stopPropagation()}
              >
              <View style={styles.addModalHeader}>
                <Text style={styles.addModalTitle}>Add task</Text>
                <IconButton
                  icon="close"
                  size={22}
                  onPress={closeAddTaskModal}
                />
              </View>

              <ScrollView
                style={styles.addModalBody}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={styles.addModalLabel}>Task name *</Text>
                <TextInput
                  style={styles.addModalInput}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  placeholder="Write a task name"
                  placeholderTextColor="#9ca3af"
                />

                <Text style={styles.addModalLabel}>Project *</Text>
                <View
                  style={[
                    styles.projectDropdownWrapper,
                    projectPickerOpen && styles.dropdownWrapperActive,
                  ]}
                >
                  <DropDownPicker
                    open={projectPickerOpen}
                    value={selectedProjectId}
                    items={projectItems}
                    setOpen={setProjectPickerOpen}
                    setValue={callback => {
                      const value =
                        typeof callback === 'function'
                          ? callback(selectedProjectId)
                          : callback;
                      setSelectedProjectId(value || null);
                      const project = projects.find(p => p.id === value);
                      setSelectedProject(project || null);
                      setTaskLists([]);
                      setTaskListItems([]);
                      setSelectedTaskListId(null);
                      if (value) {
                        fetchTaskListsForModal(value);
                      }
                    }}
                    setItems={setProjectItems}
                    placeholder={
                      isLoadingProjects
                        ? 'Loading projects...'
                        : '- Select project -'
                    }
                    listMode="SCROLLVIEW"
                    style={styles.dropdownPicker}
                    dropDownContainerStyle={styles.dropdownPickerContainer}
                    textStyle={styles.dropdownPickerText}
                    labelStyle={styles.dropdownPickerLabel}
                    selectedItemLabelStyle={
                      styles.dropdownPickerSelectedLabel
                    }
                    placeholderStyle={styles.dropdownPickerPlaceholder}
                    arrowIconStyle={styles.dropdownPickerArrow}
                    tickIconStyle={styles.dropdownPickerTick}
                    closeAfterSelecting
                    zIndex={projectPickerOpen ? 6000 : 3000}
                    zIndexInverse={projectPickerOpen ? 1000 : 2000}
                    disabled={isLoadingProjects}
                  />
                </View>

                <Text style={styles.addModalLabel}>Task list *</Text>
                <View
                  style={[
                    styles.taskListDropdownWrapper,
                    taskListPickerOpen && styles.dropdownWrapperActive,
                  ]}
                >
                  <DropDownPicker
                    open={taskListPickerOpen}
                    value={selectedTaskListId}
                    items={taskListItems}
                    setOpen={setTaskListPickerOpen}
                    setValue={callback => {
                      const value =
                        typeof callback === 'function'
                          ? callback(selectedTaskListId)
                          : callback;
                      setSelectedTaskListId(value || null);
                    }}
                    setItems={setTaskListItems}
                    placeholder={
                      !selectedProjectId
                        ? 'Select a project first'
                        : isLoadingTaskLists
                        ? 'Loading task lists...'
                        : '- Select task list -'
                    }
                    listMode="SCROLLVIEW"
                    style={styles.dropdownPicker}
                    dropDownContainerStyle={styles.dropdownPickerContainer}
                    textStyle={styles.dropdownPickerText}
                    labelStyle={styles.dropdownPickerLabel}
                    selectedItemLabelStyle={
                      styles.dropdownPickerSelectedLabel
                    }
                    placeholderStyle={styles.dropdownPickerPlaceholder}
                    arrowIconStyle={styles.dropdownPickerArrow}
                    tickIconStyle={styles.dropdownPickerTick}
                    closeAfterSelecting
                    dropDownDirection="BOTTOM"
                    zIndex={taskListPickerOpen ? 6000 : 3000}
                    zIndexInverse={taskListPickerOpen ? 1000 : 2000}
                    disabled={!selectedProjectId || isLoadingTaskLists}
                  />
                </View>

                {/* <Text style={styles.addModalLabel}>Priority</Text>
                <View style={styles.priorityRow}>
                  {[0, 1, 2].map(value => (
                    <TouchableOpacity
                      key={value}
                      style={[
                        styles.priorityChip,
                        newTaskPriority === value &&
                          styles.priorityChipActive,
                      ]}
                      onPress={() => setNewTaskPriority(value)}
                    >
                      <Text
                        style={[
                          styles.priorityChipText,
                          newTaskPriority === value &&
                            styles.priorityChipTextActive,
                        ]}
                      >
                        {value === 0
                          ? 'Low'
                          : value === 1
                          ? 'Medium'
                          : 'High'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View> */}

                <View style={styles.assignRow}>
                  <TouchableOpacity
                    style={styles.assignCheckbox}
                    onPress={() => setAssignToMe(prev => !prev)}
                    activeOpacity={0.8}
                  >
                    <IconButton
                      icon={assignToMe ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={20}
                      iconColor={assignToMe ? '#ff7a08' : '#9ca3af'}
                      style={styles.assignCheckboxIcon}
                    />
                    <Text style={styles.assignLabel}>Assign to me</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

                <View style={styles.addModalFooter}>
                  <TouchableOpacity
                    style={styles.addModalCancelButton}
                    onPress={closeAddTaskModal}
                    disabled={isCreatingTask}
                  >
                    <Text style={styles.addModalCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addModalCreateButton,
                      isCreatingTask && styles.addModalCreateButtonDisabled,
                    ]}
                    onPress={handleCreateTask}
                    disabled={isCreatingTask}
                  >
                    {isCreatingTask ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.addModalCreateText}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ViewLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scroll: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff7a08',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  addTaskButtonIcon: {
    margin: 0,
    marginRight: 4,
  },
  addTaskButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff',
  },
  headerFilters: {
    marginBottom: 8,
  },
  showCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  showCompletedLabel: {
    fontSize: 13,
    color: '#4b5563',
    marginRight: 8,
  },
  searchInput: {
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingTop: 10,
    paddingBottom: 6,
  },
  tableHeaderCell: {
    justifyContent: 'flex-start',
  },
  tableHeaderText: {
    fontSize: 11,
    color: '#6b7280',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  rowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cell: {
    justifyContent: 'center',
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 20,
  },
  statusButton: {
    margin: 0,
    marginRight: 13,
  },
  nameTextWrapper: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
    paddingRight: 12,
  },
  completedTaskTitle: {
    textDecorationLine: 'line-through',
    color: '#9ca3af',
  },
  projectBadge: {
    marginTop: 2,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: '#eff6ff',
  },
  projectBadgeText: {
    fontSize: 11,
    color: '#1d4ed8',
    fontWeight: '500',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  pageButtonDisabled: {
    opacity: 0.4,
  },
  pageButtonIcon: {
    margin: 0,
  },
  pageInfoText: {
    fontSize: 13,
    color: '#4b5563',
    marginHorizontal: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 8,
    fontSize: 15,
    color: '#6b7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
  },
  // Table + row styles aligned with SingleProject for consistent design
  taskListSection: {
    marginTop: 12,
    marginHorizontal: 5,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: 'red',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'visible',
  },
  tableContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  fixedColumn: {
    backgroundColor: '#ffffff',
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  scrollableColumns: {
    flex: 1,
  },
  tableWrapper: {
    paddingRight: 12,
    paddingVertical: 6,
    backgroundColor: '#ffffff',
  },
  newTaskRowContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  taskListEmpty: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'left',
  },
  taskTitleTouchable: {
    flex: 1,
    flexShrink: 1,
  },
  subtaskTitle: {
    color: '#555555',
    textAlign: 'left',
    flexShrink: 1,
    paddingRight: 20,
  },
  addModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  addModalKeyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  addModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 8,
    maxHeight: '80%',
  },
  addModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  addModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addModalBody: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addModalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
    marginBottom: 4,
  },
  addModalInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 14,
    color: '#111827',
  },
  selectorButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 4,
  },
  selectorButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectorButtonText: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  selectorButtonPlaceholder: {
    color: '#9ca3af',
  },
  selectorButtonIcon: {
    margin: 0,
    marginLeft: 4,
  },
  selectorList: {
    maxHeight: 140,
    marginBottom: 4,
  },
  selectorListItem: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 4,
  },
  selectorListItemActive: {
    backgroundColor: '#eff6ff',
  },
  selectorListItemText: {
    fontSize: 14,
    color: '#111827',
  },
  selectorListItemTextActive: {
    color: '#1d4ed8',
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
  },
  priorityChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
  },
  priorityChipActive: {
    backgroundColor: '#fffbeb',
    borderColor: '#fbbf24',
  },
  priorityChipText: {
    fontSize: 13,
    color: '#374151',
  },
  priorityChipTextActive: {
    color: '#92400e',
    fontWeight: '600',
  },
  assignRow: {
    marginTop: 8,
    marginBottom: 12,
  },
  assignCheckbox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignCheckboxIcon: {
    margin: 0,
    marginRight: 4,
  },
  assignLabel: {
    fontSize: 13,
    color: '#374151',
  },
  projectDropdownWrapper: {
    marginBottom: 4,
  },
  taskListDropdownWrapper: {
    marginBottom: 4,
  },
  dropdownWrapperActive: {
    zIndex: 9000,
    elevation: 8,
  },
  addModalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  addModalCancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    marginRight: 8,
    backgroundColor: '#f3f4f6',
  },
  addModalCancelText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  addModalCreateButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 9999,
    backgroundColor: '#ff7a08',
  },
  addModalCreateButtonDisabled: {
    opacity: 0.7,
  },
  addModalCreateText: {
    fontSize: 13,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default connect(mapStateToProps)(MyTasks);

