import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import DropDownPicker from 'react-native-dropdown-picker';

const EditProjectModal = ({
  visible,
  onClose,
  formData,
  setFormData,
  categories = [],
  saving,
  onSubmit,
}) => {
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState([]);

  useEffect(() => {
    if (categories && categories.length > 0) {
      const items = categories.map(category => ({
        label: category.name || category.title,
        value: category.id || category.category_id,
      }));
      setCategoryItems(items);
    } else {
      setCategoryItems([]);
    }
  }, [categories]);

  const disabled = saving || !formData.title.trim();

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
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
              <Text style={styles.modalTitle}>Edit Project</Text>
              <IconButton icon="close" size={24} onPress={onClose} />
            </View>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContentContainer}
            >
              <View style={styles.formGroup}>
                <Text style={styles.label}>Name of the project *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.title}
                  onChangeText={value => handleInputChange('title', value)}
                  placeholder="Name of the project"
                  editable={!saving}
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
                    setValue={callback => {
                      const value =
                        typeof callback === 'function'
                          ? callback(formData.category)
                          : callback;
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
                    closeAfterSelecting
                    zIndex={5000}
                    zIndexInverse={1000}
                    disabled={saving}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>
                  Some details about the project (optional)
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={value =>
                    handleInputChange('description', value)
                  }
                  placeholder="Some details about the project (optional)"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!saving}
                />
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  (disabled || saving) && styles.submitButtonDisabled,
                ]}
                onPress={onSubmit}
                disabled={disabled}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>Update Project</Text>
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
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
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

export default EditProjectModal;
