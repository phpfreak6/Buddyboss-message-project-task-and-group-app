import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView, FlatList, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';
import SendInvitesStep from './SendInvitesStep';
import { useNavigation } from '@react-navigation/native';

const DEFAULT_AVATAR = require('@/assets/images/icons/dummy-user.png'); // Update path if needed

const TABS = [
  { key: 'members', label: 'Members' }
];

const InvitesStep = ({ groupId, onBack, onNext, isDirectAccess }) => {
  const navigation = useNavigation();
  const [members, setMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sendingInvites, setSendingInvites] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('members');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [showSendInvites, setShowSendInvites] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);

  useEffect(() => {
    fetchMembers(true);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchMembers(true);
    }, 500);
    return () => clearTimeout(delayDebounce);
    // eslint-disable-next-line
  }, [search]);

  const fetchMembers = async (reset = false) => {
    setLoading(reset);
    setIsFetchingMore(!reset);
    try {
      let pageToFetch = reset ? 1 : page;
      let size = 20;

      // const responseGroupMembers = await agent.Groups.getGroupMembers(groupId);
      // console.log(responseGroupMembers);
      // For 'connections' tab, use a different API if available
      let response;
      if (activeTab === 'members') {
        response = await agent.Groups.getGroupAllUsers(groupId,pageToFetch, size, search);
      } else {
        response = await agent.Groups.getGroupAllUsers(groupId,pageToFetch, size, search);
      }
      const users = response?.data?.users?.users || [];
      const pagination = response?.data?.users?.pagination || {};
      setMembers(reset ? users : [...members, ...users]);
      setPage(pageToFetch + 1);
      setHasMore(pageToFetch < (pagination.totalPages || 1));
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch members.');
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleSelect = (user) => {
    if (selectedMembers.some((m) => m.ID === user.ID)) {
      setSelectedMembers(selectedMembers.filter((m) => m.ID !== user.ID));
    } else {
      setSelectedMembers([...selectedMembers, user]);
    }
  };

  const handleDirectAdd = async (user) => {
    setAddingUserId(user.ID);
    try {
      const response = await agent.Groups.sendGroupInvites(groupId, [user.ID], '', true);
      if (response?.data?.group_id) {
        Alert.alert('Success', 'Member added successfully.');
        fetchMembers(true);
      } else {
        Alert.alert('Error', 'Failed to add member.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add member.');
      console.error(error);
    } finally {
      setAddingUserId(null);
    }
  };

  const renderMember = ({ item }) => {
    const isSelected = selectedMembers.some((m) => m.ID === item.ID);
    const isAdding = addingUserId === item.ID;
    return (
      <TouchableOpacity style={styles.memberRow} onPress={() => handleSelect(item)}>
        <Image
          source={item.image ? { uri: item.image } : DEFAULT_AVATAR}
          style={styles.avatar}
        />
        <Text style={styles.memberName}>{item.display_name || item.name || item.email}</Text>
        <View style={styles.actionButtons}>
          
          <View style={[
            styles.checkCircle,
            isSelected && { backgroundColor: '#F9B233', borderColor: '#F9B233' }
          ]}>
            {isSelected && (
              <Icon name="check" size={20} color="#fff" />
            )}
          </View>
          <TouchableOpacity 
            style={styles.directAddButton}
            onPress={() => handleDirectAdd(item)}
            disabled={isAdding}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#F9B233" />
            ) : (
              <Icon name="account-plus" size={20} color="#F9B233" />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Show SendInvitesStep after Next
  const handleNext = () => {
    if (selectedMembers.length === 0) {
      if (isDirectAccess) {
        Alert.alert('Info', 'Please select members to invite.');
        return;
      }
      // No members selected, skip to next step
      onNext({ members: [], message: '' });
      return;
    }
    setShowSendInvites(true);
  };

  // Go back from SendInvitesStep to member selection
  const handleBackFromSend = () => {
    setShowSendInvites(false);
  };

  // Handle send action (call onNext or API)
  const handleSendInvites = async (memberIds, inviteMessage) => {
    setSendingInvites(true);
    try {
      const response = await agent.Groups.sendGroupInvites(groupId, memberIds, inviteMessage);
      if (response?.data?.group_id) {
        Alert.alert('Success', 'Invites sent successfully.');
        setSelectedMembers([]);
        setShowSendInvites(false);
        fetchMembers(true);
        // if (isDirectAccess) {
        //   onBack(); 
        // }
      } else {
        Alert.alert('Error', 'Failed to send invites.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send invites.');
      console.error(error);
    } finally {
      setSendingInvites(false);
    }
  };

  const handleTab = (key) => {
    setActiveTab(key);
    setMembers([]);
    setPage(1);
    setHasMore(true);
    setSearch('');
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !loading && members.length > 0) {
      fetchMembers(false);
    }
  };

  const handleBackPress = () => {
    if (isDirectAccess) {
      navigation.goBack();
    } else {
      onBack();
    }
  };

  if (showSendInvites) {
    return (
      <SendInvitesStep
        selectedMembers={selectedMembers}
        setSelectedMembers={setSelectedMembers || (() => {})}
        onBack={handleBackFromSend}
        onSend={handleSendInvites}
        sendingInvites={sendingInvites}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButtonBack} onPress={handleBackPress}>
          <Icon name="arrow-left" size={22} color="#122b46" />
          <Text style={styles.navButtonTextBack}></Text>
        </TouchableOpacity>
        <Text style={styles.stepHeadingTop}>Invites</Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNext}
        >
          <Text style={styles.navButtonText}>{isDirectAccess ? 'Save' : 'Next'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      {/* <View style={styles.tabsContainer}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => handleTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View> */}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Members List */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#122b46" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={members}
            renderItem={renderMember}
            keyExtractor={(item) => item.ID?.toString() || item.id?.toString() || item.email}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.0}
            ListEmptyComponent={<Text style={styles.emptyText}>No members found.</Text>}
            extraData={selectedMembers}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  navButtonBack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#122b46',
  },
  navButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  navButtonTextBack: {
    fontSize: 15,
    color: '#F9B233',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  stepHeadingTop: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    margin: 16,
    marginBottom: 0,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
  },
  activeTab: {
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#F9B233',
  },
  tabText: {
    color: '#888',
    fontWeight: '500',
    fontSize: 15,
  },
  activeTabText: {
    color: '#F9B233',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    margin: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F9B233',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  directAddButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#F9B233',
  },
});

export default InvitesStep; 