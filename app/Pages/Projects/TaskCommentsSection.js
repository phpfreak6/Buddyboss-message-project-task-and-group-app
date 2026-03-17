import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  ActionSheetIOS,
} from 'react-native';
import { IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HtmlRenderer from '@/components/htmlRenderer';
import TaskCommentEditor from '@/components/TaskCommentEditor';

const TaskCommentsSection = ({
  taskComments,
  formatRelativeTime,
  taskData,
  currentUserId,
  onAddComment,
  onUpdateComment,
  onDeleteComment,
  projectId,
  taskId,
  onRefreshComments,
  submittingComment = false,
  onRequestScrollToBottom,
}) => {
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingCommentContent, setEditingCommentContent] = useState('');
  const [editingCommentFiles, setEditingCommentFiles] = useState([]);
  const [deletedFileIds, setDeletedFileIds] = useState([]);
  const [savingEditCommentId, setSavingEditCommentId] = useState(null);
  const [editingEditorReady, setEditingEditorReady] = useState(false);
  const addEditorRef = useRef(null);

  const handleAddCommentSubmit = useCallback(
    (editorData) => {
      const result = onAddComment(editorData);
      Promise.resolve(result).then(
        () => addEditorRef.current?.clearEditor?.(),
        () => {}
      );
    },
    [onAddComment]
  );

  const handleAttachmentPreview = (file, previewUrl) => {
    if (!file?.file_url) return;
    setPreviewAttachment({ url: previewUrl, name: file.file_name || 'Attachment' });
  };

  const handleClosePreview = () => setPreviewAttachment(null);

  const handleEditComment = (comment) => {
    setEditingEditorReady(false);
    setEditingCommentId(comment.id);
    const rawContent =
      comment && typeof comment.content !== 'undefined' && comment.content !== null
        ? String(comment.content)
        : '';
    const decoded = rawContent
      .replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => {
        try {
          return String.fromCodePoint(parseInt(hex, 16));
        } catch {
          return match;
        }
      })
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    setEditingCommentContent(decoded);
    setEditingCommentFiles(comment.files || []);
    setDeletedFileIds([]);
  };

  const showCommentActions = (comment) => {
    if (Platform.OS === 'ios' && ActionSheetIOS.showActionSheetWithOptions) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Edit', 'Delete'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 2,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) handleEditComment(comment);
          else if (buttonIndex === 2) handleDeleteComment(comment.id);
        }
      );
    } else {
      Alert.alert('Comment options', '', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => handleEditComment(comment) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDeleteComment(comment.id) },
      ]);
    }
  };

  const handleSaveEdit = async (commentId, editorData) => {
    if (!projectId || !taskId) {
      setEditingCommentId(null);
      return;
    }
    const content = ((editorData?.content ?? editorData?.htmlContent ?? editingCommentContent) || '').trim();
    const htmlContent = editorData?.htmlContent ?? content;
    const newAttachments = editorData?.attachments || [];
    const mentions = editorData?.mentions || [];
    const hasNewContent = content.length > 0;
    const hasAttachments = newAttachments.length > 0 || editingCommentFiles.length > deletedFileIds.length;
    if (!hasNewContent && !hasAttachments && editingCommentFiles.length <= deletedFileIds.length) {
      setEditingCommentId(null);
      setEditingCommentContent('');
      setEditingCommentFiles([]);
      setDeletedFileIds([]);
      return;
    }
    try {
      setSavingEditCommentId(commentId);
      if (typeof onUpdateComment === 'function') {
        await onUpdateComment(commentId, {
          content: content || htmlContent,
          htmlContent: htmlContent || content,
          mentions,
          attachments: newAttachments,
          files_to_delete: deletedFileIds,
        });
      }
      if (typeof onRefreshComments === 'function') {
        await onRefreshComments();
      }
      setEditingCommentId(null);
      setEditingCommentContent('');
      setEditingCommentFiles([]);
      setDeletedFileIds([]);
      setEditingEditorReady(false);
    } catch (err) {
      console.error('Failed to update comment:', err);
      Alert.alert('Error', 'Failed to update comment. Please try again.');
    } finally {
      setSavingEditCommentId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentContent('');
    setEditingCommentFiles([]);
    setDeletedFileIds([]);
    setEditingEditorReady(false);
  };

  const handleDeleteAttachmentInEdit = (fileId) => {
    setDeletedFileIds((prev) => [...prev, fileId]);
    setEditingCommentFiles((prev) => prev.filter((f) => (f.id || f.attachment_id) !== fileId));
  };

  const handleDeleteComment = (commentId) => {
    if (!projectId || !taskId) return;
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (typeof onDeleteComment === 'function') {
                await onDeleteComment(commentId);
              }
              if (typeof onRefreshComments === 'function') {
                await onRefreshComments();
              }
            } catch (err) {
              console.error('Failed to delete comment:', err);
              Alert.alert('Error', 'Failed to delete comment.');
            }
          },
        },
      ]
    );
  };

  const isOwnComment = (comment) =>
    comment.created_by == currentUserId ||
    comment.creator?.ID == currentUserId ||
    comment.creator?.id == currentUserId;

  const currentUser = taskData?.project_users?.find(
    (u) => (u.ID || u.id) == currentUserId
  );

  return (
    <View style={styles.wrapper}>
      <View style={styles.commentsList}>
        {taskComments && taskComments.length > 0 ? (
          taskComments.map((comment) => (
            <View key={comment.id} style={styles.commentItem}>
              <View style={styles.commentAvatar}>
                {comment.creator?.image || comment.creator?.avatar_url ? (
                  <Image
                    source={{
                      uri: comment.creator.image || comment.creator.avatar_url,
                    }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {(comment.creator?.display_name || comment.creator?.name || 'U')
                        .charAt(0)
                        .toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.commentContent}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentAuthor}>
                    {comment.creator?.display_name || comment.creator?.name || 'User'}
                  </Text>
                  {isOwnComment(comment) && (
                    <TouchableOpacity
                      style={styles.menuTrigger}
                      onPress={() => showCommentActions(comment)}
                      activeOpacity={0.7}
                    >
                      <Icon name="dots-vertical" size={22} color="#5f6368" />
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.commentBody}>
                  {comment.content && typeof comment.content === 'string' && comment.content.trim() !== '' && (
                    <HtmlRenderer message={comment.content} />
                  )}
                </View>
                {comment.files && comment.files.length > 0 && (
                  <View style={styles.attachmentsRow}>
                    {comment.files.map((file, index) => {
                      const url = file.file_url;
                      const name = file.file_name || 'Attachment';
                      const isImage = (file.type || '').toLowerCase() === 'photo' || (file.mime_type || '').startsWith('image/');
                      return (
                        <TouchableOpacity
                          key={file.id || file.attachment_id || index}
                          style={styles.attachmentCard}
                          onPress={() => isImage && url && handleAttachmentPreview(file, url)}
                        >
                          {isImage && url ? (
                            <Image source={{ uri: url }} style={styles.attachmentThumb} resizeMode="cover" />
                          ) : (
                            <View style={styles.attachmentFile}>
                              <IconButton icon="file-document" size={24} iconColor="#5f6368" />
                              <Text style={styles.attachmentName} numberOfLines={1}>{name}</Text>
                            </View>
                          )}
                          {url && (
                            <TouchableOpacity
                              style={styles.downloadBtn}
                              onPress={() => url && Linking.openURL(url)}
                            >
                              <IconButton icon="download" size={18} iconColor="#fff" />
                            </TouchableOpacity>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
                <Text style={styles.commentTime}>
                  {formatRelativeTime(comment.created_at)
                    ? `· ${formatRelativeTime(comment.created_at)}`
                    : ''}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.noComments}>No comments yet</Text>
        )}
      </View>
      <View style={styles.commentEditorContainer}>
        <TaskCommentEditor
          ref={addEditorRef}
          projectUsers={taskData?.project_users || []}
          currentUser={currentUser}
          placeholder="Add a comment"
          onSubmit={handleAddCommentSubmit}
          submitting={submittingComment}
          submitLabel="Comment"
          showAttachments={true}
          onRequestScrollToBottom={onRequestScrollToBottom}
        />
      </View>

      {/* Edit comment popup – includes attachments */}
      <Modal
        visible={!!editingCommentId}
        animationType="slide"
        transparent
        onRequestClose={handleCancelEdit}
      >
        <KeyboardAvoidingView
          style={styles.editModalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View style={styles.editModalContent}>
            <View style={styles.editModalHeader}>
              <Text style={styles.editModalTitle}>Edit comment</Text>
              <TouchableOpacity style={styles.editModalClose} onPress={handleCancelEdit} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                <Icon name="close" size={24} color="#5f6368" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.editModalScroll}
              contentContainerStyle={styles.editModalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {editingCommentFiles.length > 0 && (
                <View style={styles.editAttachmentsRow}>
                  {editingCommentFiles.map((file) => {
                    const url = file.file_url;
                    const name = file.file_name || 'Attachment';
                    const fileId = file.id || file.attachment_id;
                    const isImage = (file.type || '').toLowerCase() === 'photo' || (file.mime_type || '').startsWith('image/');
                    return (
                      <View key={fileId} style={styles.editAttachmentCard}>
                        {isImage && url ? (
                          <Image source={{ uri: url }} style={styles.editAttachmentThumb} resizeMode="cover" />
                        ) : (
                          <View style={styles.editAttachmentFile}>
                            <IconButton icon="file-document" size={24} iconColor="#5f6368" />
                            <Text style={styles.editAttachmentName} numberOfLines={1}>{name}</Text>
                          </View>
                        )}
                        <TouchableOpacity
                          style={styles.editAttachmentRemove}
                          onPress={() => handleDeleteAttachmentInEdit(fileId)}
                        >
                          <IconButton icon="close" size={16} iconColor="#fff" />
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
              <View style={styles.editModalEditorWrap}>
                {!editingEditorReady && (
                  <View style={styles.editModalEditorLoader} pointerEvents="none">
                    <ActivityIndicator size="large" color="#1a73e8" />
                    <Text style={styles.editModalEditorLoaderText}>Loading...</Text>
                  </View>
                )}
                <TaskCommentEditor
                  key={`edit-comment-${editingCommentId}`}
                  projectUsers={taskData?.project_users || []}
                  currentUser={currentUser}
                  placeholder="Edit comment"
                  initialValue={editingCommentContent}
                  onSubmit={(editorData) => handleSaveEdit(editingCommentId, editorData)}
                  onCancel={handleCancelEdit}
                  submitLabel="Save"
                  showAttachments={true}
                  submitting={!!savingEditCommentId}
                  containerStyle={styles.editModalEditorContainer}
                  onEditorReady={() => setEditingEditorReady(true)}
                />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {previewAttachment && (
        <Modal visible={!!previewAttachment} transparent onRequestClose={handleClosePreview}>
          <TouchableOpacity style={styles.previewOverlay} activeOpacity={1} onPress={handleClosePreview}>
            <View style={styles.previewContent}>
              <TouchableOpacity style={styles.previewClose} onPress={handleClosePreview}>
                <IconButton icon="close" size={24} iconColor="#fff" />
              </TouchableOpacity>
              <Image
                source={{ uri: previewAttachment.url }}
                style={styles.previewImage}
                resizeMode="contain"
              />
              {previewAttachment.name ? (
                <Text style={styles.previewTitle}>{previewAttachment.name}</Text>
              ) : null}
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { marginBottom: 16 },
  commentsList: { marginBottom: 16 },
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
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#dadce0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlaceholderText: { fontSize: 14, fontWeight: '500', color: '#5f6368' },
  commentContent: { flex: 1, minWidth: 0 },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
    zIndex: 100,
    elevation: 100,
  },
  commentAuthor: { fontSize: 14, fontWeight: '600', color: '#202124' },
  menuTrigger: {
    padding: 8,
    margin: -8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentBody: { marginBottom: 4 },
  commentTime: { fontSize: 12, color: '#5f6368' },
  noComments: { textAlign: 'center', padding: 20, color: '#9aa0a6', fontSize: 14 },
  editModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  editModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: '85%',
    minHeight: 320,
    overflow: 'visible',
  },
  editModalScroll: { flex: 1, overflow: 'visible' },
  editModalScrollContent: { paddingBottom: 16 },
  editModalEditorWrap: {
    position: 'relative',
    minHeight: 220,
    flexGrow: 1,
    alignSelf: 'stretch',
    overflow: 'visible',
  },
  editModalEditorLoader: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    elevation: 10,
  },
  editModalEditorLoaderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#5f6368',
  },
  editModalEditorContainer: {
    flex: 1,
    minHeight: 200,
  },
  editModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  editModalTitle: { fontSize: 18, fontWeight: '600', color: '#202124' },
  editModalClose: { padding: 4 },
  editRow: { marginTop: 4 },
  editAttachmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  editAttachmentCard: {
    position: 'relative',
    width: 70,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  editAttachmentThumb: { width: '100%', height: '100%' },
  editAttachmentFile: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  editAttachmentName: { fontSize: 10, color: '#5f6368', maxWidth: 70 },
  editAttachmentRemove: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  attachmentCard: {
    width: 70,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dadce0',
  },
  attachmentThumb: { width: '100%', height: '100%' },
  attachmentFile: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 4 },
  attachmentName: { fontSize: 10, color: '#5f6368', maxWidth: 70 },
  downloadBtn: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContent: { position: 'relative', alignItems: 'center' },
  previewClose: { position: 'absolute', top: -40, right: 0, zIndex: 1 },
  previewImage: { width: 300, height: 300 },
  previewTitle: { color: '#fff', marginTop: 8, fontSize: 14 },
});

export default TaskCommentsSection;
