import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { ViewLayout } from '@/Pages/Layouts';
import { PageLoader } from '@/components';
import agent from '@/agent';
import { SwipeListView } from 'react-native-swipe-list-view';
import Toast from 'react-native-toast-message';
import { useFocusEffect } from '@react-navigation/native';

const formatDate = (date) => {
  const notificationDate = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (notificationDate.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (notificationDate.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return notificationDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
};

const NotificationItem = ({ notification, onLongPress, onPress }) => (
  <TouchableOpacity
    style={styles.notificationItem}
    onLongPress={onLongPress}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View style={styles.avatarContainer}>
      <Image
        source={
          notification?.data?.user_data?.image
            ? { uri: notification.data.user_data.image }
            : require('@/assets/images/icons/dummy-user.png')
        }
        style={styles.avatar}
      />
      <View style={styles.iconBadge}>
        <Icon
          name={notification.read ? 'bell-outline' : 'bell'}
          size={14}
          color={notification.read ? '#666' : '#122b46'}
        />
      </View>
    </View>
    <View style={styles.contentContainer}>
      <Text style={[styles.title, !notification.read && styles.unreadTitle]}>
        {notification?.data?.user_data?.display_name || 'System'}
      </Text>
      <Text style={styles.message} numberOfLines={2}>
        {notification?.data?.message}
      </Text>
      <Text style={styles.time}>{formatDate(notification.date_notified)}</Text>
    </View>
    <Icon name="chevron-right" size={20} color="#666" />
  </TouchableOpacity>
);

const TabBar = ({ activeTab, onTabPress }) => (
  <View style={styles.tabContainer}>
    <TouchableOpacity
      style={[styles.tab, activeTab === 'unread' && styles.activeTab]}
      onPress={() => onTabPress('unread')}
    >
      <Icon
        name="bell"
        size={20}
        color={activeTab === 'unread' ? '#122b46' : '#666'}
        style={styles.tabIcon}
      />
      <Text style={[styles.tabText, activeTab === 'unread' && styles.activeTabText]}>Unread</Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[styles.tab, activeTab === 'read' && styles.activeTab]}
      onPress={() => onTabPress('read')}
    >
      <Icon
        name="bell-outline"
        size={20}
        color={activeTab === 'read' ? '#122b46' : '#666'}
        style={styles.tabIcon}
      />
      <Text style={[styles.tabText, activeTab === 'read' && styles.activeTabText]}>Read</Text>
    </TouchableOpacity>
  </View>
);

const Notification = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('unread');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const swipeRowRefs = useRef({});

  // useEffect(() => {
  //   setNotifications([]);
  //   setCurrentPage(1);
  //   setHasMore(true);
  //   fetchNotifications(1, true);
  // }, [activeTab]);

  useFocusEffect(
    React.useCallback(() => {
      setNotifications([]);
      setCurrentPage(1);
      setHasMore(true);
      fetchNotifications(1, true);
    }, [activeTab])
  );

  const triggerStatus = (type, message) => {
    Toast.show({
      type: type,
      text1: type === 'error' ? 'Error' : 'Success',
      text2: message,
      position: 'bottom',
      visibilityTime: 1000,
    });
  };

  const fetchNotifications = async (page = 1, replace = false) => {
    try {
      if (page === 1 && !refreshing) setLoading(true);
      else setLoadingMore(true);

      const response = await agent.Auth.getNotifications(page, limit, activeTab);
      //console.log('response', JSON.stringify(response, null, 2));
      if (response && response.isSuccess) {
        const pagination = response.data && response.data.pagination ? response.data.pagination : {};
        setCurrentPage(parseInt(pagination.currentPage) || 1);
        const newNotifications = (response.data && response.data.notifications ? response.data.notifications : []).map(n => ({
          ...n,
          read: n.is_new === 0,
        }));
        setHasMore(newNotifications.length === limit);
        setNotifications(prev => {
          if (replace) return newNotifications;
          const all = [...prev, ...newNotifications];
          return Array.from(new Map(all.map(n => [n.id, n])).values()).sort((a, b) => new Date(b.date_notified) - new Date(a.date_notified));
        });
      } else {
        setHasMore(false);
        triggerStatus('error', 'Failed to load notifications');
      }
    } catch (error) {
      setHasMore(false);
      triggerStatus('error', 'Failed to load notifications');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMore) {
      fetchNotifications(currentPage + 1);
    }
  };

  const handleNotificationPress = async (notification) => {
    //console.log('notification', notification);

    if (!notification.read) {
      try {
        await agent.Auth.markNotificationAsRead(notification.id);

        if (notification?.data?.target_data?.thread_id) {
          navigation.navigate('ThreadScreen', {
            threadId: notification.data.target_data.thread_id,
          });
        } else if (
          notification?.component_name === 'groups' &&
          notification?.data?.target_data?.id
        ) {
          navigation.navigate('singleGroup', {
            groupId: notification.data.target_data.id,
            groupTitle: notification.data.target_data.name,
          });
        } else if (
          (notification?.component_name === 'projects' ||
            notification?.component_name === 'tasks') &&
          notification?.data?.target_data?.project_id &&
          notification?.data?.target_data?.id
        ) {
          navigation.navigate('MyTasks', {
            initialTask: {
              projectId: notification.data.target_data.project_id,
              taskId: notification.data.target_data.id,
            },
          });
        } else {
          triggerStatus('success', 'Notification marked as read');
        }
        //fetchNotifications(1, true);
      } catch (error) {
        triggerStatus('error', 'Failed to mark notification as read');
      }
    } else {
      if (notification?.data?.target_data?.thread_id) {
        navigation.navigate('ThreadScreen', {
          threadId: notification.data.target_data.thread_id,
        });
      } else if (
        notification?.component_name === 'groups' &&
        notification?.data?.target_data?.id
      ) {
        navigation.navigate('singleGroup', {
          groupId: notification.data.target_data.id,
          groupTitle: notification.data.target_data.name,
        });
      } else if (
        (notification?.component_name === 'projects' ||
          notification?.component_name === 'tasks') &&
        notification?.data?.target_data?.project_id &&
        notification?.data?.target_data?.id
      ) {
        navigation.navigate('MyTasks', {
          initialTask: {
            projectId: notification.data.target_data.project_id,
            taskId: notification.data.target_data.id,
          },
        });
      }
    }
  };

  const handleMarkAsRead = async (notification) => {
    if (!notification.read) {
      try {
        const response = await agent.Auth.markNotificationAsRead(notification.id);
        
        if(response?.isSuccess && response?.data === true){
          triggerStatus('success', 'Notification marked as read');
          fetchNotifications(1, true);
        }else{
          triggerStatus('error', 'Failed to mark notification as read');
        }
      } catch (error) {
        triggerStatus('error', 'Failed to mark notification as read');
      }
    }
  };

  const handleDeleteNotification = async (notification) => {
    try {
      const response = await agent.Auth.deleteNotification(notification.id);
      // console.log('deleteNotification', response);

      if(response?.isSuccess && response?.data === true){
        triggerStatus('success', 'Notification deleted');
        fetchNotifications(1, true);
      }else{
        triggerStatus('error', 'Failed to delete notification');
      }
    } catch (error) {
      triggerStatus('error', 'Failed to delete notification');
    }
  };

  const renderItem = ({ item: notification }) => (
    <NotificationItem
      notification={notification}
      onLongPress={() => {
        if (swipeRowRefs.current[notification.id]) {
          swipeRowRefs.current[notification.id].manuallySwipeRow(-120);
        }
      }}
      onPress={() => handleNotificationPress(notification)}
    />
  );

  const renderHiddenItem = ({ item: notification }, rowMap) => {
    swipeRowRefs.current[notification.id] = rowMap[notification.id];
    return (
      <View style={styles.hiddenActions}>
        {!notification.read && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#4caf50' }]}
            onPress={() => handleMarkAsRead(notification)}
            activeOpacity={0.7}
          >
            <Icon name="check" size={22} color="#fff" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: '#f44336' }]}
          onPress={() => handleDeleteNotification(notification)}
          activeOpacity={0.7}
        >
          <Icon name="delete" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon
        name={activeTab === 'unread' ? 'bell-off-outline' : 'bell-check-outline'}
        size={64}
        color="#666"
      />
      <Text style={styles.emptyText}>
        {activeTab === 'unread' ? 'No unread notifications' : 'No read notifications'}
      </Text>
    </View>
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications(1, true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ViewLayout noMargin={true} backGroundGrey={true}>
        <View style={styles.container}>
          <TabBar activeTab={activeTab} onTabPress={setActiveTab} />
          {notifications.length > 0 ? (
            <SwipeListView
              data={notifications}
              renderItem={renderItem}
              renderHiddenItem={renderHiddenItem}
              rightOpenValue={-120}
              disableRightSwipe
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={styles.listContainer}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.1}
              ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color="#122b46" /> : null}
              previewRowKey={notifications[0]?.id?.toString()}
              previewOpenValue={-60}
              previewOpenDelay={100}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          ) : (
            !loading && renderEmptyState()
          )}
          <PageLoader visible={loading} setVisible={setLoading} />
        </View>
      </ViewLayout>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 20,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#f0f0f0',
  },
  tabIcon: {
    marginRight: 8,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#122b46',
    fontWeight: '600',
  },
  listContainer: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 14,
    borderRadius: 4,
    marginBottom: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  hiddenActions: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '90%',
    justifyContent: 'flex-end',
    marginRight: 0,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 50,
    height: 50,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: '600',
    color: '#122b46',
  },
  message: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  loadingMoreContainer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Notification; 