import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { getStatusLabel } from '@/components/StatusDropdown';

const TaskActivitySection = ({
  formatRelativeTime,
  createdDate,
  creatorName,
  createdTimeAgo,
  creator,
  taskActivities,
}) => {
  const formatActivityMessage = (activity) => {
    const actorName = activity.actor?.display_name || activity.actor?.name || 'User';
    const action = activity.action || '';
    const meta = activity.meta || {};

    switch (action) {
      case 'create_task':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> created this task
            {meta.task_title ? (
              <Text style={styles.activityMeta}> "{meta.task_title}"</Text>
            ) : null}
          </Text>
        );

      case 'update_task_title':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> renamed this task
            {meta.task_title_old && meta.task_title ? (
              <Text style={styles.activityMeta}>
                {' '}from "{meta.task_title_old}" to "{meta.task_title}"
              </Text>
            ) : null}
          </Text>
        );

      case 'update_task_status': {
        const statusOld = getStatusLabel(meta.task_status_old ?? 0);
        const statusNew = getStatusLabel(meta.task_status ?? 0);
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> changed status
            {meta.task_status_old !== undefined && meta.task_status !== undefined ? (
              <Text style={styles.activityMeta}>
                {' '}from <Text style={styles.activityBold}>{statusOld}</Text> to{' '}
                <Text style={styles.activityBold}>{statusNew}</Text>
              </Text>
            ) : null}
          </Text>
        );
      }

      case 'update_task_due_date': {
        const dueDate = meta.task_due_date
          ? new Date(meta.task_due_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })
          : 'removed';
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text>{' '}
            {meta.task_due_date ? 'set' : 'removed'} the due date
            {meta.task_due_date ? (
              <Text style={styles.activityMeta}> to {dueDate}</Text>
            ) : null}
          </Text>
        );
      }

      case 'update_task_description':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> updated the description
          </Text>
        );

      case 'update_task_priority': {
        const priorityLabels = { 0: 'low', 1: 'normal', 2: 'high', 3: 'urgent' };
        const priority = priorityLabels[meta.task_priority] || meta.task_priority;
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> changed priority to{' '}
            <Text style={styles.activityBold}>{priority}</Text>
          </Text>
        );
      }

      case 'update_task_recurrent':
      case 'disable_task_recurring':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text>{' '}
            {action === 'disable_task_recurring' ? 'disabled' : 'updated'} recurring
            settings
          </Text>
        );

      case 'delete_task':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> deleted this task
            {meta.deleted_task_title ? (
              <Text style={styles.activityMeta}> "{meta.deleted_task_title}"</Text>
            ) : null}
          </Text>
        );

      case 'comment_on_task':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> commented on this task
          </Text>
        );

      case 'add_task_assignee':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> assigned{' '}
            <Text style={styles.activityBold}>{meta.assignee_name || 'someone'}</Text> to
            this task
          </Text>
        );

      case 'remove_task_assignee':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> unassigned{' '}
            <Text style={styles.activityBold}>{meta.assignee_name || 'someone'}</Text>{' '}
            from this task
          </Text>
        );

      case 'create_task_list':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> created task list
            {meta.task_list_title ? (
              <Text style={styles.activityMeta}> "{meta.task_list_title}"</Text>
            ) : null}
          </Text>
        );

      case 'update_task_list':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> updated task list
            {meta.task_list_title ? (
              <Text style={styles.activityMeta}> "{meta.task_list_title}"</Text>
            ) : null}
          </Text>
        );

      case 'delete_task_list':
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text> deleted task list
            {meta.deleted_task_list_title ? (
              <Text style={styles.activityMeta}> "{meta.deleted_task_list_title}"</Text>
            ) : null}
          </Text>
        );

      default: {
        const actionText = action
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase());
        return (
          <Text style={styles.activityText}>
            <Text style={styles.activityBold}>{actorName}</Text>{' '}
            {actionText.toLowerCase()}
          </Text>
        );
      }
    }
  };

  return (
    <View style={styles.list}>
      {taskActivities && taskActivities.length > 0 ? (
        taskActivities.map((activity) => (
          <View key={activity.id} style={styles.commentItem}>
            <View style={styles.commentAvatar}>
              {activity.actor?.image || activity.actor?.avatar_url ? (
                <Image
                  source={{
                    uri:
                      activity.actor.image ||
                      activity.actor.avatar_url,
                  }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {(
                      activity.actor?.display_name ||
                      activity.actor?.name ||
                      'U'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.commentContent}>
              <View style={styles.commentText}>{formatActivityMessage(activity)}</View>
              {formatRelativeTime(activity.created_at) ? (
                <Text style={styles.commentTime}>
                  · {formatRelativeTime(activity.created_at)}
                </Text>
              ) : null}
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noComments}>No activity yet</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    marginBottom: 16,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#dadce0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5f6368',
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    marginBottom: 4,
  },
  activityText: {
    fontSize: 14,
    color: '#202124',
  },
  activityBold: {
    fontWeight: '600',
  },
  activityMeta: {
    color: '#5f6368',
  },
  commentTime: {
    fontSize: 12,
    color: '#5f6368',
  },
  noComments: {
    textAlign: 'center',
    padding: 20,
    color: '#9aa0a6',
    fontSize: 14,
  },
});

export default TaskActivitySection;
