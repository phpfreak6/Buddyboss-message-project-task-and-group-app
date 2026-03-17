import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Image, ActivityIndicator, SectionList, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';

const DEFAULT_AVATAR = require('@/assets/images/icons/dummy-user.png');

const MembersScreen = ({ navigation, route }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const groupId = route.params?.groupId;
  const currentUserId = route.params?.currentUserId;
  const userRole = route.params?.userRole || {};
  const isAdminOrMod = userRole.is_admin === 1 || userRole.is_mod === 1;
  const creatorId = route.params?.creatorId;

  useEffect(() => {
    fetchMembers(true);
  }, []);

  const handleSearch = (text) => {
    setSearch(text);
    // Clear previous timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    // Set new timeout to debounce search
    const timeout = setTimeout(() => {
      fetchMembers(true);
    }, 500);
    setSearchTimeout(timeout);
  };

  const fetchMembers = async (reset = false) => {
    setLoading(reset);
    setIsFetchingMore(!reset);
    try {
      let pageToFetch = reset ? 1 : page;
      let size = 1000;

      const response = await agent.Groups.getGroupMembersBySearch(groupId, pageToFetch, size, search);
      const users = response?.data?.members || [];
      const pagination = response?.data?.pagination || {};
      
      setMembers(reset ? users : [...members, ...users]);
      setPage(pageToFetch + 1);
      setHasMore(pageToFetch < (pagination.totalPages || 1));
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !loading && members.length > 0) {
      fetchMembers(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMembers(true);
    setRefreshing(false);
  };

  const handleRemoveMember = (member) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.display_name || member.name || member.email} from the group?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await agent.Groups.removeGroupMember(groupId, member.ID || member.id);
              fetchMembers(true);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove member.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDemoteMember = (member) => {
    Alert.alert(
      'Demote Organizer',
      `Are you sure you want to demote ${member.display_name || member.name || member.email} to a regular member?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Demote',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await agent.Groups.demoteGroupMember(groupId, member.ID || member.id);
              fetchMembers(true);
            } catch (error) {
              Alert.alert('Error', 'Failed to demote member.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberRow}>
      <Image
        source={item.image ? { uri: item.image } : DEFAULT_AVATAR}
        style={styles.avatar}
      />
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.display_name || item.name || item.email}</Text>
        <Text style={styles.memberRole}>{(item.is_admin === 1 || item.is_mod === 1) ? 'Organizer' : 'Member'}</Text>
      </View>
      {isAdminOrMod && currentUserId !== item.ID && creatorId !== item.ID && (
        <View style={{ flexDirection: 'row' }}>
          {(item.is_admin === 1 || item.is_mod === 1) ? (
            <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => handleDemoteMember(item)}>
              <Icon name="account-arrow-down" size={22} color="#f6c343" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => handleRemoveMember(item)}>
              <Icon name="account-remove" size={22} color="#ff4444" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const getSections = () => {
    const organizers = members.filter(member => member.is_admin === 1 || member.is_mod === 1);
    const regularMembers = members.filter(member => !(member.is_admin === 1 || member.is_mod === 1));

    return [
      {
        title: 'Organizers',
        data: organizers,
      },
      {
        title: 'Members',
        data: regularMembers,
      },
    ];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Members</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search members..."
          value={search}
          onChangeText={handleSearch}
          placeholderTextColor="#666"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')} style={styles.clearButton}>
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#122b46" style={styles.loader} />
        ) : (
          <SectionList
            sections={getSections()}
            renderItem={renderMember}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.ID?.toString() || item.id?.toString() || item.email}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshing={refreshing}
            onRefresh={onRefresh}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No members found</Text>
            }
          />
        )}
      </View>
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
  loader: {
    marginTop: 20,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  memberRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#122b46',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    margin: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#333',
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
});

export default MembersScreen; 