import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconButton } from 'react-native-paper';

const ManageMembersModal = ({
  visible,
  onClose,
  project,
  projectUsers = [],
  currentUser,
  manageSearchQuery,
  setManageSearchQuery,
  manageSearchResults = [],
  isManageSearching,
  addingMemberId,
  removingMemberId,
  onAddUser,
  onRemoveUser,
}) => {
  const createdBy = project?.created_by;

  const renderMemberRow = (u) => {
    const id = u.ID || u.id;
    const isOwner = createdBy != null && String(id) === String(createdBy);
    const isYou = currentUser && String(currentUser.ID || currentUser.id) === String(id);
    const imageUri = u.image || u.avatar_url;
    const displayName = u.display_name || u.name || 'User';
    const email = u.user_email || u.email || '';

    return (
      <View key={id} style={styles.memberRow}>
        <View style={styles.memberInfo}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.memberAvatarLarge} />
          ) : (
            <View style={styles.memberAvatarLargePlaceholder}>
              <Text style={styles.memberAvatarLargeText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.memberTextBlock}>
            <Text style={styles.memberName}>{displayName}</Text>
            {email ? <Text style={styles.memberEmail}>{email}</Text> : null}
          </View>
        </View>
        <View style={styles.memberRight}>
          {isOwner ? (
            <Text style={styles.memberRole}>Owner</Text>
          ) : isYou ? (
            <Text style={styles.memberRole}>You</Text>
          ) : null}
          {!isOwner && (
            removingMemberId === id ? (
              <ActivityIndicator size="small" color="#ef4444" style={{ marginTop: 4 }} />
            ) : (
              <TouchableOpacity
                style={styles.removeMemberButton}
                onPress={() => onRemoveUser(id)}
              >
                <Text style={styles.removeMemberText}>Remove</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    );
  };

  const renderSearchResult = (user) => {
    const id = user.ID || user.id;
    const adding = addingMemberId === id;
    const imageUri = user.image || user.avatar_url;
    const displayName = user.display_name || user.name || 'User';
    const email = user.user_email || user.email;

    return (
      <TouchableOpacity
        key={id}
        style={styles.searchResultRow}
        disabled={adding}
        onPress={() => !adding && onAddUser(user)}
      >
        <View style={styles.memberInfo}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.memberAvatarSmall} />
          ) : (
            <View style={styles.memberAvatarSmallPlaceholder}>
              <Text style={styles.memberAvatarSmallText}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.memberTextBlock}>
            <Text style={styles.memberName}>{displayName}</Text>
            {email ? <Text style={styles.memberEmail}>{email}</Text> : null}
          </View>
        </View>
        {adding ? (
          <ActivityIndicator size="small" color="#ff7a08" style={{ marginLeft: 8 }} />
        ) : (
          <Text style={styles.addMemberText}>Add</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Manage Project Members</Text>
              <IconButton icon="close" size={22} onPress={onClose} />
            </View>

            <ScrollView
              style={styles.modalBody}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContentContainer}
            >
              <Text style={styles.modalSectionTitle}>
                Assigned Members ({projectUsers.length})
              </Text>
              {projectUsers.length > 0 ? (
                projectUsers.map(renderMemberRow)
              ) : (
                <Text style={styles.modalEmptyText}>No members assigned to this project.</Text>
              )}

              <View style={styles.modalDivider} />

              <Text style={styles.modalSectionTitle}>Add Members</Text>
              <View style={styles.searchInputWrapper}>
                <Text style={styles.searchLabel}>Search users to add</Text>
                <View style={styles.searchRow}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Type a name or email..."
                    placeholderTextColor="#999"
                    value={manageSearchQuery}
                    onChangeText={setManageSearchQuery}
                  />
                  {isManageSearching && (
                    <ActivityIndicator size="small" color="#ff7a08" style={{ marginLeft: 8 }} />
                  )}
                </View>
                {manageSearchQuery.trim().length > 0 && (
                  <View style={styles.searchResults}>
                    {isManageSearching ? (
                      <Text style={styles.searchStatusText}>Searching...</Text>
                    ) : manageSearchResults.length > 0 ? (
                      manageSearchResults.map(renderSearchResult)
                    ) : (
                      <Text style={styles.searchStatusText}>No users found.</Text>
                    )}
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
  scrollContentContainer: {
    paddingBottom: 24,
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
    color: '#ff7a08',
    fontWeight: '500',
  },
  searchStatusText: {
    fontSize: 13,
    color: '#777777',
    marginTop: 4,
  },
});

export default ManageMembersModal;
