import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { IconButton } from 'react-native-paper';
import agent from '../../agent';
import FastImage from 'react-native-fast-image';

const NewProjectModal = ({ visible, onClose, categories = [], onProjectCreated }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    assignees: []
  });
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!visible) {
      // Reset form when modal closes
      setFormData({
        title: '',
        description: '',
        category: '',
        assignees: []
      });
      setUserSearchQuery('');
      setError(null);
      setShowUserDropdown(false);
      setCategoryOpen(false);
    }
  }, [visible]);

  useEffect(() => {
    // Prepare category items for dropdown
    if (categories && categories.length > 0) {
      const items = categories.map((category) => ({
        label: category.name || category.title,
        value: category.id || category.category_id,
      }));
      setCategoryItems(items);
    }
  }, [categories]);

  useEffect(() => {
    if (!userSearchQuery.trim()) {
      setSearchResults([]);
      setShowUserDropdown(false);
      return;
    }

    const debounceTimer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await agent.Auth.getUsers(1, 10, userSearchQuery);
        if (response && response.data && response.data.users) {
          const users = response.data.users.users || response.data.users || [];
          const filteredUsers = users.filter(user =>
            !formData.assignees.some(assignee =>
              (assignee.ID || assignee.id) === (user.ID || user.id)
            )
          );
          setSearchResults(filteredUsers);
          setShowUserDropdown(true);
        } else {
          setSearchResults([]);
          setShowUserDropdown(false);
        }
      } catch (err) {
        console.error('Error searching users:', err);
        setSearchResults([]);
        setShowUserDropdown(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [userSearchQuery, formData.assignees]);

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleAddUser = (user) => {
    if (!formData.assignees.some(assignee =>
      (assignee.ID || assignee.id) === (user.ID || user.id)
    )) {
      setFormData(prev => ({
        ...prev,
        assignees: [...prev.assignees, user]
      }));
    }
    setUserSearchQuery('');
    setShowUserDropdown(false);
  };

  const handleRemoveUser = (userId) => {
    setFormData(prev => ({
      ...prev,
      assignees: prev.assignees.filter(assignee =>
        (assignee.ID || assignee.id) !== userId
      )
    }));
  };

  const handleSubmit = async () => {
    setError(null);

    if (!formData.title.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const projectData = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        category: formData.category || undefined,
        assignees: formData.assignees.map(user => user.ID || user.id)
      };

      const response = await agent.Projects.createProject(projectData);

      if (response && response.data) {
        if (onProjectCreated) {
          onProjectCreated(response.data);
        }
        onClose();
      } else {
        setError('Failed to create project. Please try again.');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError(err.message || 'Failed to create project. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Create New Project</Text>
            <IconButton icon="close" size={24} onPress={onClose} />
          </View>

          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContentContainer}
          >
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.formGroup}>
              <Text style={styles.label}>Name of the project *</Text>
              <TextInput
                style={styles.input}
                value={formData.title}
                onChangeText={(value) => handleInputChange('title', value)}
                placeholder="Name of the project"
                editable={!isSubmitting}
                
              />
            </View>

            <View style={[styles.formGroup, { zIndex: 3000 }]}>
              <Text style={styles.label}>Project Category</Text>
              <View style={styles.categoryPickerWrapper}>
                <DropDownPicker
                  open={categoryOpen}
                  value={formData.category}
                  items={categoryItems}
                  setOpen={setCategoryOpen}
                  setValue={(callback) => {
                    const value = typeof callback === 'function' ? callback(formData.category) : callback;
                    handleInputChange('category', value || '');
                  }}
                  setItems={setCategoryItems}
                  placeholder="- Project Category -"
                  listMode="SCROLLVIEW"
                  style={styles.dropdownPicker}
                  dropDownContainerStyle={styles.dropdownPickerContainer}
                  textStyle={styles.dropdownPickerText}
                  labelStyle={styles.dropdownPickerLabel}
                  selectedItemLabelStyle={styles.dropdownPickerSelectedLabel}
                  placeholderStyle={styles.dropdownPickerPlaceholder}
                  arrowIconStyle={styles.dropdownPickerArrow}
                  tickIconStyle={styles.dropdownPickerTick}
                  closeAfterSelecting={true}
                  zIndex={5000}
                  zIndexInverse={1000}
                />
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Some details about the project (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.description}
                onChangeText={(value) => handleInputChange('description', value)}
                placeholder="Some details about the project (optional)"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Search users...</Text>
              <View style={styles.userSearchWrapper}>
                <TextInput
                  style={styles.input}
                  value={userSearchQuery}
                  onChangeText={setUserSearchQuery}
                  placeholder="Search users..."
                  editable={!isSubmitting}
                />
                {showUserDropdown && (
                  <View style={styles.userDropdown}>
                    {isSearching ? (
                      <View style={styles.searchLoading}>
                        <ActivityIndicator size="small" color="#ff7a08" />
                        <Text style={styles.searchLoadingText}>Searching...</Text>
                      </View>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((user) => (
                        <TouchableOpacity
                          key={user.ID || user.id}
                          style={styles.userSearchItem}
                          onPress={() => handleAddUser(user)}
                        >
                          {user.image ? (
                            <FastImage source={{ uri: user.image }} style={styles.userAvatar} />
                          ) : (
                            <View style={styles.userAvatarPlaceholder}>
                              <Text style={styles.userAvatarText}>
                                {(user.display_name || user.name || 'U').charAt(0).toUpperCase()}
                              </Text>
                            </View>
                          )}
                          <Text style={styles.userName}>{user.display_name || user.name || 'User'}</Text>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.searchEmpty}>No users found</Text>
                    )}
                  </View>
                )}
              </View>

              {formData.assignees.length > 0 && (
                <View style={styles.selectedUsers}>
                  {formData.assignees.map((user) => (
                    <View key={user.ID || user.id} style={styles.selectedUserTag}>
                      {user.image ? (
                        <FastImage source={{ uri: user.image }} style={styles.selectedUserAvatar} />
                      ) : (
                        <View style={styles.selectedUserAvatarPlaceholder}>
                          <Text style={styles.selectedUserAvatarText}>
                            {(user.display_name || user.name || 'U').charAt(0).toUpperCase()}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.selectedUserName}>{user.display_name || user.name || 'User'}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveUser(user.ID || user.id)}
                        disabled={isSubmitting}
                      >
                        <IconButton icon="close" size={16} iconColor="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.submitButton, (!formData.title.trim() || isSubmitting) && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>Create Project</Text>
              )}
            </TouchableOpacity>
          </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    maxHeight: 500,
  },
  scrollContentContainer: {
    paddingBottom: 24,
  },
  formGroup: {
    padding: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  categoryPickerWrapper: {
    zIndex: 3000,
    position: 'relative',
  },
  dropdownPicker: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    minHeight: 44,
  },
  dropdownPickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginTop: 5,
    // Ensure the dropdown appears above other modal content
    zIndex: 4000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownPickerText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPickerLabel: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPickerSelectedLabel: {
    fontWeight: '600',
    color: '#333',
  },
  dropdownPickerPlaceholder: {
    color: '#999',
  },
  dropdownPickerArrow: {
    width: 20,
    height: 20,
  },
  dropdownPickerTick: {
    width: 20,
    height: 20,
  },
  userSearchWrapper: {
    position: 'relative',
  },
  userDropdown: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginTop: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  userSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  userName: {
    fontSize: 16,
    color: '#333',
  },
  searchLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  searchLoadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  searchEmpty: {
    padding: 20,
    textAlign: 'center',
    color: '#666',
  },
  selectedUsers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  selectedUserTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  selectedUserAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  selectedUserAvatarText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedUserName: {
    fontSize: 14,
    color: '#1976d2',
    marginRight: 4,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    margin: 15,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  submitButton: {
    backgroundColor: '#ff7a08',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default NewProjectModal;
