import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
  Platform,
  Keyboard,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NODE_BACKEND } from '@env';
import { IconButton } from 'react-native-paper';
import DocumentPicker from 'react-native-document-picker';
import agent from '@/agent';
import StatusDropdown from '@/components/StatusDropdown';
import HtmlRenderer from '@/components/htmlRenderer';
import TaskRecurringSection from './TaskRecurringSection';
import TaskCommentsActivitySection from './TaskCommentsActivitySection';
import TaskAssigneeModal from './TaskAssigneeModal';
import DueDatePickerModal from './DueDatePickerModal';
import { mapAssignees } from './TaskRow';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const API_ROOT = NODE_BACKEND;

// Subtask row for modal
const SubtaskRow = ({
  subtask,
  taskListId,
  parentTaskId,
  projectUsers,
  onUpdate,
  onDelete,
  onOpenSubtaskDetail,
  projectId,
  currentUserId,
  parentTaskData,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title || subtask.name || '');

  React.useEffect(() => {
    setEditTitle(subtask.title || subtask.name || '');
  }, [subtask]);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== (subtask.title || subtask.name)) {
      onUpdate?.(subtask.id, parentTaskId, taskListId, {
        title: editTitle.trim(),
        action: 'update_title',
      });
    }
    setIsEditingTitle(false);
  };

  const handleStatusChange = (newStatus) => {
    onUpdate?.(subtask.id, parentTaskId, taskListId, {
      status: newStatus,
      action: 'update_status',
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete subtask',
      'Are you sure you want to delete this subtask?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(subtask.id, parentTaskId, taskListId) },
      ]
    );
  };

  return (
    <View style={subtaskRowStyles.row}>
      <View style={subtaskRowStyles.nameCell}>
        <StatusDropdown
          currentStatus={subtask.status ?? 0}
          onStatusChange={handleStatusChange}
          size="medium"
        />
        {isEditingTitle ? (
          <TextInput
            style={subtaskRowStyles.titleInput}
            value={editTitle}
            onChangeText={setEditTitle}
            onBlur={handleSaveTitle}
            onSubmitEditing={handleSaveTitle}
            autoFocus
          />
        ) : (
          <View style={subtaskRowStyles.titleRow}>
            <Text
              style={[subtaskRowStyles.title, subtask.status === 1 && subtaskRowStyles.titleCompleted]}
              // onPress={() => setIsEditingTitle(true)}
              onPress={() => onOpenSubtaskDetail(projectId, subtask.id)}
              numberOfLines={2}
            >
              {subtask.title || subtask.name}
            </Text>
            {onOpenSubtaskDetail && (
              <TouchableOpacity
                onPress={() => onOpenSubtaskDetail(projectId, subtask.id)}
                style={subtaskRowStyles.chevron}
              >
                <IconButton icon="chevron-right" size={22} iconColor="#5f6368" style={{ margin: 0 }} />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const subtaskRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  nameCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minWidth: 0,
  },
  titleInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#ff7a08',
    borderRadius: 8,
    fontSize: 14,
    minHeight: 44,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    color: '#1e293b',
    flex: 1,
    minWidth: 0,
  },
  titleCompleted: { opacity: 0.5, textDecorationLine: 'line-through' },
  chevron: { padding: 4, margin: 0 },
});

const TaskDetailModal = ({
  visible,
  taskId,
  projectId,
  currentUserId,
  onClose,
  onOpenSubtaskDetail,
  onRefreshMainTaskData,
  onNotFound,
}) => {
  const scrollViewRef = useRef(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [isAssigneesModalOpen, setIsAssigneesModalOpen] = useState(false);
  const [addingAssigneeId, setAddingAssigneeId] = useState(null);
  const [removingAssigneeId, setRemovingAssigneeId] = useState(null);
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState(0);
  const [subtaskText, setSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [assignees, setAssignees] = useState([]);
  const [isLoadingTask, setIsLoadingTask] = useState(true);
  const [taskData, setTaskData] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [refreshTaskActivities, setRefreshTaskActivities] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);

  useEffect(() => {
    if (!taskId || !projectId || !visible) return;
    const fetchTaskDetails = async () => {
      setIsLoadingTask(true);
      try {
        const response = await agent.Tasks.getTaskById(projectId, taskId);
        if (response && response.data) {
          setTaskData(response.data);
        } else {
          if (typeof onNotFound === 'function') onNotFound();
        }
      } catch (err) {
        setTaskData(null);
        if (typeof onNotFound === 'function') onNotFound();
      } finally {
        setIsLoadingTask(false);
      }
    };
    fetchTaskDetails();
  }, [taskId, projectId, visible]);

  useEffect(() => {
    if (taskData && !isLoadingTask) {
      setTaskTitle(taskData.title || taskData.name || '');
      const desc = (taskData.description && taskData.description.replace(/<p><\/p>/g, '<p><br></p>')) || '';
      setTaskDescription(desc);
      setAssignees(mapAssignees(taskData.assignees || taskData.project_users || []));
      setDueDate(taskData.due_date || taskData.dueDate || taskData.due_at || '');
      setPriority(taskData.priority !== undefined ? taskData.priority : 0);
      setProjectName(taskData.project?.title || taskData.project?.name || taskData.project_name || '');
    }
  }, [taskData, isLoadingTask]);

  // When modal is closed, clear task data and related UI state
  useEffect(() => {
    if (!visible) {
      setTaskData(null);
      setIsLoadingTask(true);
      setTaskTitle('');
      setTaskDescription('');
      setDescriptionDraft('');
      setAssignees([]);
      setDueDate('');
      setPriority(0);
      setSubtaskText('');
      setIsAddingSubtask(false);
      setIsAssigneesModalOpen(false);
      setAddingAssigneeId(null);
      setRemovingAssigneeId(null);
      setPreviewAttachment(null);
      setShowDueDatePicker(false);
      setRefreshTaskActivities(false);
      setIsEditingTitle(false);
      setIsEditingDescription(false);
    }
  }, [visible]);

  // Helper: scroll the details view to bottom.
  // Passed down so only the comment editor can trigger it.
  const scrollToBottom = () => {
    if (scrollViewRef.current?.scrollToEnd) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const isTaskOwner = taskData?.created_by === parseInt(currentUserId);

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    try {
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return dateValue;
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return '';
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    } catch (e) {
      return '';
    }
  };

  const refreshTaskData = async () => {
    if (!taskData?.id || !projectId) return;
    try {
      const response = await agent.Tasks.getTaskById(projectId, taskData.id);
      if (response && response.data) {
        setTaskData(response.data);
        setRefreshTaskActivities(true);
      }
    } catch (err) {
      console.error('Failed to refresh task data:', err);
    }
  };

  const handleSaveTitle = async () => {
    if (!taskData?.id || !projectId) return;
    if (taskTitle.trim() && taskTitle.trim() !== (taskData?.title || taskData?.name)) {
      await agent.Tasks.updateTask(projectId, taskData.id, {
        title: taskTitle.trim(),
        action: 'update_title',
      });
      if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
      await refreshTaskData();
    }
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async (content) => {
    if (!taskData?.id || !projectId) return;
    const htmlContent = content || taskDescription;
    await agent.Tasks.updateTask(projectId, taskData.id, {
      description: htmlContent,
      action: 'update_description',
    });
    if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
    setTaskDescription(htmlContent);
    await refreshTaskData();
    setIsEditingDescription(false);
  };

  const handleAddAssignee = async (user) => {
    const assigneeId = user.ID || user.id;
    setAddingAssigneeId(assigneeId);
    try {
      await agent.Tasks.addAssigneeToTask(projectId, taskData.id, assigneeId);
      if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
      await refreshTaskData();
    } catch (err) {
      console.error('Failed to add assignee', err);
    } finally {
      setAddingAssigneeId(null);
    }
  };

  const handleRemoveAssignee = async (assigneeId) => {
    setRemovingAssigneeId(assigneeId);
    try {
      await agent.Tasks.updateTask(projectId, taskData.id, {
        assignee_id: assigneeId,
        action: 'remove_assignee',
      });
      if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
      await refreshTaskData();
    } catch (err) {
      console.error('Failed to remove assignee', err);
    } finally {
      setRemovingAssigneeId(null);
    }
  };

  const handleDueDateChange = async (event, date) => {
    if (event?.type === 'set' && date) {
      const newDate = formatDateForInput(date);
      setDueDate(newDate);
      await agent.Tasks.updateTask(projectId, taskData.id, {
        due_date: newDate || '',
        action: 'update_due_date',
      });
      if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
      await refreshTaskData();
    }
    setShowDueDatePicker(false);
  };

  const handlePriorityChange = async (newPriority) => {
    const val = parseInt(newPriority, 10);
    setPriority(val);
    await agent.Tasks.updateTask(projectId, taskData.id, {
      priority: val,
      action: 'update_priority',
    });
    if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
    await refreshTaskData();
  };

  const handleStatusChange = async (newStatus) => {
    await agent.Tasks.updateTask(projectId, taskData.id, {
      status: newStatus,
      action: 'update_status',
    });
    if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
    await refreshTaskData();
  };

  const handleAddSubtask = async () => {
    if (!subtaskText.trim() || !projectId || !taskData?.task_list_id) return;
    try {
      const response = await agent.Tasks.createTask(projectId, {
        title: subtaskText.trim(),
        task_list_id: taskData.task_list_id,
        parent_id: taskData.id,
      });
      if (response && response.data) {
        setSubtaskText('');
        setIsAddingSubtask(false);
        if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
        await refreshTaskData();
      }
    } catch (err) {
      console.error('Failed to create subtask:', err);
      Alert.alert('Error', 'Failed to create subtask.');
    }
  };

  const handleUpdateSubtask = async (subtaskId, parentTaskId, taskListId, data) => {
    if (!projectId) return;
    try {
      await agent.Tasks.updateTask(projectId, subtaskId, data);
      if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
      await refreshTaskData();
    } catch (err) {
      console.error('Failed to update subtask:', err);
    }
  };

  const handleDeleteSubtask = async (subtaskId, parentTaskId, taskListId) => {
    if (!projectId || !taskListId) return;
    try {
      await agent.Tasks.deleteTask(projectId, taskListId, subtaskId);
      if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
      await refreshTaskData();
    } catch (err) {
      console.error('Failed to delete subtask:', err);
    }
  };

  const handleViewAttachment = (url, name) => {
    if (!url) return;
    // For images we already have a full-screen preview modal;
    // this function is mainly for non-image files.
    Linking.openURL(url).catch((err) => {
      console.error('Open attachment failed:', err);
      Alert.alert('Error', 'Unable to open attachment.');
    });
  };

  const handleDownloadAttachmentFile = (url) => {
    if (!url) return;
    // On mobile, opening the URL will typically trigger the download or viewer
    Linking.openURL(url).catch((err) => {
      console.error('Download attachment failed:', err);
      Alert.alert('Error', 'Unable to download attachment.');
    });
  };

  const handleAttachmentClick = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
        allowMultiSelection: true,
      });

      if (!results?.length || !taskData?.id) return;

      setIsUploadingAttachment(true);
      const formData = new FormData();

      results.forEach((file) => {
        if (!file?.uri) return;
        // Match web TaskDetailSidePanel: use attachments[]
        formData.append('attachments[]', {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || file.fileName || 'file',
        });
      });

      // Use direct fetch pattern similar to ThreadScreen
      const token = await AsyncStorage.getItem('jwt');
      const url = `/tasks/${projectId}/${taskData.id}/uploadAttachment`;

      const response = await fetch(`${API_ROOT}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      }).then((res) => res.json());

      if (response && response.data) {
        await refreshTaskData();
        if (typeof onRefreshMainTaskData === 'function') {
          onRefreshMainTaskData(taskData?.task_list_id);
        }
      }
    } catch (err) {
      if (err?.code !== 'DOCUMENT_PICKER_CANCELED') {
        console.error('Upload attachment:', err);
        Alert.alert('Error', 'Failed to upload attachment.');
      }
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleDeleteAttachment = async (fileId) => {
    Alert.alert(
      'Delete attachment',
      'Are you sure you want to delete this attachment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await agent.Tasks.deleteTaskAttachment(projectId, taskData.id, fileId);
              await refreshTaskData();
              if (typeof onRefreshMainTaskData === 'function') onRefreshMainTaskData(taskData?.task_list_id);
            } catch (err) {
              console.error('Delete attachment:', err);
            }
          },
        },
      ]
    );
  };

  const handleCopyLink = async () => {
    try {
      await Share.share({
        message: `Task: ${taskTitle || 'Untitled'}\nProject: ${projectName}`,
        title: 'Task link',
      });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const currentTask = taskData;

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === 'android'}
      supportedOrientations={['portrait', 'landscape']}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.panelWrapper}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.panel}>
          {/* Keyboard avoiding so bottom editor stays visible above iOS keyboard */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
          {/* Sheet handle */}
          <View style={styles.sheetHandle}>
            <View style={styles.sheetHandleBar} />
          </View>
          {/* Header: project name + close on top, then actions row */}
          <View style={styles.header}>
            {/* Project name row - on top, with close button on the right */}
            <View style={styles.headerProjectRow}>
              {projectName ? (
                <View style={styles.headerProjectInfo}>
                  <IconButton icon="folder" size={20} iconColor="#ff7a08" style={styles.projectNameIcon} />
                  <Text style={styles.projectNameText} numberOfLines={1}>
                    {projectName}
                  </Text>
                </View>
              ) : (
                <View style={styles.headerProjectInfo} />
              )}
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityLabel="Close"
              >
                <View style={styles.closeBtnInner}>
                  <IconButton icon="close" size={22} iconColor="#fff" style={styles.closeBtnIcon} />
                </View>
              </TouchableOpacity>
            </View>

            {/* Actions row */}
            <View style={styles.headerActionsRow}>
              <View style={styles.headerLeft} pointerEvents="box-none">
                {isLoadingTask ? (
                  <ActivityIndicator size="small" color="#ff7a08" />
                ) : (
                  <>
                    {!!currentTask?.parent_id && onOpenSubtaskDetail && projectId && (
                      <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => onOpenSubtaskDetail(projectId, currentTask.parent_id)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <IconButton icon="chevron-left" size={24} iconColor="#1a1a1a" />
                      </TouchableOpacity>
                    )}
                    <View style={styles.headerActions}>
                      <StatusDropdown
                        currentStatus={currentTask?.status ?? 0}
                        onStatusChange={handleStatusChange}
                        size="medium"
                        showLabel
                      />
                      <TouchableOpacity
                        onPress={handleAttachmentClick}
                        disabled={isUploadingAttachment}
                        style={styles.headerActionBtn}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        {isUploadingAttachment ? (
                          <ActivityIndicator size="small" color="#ff7a08" />
                        ) : (
                          <IconButton icon="paperclip" size={20} iconColor="#5f6368" style={styles.headerActionIcon} />
                        )}
                      </TouchableOpacity>
                      {/* <TouchableOpacity onPress={handleCopyLink} style={styles.headerActionBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <IconButton icon="link" size={20} iconColor="#5f6368" style={styles.headerActionIcon} />
                      </TouchableOpacity> */}
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>

          {isLoadingTask ? (
            <View style={styles.loadingContent}>
              <ActivityIndicator size="large" />
              <Text style={styles.loadingText}>Loading task...</Text>
            </View>
          ) : !currentTask ? (
            <View style={styles.loadingContent}>
              <Text style={styles.loadingText}>Task not found</Text>
            </View>
          ) : (
            <ScrollView
              ref={scrollViewRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={true}
            >
              <TouchableWithoutFeedback
                onPress={() => {
                  Keyboard.dismiss();
                  if (isEditingTitle) handleSaveTitle();
                }}
              >
                <View style={styles.scrollContentInner}>
              {/* Title */}
              <View style={styles.titleSection}>
                {isEditingTitle ? (
                  <TextInput
                    style={[
                      styles.title,
                      styles.titleInputSame,
                      currentTask?.status === 1 && styles.titleCompleted,
                    ]}
                    value={taskTitle}
                    onChangeText={setTaskTitle}
                    onBlur={handleSaveTitle}
                    onSubmitEditing={handleSaveTitle}
                    onEndEditing={handleSaveTitle}
                    autoFocus
                    placeholder="Task title"
                    placeholderTextColor="#9aa0a6"
                    multiline
                    blurOnSubmit={false}
                  />
                ) : (
                  <Text
                    style={[styles.title, currentTask?.status === 1 && styles.titleCompleted]}
                    onPress={() => setIsEditingTitle(true)}
                    numberOfLines={5}
                  >
                    {taskTitle || 'Untitled task'}
                  </Text>
                )}
              </View>

              {/* Assignee & Due date & Priority */}
              {!currentTask?.parent_id && (
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Assignee</Text>
                    <View style={styles.assigneesRow}>
                      {assignees.map((a) => (
                        <TouchableOpacity key={a.ID || a.id} style={styles.assigneeAvatarItem} onPress={() => setIsAssigneesModalOpen(true)}>
                          {a.image || a.avatar_url ? (
                            <Image source={{ uri: a.image || a.avatar_url }} style={styles.avatarImg} />
                          ) : (
                            <View style={styles.avatarPlaceholder}>
                              <Text style={styles.avatarPlaceholderText}>
                                {(a.display_name || a.name || 'U').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                      <TouchableOpacity
                        style={styles.addAssigneeBtn}
                        onPress={() => setIsAssigneesModalOpen(true)}
                      >
                        <IconButton icon="account-plus" size={18} iconColor="#ff7a08" style={styles.addAssigneeIcon} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Due date</Text>
                    <TouchableOpacity
                      style={styles.dueDateValue}
                      onPress={() => setShowDueDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <IconButton icon="calendar" size={20} iconColor="#5f6368" style={styles.dueDateIcon} />
                      <Text style={styles.dueDateText}>
                        {dueDate
                          ? new Date(dueDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'No due date'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <DueDatePickerModal
                    visible={showDueDatePicker}
                    onClose={() => setShowDueDatePicker(false)}
                    value={dueDate}
                    onChange={handleDueDateChange}
                  />
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Priority</Text>
                    <View style={styles.priorityRow}>
                      {[0, 1, 2].map((p) => (
                        <TouchableOpacity
                          key={p}
                          style={[styles.priorityBtn, priority === p && styles.priorityBtnActive]}
                          onPress={() => handlePriorityChange(p)}
                        >
                          <Text style={[styles.priorityBtnText, priority === p && styles.priorityBtnTextActive]}>
                            {p === 0 ? 'Low' : p === 1 ? 'Medium' : 'High'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              )}

              {!currentTask?.parent_id && (
                <TaskRecurringSection
                  taskData={taskData}
                  projectId={projectId}
                  onRefreshMainTaskData={onRefreshMainTaskData}
                  onRefreshTaskData={refreshTaskData}
                />
              )}

              {/* Description */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Description</Text>
                {isEditingDescription ? (
                  <View style={styles.descEditor}>
                    <TextInput
                      style={styles.descInput}
                      value={descriptionDraft}
                      onChangeText={setDescriptionDraft}
                      multiline
                      placeholder="What is this task about?"
                    />
                    <View style={styles.descActions}>
                      <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={() => {
                          // Revert draft to last saved description and exit edit mode
                          setDescriptionDraft(
                            (taskDescription || '').replace(/<[^>]*>/g, ''),
                          );
                          setIsEditingDescription(false);
                        }}
                      >
                        <Text style={styles.cancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.saveDescBtn}
                        onPress={() => handleSaveDescription(descriptionDraft)}
                      >
                        <Text style={styles.saveDescBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.descBlock}
                    onPress={() => {
                      setDescriptionDraft(
                        (taskDescription || '').replace(/<[^>]*>/g, ''),
                      );
                      setIsEditingDescription(true);
                    }}
                  >
                    {taskDescription && typeof taskDescription === 'string' && taskDescription.trim() !== '' ? (
                      <HtmlRenderer message={taskDescription} />
                    ) : (
                      <Text style={styles.descPlaceholder}>What is this task about?</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>

              {/* Subtasks */}
              <View style={styles.subtasksSection}>
                <Text style={styles.fieldLabel}>Subtasks</Text>
                {currentTask?.subtasks?.map((subtask) => (
                  <SubtaskRow
                    key={subtask.id}
                    subtask={subtask}
                    currentUserId={currentUserId}
                    parentTaskData={currentTask}
                    taskListId={currentTask?.task_list_id}
                    parentTaskId={currentTask?.id}
                    projectUsers={taskData?.project_users || []}
                    onUpdate={handleUpdateSubtask}
                    onDelete={handleDeleteSubtask}
                    onOpenSubtaskDetail={onOpenSubtaskDetail}
                    projectId={projectId}
                  />
                ))}
                {isAddingSubtask && (
                  <View style={styles.subtaskInputRow}>
                    <TextInput
                      style={styles.subtaskInput}
                      placeholder="Add a subtask"
                      value={subtaskText}
                      onChangeText={setSubtaskText}
                      onSubmitEditing={subtaskText.trim() ? handleAddSubtask : undefined}
                      onBlur={() => {
                        if (!subtaskText.trim()) setIsAddingSubtask(false);
                      }}
                      autoFocus
                    />
                    {subtaskText.trim() ? (
                      <TouchableOpacity onPress={handleAddSubtask} style={styles.subtaskSaveBtn}>
                        <IconButton icon="check" size={20} iconColor="#ff7a08" style={styles.subtaskSaveIcon} />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                )}
                {!isAddingSubtask && (
                  <TouchableOpacity
                    style={styles.addSubtaskBtn}
                    onPress={() => setIsAddingSubtask(true)}
                  >
                    <IconButton icon="plus" size={18} iconColor="#ff7a08" style={styles.addSubtaskIcon} />
                    <Text style={styles.addSubtaskBtnText}>Add subtask</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Attachments */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Attachments</Text>
                <View style={styles.attachmentsRow}>
                  {currentTask?.files?.map((file, index) => {
                    const url = file.file_url;
                    const name = file.file_name || 'Attachment';
                    const isPhoto =
                      (file.type || '').toLowerCase() === 'photo' ||
                      (file.mime_type || '').startsWith('image/');
                    const fid = file.id || file.attachment_id || index;
                    if (isPhoto && url) {
                      return (
                        <View key={fid} style={styles.attachmentCard}>
                          <TouchableOpacity
                            onPress={() => setPreviewAttachment({ url, name })}
                            style={styles.attachmentThumb}
                          >
                            <Image source={{ uri: url }} style={styles.attachmentImg} />
                          </TouchableOpacity>

                          {/* View & Download controls overlay (like web) */}
                          <View style={styles.attachmentActionsOverlay}>
                            <TouchableOpacity
                              style={styles.attachmentActionButton}
                              onPress={() => setPreviewAttachment({ url, name })}
                            >
                              <IconButton
                                icon="eye-outline"
                                size={18}
                                iconColor="#1f2933"
                                style={styles.attachmentActionIcon}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.attachmentActionButton}
                              onPress={() => handleDownloadAttachmentFile(url)}
                            >
                              <IconButton
                                icon="download-outline"
                                size={18}
                                iconColor="#1f2933"
                                style={styles.attachmentActionIcon}
                              />
                            </TouchableOpacity>
                          </View>

                          <TouchableOpacity
                            style={styles.attachmentDeleteBtn}
                            onPress={() => handleDeleteAttachment(fid)}
                          >
                            <IconButton icon="close" size={14} iconColor="#fff" style={styles.attachmentDeleteIcon} />
                          </TouchableOpacity>
                        </View>
                      );
                    }
                    return (
                      <View key={fid} style={styles.attachmentFileCard}>
                        <Text style={styles.attachmentFileIcon}>📄</Text>
                        <Text style={styles.attachmentFileName} numberOfLines={2}>
                          {name}
                        </Text>
                        <View style={styles.attachmentFileActionsRow}>
                          <TouchableOpacity
                            style={styles.attachmentFileActionBtn}
                            onPress={() => handleViewAttachment(url, name)}
                          >
                            <IconButton
                              icon="eye-outline"
                              size={18}
                              iconColor="#1f2933"
                              style={styles.attachmentActionIcon}
                            />
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.attachmentFileActionBtn}
                            onPress={() => handleDownloadAttachmentFile(url)}
                          >
                            <IconButton
                              icon="download-outline"
                              size={18}
                              iconColor="#1f2933"
                              style={styles.attachmentActionIcon}
                            />
                          </TouchableOpacity>
                        </View>
                        <TouchableOpacity
                          style={styles.attachmentDeleteBtn}
                          onPress={() => handleDeleteAttachment(fid)}
                        >
                          <IconButton icon="close" size={14} iconColor="#fff" style={styles.attachmentDeleteIcon} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                  <TouchableOpacity style={styles.attachmentAddCard} onPress={handleAttachmentClick}>
                    <IconButton icon="plus" size={24} iconColor="#5f6368" style={styles.attachmentAddIcon} />
                  </TouchableOpacity>
                </View>
              </View>

              <TaskCommentsActivitySection
                projectId={projectId}
                taskData={taskData}
                currentUserId={currentUserId}
                onRefreshTaskData={refreshTaskData}
                refreshTaskActivitiesData={refreshTaskActivities}
                setRefreshTaskActivitiesData={setRefreshTaskActivities}
                onRequestScrollToBottom={scrollToBottom}
              />
                </View>
              </TouchableWithoutFeedback>
            </ScrollView>
          )}

          <TaskAssigneeModal
            visible={isAssigneesModalOpen}
            onClose={() => setIsAssigneesModalOpen(false)}
            title="Assign Task"
            assignees={assignees}
            projectUsers={taskData?.project_users || []}
            addingAssigneeId={addingAssigneeId}
            removingAssigneeId={removingAssigneeId}
            onAddAssignee={handleAddAssignee}
            onRemoveAssignee={handleRemoveAssignee}
          />
          </KeyboardAvoidingView>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Attachment preview */}
      {previewAttachment && (
        <Modal visible transparent animationType="fade">
          <TouchableOpacity
            style={styles.previewOverlay}
            activeOpacity={1}
            onPress={() => setPreviewAttachment(null)}
          >
            <View style={styles.previewContent}>
              <TouchableOpacity
                style={styles.previewClose}
                onPress={() => setPreviewAttachment(null)}
              >
                <IconButton icon="close" size={28} iconColor="#fff" />
              </TouchableOpacity>
              <Image
                source={{ uri: previewAttachment.url }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              <Text style={styles.previewTitle}>{previewAttachment.name}</Text>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panelWrapper: {
    maxHeight: '94%',
    height: '94%',
    width: '100%',
  },
  panel: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  sheetHandle: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingTop: 12,
  },
  sheetHandleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#dadce0',
  },
  header: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    backgroundColor: '#fafafa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 2,
  },
  headerProjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 5,
    paddingRight: 8,
    minWidth: 0,
  },
  headerProjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  projectNameIcon: {
    margin: 0,
    marginRight: 8,
  },
  projectNameText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    minWidth: 0,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 10,
  },
  backBtn: {
    marginLeft: -4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 4,
  },
  headerActionBtn: {
    padding: 4,
  },
  headerActionIcon: {
    margin: 0,
  },
  closeBtn: {
    marginLeft: 8,
  },
  closeBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnIcon: {
    margin: 0,
  },
  loadingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#5f6368',
  },
  scroll: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 50,
  },
  scrollContentInner: {
    flexGrow: 1,
  },
  titleSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#202124',
    lineHeight: 32,
  },
  titleCompleted: {
    opacity: 0.5,
    textDecorationLine: 'line-through',
  },
  titleInputSame: {
    padding: 0,
    margin: 0,
    borderWidth: 0,
  },
  infoRow: {
    flexDirection: 'column',
    gap: 20,
    marginBottom: 24,
  },
  infoItem: {
    marginBottom: 0,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  assigneesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  assigneeAvatarItem: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dadce0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5f6368',
  },
  removeAssigneeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ea4335',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeAssigneeIcon: {
    margin: 0,
  },
  manageAssigneesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#ff7a08',
    backgroundColor: '#fff8f5',
    gap: 6,
  },
  manageAssigneesBtnText: {
    fontSize: 14,
    color: '#ff7a08',
    fontWeight: '600',
  },
  addAssigneeIcon: {
    margin: 0,
  },
  dueDateValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8eaed',
    minHeight: 44,
  },
  dueDateIcon: {
    margin: 0,
  },
  dueDateText: {
    fontSize: 14,
    color: '#202124',
    flex: 1,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  priorityBtn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    backgroundColor: '#f1f3f4',
    borderWidth: 1,
    borderColor: '#dadce0',
    minHeight: 44,
    justifyContent: 'center',
  },
  priorityBtnActive: {
    backgroundColor: '#ff7a08',
    borderColor: '#ff7a08',
  },
  priorityBtnText: {
    fontSize: 14,
    color: '#5f6368',
    fontWeight: '500',
  },
  priorityBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  field: {
    marginBottom: 24,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#5f6368',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  descBlock: {
    minHeight: 80,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e8eaed',
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  descPlaceholder: {
    color: '#9aa0a6',
    fontSize: 14,
  },
  descEditor: {
    borderWidth: 2,
    borderColor: '#ff7a08',
    borderRadius: 8,
    padding: 14,
  },
  descInput: {
    minHeight: 100,
    fontSize: 14,
    color: '#202124',
    padding: 0,
  },
  descActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  cancelText: {
    fontSize: 14,
    color: '#5f6368',
  },
  saveDescBtn: {
    paddingVertical: 10,
    paddingHorizontal: 22,
    backgroundColor: '#ff7a08',
    borderRadius: 8,
  },
  saveDescBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  subtasksSection: {
    marginBottom: 28,
  },
  subtaskInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f4',
  },
  subtaskInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    fontSize: 14,
    minHeight: 44,
  },
  subtaskSaveBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subtaskSaveIcon: {
    margin: 0,
  },
  addSubtaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  addSubtaskIcon: {
    margin: 0,
  },
  addSubtaskBtnText: {
    fontSize: 14,
    color: '#ff7a08',
    fontWeight: '600',
  },
  attachmentsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  attachmentCard: {
    width: 110,
    height: 110,
    position: 'relative',
  },
  attachmentThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  attachmentImg: {
    width: '100%',
    height: '100%',
  },
  attachmentActionsOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  attachmentActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 3,
  },
  attachmentActionIcon: {
    margin: 0,
  },
  attachmentFileCard: {
    width: 110,
    height: 110,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  attachmentFileIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  attachmentFileName: {
    fontSize: 11,
    color: '#111827',
    textAlign: 'center',
    flex: 1,
  },
  attachmentFileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  attachmentFileActionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentDeleteBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(220,38,38,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentDeleteIcon: {
    margin: 0,
  },
  attachmentAddCard: {
    width: 110,
    height: 110,
    borderRadius: 8,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentAddIcon: {
    margin: 0,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: {
    maxWidth: SCREEN_WIDTH - 40,
    alignItems: 'center',
  },
  previewClose: {
    position: 'absolute',
    top: -50,
    right: 0,
    zIndex: 10,
  },
  previewImage: {
    width: SCREEN_WIDTH - 40,
    height: 400,
  },
  previewTitle: {
    marginTop: 12,
    fontSize: 14,
    color: '#fff',
  },
});

export default TaskDetailModal;
