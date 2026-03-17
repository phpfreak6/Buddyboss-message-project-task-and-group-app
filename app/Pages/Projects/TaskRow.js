import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
  ActionSheetIOS,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import agent from '@/agent';
import TaskAssigneeModal from './TaskAssigneeModal';
import DueDatePickerModal from './DueDatePickerModal';

// Helper function to format date for date input (yyyy-MM-dd)
export const formatDateForInput = (dateValue) => {
  if (!dateValue) return '';
  try {
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue;
    }
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
};

// Helper function to map assignee data
export const mapAssignee = (assigneeData) => {
  if (!assigneeData) return null;
  return {
    ID: assigneeData.user_id || assigneeData.ID || assigneeData.id,
    id: assigneeData.user_id || assigneeData.ID || assigneeData.id,
    display_name: assigneeData.display_name || assigneeData.name,
    name: assigneeData.display_name || assigneeData.name,
    image: assigneeData.assignee || assigneeData.image || assigneeData.avatar_url,
    avatar_url: assigneeData.assignee || assigneeData.image || assigneeData.avatar_url,
    user_email: assigneeData.user_email || assigneeData.email,
  };
};

// Helper function to map multiple assignees
export const mapAssignees = (assigneesData) => {
  if (!assigneesData || !Array.isArray(assigneesData)) return [];
  return assigneesData.map(mapAssignee).filter(Boolean);
};

// Assignee Cell Component
export const AssigneeCell = ({
  task,
  projectId,
  taskListId,
  projectUsers = [],
  currentUser,
  onUpdate,
  isSubtask = false,
}) => {
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [addingAssigneeId, setAddingAssigneeId] = useState(null);
  const [removingAssigneeId, setRemovingAssigneeId] = useState(null);

  const assignees = React.useMemo(() => {
    const assigneesData = task.assignees || task.assigned_users || task.users || [];
    return mapAssignees(assigneesData);
  }, [task.assignees, task.assigned_users, task.users]);

  const currentUserId = currentUser?.user?.id || currentUser?.ID || currentUser?.id;
  const isTaskOwner = task.created_by === parseInt(currentUserId);

  const handleSelectAssignee = async (user) => {
    const assigneeId = user.ID || user.id;
    setAddingAssigneeId(assigneeId);
    try {
      await agent.Tasks.addAssigneeToTask(projectId, task.id, assigneeId);
      // Update task list after adding assignee
      if (onUpdate) {
        await onUpdate();
      }
    } catch (err) {
      console.error('Failed to add assignee', err);
      Alert.alert('Error', 'Failed to add assignee');
    } finally {
      setAddingAssigneeId(null);
    }
  };

  const handleRemoveAssignee = async (assigneeId) => {
    setRemovingAssigneeId(assigneeId);
    try {
      await agent.Tasks.updateTask(projectId, task.id, {
        assignee_id: assigneeId,
        action: 'remove_assignee',
        task_list_id: taskListId || task.task_list_id,
      });
      // Update task list after removing assignee
      if (onUpdate) {
        await onUpdate();
      }
    } catch (err) {
      console.error('Failed to remove assignee', err);
      Alert.alert('Error', 'Failed to remove assignee');
    } finally {
      setRemovingAssigneeId(null);
    }
  };

  if (isSubtask) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowAssigneeModal(true)}
        style={styles.assigneeCellContainer}
      >
        {assignees.length > 0 ? (
          <View style={styles.assigneesContainer}>
            {assignees.slice(0, 2).map((assignee) => (
              <View
                key={assignee.ID || assignee.id}
                style={styles.assigneeAvatarWrapper}
              >
                {assignee.image || assignee.avatar_url ? (
                  <Image
                    source={{ uri: assignee.image || assignee.avatar_url }}
                    style={styles.assigneeAvatar}
                  />
                ) : (
                  <View style={styles.assigneeAvatarPlaceholder}>
                    <Text style={styles.assigneeAvatarText}>
                      {(assignee.display_name || assignee.name || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            ))}
            {assignees.length > 2 && (
              <View style={styles.moreAssigneesBadge}>
                <Text style={styles.moreAssigneesText}>+{assignees.length - 2}</Text>
              </View>
            )}
          </View>
        ) : (
          <IconButton
            icon="account-plus-outline"
            size={18}
            iconColor="#9e9e9e"
            style={styles.addAssigneeIcon}
          />
        )}
      </TouchableOpacity>

      <TaskAssigneeModal
        visible={showAssigneeModal}
        onClose={() => setShowAssigneeModal(false)}
        title="Assign Task"
        assignees={assignees}
        projectUsers={projectUsers}
        addingAssigneeId={addingAssigneeId}
        removingAssigneeId={removingAssigneeId}
        onAddAssignee={handleSelectAssignee}
        onRemoveAssignee={handleRemoveAssignee}
      />
    </>
  );
};

// Due Date Cell Component
export const DueDateCell = ({
  task,
  projectId,
  taskListId,
  onUpdate,
  isSubtask = false,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isUpdatingDueDate, setIsUpdatingDueDate] = useState(false);

  const rawDueDate = task.due_date || task.dueDate || task.due_at;
  const selectedDate = rawDueDate ? new Date(rawDueDate) : null;

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const handleDateChange = (event, date) => {
    if (!date) return;
    // Our DueDatePickerModal always sends { type: 'set' } on confirm.
    if (event?.type !== 'set') return;
    confirmDateSelection(date);
  };

  const confirmDateSelection = async (date) => {
    if (!date) return;
    const formattedDate = formatDateForInput(date.toISOString());
    try {
      setIsUpdatingDueDate(true);
      await agent.Tasks.updateTask(projectId, task.id, {
        due_date: formattedDate,
        action: 'update_due_date',
        task_list_id: taskListId || task.task_list_id,
      });
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to update due date', err);
      Alert.alert('Error', 'Failed to update due date');
    } finally {
      setIsUpdatingDueDate(false);
    }
  };

  const handleRemoveDate = async () => {
    try {
      setIsUpdatingDueDate(true);
      await agent.Tasks.updateTask(projectId, task.id, {
        due_date: '',
        action: 'update_due_date',
        task_list_id: taskListId || task.task_list_id,
      });
      //setSelectedDate(null);
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to remove due date', err);
      Alert.alert('Error', 'Failed to remove due date');
    } finally {
      setIsUpdatingDueDate(false);
    }
  };

  if (isSubtask) {
    return null;
  }

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        style={styles.dueDateCellContainer}
      >
        {isUpdatingDueDate ? (
          <ActivityIndicator size="small" color="#9e9e9e" />
        ) : selectedDate ? (
          <View style={styles.dueDateSelected}>
            <Text style={styles.dueDateText}>{formatDate(selectedDate)}</Text>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                handleRemoveDate();
              }}
              style={styles.removeDateButton}
            >
              <IconButton
                icon="close"
                size={14}
                iconColor="#9e9e9e"
                style={styles.removeDateIcon}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <IconButton
            icon="calendar-outline"
            size={18}
            iconColor="#9e9e9e"
            style={styles.addDateIcon}
          />
        )}
      </TouchableOpacity>

      <DueDatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        value={selectedDate || new Date()}
        onChange={handleDateChange}
      />
    </>
  );
};

// Priority Cell Component
export const PriorityCell = ({
  task,
  projectId,
  taskListId,
  onUpdate,
  isSubtask = false,
}) => {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [priority, setPriority] = useState(task.priority ?? 0);

  useEffect(() => {
    setPriority(task.priority ?? 0);
  }, [task.priority]);

  const getPriorityConfig = (priorityValue) => {
    let label = 'Low';
    let bg = '#FFF3CD';
    let color = '#B58105';

    if (priorityValue === 1) {
      label = 'Med';
      bg = '#E3F2FD';
      color = '#1565C0';
    } else if (priorityValue === 2) {
      label = 'High';
      bg = '#FFEBEE';
      color = '#C62828';
    }

    return { label, bg, color };
  };

  const handlePriorityChange = async (newPriority) => {
    const priorityValue = parseInt(newPriority, 10);
    setPriority(priorityValue);
    setShowPriorityMenu(false);

    try {
      await agent.Tasks.updateTask(projectId, task.id, {
        priority: priorityValue,
        action: 'update_priority',
        task_list_id: taskListId || task.task_list_id,
      });
      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error('Failed to update priority', err);
      Alert.alert('Error', 'Failed to update priority');
      // Revert priority on error
      setPriority(task.priority ?? 0);
    }
  };

  const priorityConfig = getPriorityConfig(priority);

  const renderPriorityMenuItem = (priorityValue, label) => {
    const isActive = priority === priorityValue;
    const itemConfig = getPriorityConfig(priorityValue);
    
    return (
      <TouchableOpacity
        key={priorityValue}
        style={[
          styles.priorityMenuItemContainer,
          isActive && styles.priorityMenuItemContainerActive,
        ]}
        onPress={() => handlePriorityChange(priorityValue)}
      >
        <View style={[styles.priorityMenuItemIcon, { backgroundColor: itemConfig.bg }]}>
          <View style={[styles.priorityMenuItemDot, { backgroundColor: itemConfig.color }]} />
        </View>
        <Text
          style={[
            styles.priorityMenuItemText,
            isActive && { color: itemConfig.color, fontWeight: '600' },
          ]}
        >
          {label}
        </Text>
        {isActive && (
          <IconButton
            icon="check"
            size={18}
            iconColor={itemConfig.color}
            style={styles.priorityMenuItemCheck}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowPriorityMenu(true)}
        style={styles.priorityPillContainer}
      >
        <View style={[styles.priorityPill, { backgroundColor: priorityConfig.bg }]}>
          <Text style={[styles.priorityText, { color: priorityConfig.color }]}>
            {priorityConfig.label}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={showPriorityMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPriorityMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPriorityMenu(false)}
        >
          <View style={styles.priorityModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Priority</Text>
              <IconButton
                icon="close"
                size={22}
                onPress={() => setShowPriorityMenu(false)}
              />
            </View>
            <View style={styles.priorityMenuItemsContainer}>
              {renderPriorityMenuItem(0, 'Low')}
              {renderPriorityMenuItem(1, 'Medium')}
              {renderPriorityMenuItem(2, 'High')}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

// Actions Cell Component
export const ActionsCell = ({
  task,
  projectId,
  taskListId,
  currentUser,
  onUpdate,
  onDelete,
  onView,
  isSubtask = false,
}) => {
  const currentUserId = currentUser?.user?.id || currentUser?.ID || currentUser?.id;
  const isTaskOwner = task.created_by === parseInt(currentUserId);

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      isSubtask
        ? 'Are you sure you want to delete this subtask?'
        : 'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await agent.Tasks.deleteTask(projectId, taskListId, task.id);
              if (onDelete) await onDelete();
              if (onUpdate) await onUpdate();
            } catch (err) {
              console.error('Failed to delete task', err);
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const handleView = () => {
    if (onView) onView(task.id);
  };

  const showTaskActions = () => {
    if (Platform.OS === 'ios' && ActionSheetIOS.showActionSheetWithOptions) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'View', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleView();
          else if (buttonIndex === 2) handleDelete();
        }
      );
    } else {
      Alert.alert('Task options', '', [
        { text: 'Delete', style: 'destructive', onPress: handleDelete },
        { text: 'Cancel', style: 'cancel' },
        { text: 'View', onPress: handleView },
        
      ]);
    }
  };

  return (
    <View style={styles.actionsCellContainer}>
      <IconButton
        icon="dots-vertical"
        size={18}
        iconColor="#9e9e9e"
        onPress={showTaskActions}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  assigneeCellContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  assigneesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  assigneeAvatarWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 4,
    overflow: 'hidden',
  },
  assigneeAvatar: {
    width: '100%',
    height: '100%',
  },
  assigneeAvatarPlaceholder: {
    flex: 1,
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  assigneeAvatarText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  moreAssigneesBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  moreAssigneesText: {
    fontSize: 9,
    color: '#666',
    fontWeight: '600',
  },
  addAssigneeIcon: {
    margin: 0,
  },
  dueDateCellContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  dueDateSelected: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dueDateText: {
    fontSize: 12,
    color: '#555555',
  },
  removeDateButton: {
    marginLeft: 4,
  },
  removeDateIcon: {
    margin: 0,
  },
  addDateIcon: {
    margin: 0,
  },
  actionsCellContainer: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
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
  priorityCellContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityPillContainer: {
    alignSelf: 'center',
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
  priorityModalContent: {
    width: '80%',
    maxWidth: 300,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  priorityMenuItemsContainer: {
    paddingVertical: 8,
  },
  priorityMenuItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  priorityMenuItemContainerActive: {
    backgroundColor: '#f5f5f5',
  },
  priorityMenuItemIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  priorityMenuItemDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  priorityMenuItemText: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
  },
  priorityMenuItemCheck: {
    margin: 0,
    width: 24,
    height: 24,
  },
});

export default {
  AssigneeCell,
  DueDateCell,
  PriorityCell,
  ActionsCell,
};
