import React, { useState, useEffect, Fragment } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, ActivityIndicator, Modal, Dimensions, Alert, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRoute, useFocusEffect } from '@react-navigation/native';
import agent from '@/agent';
import { MembersScreen } from './GroupMenu';
import { connect } from 'react-redux';
import FastImage from 'react-native-fast-image';
import VideoPlayer from '@/components/Video';
import HTMLContentViewer from './HTMLContentViewer';
import PageLoader from '@/components/PageLoader';

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
});

const mapDispatchToProps = dispatch => ({
});

// Static menu configuration with status flags
const MENU_CONFIG = [
  { 
    id: 'feed',
    label: 'Feed',
    icon: 'newspaper',
    statusKey: 'feed_status'
  },
  { 
    id: 'members',
    label: 'Members',
    icon: 'account-group-outline',
    statusKey: 'member_status'
  },
  { 
    id: 'photos',
    label: 'Photos',
    icon: 'image-multiple-outline',
    statusKey: 'photo_status'
  },
  { 
    id: 'videos',
    label: 'Videos',
    icon: 'video-outline',
    statusKey: 'video_status'
  },
  // { 
  //   id: 'albums',
  //   label: 'Albums',
  //   icon: 'image-album',
  //   statusKey: 'album_status'
  // },
  // { 
  //   id: 'documents',
  //   label: 'Documents',
  //   icon: 'file-document',
  //   statusKey: 'document_status'
  // },
  { 
    id: 'send_messages',
    label: 'Send Messages',
    icon: 'email-outline',
    statusKey: 'message_status'
  },
  { 
    id: 'send_invites',
    label: 'Send Invites',
    icon: 'email-send-outline',
    statusKey: 'invite_status'
  },
  { 
    id: 'group_courses',
    label: 'Courses',
    icon: 'school-outline',
    statusKey: 'course_status'
  },
  { 
    id: 'projects',
    label: 'Projects',
    icon: 'briefcase-outline',
    statusKey: 'project_status'
  },
  { 
    id: 'manage',
    label: 'Manage',
    icon: 'cog-outline',
    statusKey: 'manage_status'
  }
];


const SingleGroup = ({ navigation, currentUser }) => {
  const route = useRoute();
  const [activeMenu, setActiveMenu] = useState('feed');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupData, setGroupData] = useState(null);
  const [menuCounts, setMenuCounts] = useState({});
  const [feedData, setFeedData] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showLikedUsers, setShowLikedUsers] = useState(false);
  const [likingActivity, setLikingActivity] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedActivityForDelete, setSelectedActivityForDelete] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [selectedActivityForDropdown, setSelectedActivityForDropdown] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [imageLoadProgress, setImageLoadProgress] = useState({});
  const [selectedContent, setSelectedContent] = useState(null);
  const [showHTMLViewer, setShowHTMLViewer] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const currentUserId = currentUser?.user?.id;

  const groupId = route.params?.groupId;

  const canInviteMembers = () => {
    if (!groupData?.meta_data || !groupData?.role) return false;

    const { invite_status } = groupData.meta_data;
    const { is_admin, is_mod } = groupData.role;

    if (invite_status === 'members' && groupData.role) {
      return true;
    } else if (invite_status === 'admins' && groupData.role && (is_admin === 1 || is_mod === 1)) {
      return true;
    } else if (invite_status === 'mods' && groupData.role && (is_admin === 1 || is_mod === 1)) {
      return true;
    }

    return false;
  };
  const canMembers = (meta_key) => {
    if (!groupData?.meta_data || !groupData?.role) return false;

    const meta_value = groupData.meta_data?.[meta_key];
    const { is_admin, is_mod } = groupData.role;

    if (meta_value === 'members' && groupData.role) {
      return true;
    } else if (meta_value === 'admins' && groupData.role && (is_admin === 1 || is_mod === 1)) {
      return true;
    } else if (meta_value === 'mods' && groupData.role && (is_admin === 1 || is_mod === 1)) {
      return true;
    }

    return false;
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchGroupData();
      fetchFeedData(true);
    }, [])
  );

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!groupId) {
        throw new Error('Group ID is required');
      }

      // Fetch group data using agent API
      const response = await agent.Groups.getdetails(groupId);

      console.log(JSON.stringify(response,null,2));
      
      if (response?.failed) {
        throw new Error(response.error?.message || 'Failed to fetch group data');
      }

      const data = response?.data?.group || {};
      setGroupData(data);

      // Update menu counts based on fetched data
      const counts = {
        feed: data.feed?.length || 0,
        members: data.members?.length || 0,
        photos: data.photos?.length || 0,
        videos: data.videos?.length || 0,
        albums: data.albums?.length || 0,
        documents: data.documents?.length || 0,
        projects: data.projects?.length || 0
      };
      setMenuCounts(counts);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching group data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeedData = async (reset = false) => {
    try {
      setFeedLoading(reset);
      setFeedError(null);
      
      if (!groupId) {
        throw new Error('Group ID is required');
      }

      let pageToFetch = reset ? 1 : feedPage;
      let size = 10;

      const response = await agent.Groups.getGroupFeed(groupId, pageToFetch, size);

      //console.log(JSON.stringify(response,null,2));
      
      if (response?.failed) {
        throw new Error(response.error?.message || 'Failed to fetch feed data');
      }

      const feedItems = response?.data?.activities || [];
      const pagination = response?.data?.pagination || {};
      
      setFeedData(reset ? feedItems : [...feedData, ...feedItems]);
      setFeedPage(pageToFetch + 1);
      setHasMoreFeed(pageToFetch < (pagination.totalPages || 1));
    } catch (err) {
      setFeedError(err.message);
      console.error('Error fetching feed data:', err);
    } finally {
      setFeedLoading(false);
    }
  };

  const handleLoadMoreFeed = () => {
    if (!feedLoading && hasMoreFeed && feedData.length > 0) {
      fetchFeedData(false);
    }
  };

  const isMenuEnabled = (id) => {
    if(id === "feed"){
      return true;
    }

    if(id === "members"){
      return true;
    }
    

    if(id === "projects"){
      return true;
    }


    if(id === "group_courses" && groupData?.hasCourses){
      return true;
    }

    if (!groupData?.role) return false;

    const { is_admin, is_mod } = groupData.role;

    

    if(id === "photos" && canMembers("media_status")){
      return true;
    }
    
    if(id === "videos" && canMembers("video_status")){
      return true;
    }

    if(id === "albums" && canMembers("album_status")){
      return true;
    }

    if(id === "documents" && canMembers("document_status")){
      return true;
    }

    if(id === "send_messages" && canMembers("message_status")){
      return true;
    }

    if(id === "send_invites" && canMembers("invite_status")){
      return true;
    }

    

    if(id === "manage" && (is_admin === 1 || is_mod === 1)){
      return true;
    }

    return false;
    
    // Check if the status flag is 1 in the group data
    //return groupData?.meta_data?.[statusKey] === 1;
  };
  
  const isLeaveGroupEnabled = () => {
    if (!groupData?.role) return false;

    const { is_admin, is_mod, creator_id } = groupData.role;

    if (groupData.creator_id !== currentUser.user.id) {
      return true;
    }

    return false;
  };

  const handleInvite = () => {
    navigation.navigate('CreateGroup', {
      initialStep: 5, // Index of InvitesStep in the steps array
      groupId: groupId,
      isDirectAccess: true
    });
  };

  const handleMenuPress = (item) => {
    switch (item.id) {
      case 'members':
        navigation.navigate('GroupMenu', { 
          screen: 'MembersScreen', 
          params: { 
            groupId: groupData?.id, 
            currentUserId: currentUser?.user?.id, 
            userRole: groupData?.role || {} 
          } 
        });
        break;
      case 'photos':
        navigation.navigate('GroupMenu', { screen: 'PhotosScreen', params: { groupId: groupData.id } });
        break;
      case 'videos':
        navigation.navigate('GroupMenu', { screen: 'VideosScreen', params: { groupId: groupData.id } });
        break;
      case 'albums':
        navigation.navigate('GroupMenu', { screen: 'AlbumsScreen', params: { groupId: groupData.id } });
        break;
      case 'send_invites':
        navigation.navigate('CreateGroup', { initialStep: 5, groupId: groupData.id, isDirectAccess: true });
        break;
      case 'send_messages':
        handleSendMessage();
        break;
      case 'group_courses':
        navigation.navigate('GroupMenu', { screen: 'GroupCoursesScreen', params: { groupId: groupData.id } });
        break;  
      case 'projects':
        navigation.navigate('MyTasks');
        break;
      case 'manage':
        navigation.navigate('GroupMenu', { screen: 'ManageScreen',
          params: { 
            groupId: groupData?.id, 
            currentUserId: currentUser?.user?.id, 
            userRole: groupData?.role || {},
            creatorId: groupData?.creator_id || 0
          } 
        });
        break;
      default:
        break;
    }
  };

  const handleSendMessage = async () => {
    try {
      setLoaderVisible(true);
      
      // Make API call to check/create thread
      const response = await agent.Groups.checkGroupMessage(groupData.id);
      
      if (response?.data?.thread_id) {
        // Navigate to thread screen with the thread ID
        navigation.navigate('ThreadScreen', { 
          threadId: response.data.thread_id,
          hasRefreshed: true
        });
      } else {

        navigation.navigate('GroupMenu', { screen: 'CreateGroupMessage', params: { groupId: groupData.id, groupName: groupData.name } });
        
      }
    } catch (error) {
      console.error('Error creating message thread:', error);
      Alert.alert('Error', 'An error occurred while creating the message thread.');
    } finally {
      setLoaderVisible(false);
    }
  };

  const handleLikedUsersPress = (activity) => {
    setSelectedActivity(activity);
    setShowLikedUsers(true);
  };

  const handleLikePress = async (activity) => {
    try {
      setLikingActivity(activity.id);
      const response = await agent.Groups.likeGroupFeed(groupId, activity.id);

      
      if (response?.data?.status) {
        // Update the feed data with new like status
        setFeedData(prevData => 
          prevData.map(item => {
            if (item.id === activity.id) {
              const hasUserLiked = response.data.status === 'liked';
              const updatedLikedUsers = hasUserLiked
                ? [...item.liked_users, {
                    user_id: currentUserId,
                    display_name: currentUser.user.display_name,
                    avatar_url: currentUser.user.image
                  }]
                : item.liked_users.filter(user => user.user_id !== currentUserId);
              
              return {
                ...item,
                likes: hasUserLiked ? item.likes + 1 : item.likes - 1,
                liked_users: updatedLikedUsers
              };
            }
            return item;
          })
        );
      } else {
        // Show error if API call fails
        alert('Failed to update like status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLikingActivity(null);
    }
  };

  const handleDotsPress = (event, activity) => {
    const { pageX, pageY } = event.nativeEvent;
    const screenWidth = Dimensions.get('window').width;
    const screenHeight = Dimensions.get('window').height;
    const dropdownWidth = 150; // Width of the dropdown
    const dropdownHeight = 50; // Approximate height of the dropdown

    // Calculate initial position
    let x = pageX - dropdownWidth + 20; // Align right edge with dots
    let y = pageY + 10; // Add some padding below dots

    // Ensure dropdown stays within screen bounds
    if (x < 10) x = 10; // Minimum left margin
    if (x + dropdownWidth > screenWidth - 10) x = screenWidth - dropdownWidth - 10; // Maximum right margin
    if (y + dropdownHeight > screenHeight - 10) y = pageY - dropdownHeight - 10; // If bottom would be off screen, show above

    setDropdownPosition({ x, y });
    setSelectedActivityForDropdown(activity);
    setShowDropdown(true);
  };

  const handleDeletePress = () => {
    setShowDropdown(false);
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteConfirm(selectedActivityForDropdown)
        }
      ]
    );
  };

  const handleDeleteConfirm = async (activity) => {

    try {
      if (!activity) return;

      const response = await agent.Groups.deleteGroupFeed(groupId, activity.id);

      console.log(JSON.stringify(response,null,2));
      
      if (response?.data?.status && response?.data?.status === "deleted") {
        // Remove the deleted activity from feed
        setFeedData(prevData => 
          prevData.filter(item => item.id !== activity.id)
        );
      } else {
        alert('Failed to delete post. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('An error occurred while deleting. Please try again.');
    }
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

  const renderDropdown = () => {
    if (!showDropdown || !selectedActivityForDropdown) return null;

    return (
      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="none"
        onRequestClose={() => setShowDropdown(false)}
      >
        <TouchableOpacity 
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setShowDropdown(false)}
        >
          <View style={[styles.dropdownContent, { 
            position: 'absolute',
            top: dropdownPosition.y,
            left: dropdownPosition.x,
          }]}>
            <TouchableOpacity 
              style={styles.dropdownOption}
              onPress={handleDeletePress}
            >
              <Icon name="delete-outline" size={20} color="#ff4444" style={styles.dropdownOptionIcon} />
              <Text style={[styles.dropdownOptionText, { color: '#ff4444' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  const renderMenu = () => {
    return (
      <View style={styles.menuContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {MENU_CONFIG.map((item) => {

            if (!isMenuEnabled(item.id)) return null;
            
            const isActive = activeMenu === item.id;
            let count = 0;
            if(item.id === "members"){
              count = groupData.meta_data?.total_member_count || 0;
            }else{
              count = menuCounts[item.id] || 0;
            }
            
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => handleMenuPress(item)}
              >
                <Icon 
                  name={item.icon} 
                  size={20} 
                  color={isActive ? '#fff' : '#666'} 
                  style={styles.menuIcon}
                />
                <Text style={[styles.menuText, isActive && styles.menuTextActive]}>
                  {item.label}
                </Text>
                {count > 0 && (
                  <View style={[styles.menuBadge, isActive && styles.menuBadgeActive]}>
                    <Text style={[styles.menuBadgeText, isActive && styles.menuBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
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

  const stripHtml = (html) => {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  };

  const canDeletePost = (activity) => {
    // Check if user is the post creator
    const isPostCreator = activity.user_id === currentUserId;
    
    // Check if user is group admin
    const isGroupAdmin = groupData?.role?.is_admin === 1;
    
    return isPostCreator || isGroupAdmin;
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

  const renderFeed = () => {
    if (feedLoading && feedData.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#122b46" />
          <Text style={styles.loadingText}>Loading feed...</Text>
        </View>
      );
    }

    if (feedError && feedData.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={48} color="#ff4444" />
          <Text style={styles.errorText}>{feedError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchFeedData(true)}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (feedData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="newspaper-variant-outline" size={48} color="#666" />
          <Text style={styles.emptyText}>No posts yet</Text>
          <Text style={styles.emptySubText}>Be the first to share something!</Text>
        </View>
      );
    }

    return (
      <>
        {feedData.map(activity => {
          const hasUserLiked = activity.liked_users?.some(user => user.user_id === currentUserId);
          const isLiking = likingActivity === activity.id;
          const canDelete = canDeletePost(activity);
          
          return (
            <View key={activity.id} style={styles.feedCard}>
              <View style={styles.feedHeader}>
                <Image source={{ uri: activity.user.avatar_url }} style={styles.feedAvatar} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.feedUser}>
                    <Text style={{ fontWeight: 'bold' }}>{activity.user.display_name}</Text> {getActivityContext(activity)}
                  </Text>
                  <Text style={styles.feedTime}>{formatDate(activity.date_recorded)}</Text>
                </View>
                {canDelete && (
                  <TouchableOpacity 
                    onPress={(event) => handleDotsPress(event, activity)}
                    style={styles.dotsButton}
                  >
                    <Icon name="dots-horizontal" size={22} color="#888" />
                  </TouchableOpacity>
                )}
              </View>
              {activity.content ? (
                <HTMLContentViewer
                  content={activity.content}
                />
              ) : null}
              {renderAttachments(activity.attachments)}
              {activity.liked_users && activity.liked_users.length > 0 && (
                <LikedUsers 
                  users={activity.liked_users} 
                  onPress={() => handleLikedUsersPress(activity)}
                />
              )}
              <View style={styles.feedActions}>
                <TouchableOpacity 
                  style={styles.feedActionBtn}
                  onPress={() => handleLikePress(activity)}
                  disabled={isLiking}
                >
                  {isLiking ? (
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
                  onPress={() => navigation.navigate('CommentScreen', { activityId: activity.id, groupId })}
                >
                  <Icon name="comment-outline" size={20} color="#888" />
                  <Text style={styles.feedActionText}>
                    {activity.comment_count > 0 ? `${activity.comment_count} Comment${activity.comment_count !== 1 ? 's' : ''}` : 'Comment'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
        {renderLikedUsersModal()}
        {renderDropdown()}
        {hasMoreFeed && (
          <TouchableOpacity 
            style={styles.loadMoreButton}
            onPress={() => fetchFeedData(false)}
            disabled={feedLoading}
          >
            {feedLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loadMoreButtonText}>Load More</Text>
            )}
          </TouchableOpacity>
        )}
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
      </>
    );
  };

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

  const handleLeaveGroup = async () => {
    Alert.alert(
      "Leave Group",
      "Are you sure you want to leave this group?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Leave",
          style: "destructive",
          onPress: async () => {
            try {
              setIsLeavingGroup(true);
              const response = await agent.Groups.leaveGroup(groupId);
              console.log("response", JSON.stringify(response, null, 2));
              if (response?.failed) {
                Alert.alert(
                  'Error',
                  response.error?.message || 'Failed to delete group. Please try again.'
                );
              }else if(response?.data?.group_id){
                navigation.reset({
                  index: 0,
                  routes: [
                    { name: 'BottomStack', params: { screen: 'Groups' } }
                  ],
                });
              }else{
                Alert.alert(
                  'Error',
                  response?.error?.message || 'Failed to delete group. Please try again.'
                );
              }
            } catch (error) {
              Alert.alert(
                'Error',
                error.message || 'Failed to delete group. Please try again.'
              );
            } finally {
              setIsLeavingGroup(false);
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#f6c343" />
          <Text style={styles.loadingText}>Loading group data...</Text>
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
          <TouchableOpacity style={styles.retryButton} onPress={fetchGroupData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!groupData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No group data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={{ flex: 1, backgroundColor: '#f6f6f6' }}>
        {/* Custom Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIconBtn}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">{groupData.name}</Text>
          <View style={styles.headerRightButtons}>
            <TouchableOpacity style={[styles.headerIconBtn, styles.plusButton]} onPress={() => navigation.navigate('CreatePost', { groupId })}>
              <Icon name="pencil" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          style={styles.feedBg}
          contentContainerStyle={{ paddingBottom: 80 }}
          onEndReached={handleLoadMoreFeed}
          onEndReachedThreshold={0.5}
        >
          {/* Group Cover Section */}
          <View style={styles.coverSection}>
            {groupData.coverPhoto ? (
              <Image source={{ uri: groupData.coverPhoto }} style={styles.coverImage} />
            ) : (
              <Image source={require('@/assets/images/cover-image-1.png')} style={styles.coverImage} />
            )}
            {groupData.image ? (
              <Image source={{ uri: groupData.image }} style={styles.groupAvatar} />
            ) : (
              <View style={[styles.groupAvatar, styles.iconContainer]}>
                <Icon name="account-group" size={60} color="#122b46" />
              </View>
            )}
            {isLeaveGroupEnabled() && (
              <TouchableOpacity 
                style={[styles.leaveGroupButton, isLeavingGroup && styles.leaveGroupButtonDisabled]} 
                onPress={handleLeaveGroup}
                disabled={isLeavingGroup}
              >
                {isLeavingGroup ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="exit-to-app" size={20} color="#fff" />
                    <Text style={styles.leaveGroupText}>Leave Group</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.groupInfoSection}>
            <Text style={styles.groupName}>{groupData.name}</Text>
            <Text style={styles.groupMeta}>
              {groupData.status ? `${groupData.status.charAt(0).toUpperCase() + groupData.status.slice(1)}` : ''} / Group · {groupData.meta_data?.total_member_count || 0} members
            </Text>
            
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.organizerBtn}>
                <Text style={styles.organizerText}>
                  {groupData?.role?.is_admin ? 'Organizer' : 'Member'}
                </Text>
                {/* <Icon name="chevron-down" size={18} color="#222" /> */}
              </TouchableOpacity>
              {canInviteMembers() && (
                <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
                  <Text style={styles.inviteText}>+ Invite</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.infoBtn} onPress={() => navigation.navigate('GroupInfo', { groupData })}>
                <Icon name="information-outline" size={20} color="#222" />
              </TouchableOpacity>
            </View>
            {renderMenu()}
          </View>
          {/* Feed */}
          {renderFeed()}
        </ScrollView>
        <View style={styles.bottomBar}>
          {/* Add your comment input or action buttons here */}
        </View>
        <PageLoader visible={loaderVisible} setVisible={setLoaderVisible} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f6f6f6' },
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
  plusButton: {
    backgroundColor: '#fff',
    width: 30,
    height: 30,
    borderRadius: 20,
    right: 10,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  coverSection: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#eee',
    marginBottom: 8,
  },
  coverImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  
  groupInfoSection: {
    paddingHorizontal: 16,
    paddingTop: 5,
    paddingBottom: 8,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    marginHorizontal: 8,
    marginTop: 35,
    zIndex: 2,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  groupName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  groupMeta: {
    color: '#888',
    marginBottom: 8,
    fontSize: 14,
  },
  avatarRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: -10,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#eee',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  organizerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f6c343',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  organizerText: {
    fontWeight: 'bold',
    color: '#222',
    marginRight: 4,
  },
  inviteBtn: {
    backgroundColor: '#122b46',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  inviteText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoBtn: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginHorizontal: -8,
    marginBottom: 8,
    marginTop: 4,
    paddingLeft: 8,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
    paddingVertical: 10,
  },
  tabText: {
    fontWeight: '500',
    color: '#222',
    marginRight: 4,
  },
  tabBadge: {
    backgroundColor: '#f6c343',
    borderRadius: 10,
    paddingHorizontal: 6,
    marginLeft: 2,
  },
  tabBadgeText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 12,
  },
  feedBg: {
    flex: 1,
    backgroundColor: '#f6f6f6',
    paddingHorizontal: 0,
  },
  feedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 12,
    marginTop: 16,
    marginBottom: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
  feedText: {
    color: '#222',
    fontSize: 15,
    marginBottom: 8,
    backgroundColor: 'transparent',
    height: 'auto',
    minHeight: 20,
    width: '100%',
  },
  feedImage: {
    width: '100%',
    height: 180,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: '#eee',
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
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  groupAvatar: {
    position: 'absolute',
    bottom: -32,
    left: 24,
    width: 120,
    height: 120,
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#fff',
    backgroundColor: '#eee',
    zIndex: 99999999,
  },
  menuContainer: {
    backgroundColor: '#00000',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    borderColor: '#ccc',
    borderWidth: 1,
  },
  menuItemActive: {
    backgroundColor: '#f6c343',
    borderColor: '#f6c343',
  },
  menuIcon: {
    marginRight: 6,
  },
  menuText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  menuTextActive: {
    color: '#fff',
  },
  menuBadge: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    paddingHorizontal: 6,
    marginLeft: 6,
  },
  menuBadgeActive: {
    backgroundColor: '#fff',
  },
  menuBadgeText: {
    fontSize: 12,
    color: '#666',
    fontWeight: 'bold',
  },
  menuBadgeTextActive: {
    color: '#f6c343',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f6f6',
    padding: 20,
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
  iconContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
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
  remainingCount: {
    color: '#122b46',
    fontWeight: '500',
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
  currentUserText: {
    color: '#ff4444',
    fontWeight: '500',
  },
  dropdownOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  dropdownContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    width: 150,
    position: 'absolute',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 4,
  },
  dropdownOptionIcon: {
    marginRight: 12,
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dotsButton: {
    padding: 4,
    zIndex: 1,
  },
  attachmentContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    width: "100%",
    gap: 16,
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
  documentText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginRight: 12,
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
  loadMoreButton: {
    backgroundColor: '#122b46',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginHorizontal: 12,
    marginVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  headerRightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leaveGroupButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(250, 2, 2, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  leaveGroupButtonDisabled: {
    opacity: 0.7,
  },
  leaveGroupText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SingleGroup); 