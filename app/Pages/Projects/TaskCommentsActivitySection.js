import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NODE_BACKEND } from '@env';
import { IconButton } from 'react-native-paper';
import agent from '@/agent';
import TaskCommentsSection from './TaskCommentsSection';
import TaskActivitySection from './TaskActivitySection';

const API_ROOT = NODE_BACKEND;

const TaskCommentsActivitySection = ({
  projectId,
  taskData,
  currentUserId,
  onRefreshTaskData,
  refreshTaskActivitiesData,
  setRefreshTaskActivitiesData,
  activeTabExternal,
  hideTabs = false,
  onRequestScrollToBottom,
}) => {
  const [activeTab, setActiveTab] = useState('comments');
  const [sortOrder, setSortOrder] = useState('oldest');
  const [taskComments, setTaskComments] = useState([]);
  const [taskActivities, setTaskActivities] = useState([]);
  const [addingComment, setAddingComment] = useState(false);

  const currentTask = taskData;

  const formatRelativeTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  const refreshTaskComments = async () => {
    if (!projectId || !currentTask?.id) return;
    try {
      const response = await agent.Tasks.getTaskComments(projectId, currentTask.id);
      if (response?.data) setTaskComments(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch task comments:', err);
    }
  };

  const refreshTaskActivities = async () => {
    if (!projectId || !currentTask?.id) return;
    try {
      const response = await agent.Tasks.getTaskActivities(projectId, currentTask.id);
      if (response?.data) setTaskActivities(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Failed to fetch task activities:', err);
    }
  };

  useEffect(() => {
    if (refreshTaskActivitiesData && setRefreshTaskActivitiesData) {
      setRefreshTaskActivitiesData(false);
      refreshTaskActivities();
    }
  }, [refreshTaskActivitiesData, setRefreshTaskActivitiesData]);

  useEffect(() => {
    if (projectId && currentTask?.id) {
      refreshTaskComments();
      refreshTaskActivities();
    }
  }, [projectId, currentTask?.id]);

  // Allow parent to control which tab is active (e.g. from TaskDetailModal)
  useEffect(() => {
    if (activeTabExternal && activeTabExternal !== activeTab) {
      setActiveTab(activeTabExternal);
    }
  }, [activeTabExternal, activeTab]);

  const handleAddComment = async (commentData) => {
    if (
      !commentData ||
      (!commentData.content &&
        (!commentData.attachments || commentData.attachments.length === 0)) ||
      !projectId ||
      !currentTask?.id
    ) {
      return;
    }

    const content = commentData.content || '';
    const htmlContent = commentData.htmlContent || commentData.content || '';
    const attachments = commentData.attachments || [];
    const mentions = Array.isArray(commentData.mentions)
      ? commentData.mentions
      : [];

    console.log('commentData', commentData);

    setAddingComment(true);
    try {
      const token = await AsyncStorage.getItem('jwt');
      // Correct comments endpoint for mobile
      const url = `/tasks/${projectId}/${currentTask.id}/createComment`;

      const formData = new FormData();
      formData.append('content', content);
      formData.append('html_content', htmlContent);

      // Send mentions as repeated primitive fields (no JSON.stringify)
      if (mentions.length > 0) {
        mentions.forEach((m) => {
          if (!m) return;
          const id = m.id ?? m.ID;
          if (id != null) {
            formData.append('mentions[]', String(id));
          }
        });
      }

      attachments.forEach((file) => {
        if (!file?.uri) return;
        formData.append('attachments[]', {
          uri: file.uri,
          type: file.type || 'application/octet-stream',
          name: file.name || file.fileName || 'file',
        });
      });

      const res = await fetch(`${API_ROOT}${url}`, {
        method: 'POST',
        headers: {
          // Let fetch set the correct multipart boundary; just add auth
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const raw = await res.text().catch(() => '');
        console.error('Failed to add comment, status:', res.status, raw);
        throw new Error(`add comment failed with status ${res.status}`);
      }

      await refreshTaskComments();
      await refreshTaskActivities();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setAddingComment(false);
    }
  };

  const handleUpdateComment = async (commentId, payload) => {
    if (!projectId || !currentTask?.id) return;
    const content = payload?.content ?? payload?.htmlContent ?? '';
    const htmlContent = payload?.htmlContent ?? content;
    const mentions = Array.isArray(payload?.mentions) ? payload.mentions : [];
    const attachments = Array.isArray(payload?.attachments) ? payload.attachments : [];
    const files_to_delete = Array.isArray(payload?.files_to_delete) ? payload.files_to_delete : [];
    const useFormData = attachments.length > 0 || files_to_delete.length > 0;

    try {
      if (useFormData) {
        const token = await AsyncStorage.getItem('jwt');
        const url = `/tasks/${projectId}/${currentTask.id}/updateComment/${commentId}`;
        const formData = new FormData();
        formData.append('content', content || htmlContent);
        formData.append('html_content', htmlContent || content);
        if (mentions.length > 0) {
          mentions.forEach((m) => {
            const id = m?.id ?? m?.ID;
            if (id != null) formData.append('mentions[]', String(id));
          });
        }
        if (files_to_delete.length > 0) {
          formData.append('files_to_delete', JSON.stringify(files_to_delete));
        }
        attachments.forEach((file) => {
          if (!file?.uri) return;
          formData.append('attachments[]', {
            uri: file.uri,
            type: file.type || 'application/octet-stream',
            name: file.name || file.fileName || 'file',
          });
        });
        const res = await fetch(`${API_ROOT}${url}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!res.ok) {
          const raw = await res.text().catch(() => '');
          throw new Error(`update comment failed: ${res.status} ${raw}`);
        }
      } else {
        await agent.Tasks.updateTaskComment(projectId, currentTask.id, commentId, {
          content: content || htmlContent,
          html_content: htmlContent || content,
        });
      }
      await refreshTaskComments();
      await refreshTaskActivities();
    } catch (err) {
      console.error('Failed to update comment:', err);
      throw err;
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!projectId || !currentTask?.id) return;
    try {
      await agent.Tasks.deleteTaskComment(projectId, currentTask.id, commentId);
      await refreshTaskComments();
      await refreshTaskActivities();
    } catch (err) {
      console.error('Failed to delete comment:', err);
      throw err;
    }
  };

  if (!currentTask) {
    return null;
  }

  const creatorId = currentTask?.created_by || currentTask?.creator_id;
  const creator = taskData?.project_users?.find(
    (u) => (u.ID || u.id) == creatorId
  );
  const createdDate =
    currentTask?.created_at || currentTask?.created_on || currentTask?.created_date;
  const creatorName = creator ? creator.display_name || creator.name : 'Unknown';
  const createdTimeAgo = formatRelativeTime(createdDate);

  const sortedComments =
    sortOrder === 'oldest' ? taskComments : [...taskComments].reverse();
  const sortedActivities =
    sortOrder === 'oldest' ? [...taskActivities] : [...taskActivities].reverse();

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        {!hideTabs && (
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'comments' && styles.tabActive]}
              onPress={() => setActiveTab('comments')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'comments' && styles.tabTextActive,
                ]}
              >
                Comments
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'activity' && styles.tabActive]}
              onPress={() => setActiveTab('activity')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'activity' && styles.tabTextActive,
                ]}
              >
                Activity
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <TouchableOpacity
          style={styles.sortBtn}
          onPress={() =>
            setSortOrder((prev) => (prev === 'oldest' ? 'newest' : 'oldest'))
          }
        >
          <IconButton
            icon={sortOrder === 'oldest' ? 'sort-ascending' : 'sort-descending'}
            size={20}
            iconColor="#5f6368"
          />
        </TouchableOpacity>
      </View>

      {activeTab === 'comments' ? (
        <TaskCommentsSection
          taskComments={sortedComments}
          formatRelativeTime={formatRelativeTime}
          taskData={taskData}
          currentUserId={currentUserId}
          onAddComment={handleAddComment}
          onUpdateComment={handleUpdateComment}
          onDeleteComment={handleDeleteComment}
          projectId={projectId}
          taskId={currentTask?.id}
          onRefreshComments={refreshTaskComments}
          submittingComment={addingComment}
          onRequestScrollToBottom={onRequestScrollToBottom}
        />
      ) : (
        <TaskActivitySection
          formatRelativeTime={formatRelativeTime}
          createdDate={createdDate}
          creatorName={creatorName}
          createdTimeAgo={createdTimeAgo}
          creator={creator}
          taskActivities={sortedActivities}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 0,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: '#e8eaed',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  tabs: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#e8f0fe',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5f6368',
  },
  tabTextActive: {
    color: '#1a73e8',
  },
  sortBtn: {
    padding: 4,
  },
});

export default TaskCommentsActivitySection;
