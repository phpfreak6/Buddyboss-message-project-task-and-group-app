import { NODE_BACKEND } from '@env';
import React, { useState, useEffect, useRef, Fragment } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Dimensions, Modal, KeyboardAvoidingView, Platform, Linking, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { connect } from 'react-redux';
import FastImage from 'react-native-fast-image';
import VideoPlayer from '@/components/Video';
import HTMLContentViewer from './HTMLContentViewer';
import CommentInputBar from '@/components/CommentInputBarWeb';
import agent from '@/agent';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_ROOT = NODE_BACKEND;

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
});

const mapDispatchToProps = dispatch => ({
});

const CommentScreen = ({ currentUser }) => {
  const route = useRoute();
  const navigation = useNavigation();
  const { groupId, activityId } = route.params;
  const [activity, setActivity] = useState({
    id: null,
    likes: 0,
    liked_users: [],
    user: {
      display_name: '',
      avatar_url: ''
    },
    content: '',
    attachments: [],
    date_recorded: '',
    comment_count: 0
  });
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingComment, setSendingComment] = useState(false);
  const [error, setError] = useState(null);
  const [likingActivity, setLikingActivity] = useState(null);
  const currentUserId = currentUser?.user?.id;
  const [message, setMessage] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [showKeyword, setShowKeyword] = useState(false);
  const [imageLoadProgress, setImageLoadProgress] = useState({});
  const commentInputRef = useRef(null);
  const [showLikedUsers, setShowLikedUsers] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);

  useEffect(() => {
    if (groupId && activityId) {
      fetchActivityData();
      fetchComments();
    }
  }, [groupId, activityId]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!groupId || !activityId) {
        throw new Error('Group ID and Activity ID are required');
      }

      const response = await agent.Groups.getFeedById(groupId, activityId);

      console.log(JSON.stringify(response,null,2));

      if (response?.data?.id) {
        setActivity(response?.data);
        
      }else{
        throw new Error(response?.message || 'Failed to fetch activity data');
      }
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching activity data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!groupId || !activityId) {
        throw new Error('Group ID and Activity ID are required');
      }

      const response = await agent.Groups.getGroupFeedComments(groupId, activityId);

      if (!response?.isSuccess) {
        throw new Error(response?.message || 'Failed to fetch comments');
      }

      // Transform the comments data to match our expected format
      const transformedComments = response.data.map(comment => ({
        id: comment.id,
        content: comment.content,
        date_recorded: comment.date_recorded,
        user: {
          id: comment.user.ID,
          display_name: comment.user.display_name,
          avatar_url: comment.user.avatar_url
        },
        attachments: comment.attachments || []
      }));

      setComments(transformedComments);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLikePress = async () => {
    if (!activity?.id) return;
    try {
      setLikingActivity(activity.id);
      const response = await agent.Groups.likeGroupFeed(groupId, activity.id);
      
      if (response?.data?.status) {
        // Update the activity with new like status
        const hasUserLiked = response.data.status === 'liked';
        const updatedLikedUsers = hasUserLiked
          ? [...(activity.liked_users || []), {
              user_id: currentUserId,
              display_name: currentUser.user.display_name,
              avatar_url: currentUser.user.image
            }]
          : (activity.liked_users || []).filter(user => user.user_id !== currentUserId);
        
        setActivity(prevActivity => ({
          ...prevActivity,
          likes: hasUserLiked ? (prevActivity.likes || 0) + 1 : (prevActivity.likes || 0) - 1,
          liked_users: updatedLikedUsers
        }));
      }
    } catch (error) {
      console.error('Error updating like:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLikingActivity(null);
    }
  };

  const handleSendComment = async (data) => {
    try {
      setSendingComment(true);

      const formData = new FormData();

      // Append the content (Quill HTML content)
      formData.append('content', data.message);

      // Append images
      if (data.images && data.images.length > 0) {
        data.images.forEach(image => {
          formData.append('images', {
            uri: image.uri,
            type: image.type,
            name: image.fileName,
          });
        });
      }

      // Append videos
      if (data.videos && data.videos.length > 0) {
        data.videos.forEach(video => {
          formData.append('videos', {
            uri: video.uri,
            type: video.type,
            name: video.fileName,
          });
        });
      }

      // Append documents
      if (data.documents && data.documents.length > 0) {
        const flatDocuments = data.documents.flat();
        flatDocuments.forEach(document => {
          formData.append('documents', {
            uri: document.uri,
            type: document.type,
            name: document.name,
          });
        });
      }

      let token = await AsyncStorage.getItem('jwt');
      const url = `/groups/addGroupFeedComment/${groupId}/${activityId}`;

      const response = await fetch(`${API_ROOT}${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const responseData = await response.json();

      if (responseData?.data?.comment_id) {
        await fetchActivityData();
        await fetchComments();
      } else {
        Alert.alert('Error', responseData?.message || 'Failed to add comment. Please try again.');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      Alert.alert('Error', 'An error occurred while adding the comment.');
    } finally {
      setSendingComment(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    const diffInMonths = Math.floor(diffInDays / 30);
    const diffInYears = Math.floor(diffInMonths / 12);

    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 30) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else if (diffInMonths < 12) {
      return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
    }
  };

  const getActivityContext = (activity) => {
    switch (activity.type) {
      case 'activity_update':
        return 'posted an update';
      case 'joined_group':
        return 'joined the group';
      default:
        return 'performed an action';
    }
  };

  const renderAttachments = (attachments) => {
    if (!attachments || attachments.length === 0) return null;

    // Separate images from other attachments
    const images = attachments.filter(attachment => attachment.type === 'photo');
    const otherAttachments = attachments.filter(attachment => attachment.type !== 'photo');

    return (
      <View style={styles.attachmentContainer}>
        {/* Image Gallery Grid */}
        {images.length > 0 && (
          <View style={styles.imageGalleryContainer}>
            {images.map((attachment, index) => (
              <TouchableOpacity
                key={`photo-${attachment.id}-${index}`}
                onPress={() => handleImagePress(attachment.finalPath)}
                style={[
                  styles.imageGalleryItem,
                  images.length === 1 && styles.singleImage,
                  images.length === 2 && styles.twoImages,
                  images.length === 3 && index === 0 && styles.threeImagesFirst,
                  images.length === 3 && index > 0 && styles.threeImagesOther,
                  images.length > 3 && index === 0 && styles.fourPlusImagesFirst,
                  images.length > 3 && index > 0 && styles.fourPlusImagesOther,
                ]}
              >
                <View style={styles.attachmentImageContainer}>
                  <FastImage
                    source={{ uri: attachment.finalPath }}
                    style={styles.galleryImage}
                    onLoadStart={() => setImageLoadProgress(prev => ({...prev, [`attachment-${attachment.id}-${index}`]: 0}))}
                    onProgress={({ nativeEvent }) => {
                      const progress = nativeEvent.loaded / nativeEvent.total;
                      setImageLoadProgress(prev => ({...prev, [`attachment-${attachment.id}-${index}`]: progress}));
                    }}
                    onLoadEnd={() => setImageLoadProgress(prev => ({...prev, [`attachment-${attachment.id}-${index}`]: 1}))}
                  />
                  {imageLoadProgress[`attachment-${attachment.id}-${index}`] < 1 && (
                    <View style={styles.progressOverlay}>
                      <ActivityIndicator size="small" color="#0000ff" />
                    </View>
                  )}
                  {images.length > 3 && index === 2 && (
                    <View style={styles.remainingImagesOverlay}>
                      <Text style={styles.remainingImagesText}>+{images.length - 3}</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Other Attachments (Videos and Documents) */}
        {otherAttachments.map((attachment, index) => {
          if (attachment.type === 'video') {
            return (
              <View key={`video-${attachment.id}-${index}`} style={styles.videoContainer}>
                <VideoPlayer source={attachment.finalPath} style={styles.attachmentVideo} />
              </View>
            );
          } else {
            return (
              <View key={`document-${attachment.id}-${index}`} style={styles.documentContainer}>
                <Text style={styles.documentText} numberOfLines={1} ellipsizeMode="tail">
                  Document: {attachment.title || 'Unnamed Document'}
                </Text>
                <TouchableOpacity onPress={() => handleDownloadDocument(attachment.finalPath)}>
                  <Text style={styles.downloadButton}>Download</Text>
                </TouchableOpacity>
              </View>
            );
          }
        })}
      </View>
    );
  };

  const renderComments = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#122b46" />
          <Text style={styles.loadingText}>Loading comments...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchComments}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (comments.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="comment-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No comments yet</Text>
          <Text style={styles.emptySubText}>Be the first to comment!</Text>
        </View>
      );
    }

    return (
      <View style={styles.commentsContainer}>
        {comments.map(comment => (
          <View key={comment.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Image source={{ uri: comment.user.avatar_url }} style={styles.commentAvatar} />
              <View style={styles.commentUserInfo}>
                <Text style={styles.commentUser}>{comment.user.display_name}</Text>
                <Text style={styles.commentTime}>{formatDate(comment.date_recorded)}</Text>
              </View>
            </View>
            <View style={styles.commentContent}>
              {comment.content ? (
                <View style={styles.commentTextContainer}>
                  <HTMLContentViewer content={comment.content} />
                </View>
              ) : null}
              {comment.attachments && comment.attachments.length > 0 && (
                <View style={styles.commentAttachments}>
                  {/* Separate images from other attachments */}
                  {(() => {
                    const images = comment.attachments.filter(attachment => attachment.type === 'photo');
                    const otherAttachments = comment.attachments.filter(attachment => attachment.type !== 'photo');

                    return (
                      <>
                        {/* Image Gallery Grid */}
                        {images.length > 0 && (
                          <View style={styles.imageGalleryContainer}>
                            {images.map((attachment, index) => (
                              <TouchableOpacity
                                key={`comment-photo-${attachment.id}-${index}`}
                                onPress={() => handleImagePress(attachment.finalPath)}
                                style={[
                                  styles.imageGalleryItem,
                                  images.length === 1 && styles.singleImage,
                                  images.length === 2 && styles.twoImages,
                                  images.length === 3 && index === 0 && styles.threeImagesFirst,
                                  images.length === 3 && index > 0 && styles.threeImagesOther,
                                  images.length > 3 && index === 0 && styles.fourPlusImagesFirst,
                                  images.length > 3 && index > 0 && styles.fourPlusImagesOther,
                                ]}
                              >
                                <View style={styles.attachmentImageContainer}>
                                  <FastImage
                                    source={{ uri: attachment.finalPath }}
                                    style={styles.galleryImage}
                                    onLoadStart={() => setImageLoadProgress(prev => ({...prev, [`comment-${attachment.id}-${index}`]: 0}))}
                                    onProgress={({ nativeEvent }) => {
                                      const progress = nativeEvent.loaded / nativeEvent.total;
                                      setImageLoadProgress(prev => ({...prev, [`comment-${attachment.id}-${index}`]: progress}));
                                    }}
                                    onLoadEnd={() => setImageLoadProgress(prev => ({...prev, [`comment-${attachment.id}-${index}`]: 1}))}
                                  />
                                  {imageLoadProgress[`comment-${attachment.id}-${index}`] < 1 && (
                                    <View style={styles.progressOverlay}>
                                      <ActivityIndicator size="small" color="#0000ff" />
                                    </View>
                                  )}
                                  {images.length > 3 && index === 2 && (
                                    <View style={styles.remainingImagesOverlay}>
                                      <Text style={styles.remainingImagesText}>+{images.length - 3}</Text>
                                    </View>
                                  )}
                                </View>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}

                        {/* Other Attachments (Videos and Documents) */}
                        {otherAttachments.map((attachment, index) => {
                          if (attachment.type === 'video') {
                            return (
                              <View key={`comment-video-${attachment.id}-${index}`} style={styles.videoContainer}>
                                <VideoPlayer source={attachment.finalPath} style={styles.attachmentVideo} />
                              </View>
                            );
                          } else {
                            return (
                              <View key={`comment-document-${attachment.id}-${index}`} style={styles.documentContainer}>
                                <Text style={styles.documentText} numberOfLines={1} ellipsizeMode="tail">
                                  Document: {attachment.title || 'Unnamed Document'}
                                </Text>
                                <TouchableOpacity onPress={() => handleDownloadDocument(attachment.finalPath)}>
                                  <Text style={styles.downloadButton}>Download</Text>
                                </TouchableOpacity>
                              </View>
                            );
                          }
                        })}
                      </>
                    );
                  })()}
                </View>
              )}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const hasUserLiked = activity?.liked_users?.some(user => user.user_id === currentUserId);

  const LikedUsers = ({ users, onPress }) => {
    if (!users || users.length === 0) return null;

    // Sort users to put current user first
    const sortedUsers = [...users].sort((a, b) => {
      if (a.user_id === currentUserId) return -1;
      if (b.user_id === currentUserId) return 1;
      return 0;
    });

    const displayUsers = sortedUsers.slice(0, 2);
    const remainingCount = users.length - 2;

    const renderUserName = (user) => {
      const isCurrentUser = user.user_id === currentUserId;
      return (
        <Text 
          key={user.user_id}
          style={styles.likedUserName}
        >
          {isCurrentUser ? 'You' : user.display_name}
        </Text>
      );
    };

    return (
      <TouchableOpacity onPress={onPress} style={styles.likedUsersContainer}>
        <Text style={styles.likedUsersText}>
          Liked by{' '}
          {displayUsers.map((user, index) => (
            <React.Fragment key={user.user_id}>
              {renderUserName(user)}
              {index < displayUsers.length - 1 ? ', ' : ''}
            </React.Fragment>
          ))}
          {remainingCount > 0 && (
            <Text style={styles.remainingCount}> and {remainingCount} others</Text>
          )}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleLikedUsersPress = (activity) => {
    setSelectedActivity(activity);
    setShowLikedUsers(true);
  };

  const renderLikedUsersModal = () => {
    if (!showLikedUsers || !selectedActivity) return null;

    return (
      <Modal
        visible={showLikedUsers}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowLikedUsers(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Liked by</Text>
              <TouchableOpacity 
                onPress={() => setShowLikedUsers(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScrollView}>
              {selectedActivity.liked_users.map((user) => (
                <View key={user.user_id} style={styles.likedUserItem}>
                  <Image 
                    source={{ uri: user.avatar_url }} 
                    style={styles.likedUserAvatar} 
                  />
                  <Text style={styles.likedUserName}>
                    {user.user_id === currentUserId ? 'You' : user.display_name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const handleImagePress = (uri) => {
    setSelectedImage(uri);
    setImageModalVisible(true);
  };

  const handleCloseModal = () => {
    setImageModalVisible(false);
    setSelectedImage(null);
  };

  const handleDownloadDocument = (document) => {
    Linking.openURL(document);
  };

  const handleDownload = () => {
    if (selectedImage) {
      Linking.openURL(selectedImage);
    }
  };

  const renderFeed = () => {
    if (!activity) return null;

    return (
      <View style={styles.feedCard}>
        <View style={styles.feedHeader}>
          <Image 
            source={{ uri: activity.user?.avatar_url || 'https://via.placeholder.com/40' }} 
            style={styles.feedAvatar} 
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.feedUser}>
              <Text style={{ fontWeight: 'bold' }}>{activity.user?.display_name || 'Unknown User'}</Text> {getActivityContext(activity)}
            </Text>
            <Text style={styles.feedTime}>{formatDate(activity.date_recorded)}</Text>
          </View>
        </View>
        {activity.content ? (
          <View style={{ padding: 10 }}>
            <HTMLContentViewer content={activity.content} />
          </View>
        ) : null}
        {renderAttachments(activity.attachments || [])}
        <View style={styles.feedLikesections}>
          {activity.liked_users && activity.liked_users.length > 0 && (
            <LikedUsers 
              users={activity.liked_users} 
              onPress={() => handleLikedUsersPress(activity)}
            />
          )}
          <View style={styles.feedActions}>
            <TouchableOpacity 
              style={styles.feedActionBtn}
              onPress={handleLikePress}
              disabled={likingActivity === activity.id}
            >
              {likingActivity === activity.id ? (
                <ActivityIndicator size="small" color="#888" />
              ) : (
                <>
                  <Icon 
                    name={hasUserLiked ? "heart" : "heart-outline"} 
                    size={20} 
                    color={hasUserLiked ? "#ff4444" : "#888"} 
                  />
                  <Text style={[
                    styles.feedActionText,
                    hasUserLiked && { color: "#000" }
                  ]}>
                    {activity.likes > 0 ? `${activity.likes} Like${activity.likes !== 1 ? 's' : ''}` : 'Like'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.feedActionBtn}
              onPress={() => {
                commentInputRef.current?.focus();
              }}
            >
              <Icon name="comment-outline" size={20} color="#888" />
              <Text style={styles.feedActionText}>
                {activity.comment_count > 0 ? `${activity.comment_count} Comment${activity.comment_count !== 1 ? 's' : ''}` : 'Comment'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#122b46" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchActivityData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!activity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Activity not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.headerContainer, { backgroundColor: '#fff', justifyContent: 'flex-start', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Icon name="arrow-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#000', textAlign: 'left', marginLeft: 4, flex: 1 }]}>Back</Text>
          <View style={styles.headerIconBtn} />
        </View>

        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollViewContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Original Post */}
            {renderFeed()}

            {/* Comments Section */}
            {renderComments()}
          </ScrollView>

          {/* Comment Input */}
          <CommentInputBar 
            onSend={handleSendComment} 
            groupId={groupId} 
            ref={commentInputRef}
            sending={sendingComment}
          />
        </View>

        {renderLikedUsersModal()}
        
        {/* Image Modal */}
        <Modal visible={imageModalVisible} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeText}>✖</Text>
            </TouchableOpacity>
            {selectedImage && (
              <Fragment>
                <Image source={{ uri: selectedImage }} style={styles.fullScreenImage} resizeMode="contain" />
                <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                  <Text style={styles.downloadText}>Download</Text>
                </TouchableOpacity>
              </Fragment>
            )}
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f6f6f6',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#122b46',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
    elevation: 2,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  feedCard: {
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
    padding: 5,
  },
  feedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  feedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#eee',
  },
  feedUser: {
    color: '#222',
    fontSize: 14,
  },
  feedTime: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  feedActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 12,
    paddingTop: 8,
    paddingBottom: 4,
    width: '100%',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  feedActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    textAlign: 'center',
    width: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedActionText: {
    color: '#888',
    fontSize: 15,
    marginLeft: 6,
  },
  attachmentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: "100%",
    gap: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  imageGalleryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    gap: 4,
  },
  imageGalleryItem: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  singleImage: {
    width: '100%',
    aspectRatio: 1,
  },
  twoImages: {
    width: '48%',
    aspectRatio: 1,
  },
  threeImagesFirst: {
    width: '100%',
    aspectRatio: 2,
  },
  threeImagesOther: {
    width: '48%',
    aspectRatio: 1,
  },
  fourPlusImagesFirst: {
    width: '100%',
    aspectRatio: 2,
  },
  fourPlusImagesOther: {
    width: '48%',
    aspectRatio: 1,
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  remainingImagesOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingImagesText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  videoContainer: {
    width: '100%',
    marginVertical: 8,
  },
  attachmentVideo: {
    width: '100%',
    height: 280,
    borderRadius: 12,
    backgroundColor: "#f5f5f5",
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  documentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  documentPreview: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  documentText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 12,
  },
  commentsContainer: {
    padding: 12,
    marginBottom: 50,
  },
  commentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  commentUserInfo: {
    flex: 1,
  },
  commentUser: {
    fontWeight: '600',
    fontSize: 15,
    color: '#222',
    marginBottom: 2,
  },
  commentTime: {
    fontSize: 12,
    color: '#888',
  },
  commentContent: {
    marginLeft: 52,
  },
  commentTextContainer: {
    marginBottom: 12,
  },
  commentAttachments: {
    marginTop: 8,
  },
  commentImageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  commentImage: {
    width: '100%',
    height: '100%',
  },
  commentVideoContainer: {
    width: '100%',
    marginBottom: 8,
  },
  commentVideo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
  },
  commentDocumentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentDocumentText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 12,
  },
  commentDownloadButton: {
    color: '#122b46',
    fontSize: 14,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: '#f6c343',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
    textAlign: 'center',
  },
  feedLikesections: {
    marginTop: 12,
    marginBottom: 8,
  },
  likedUsersContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 12,
  },
  likedUsersText: {
    fontSize: 14,
    color: '#666',
  },
  likedUserName: {
    color: '#122b46',
    fontWeight: '500',
  },
  remainingCount: {
    color: '#122b46',
    fontWeight: '500',
  },
  downloadButton: {
    backgroundColor: '#122b46',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#122b46',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    color: '#fff',
  },
  downloadText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 16,
  },
  likedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  likedUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  likedUserName: {
    fontSize: 16,
    color: '#222',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '90%',
    height: '80%',
  },
  closeText: {
    fontSize: 30,
    color: 'white',
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(CommentScreen); 