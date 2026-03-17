import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { IconButton } from 'react-native-paper';

/**
 * Shared assignee modal (TaskRow style). Used by TaskRow AssigneeCell and TaskDetailModal.
 * Props: visible, onClose, assignees, projectUsers, addingAssigneeId, removingAssigneeId,
 *        onAddAssignee(user), onRemoveAssignee(userId), title (optional, default "Assign Task")
 */
const TaskAssigneeModal = ({
  visible,
  onClose,
  assignees = [],
  projectUsers = [],
  addingAssigneeId,
  removingAssigneeId,
  onAddAssignee,
  onRemoveAssignee,
  title = 'Assign Task',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!visible) return;

    const assignedIds = assignees.map((a) => a.ID || a.id);
    const searchLower = searchQuery.toLowerCase().trim();

    const filtered = projectUsers.filter((user) => {
      const userId = user.ID || user.id;
      if (assignedIds.includes(userId)) return false;
      if (searchLower) {
        const name = (user.display_name || user.name || '').toLowerCase();
        const email = (user.user_email || user.email || '').toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      }
      return true;
    });

    setSearchResults(filtered);
  }, [visible, searchQuery, assignees, projectUsers]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.assigneeModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <IconButton icon="close" size={22} onPress={onClose} />
          </View>

          <ScrollView style={styles.modalBody}>
            {assignees.length > 0 && (
              <>
                <Text style={styles.modalSectionTitle}>
                  Assigned ({assignees.length})
                </Text>
                {assignees.map((assignee) => (
                  <View key={assignee.ID || assignee.id} style={styles.assigneeRow}>
                    <View style={styles.assigneeInfo}>
                      {assignee.image || assignee.avatar_url ? (
                        <Image
                          source={{ uri: assignee.image || assignee.avatar_url }}
                          style={styles.assigneeAvatarLarge}
                        />
                      ) : (
                        <View style={styles.assigneeAvatarLargePlaceholder}>
                          <Text style={styles.assigneeAvatarLargeText}>
                            {(assignee.display_name || assignee.name || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.assigneeTextBlock}>
                        <Text style={styles.assigneeName}>
                          {assignee.display_name || assignee.name || 'User'}
                        </Text>
                        {assignee.user_email ? (
                          <Text style={styles.assigneeEmail}>
                            {assignee.user_email}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {removingAssigneeId === (assignee.ID || assignee.id) ? (
                      <ActivityIndicator size="small" color="#ef4444" />
                    ) : (
                      <TouchableOpacity
                        style={styles.removeAssigneeButton}
                        onPress={() => onRemoveAssignee(assignee.ID || assignee.id)}
                      >
                        <IconButton
                          icon="close"
                          size={16}
                          iconColor="#ef4444"
                          style={styles.removeAssigneeIcon}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                <View style={styles.modalDivider} />
              </>
            )}

            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />

            {searchResults.length > 0 ? (
              <>
                <Text style={styles.modalSectionTitle}>
                  Available Users ({searchResults.length})
                </Text>
                {searchResults.map((user) => (
                  <TouchableOpacity
                    key={user.ID || user.id}
                    style={styles.assigneeResultRow}
                    onPress={() => onAddAssignee(user)}
                    disabled={addingAssigneeId === (user.ID || user.id)}
                  >
                    <View style={styles.assigneeInfo}>
                      {user.image || user.avatar_url ? (
                        <Image
                          source={{ uri: user.image || user.avatar_url }}
                          style={styles.assigneeAvatarLarge}
                        />
                      ) : (
                        <View style={styles.assigneeAvatarLargePlaceholder}>
                          <Text style={styles.assigneeAvatarLargeText}>
                            {(user.display_name || user.name || 'U')
                              .charAt(0)
                              .toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <View style={styles.assigneeTextBlock}>
                        <Text style={styles.assigneeName}>
                          {user.display_name || user.name || 'User'}
                        </Text>
                        {user.user_email ? (
                          <Text style={styles.assigneeEmail}>
                            {user.user_email}
                          </Text>
                        ) : null}
                      </View>
                    </View>
                    {addingAssigneeId === (user.ID || user.id) ? (
                      <ActivityIndicator size="small" color="#ff7a08" />
                    ) : (
                      <IconButton
                        icon="plus"
                        size={20}
                        iconColor="#2563eb"
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </>
            ) : searchQuery.trim() ? (
              <Text style={styles.searchEmpty}>No users found</Text>
            ) : (
              <Text style={styles.searchEmpty}>No available users</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  assigneeModalContent: {
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
    maxHeight: 400,
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
  assigneeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  assigneeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  assigneeAvatarLarge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  assigneeAvatarLargePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  assigneeAvatarLargeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  assigneeTextBlock: {
    flex: 1,
  },
  assigneeName: {
    fontSize: 15,
    color: '#222222',
    fontWeight: '500',
  },
  assigneeEmail: {
    fontSize: 12,
    color: '#777777',
    marginTop: 2,
  },
  removeAssigneeButton: {
    padding: 4,
  },
  removeAssigneeIcon: {
    margin: 0,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333333',
    marginBottom: 8,
  },
  assigneeResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  searchEmpty: {
    fontSize: 13,
    color: '#777777',
    textAlign: 'center',
    padding: 20,
  },
});

export default TaskAssigneeModal;
