import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  RefreshControl,
  Dimensions,
  TextInput,
} from 'react-native';
import { connect } from 'react-redux';
import { IconButton, DataTable } from 'react-native-paper';
import { ViewLayout } from '@/Pages/Layouts';
import agent from '@/agent';
import DefaultTaskInputRow from './DefaultTaskInputRow';
import ManageMembersModal from './ManageMembersModal';
import EditProjectModal from './EditProjectModal';
import EditSectionModal from './EditSectionModal';
import { AssigneeCell, DueDateCell, PriorityCell, ActionsCell } from './TaskRow';
import StatusDropdown from '@/components/StatusDropdown';
import TaskTable from './TaskTable';
import TaskDetailModal from './TaskDetailModal';
import { Alert } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
});

const SingleProject = ({ route, navigation, currentUser }) => {
  const { projectId } = route.params || {};

  const [project, setProject] = useState(null);
  const [taskLists, setTaskLists] = useState([]);
  const [tasksByList, setTasksByList] = useState({});
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadProject = async () => {
    if (!projectId) return;

    try {
      setError(null);
      const response = await agent.Projects.getProject(projectId);
      if (response && response.data) {
        const data = response.data;
        setProject(data);
        const fav =
          data.favourite ||
          (data.favourite !== '0' &&
            data.favourite !== '' &&
            data.favourite !== false);
        setIsFavorite(!!fav);
      }
    } catch (err) {
      console.error('Failed to load project', err);
      setError(err.message || 'Failed to load project');
    }
  };

  const loadTaskLists = async () => {
    if (!projectId) return;
    try {
      const response = await agent.Tasks.getTaskLists(projectId);
      if (response && response.data) {
        const lists = Array.isArray(response.data)
          ? response.data
          : [response.data];
        setTaskLists(lists);

        // If tasks are nested inside lists use them, otherwise fetch per list
        const nextTasksByList = {};
        const listsToFetch = [];

        lists.forEach(list => {
          if (Array.isArray(list.tasks)) {
            nextTasksByList[list.id] = list.tasks;
          } else {
            listsToFetch.push(list.id);
          }
        });

        setTasksByList(prev => ({ ...prev, ...nextTasksByList }));

        // Fallback: fetch tasks for lists without embedded tasks
        for (const listId of listsToFetch) {
          try {
            const taskRes = await agent.Tasks.getTaskByListId(
              projectId,
              listId,
            );
            if (taskRes && taskRes.data) {
              const taskArray = Array.isArray(taskRes.data)
                ? taskRes.data
                : [taskRes.data];
              setTasksByList(prev => ({
                ...prev,
                [listId]: taskArray,
              }));
            }
          } catch (err) {
            console.error('Failed to load tasks for list', listId, err);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load task lists', err);
    }
  };

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    await loadProject();
    await loadTaskLists();
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    navigation.setOptions({
      title: 'Project',
    });
    loadAll();
  }, [loadAll, navigation]);


  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadAll();
    setIsRefreshing(false);
  };

  const handleToggleFavorite = async () => {
    if (!project) return;
    try {
      const nextFav = !isFavorite;
      const response = await agent.Projects.toggleProjectFavorite(
        project.id,
        nextFav,
      );
      if (response && response.data) {
        setIsFavorite(nextFav);
      }
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const handleSetProjectStatus = async () => {
    if (!project) return;
    try {
      const newStatus = project.status === 1 ? 0 : 1;
      const response = await agent.Projects.updateProjectStatus(
        project.id,
        newStatus,
      );
      if (response && response.data) {
        setProject(prev => ({ ...prev, status: parseInt(newStatus, 10) }));
      }
    } catch (err) {
      console.error('Failed to update project status', err);
    }
  };

  // Fetch project categories for edit modal
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await agent.Projects.getProjectCategories();
        if (res && res.data) {
          const fetched =
            res.data.categories || res.data.data || res.data || [];
          setCategories(Array.isArray(fetched) ? fetched : []);
        }
      } catch (err) {
        console.error('Failed to fetch project categories', err);
      }
    };
    fetchCategories();
  }, []);

  const [showDescription, setShowDescription] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [manageSearchQuery, setManageSearchQuery] = useState('');
  const [manageSearchResults, setManageSearchResults] = useState([]);
  const [isManageSearching, setIsManageSearching] = useState(false);
  const [addingMemberId, setAddingMemberId] = useState(null);
  const [removingMemberId, setRemovingMemberId] = useState(null);
  const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
  const [editProjectSaving, setEditProjectSaving] = useState(false);
  const [editProjectFormData, setEditProjectFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  const [categories, setCategories] = useState([]);
  const [scrollPositions, setScrollPositions] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  
  // Section menu and edit modal states
  const [openSectionMenuId, setOpenSectionMenuId] = useState(null);
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [isCreateSectionModalOpen, setIsCreateSectionModalOpen] = useState(false);
  const [editingSectionTaskListId, setEditingSectionTaskListId] = useState(null);
  const [editSectionFormData, setEditSectionFormData] = useState({
    title: '',
    description: '',
  });
  const [createSectionFormData, setCreateSectionFormData] = useState({
    title: '',
    description: '',
  });
  const [editSectionSaving, setEditSectionSaving] = useState(false);
  const [createSectionSaving, setCreateSectionSaving] = useState(false);
  const [taskDetailTaskId, setTaskDetailTaskId] = useState(null);

  const formatDate = dateString => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  const renderMemberAvatar = (user, index) => {
    const key = user.ID || user.id || index;
    const name = user.display_name || user.name || 'U';
    if (user.image) {
      return (
        <View key={key} style={styles.memberAvatar}>
          <Image source={{ uri: user.image }} style={styles.avatarImage} />
        </View>
      );
    }
    return (
      <View key={key} style={styles.memberAvatar}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
    );
  };

  const handleRemoveUserFromProject = async userId => {
    if (!project || !project.id) return;
    setRemovingMemberId(userId);
    try {
      await agent.Projects.removeUserFromProject(project.id, userId);
      await loadProject();
    } catch (err) {
      console.error('Failed to remove user from project', err);
    } finally {
      setRemovingMemberId(null);
    }
  };

  const handleAddUserToProject = async user => {
    if (!project || !project.id || !user) return;
    const id = user.ID || user.id;
    setAddingMemberId(id);
    try {
      await agent.Projects.addUserToProject(project.id, id);
      await loadProject();
      setManageSearchQuery('');
      setManageSearchResults([]);
    } catch (err) {
      console.error('Failed to add user to project', err);
    } finally {
      setAddingMemberId(null);
    }
  };

  // Debounced search for users to add as members
  useEffect(() => {
    let timeout;
    const run = async () => {
      const q = manageSearchQuery.trim();
      if (!q) {
        setManageSearchResults([]);
        setIsManageSearching(false);
        return;
      }
      setIsManageSearching(true);
      try {
        // reuse Auth.getUsers just like NewProjectModal
        const res = await agent.Auth.getUsers(1, 10, q);
        if (res && res.data && res.data.users) {
          const users = res.data.users.users || res.data.users || [];
          const assignedIds = (project?.users || []).map(
            u => u.ID || u.id,
          );
          const filtered = users.filter(
            u => !assignedIds.includes(u.ID || u.id),
          );
          setManageSearchResults(filtered);
        } else {
          setManageSearchResults([]);
        }
      } catch (err) {
        console.error('Error searching users for project members', err);
        setManageSearchResults([]);
      } finally {
        setIsManageSearching(false);
      }
    };

    if (manageSearchQuery.trim()) {
      timeout = setTimeout(run, 400);
    } else {
      setManageSearchResults([]);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [manageSearchQuery, project?.users]);

  const filterTasks = tasks => {
    // For now always show all tasks in the section (no "My tasks" filter)
    return Array.isArray(tasks) ? tasks : [];
  };

  const projectUsers = project?.users || [];

  const toggleSectionCollapsed = useCallback((listId) => {
    if (!listId) return;
    setCollapsedSections(prev => ({
      ...prev,
      [listId]: !prev[listId],
    }));
  }, []);

  // Shared: reload tasks for a list (used by all columns)
  const reloadTasksForList = useCallback(async (listId) => {
    if (!listId || !projectId) return;
    try {
      const taskRes = await agent.Tasks.getTaskByListId(projectId, listId);
      if (taskRes && taskRes.data) {
        const taskArray = Array.isArray(taskRes.data)
          ? taskRes.data
          : [taskRes.data];
        setTasksByList(prev => ({ ...prev, [listId]: taskArray }));
      }
    } catch (err) {
      console.error('Failed to reload tasks', err);
    }
  }, [projectId]);

  // Shared: open task detail modal
  // Always reset the current detail first, then open the new one,
  // so the old modal state is fully cleared before showing another task.
  const openTaskDetail = useCallback((taskId) => {
    setTaskDetailTaskId(null);
    setTimeout(() => {
      setTaskDetailTaskId(taskId);
    }, 0);
  }, []);

  // Dynamic column configuration for the task table
  const taskTableColumns = React.useMemo(() => [
    {
      id: 'name',
      label: 'Name',
      width: 280,
      numeric: false,
      renderCell: (task, isSubtask, listId) => {
        const title = task.title || task.name || 'Untitled task';

        const handleStatusChange = async (newStatus) => {
          try {
            await agent.Tasks.updateTask(projectId, task.id, {
              status: newStatus,
              action: 'update_status',
              task_list_id: listId || task.task_list_id,
            });
            reloadTasksForList(listId);
          } catch (err) {
            console.error('Failed to update task status', err);
          }
        };

        const onTitlePress = () => openTaskDetail(task.id);

        return (
          <View style={styles.nameCell}>
            {isSubtask ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <IconButton
                  icon="subdirectory-arrow-right"
                  size={14}
                  iconColor="#ff7a08"
                  style={[styles.nameBulletIcon, { marginRight: 4, margin: 0 }]}
                />
                <StatusDropdown
                  currentStatus={task.status ?? 0}
                  onStatusChange={handleStatusChange}
                  size="medium"
                  buttonStyle={styles.nameBulletIcon}
                />
              </View>
            ) : (
              <StatusDropdown
                currentStatus={task.status ?? 0}
                onStatusChange={handleStatusChange}
                size="medium"
                buttonStyle={styles.nameBulletIcon}
              />
            )}
            <TouchableOpacity
              style={styles.taskTitleTouchable}
              onPress={onTitlePress}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.taskTitle,
                  isSubtask && styles.subtaskTitle,
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
      renderCell: (task, isSubtask, listId) => (
        <AssigneeCell
          task={task}
          projectId={projectId}
          taskListId={listId}
          projectUsers={projectUsers}
          currentUser={currentUser}
          onUpdate={() => reloadTasksForList(listId)}
          isSubtask={isSubtask}
        />
      ),
    },
    {
      id: 'dueDate',
      label: 'Due-date',
      width: 120,
      numeric: false,
      renderCell: (task, isSubtask, listId) => (
        <DueDateCell
          task={task}
          projectId={projectId}
          taskListId={listId}
          onUpdate={() => reloadTasksForList(listId)}
          isSubtask={isSubtask}
        />
      ),
    },
    {
      id: 'priority',
      label: 'Priority',
      width: 60,
      numeric: false,
      renderCell: (task, isSubtask, listId) => (
        <PriorityCell
          task={task}
          projectId={projectId}
          taskListId={listId}
          onUpdate={() => reloadTasksForList(listId)}
          isSubtask={isSubtask}
        />
      ),
    },
    {
      id: 'actions',
      label: '',
      width: 60,
      numeric: false,
      renderCell: (task, isSubtask, listId) => (
        <ActionsCell
          task={task}
          projectId={projectId}
          taskListId={listId}
          currentUser={currentUser}
          onUpdate={() => reloadTasksForList(listId)}
          onDelete={() => reloadTasksForList(listId)}
          onView={openTaskDetail}
          isSubtask={isSubtask}
        />
      ),
    },
  ], [projectId, projectUsers, currentUser, reloadTasksForList, openTaskDetail]);


  const handleCreateSection = async () => {
    if (!projectId) return;
    if (!createSectionFormData.title.trim()) {
      Alert.alert('Error', 'Please enter a section title');
      return;
    }
    try {
      setCreateSectionSaving(true);
      const response = await agent.Tasks.createTaskList(projectId, {
        title: createSectionFormData.title.trim(),
        description: createSectionFormData.description.trim() || undefined,
        order: taskLists.length + 1,
      });
      if (response && response.data) {
        await loadTaskLists();
        setIsCreateSectionModalOpen(false);
        setCreateSectionFormData({ title: '', description: '' });
      } else {
        Alert.alert('Error', 'Failed to create section. Please try again.');
      }
    } catch (err) {
      console.error('Failed to create section:', err);
      Alert.alert('Error', 'Failed to create section. Please try again.');
    } finally {
      setCreateSectionSaving(false);
    }
  };

  const renderTaskListSection = ({ item }) => {
    const allTasksInList = tasksByList[item.id] || [];
    const filteredTasks = filterTasks(allTasksInList);
    const listId = item.id || item.task_list_id;
    const isCollapsed = !!collapsedSections[listId];

    const handleTaskCreate = async (newTask) => {
      try {
        const payload = {
          title: newTask.title,
          description: '',
          task_list_id: item.id,
        };
        const res = await agent.Tasks.createTask(projectId, payload);
        if (res && res.data) {
          // reload tasks for this list
          const taskRes = await agent.Tasks.getTaskByListId(
            projectId,
            item.id,
          );
          if (taskRes && taskRes.data) {
            const taskArray = Array.isArray(taskRes.data)
              ? taskRes.data
              : [taskRes.data];
            setTasksByList(prev => ({
              ...prev,
              [item.id]: taskArray,
            }));
          }
        }
      } catch (e) {
        console.error('Failed to create task', e);
        throw e;
      }
    };

    const handleOpenEditSectionModal = () => {
      const taskList = item;
      if (taskList) {
        setEditSectionFormData({
          title: taskList.title || taskList.name || '',
          description: taskList.description || '',
        });
        setEditingSectionTaskListId(taskList.id);
        setIsEditSectionModalOpen(true);
        setOpenSectionMenuId(null);
      }
    };

    const handleDeleteSection = () => {
      setOpenSectionMenuId(null);
      if (taskLists.length <= 1) {
        Alert.alert(
          'Cannot Delete',
          'Cannot delete the last section. A project must have at least one section.',
        );
        return;
      }

      Alert.alert(
        'Delete Section',
        'Are you sure you want to delete this section? All tasks in this section will also be deleted. This action cannot be undone.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                const response = await agent.Tasks.deleteTaskList(
                  projectId,
                  item.id,
                );
                if (response && response.data) {
                  await loadTaskLists();
                } else {
                  Alert.alert('Error', 'Failed to delete section. Please try again.');
                }
              } catch (err) {
                console.error('Failed to delete section:', err);
                Alert.alert('Error', 'Failed to delete section. Please try again.');
              }
            },
          },
        ],
      );
    };

    return (
      <View style={styles.taskListSection}>
        <View style={styles.taskListHeader}>
          <View style={styles.taskListHeaderContent}>
            <View style={styles.taskListHeaderLeft}>
              <View style={styles.taskListTitleRow}>
                <TouchableOpacity
                  style={styles.sectionCollapseToggle}
                  onPress={() => toggleSectionCollapsed(listId)}
                  activeOpacity={0.7}
                >
                  <IconButton
                    icon={isCollapsed ? 'chevron-down' : 'chevron-up'}
                    size={20}
                    iconColor="#555"
                    style={styles.sectionCollapseIcon}
                  />
                </TouchableOpacity>
                <Text style={styles.taskListTitle}>
                  {item.title || item.name || 'Task list'}
                </Text>
                <View style={styles.taskCountBadge}>
                  <Text style={styles.taskCountBadgeText}>
                    {filteredTasks.length}
                  </Text>
                </View>
              </View>
              {item.description && (
                <Text style={styles.taskListDescription}>
                  {item.description}
                </Text>
              )}
            </View>
            <View style={styles.taskListHeaderRight}>
              <View style={styles.sectionMenuWrapper}>
                <TouchableOpacity
                  style={styles.sectionMenuButton}
                  onPress={() =>
                    setOpenSectionMenuId(
                      openSectionMenuId === item.id ? null : item.id,
                    )
                  }
                >
                  <IconButton
                    icon="dots-vertical"
                    size={20}
                    iconColor="#666"
                    style={styles.sectionMenuButtonIcon}
                  />
                </TouchableOpacity>
                {openSectionMenuId === item.id && (
                  <View style={styles.sectionMenu}>
                    <TouchableOpacity
                      style={styles.sectionMenuItem}
                      onPress={handleOpenEditSectionModal}
                    >
                      <IconButton
                        icon="pencil-outline"
                        size={18}
                        iconColor="#555"
                        style={styles.sectionMenuItemIcon}
                      />
                      <Text style={styles.sectionMenuItemText}>
                        Edit section
                      </Text>
                    </TouchableOpacity>
                    {taskLists.length > 1 && (
                      <TouchableOpacity
                        style={[
                          styles.sectionMenuItem,
                          styles.sectionMenuItemDelete,
                        ]}
                        onPress={handleDeleteSection}
                      >
                        <IconButton
                          icon="trash-can-outline"
                          size={18}
                          iconColor="#ef4444"
                          style={styles.sectionMenuItemIcon}
                        />
                        <Text
                          style={[
                            styles.sectionMenuItemText,
                            styles.sectionMenuItemTextDelete,
                          ]}
                        >
                          Delete section
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
        {!isCollapsed && (
          <TaskTable
            taskTableColumns={taskTableColumns}
            tasks={filteredTasks}
            listId={listId}
            scrollPositions={scrollPositions}
            setScrollPositions={setScrollPositions}
            rowHeights={rowHeights}
            setRowHeights={setRowHeights}
            onTaskCreate={handleTaskCreate}
            onDragEnd={async ({ data, listId: draggedListId }) => {
           // console.log('onDragEnd called with data:', data.length, 'tasks, listId:', draggedListId);
            try {
              if (!data || data.length === 0) {
                console.log('No tasks to update');
                return;
              }

              // Get current tasks to preserve subtasks
              const currentTasks = tasksByList[draggedListId] || [];
              
              // Prepare task orders array for API (same format as web version)
              const taskOrders = data
                .filter(task => task && task.id)
                .map((task, index) => ({
                  id: task.id,
                  order: index
                }));

             // console.log('Updating task order via API:', taskOrders);
              
              // Update task order using the dedicated API endpoint
              const response = await agent.Tasks.updateTaskOrder(projectId, draggedListId, taskOrders);
              
              if (response && response.data) {
                // Reconstruct full task list with subtasks
                // Get subtasks from current tasks and attach them to their parents
                const fullTaskList = [];
                data.forEach((parentTask, index) => {
                  if (!parentTask) return;
                  fullTaskList.push({
                    ...parentTask,
                    order: index,
                  });
                  // Find subtasks for this parent from current tasks
                  const subtasks = currentTasks.filter(
                    t => t && (t.parent_id === parentTask.id || t.parent_id === (parentTask.task_id))
                  );
                  fullTaskList.push(...subtasks);
                });
                
                // Update tasks in the list
                setTasksByList(prev => ({
                  ...prev,
                  [draggedListId]: fullTaskList,
                }));
                
               // console.log('Task order updated successfully via API, total tasks:', fullTaskList.length);
              } else {
                throw new Error('API response was not successful');
              }
            } catch (err) {
              //console.error('Failed to update task order', err);
              // Reload tasks to revert to original order on error
              try {
                const taskRes = await agent.Tasks.getTaskByListId(
                  projectId,
                  draggedListId,
                );
                if (taskRes && taskRes.data) {
                  const taskArray = Array.isArray(taskRes.data)
                    ? taskRes.data
                    : [taskRes.data];
                  setTasksByList(prev => ({
                    ...prev,
                    [draggedListId]: taskArray,
                  }));
                  //console.log('Tasks reloaded after error');
                }
              } catch (reloadErr) {
                console.error('Failed to reload tasks after order update error', reloadErr);
              }
            }
            }}
            styles={styles}
            emptyMessage="No tasks in this list."
          />
        )}
      </View>
    );
  };

  const projectCategories = project?.categories || [];

  return (
    <ViewLayout noMargin>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        nestedScrollEnabled={true}
        scrollEventThrottle={16}
      >
        {showHeaderMenu && (
          <TouchableWithoutFeedback onPress={() => setShowHeaderMenu(false)}>
            <View style={styles.headerMenuOverlay} />
          </TouchableWithoutFeedback>
        )}
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ff7a08" />
            <Text style={styles.loaderText}>Loading project...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : !project ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Project not found.</Text>
          </View>
        ) : (
          <>
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <View style={styles.headerMain}>
                  <Text style={styles.projectTitle}>
                    {project.title || project.name}
                  </Text>
                  {projectCategories.length > 0 && (
                    <View style={styles.categoriesSection}>
                      <View style={styles.categoriesRow}>
                        {projectCategories.map((cat, idx) => (
                          <View
                            key={cat.id || cat.category_id || idx}
                            style={styles.categoryBadge}
                          >
                            <Text style={styles.categoryText}>
                              {cat.name || cat.title || 'Category'}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                  <Text style={styles.projectMeta}>
                    Last modified:{' '}
                    {formatDate(project.updated_at || project.created_at)}
                  </Text>
                  {/* {projectUsers.length > 0 && (
                    <View style={styles.membersSection}>
                      <View style={styles.membersRow}>
                        {projectUsers.slice(0, 8).map(renderMemberAvatar)}
                        {projectUsers.length > 8 && (
                          <View style={styles.moreMembersBadge}>
                            <Text style={styles.moreMembersText}>
                              +{projectUsers.length - 8}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )} */}
                </View>
                <View style={styles.headerActions}>
                  <View style={styles.headerMenuWrapper}>
                    <IconButton
                      icon="dots-vertical"
                      size={24}
                      iconColor="#666"
                      onPress={() => setShowHeaderMenu(prev => !prev)}
                    />
                    {showHeaderMenu && (
                      <View style={styles.headerMenu}>
                        <TouchableOpacity
                          style={styles.headerMenuItem}
                          onPress={() => {
                            setShowHeaderMenu(false);
                            setIsMembersModalOpen(true);
                          }}
                        >
                          <IconButton
                            icon="account-multiple-outline"
                            size={18}
                            iconColor="#555"
                            style={styles.headerMenuItemIcon}
                          />
                          <Text style={styles.headerMenuItemText}>
                            Manage members
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.headerMenuItem}
                          onPress={() => {
                            if (project) {
                              setEditProjectFormData({
                                title: project.title || project.name || '',
                                description: project.description || '',
                                category:
                                  (project.categories &&
                                    project.categories[0] &&
                                    (project.categories[0].id ||
                                      project.categories[0].category_id)) ||
                                  '',
                              });
                              setIsEditProjectModalOpen(true);
                            }
                            setShowHeaderMenu(false);
                          }}
                        >
                          <IconButton
                            icon="pencil-outline"
                            size={18}
                            iconColor="#555"
                            style={styles.headerMenuItemIcon}
                          />
                          <Text style={styles.headerMenuItemText}>
                            Edit project
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.headerMenuItem}
                          onPress={() => {
                            setShowHeaderMenu(false);
                            setShowDescription(prev => !prev);
                          }}
                        >
                          <IconButton
                            icon={
                              showDescription
                                ? 'eye-off-outline'
                                : 'eye-outline'
                            }
                            size={18}
                            iconColor="#555"
                            style={styles.headerMenuItemIcon}
                          />
                          <Text style={styles.headerMenuItemText}>
                            {showDescription
                              ? 'Hide description'
                              : 'Show description'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.headerMenuItem}
                          onPress={() => {
                            setShowHeaderMenu(false);
                            handleToggleFavorite();
                          }}
                        >
                          <IconButton
                            icon={isFavorite ? 'star' : 'star-outline'}
                            size={18}
                            iconColor={isFavorite ? '#FFD700' : '#555'}
                            style={styles.headerMenuItemIcon}
                          />
                          <Text style={styles.headerMenuItemText}>
                            {isFavorite ? 'Remove from favourites' : 'Add to favourites'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.headerMenuItem}
                          onPress={() => {
                            setShowHeaderMenu(false);
                            handleSetProjectStatus();
                          }}
                        >
                          <IconButton
                            icon={project.status === 1 ? 'restore' : 'check-circle'}
                            size={18}
                            iconColor="#555"
                            style={styles.headerMenuItemIcon}
                          />
                          <Text style={styles.headerMenuItemText}>
                            {project.status === 1 ? 'Restore project' : 'Complete project'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              </View>
              {showDescription && project.description ? (
                <Text style={styles.projectDescription}>
                  {project.description}
                </Text>
              ) : null}
            </View>

            
            <View style={styles.manageMembersButtonContainer}>
              <ManageMembersModal
                visible={isMembersModalOpen}
                onClose={() => setIsMembersModalOpen(false)}
                project={project}
                projectUsers={projectUsers}
                currentUser={currentUser}
                manageSearchQuery={manageSearchQuery}
                setManageSearchQuery={setManageSearchQuery}
                manageSearchResults={manageSearchResults}
                isManageSearching={isManageSearching}
                addingMemberId={addingMemberId}
                removingMemberId={removingMemberId}
                onAddUser={handleAddUserToProject}
                onRemoveUser={handleRemoveUserFromProject}
              />
            </View>

            <View style={styles.editProjectButtonContainer}>
              <EditProjectModal
                visible={isEditProjectModalOpen}
                onClose={() => setIsEditProjectModalOpen(false)}
                formData={editProjectFormData}
                setFormData={setEditProjectFormData}
                categories={categories}
                saving={editProjectSaving}
                onSubmit={async () => {
                  if (!project) return;
                  if (!editProjectFormData.title.trim()) return;
                  try {
                    setEditProjectSaving(true);
                    const payload = {
                      title: editProjectFormData.title.trim(),
                      description: editProjectFormData.description.trim(),
                      category: editProjectFormData.category || '',
                    };
                    const res = await agent.Projects.updateProject(
                      project.id,
                      payload,
                    );
                    if (res && res.data) {
                      await loadProject();
                      setIsEditProjectModalOpen(false);
                    }
                  } catch (err) {
                    console.error('Failed to update project', err);
                  } finally {
                    setEditProjectSaving(false);
                  }
                }}
              />
            </View>
            
            <View style={styles.editSectionButtonContainer}>
              <EditSectionModal
                visible={isEditSectionModalOpen}
                onClose={() => {
                  setIsEditSectionModalOpen(false);
                  setEditSectionFormData({ title: '', description: '' });
                  setEditingSectionTaskListId(null);
                }}
                formData={editSectionFormData}
                setFormData={setEditSectionFormData}
                saving={editSectionSaving}
                onSubmit={async () => {
                  if (!projectId || !editingSectionTaskListId) return;
                  if (!editSectionFormData.title.trim()) {
                    Alert.alert('Error', 'Please enter a section title');
                    return;
                  }
                  try {
                    setEditSectionSaving(true);
                    const response = await agent.Tasks.updateTaskList(
                      projectId,
                      editingSectionTaskListId,
                      {
                        title: editSectionFormData.title.trim(),
                        description: editSectionFormData.description.trim() || undefined,
                      },
                    );
                    if (response && response.data) {
                      await loadTaskLists();
                      setIsEditSectionModalOpen(false);
                      setEditSectionFormData({ title: '', description: '' });
                      setEditingSectionTaskListId(null);
                    } else {
                      Alert.alert('Error', 'Failed to update section. Please try again.');
                    }
                  } catch (err) {
                    console.error('Failed to update section:', err);
                    Alert.alert('Error', 'Failed to update section. Please try again.');
                  } finally {
                    setEditSectionSaving(false);
                  }
                }}
              />
            </View>
            
            <View style={styles.addSectionButtonContainer}>
              <EditSectionModal
                visible={isCreateSectionModalOpen}
                onClose={() => {
                  setIsCreateSectionModalOpen(false);
                  setCreateSectionFormData({ title: '', description: '' });
                }}
                formData={createSectionFormData}
                setFormData={setCreateSectionFormData}
                saving={createSectionSaving}
                onSubmit={handleCreateSection}
                isNew={true}
              />
            </View>

            

            {taskLists.length === 0 ? (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>
                  No task lists found for this project.
                </Text>
              </View>
            ) : (
              <>
                <FlatList
                  data={taskLists}
                  keyExtractor={(item, index) =>
                    (item.id || item.task_list_id || index).toString()
                  }
                  renderItem={renderTaskListSection}
                  scrollEnabled={false}
                  contentContainerStyle={styles.taskListsContainer}
                  removeClippedSubviews={false}
                  nestedScrollEnabled={true}
                />
                <TouchableOpacity
                  style={styles.addSectionButton}
                  onPress={() => setIsCreateSectionModalOpen(true)}
                >
                  <IconButton
                    icon="plus"
                    size={20}
                    iconColor="#ffffff"
                    style={styles.addSectionButtonIcon}
                  />
                  <Text style={styles.addSectionButtonText}>
                    Add section
                  </Text>
                </TouchableOpacity>
              </>
            )}
            
            {/* Show add section button even when there are no sections */}
            {taskLists.length === 0 && (
              <TouchableOpacity
                style={styles.addSectionButton}
                onPress={() => setIsCreateSectionModalOpen(true)}
              >
                <IconButton
                  icon="plus"
                  size={20}
                  iconColor="#ffffff"
                  style={styles.addSectionButtonIcon}
                />
                <Text style={styles.addSectionButtonText}>
                  Add section
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.taskDetailModalContainer}>
              <TaskDetailModal
                visible={!!taskDetailTaskId}
                taskId={taskDetailTaskId}
                projectId={projectId}
                currentUserId={currentUser?.user?.id || currentUser?.ID || currentUser?.id}
                onClose={() => setTaskDetailTaskId(null)}
                onOpenSubtaskDetail={(projId, tid) => setTaskDetailTaskId(tid)}
                onRefreshMainTaskData={async (listId) => {
                  if (!listId || !projectId) return;
                  try {
                    const taskRes = await agent.Tasks.getTaskByListId(projectId, listId);
                    if (taskRes && taskRes.data) {
                      const taskArray = Array.isArray(taskRes.data)
                        ? taskRes.data
                        : [taskRes.data];
                      setTasksByList(prev => ({ ...prev, [listId]: taskArray }));
                    }
                  } catch (err) {
                    console.error('Failed to reload tasks', err);
                  }
                }}
                onNotFound={() => setTaskDetailTaskId(null)}
              />
            </View>
          </>
        )}
      </ScrollView>
    </ViewLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loaderContainer: {
    paddingTop: 80,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 20,
  },
  errorText: {
    color: '#c62828',
    fontSize: 15,
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e0e0e0',
    zIndex: 10000,
    padding: 16,
    borderBottomWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 99999999
  },
  headerMain: {
    flex: 1,
    paddingRight: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    zIndex: 99999999
  },
  headerMenuWrapper: {
    position: 'relative',
  },
  headerMenu: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    paddingVertical: 4,
    width: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  headerMenuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  headerMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  headerMenuItemIcon: {
    margin: 0,
    marginRight: 4,
  },
  headerMenuItemText: {
    fontSize: 13,
    color: '#333333',
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#222222',
    marginBottom: 6,
  },
  projectDescription: {
    fontSize: 14,
    color: '#555555',
    marginTop: 8,
  },
  projectMeta: {
    fontSize: 12,
    color: '#888888',
  },
  sectionLabel: {
    fontSize: 14,
    color: '#444444',
    fontWeight: '600',
    marginBottom: 6,
  },
  membersSection: {
    paddingTop: 15,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: -6,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  moreMembersBadge: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#eeeeee',
  },
  moreMembersText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  categoriesSection: {
    paddingTop: 2,
    paddingBottom: 4,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '500',
  },
  taskFilterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  taskFilterTab: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  taskFilterTabActive: {
    backgroundColor: '#ff7a08',
  },
  taskFilterText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  taskFilterTextActive: {
    color: '#fff',
  },
  taskListsContainer: {
    paddingHorizontal: 0,
    paddingVertical: 12,
  },
  taskListSection: {
    marginBottom: 10,
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
  taskListHeader: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingVertical: 14,
    paddingHorizontal: 16,
    position: 'relative',
    zIndex: 1000,
  },
  taskListHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskListHeaderLeft: {
    flex: 1,
    paddingRight: 12,
    width: '90%',
  },
  taskListTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  sectionCollapseToggle: {
    marginRight: 4,
  },
  sectionCollapseIcon: {
    margin: 0,
  },
  taskListTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
    marginRight: 8,
  },
  taskCountBadge: {
    backgroundColor: '#ff7a08',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskCountBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  taskListDescription: {
    fontSize: 11,
    color: '#6c757d',
    marginTop: 4,
    lineHeight: 18,
  },
  taskListHeaderRight: {
    position: 'relative',
    width: '10%',
  },
  sectionMenuButton: {
    borderRadius: 8,
    padding: 4,
  },
  sectionMenuButtonIcon: {
    margin: -10,
    marginRight: 4,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionMenuWrapper: {
    position: 'relative',
  },
  sectionMenu: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 6,
    width: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 1000,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  sectionMenuItemDelete: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  sectionMenuItemIcon: {
    margin: 0,
    marginRight: 4,
  },
  sectionMenuItemText: {
    fontSize: 13,
    color: '#333333',
  },
  sectionMenuItemTextDelete: {
    color: '#ef4444',
  },
  taskListEmpty: {
    fontSize: 13,
    color: '#999999',
    fontStyle: 'italic',
    textAlign: 'left',
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
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 11,
    color: '#9e9e9e',
    textTransform: 'uppercase',
  },
  taskRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  subtaskRow: {
    paddingLeft: 20,
    borderBottomColor: '#f2f2f2',
  },
  taskMain: {
    flex: 1,
    paddingRight: 8,
  },
  taskTitleTouchable: {
    flex: 1,
    flexShrink: 1,
    paddingRight: 8,
  },
  taskTitle: {
    fontSize: 13,
    color: '#333333',
    fontWeight: '500',
    flexShrink: 1,
    paddingRight: 12,
    marginRight: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskTitle: {
    fontSize: 13,
    color: '#555555',
    textAlign: 'left',
    flexShrink: 1,
  },
  taskAssignee: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskAssigneeAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  taskAssigneeAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  taskAssigneeAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  taskAssigneeName: {
    fontSize: 12,
    color: '#555555',
    flexShrink: 1,
  },
  taskMeta: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  taskDueDate: {
    fontSize: 12,
    color: '#555555',
    textAlign: 'left',
  },
  taskDueDateEmpty: {
    fontSize: 12,
    color: '#bbbbbb',
    fontStyle: 'italic',
    textAlign: 'left',
  },
  noDataContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 14,
    color: '#666666',
  },
  nameCell: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    overflow: 'hidden',
    gap: 10,
  },
  nameBulletIcon: {
    margin: 0,
    marginRight: 4,
    flexShrink: 0,
  },
  assigneeInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  priorityPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'left',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222222',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 8,
    marginBottom: 6,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#eeeeee',
    marginVertical: 12,
  },
  modalEmptyText: {
    fontSize: 13,
    color: '#777777',
    marginTop: 4,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  memberAvatarLargePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarLargeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberTextBlock: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    color: '#222222',
    fontWeight: '500',
  },
  memberEmail: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
  memberRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  memberRole: {
    fontSize: 12,
    color: '#4b5563',
    marginBottom: 4,
  },
  removeMemberButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  removeMemberText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  searchInputWrapper: {
    marginTop: 4,
    marginBottom: 4,
    paddingBottom: 40,
  },
  searchLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333333',
  },
  searchResults: {
    marginTop: 8,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  memberAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 10,
  },
  memberAvatarSmallPlaceholder: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  memberAvatarSmallText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  addMemberText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '500',
  },
  searchStatusText: {
    fontSize: 13,
    color: '#777777',
    marginTop: 4,
  },
  addSectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff7a08',
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  addSectionButtonIcon: {
    margin: 0,
    marginRight: 8,
  },
  addSectionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});

export default connect(mapStateToProps)(SingleProject);

