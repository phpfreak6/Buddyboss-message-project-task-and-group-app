import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';

const ManageScreen = ({ navigation, route }) => {
  const [loading, setLoading] = useState(true);
  const [groupData, setGroupData] = useState(null);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const groupId = route.params?.groupId;
  const currentUserId = route.params?.currentUserId;
  const userRole = route.params?.userRole || {};
  const isAdminOrMod = userRole.is_admin === 1 || userRole.is_mod === 1;
  const creatorId = route.params?.creatorId;

  useEffect(() => {
    fetchGroupData();
  }, []);

  const fetchGroupData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!groupId) {
        throw new Error('Group ID is required');
      }

      const response = await agent.Groups.getdetails(groupId);
      
      if (response?.failed) {
        throw new Error(response.error?.message || 'Failed to fetch group data');
      }

      const data = response?.data?.group || {};
      setGroupData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching group data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete this group? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleteLoading(true);
              const response = await agent.Groups.deleteGroup(groupId);

              if (response?.failed) {
                throw new Error(response.error?.message || 'Failed to delete group');
              }

              navigation.reset({
                index: 0,
                routes: [
                  { name: 'BottomStack', params: { screen: 'Groups' } }
                ],
              });
            } catch (err) {
              Alert.alert(
                'Error',
                err.message || 'Failed to delete group. Please try again.'
              );
            } finally {
              setDeleteLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderManageOption = (icon, title, description, onPress, isDelete = false) => {
    if (icon === 'delete' && groupData?.role?.is_admin !== 1) {
      return null;
    }
    return (
      <TouchableOpacity 
        style={[styles.optionContainer, isDelete && styles.deleteOptionContainer]} 
        onPress={onPress}
        disabled={isDelete && deleteLoading}
      >
        <View style={[styles.optionIcon, isDelete && styles.deleteOptionIcon]}>
          <Icon name={icon} size={24} color={isDelete ? "#ff4444" : "#122b46"} />
        </View>
        <View style={styles.optionContent}>
          <Text style={[styles.optionTitle, isDelete && styles.deleteOptionTitle]}>{title}</Text>
          <Text style={[styles.optionDescription, isDelete && styles.deleteOptionDescription]}>
            {deleteLoading && isDelete ? 'Deleting...' : description}
          </Text>
        </View>
        <Icon name="chevron-right" size={24} color={isDelete ? "#ff4444" : "#666"} />
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Group</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#122b46" />
          <Text style={styles.loadingText}>Loading group data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Manage Group</Text>
          <View style={styles.placeholder} />
        </View>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Group</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          {renderManageOption(
            'information',
            'Details',
            'View and edit group details',
            () => navigation.navigate('CreateGroup', { initialStep: 0, groupId, isDirectAccess: true })
          )}
          {renderManageOption(
            'cog',
            'Settings',
            'Manage group settings',
            () => navigation.navigate('CreateGroup', { initialStep: 1, groupId, isDirectAccess: true })
          )}
          {renderManageOption(
            'forum',
            'Discussions',
            'Manage group discussions',
            () => navigation.navigate('CreateGroup', { initialStep: 2, groupId, isDirectAccess: true })
          )}
          {renderManageOption(
            'book-open',
            'Courses',
            'Manage group courses',
            () => navigation.navigate('CreateGroup', { initialStep: 6, groupId, isDirectAccess: true })
          )}
          {renderManageOption(
            'image',
            'Photo',
            'Change group photo',
            () => navigation.navigate('CreateGroup', { initialStep: 3, groupId, isDirectAccess: true })
          )}
          {renderManageOption(
            'image-multiple',
            'Cover Photo',
            'Change group cover photo',
            () => navigation.navigate('CreateGroup', { initialStep: 4, groupId, isDirectAccess: true })
          )}
          {renderManageOption(
            'account-group',
            'Members',
            'Manage group members',
            () => navigation.navigate('MembersScreen', { groupId, currentUserId, userRole, creatorId })
          )}
          {renderManageOption(
            'delete',
            'Delete Group',
            'Permanently delete this group',
            handleDeleteGroup,
            true
          )}
        </View>
      </ScrollView>

      <Modal
        transparent={true}
        visible={deleteLoading}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#ff4444" />
            <Text style={styles.modalText}>Deleting Group...</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#122b46',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  deleteOptionContainer: {
    backgroundColor: '#fff5f5',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  deleteOptionIcon: {
    backgroundColor: '#fff',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  deleteOptionTitle: {
    color: '#ff4444',
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  deleteOptionDescription: {
    color: '#ff4444',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#122b46',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 200,
  },
  modalText: {
    marginTop: 16,
    fontSize: 16,
    color: '#ff4444',
    fontWeight: '500',
  },
});

export default ManageScreen; 