import React, { useState, useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { IconButton } from 'react-native-paper';

/**
 * Inline "Write a task name" row at the bottom of each section.
 * On focus, opens a modal to add the task. Shows loader on Add; modal hides only after successful save.
 */
const DefaultTaskInputRow = ({ onSave }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef(null);

  const openModal = () => {
    setModalVisible(true);
    setTitle('');
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setModalVisible(false);
    setTitle('');
    inputRef.current?.blur?.();
  };

  const handleSubmit = async () => {
    if (!title.trim() || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const result = onSave?.({ title: title.trim() });
      if (result != null && typeof result.then === 'function') {
        await result;
      }
      setModalVisible(false);
      setTitle('');
    } catch (e) {
      // Leave modal open on error; user can retry or cancel
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <View style={styles.row}>
        <View style={styles.nameCol}>
          <View style={styles.nameInner}>
            <View style={styles.bulletWrapper}>
              <IconButton
                icon="checkbox-blank-circle-outline"
                size={16}
                iconColor="#bdbdbd"
                style={styles.bulletIcon}
              />
            </View>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value=""
              editable={false}
              placeholder="Write a task name"
              placeholderTextColor="#9e9e9e"
              onFocus={openModal}
              showSoftInputOnFocus={false}
            />
            <TouchableOpacity style={styles.inputTouchable} onPress={openModal} activeOpacity={1} />
          </View>
        </View>
        <View style={styles.actionsCol}>
          {/* <TouchableOpacity onPress={openModal}>
            <IconButton
              icon="arrow-right"
              size={18}
              iconColor="#ff7a08"
            />
          </TouchableOpacity> */}
        </View>
      </View>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
          disabled={isSubmitting}
        >
          <KeyboardAvoidingView
            style={styles.modalKeyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add task</Text>
                <IconButton icon="close" size={24} onPress={closeModal} disabled={isSubmitting} />
              </View>
              <View style={styles.modalBody}>
                <Text style={styles.modalLabel}>Task name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={title}
                  onChangeText={setTitle}
                  placeholder="Write a task name"
                  placeholderTextColor="#9e9e9e"
                  onSubmitEditing={handleSubmit}
                  returnKeyType="done"
                  autoFocus
                />
              </View>
              <View style={styles.modalFooter}>
                <TouchableOpacity style={styles.cancelButton} onPress={closeModal} disabled={isSubmitting}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.addButton, (!title.trim() || isSubmitting) && styles.addButtonDisabled]}
                  onPress={handleSubmit}
                  disabled={!title.trim() || isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.addButtonText}>Add</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopColor: '#eee',
  },
  nameCol: {
    flex: 4,
    paddingRight: 8,
  },
  assigneeCol: {
    flex: 1,
  },
  dueCol: {
    flex: 1.2,
  },
  priorityCol: {
    flex: 1,
  },
  actionsCol: {
    width: 36,
    alignItems: 'flex-end',
  },
  nameInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bulletWrapper: {
    marginRight: 4,
  },
  bulletIcon: {
    margin: 0,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    paddingVertical: 6,
  },
  inputTouchable: {
    ...StyleSheet.absoluteFillObject,
    left: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalKeyboardView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202124',
  },
  modalBody: {
    padding: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#ff7a08',
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addButtonDisabled: {
    backgroundColor: '#ccc',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default DefaultTaskInputRow;

