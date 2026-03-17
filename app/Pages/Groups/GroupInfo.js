import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const GroupInfo = ({ route, navigation }) => {
  const { groupData } = route.params;
  if (!groupData) return null;

  const formatRelativeTime = (dateString) => {
    if (!dateString || dateString === 'N/A') return 'N/A';
    
    // Convert UTC string to local date
    const date = new Date(dateString + 'Z'); // Add 'Z' to ensure UTC interpretation
    const now = new Date();
    
    // Get UTC timestamps
    const utcDate = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
    
    const utcNow = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours(),
      now.getUTCMinutes(),
      now.getUTCSeconds()
    );
    
    const diffInSeconds = Math.floor((utcNow - utcDate) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} week${diffInWeeks !== 1 ? 's' : ''} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
  };

  const getPrivacyInfo = (status) => {
    switch (status) {
      case 'hidden':
        return {
          icon: 'eye-off-outline',
          title: 'Hidden group',
          subtitle: 'This group is hidden from search and directory'
        };
      case 'private':
        return {
          icon: 'lock-outline',
          title: 'Private group',
          subtitle: 'Only members can see group content'
        };
      case 'public':
      default:
        return {
          icon: 'eye-outline',
          title: 'Public group',
          subtitle: 'Anyone can see group content'
        };
    }
  };

  // Map the data structure to match component expectations
  const isHidden = groupData?.status === 'hidden';
  const memberCount = groupData?.meta_data?.total_member_count || '0';
  const lastActive = formatRelativeTime(groupData?.meta_data?.last_activity);
  const description = groupData?.description || '';
  const privacyInfo = getPrivacyInfo(groupData?.status);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>ABOUT</Text>
      <View style={styles.infoRow}>
        <Icon name={privacyInfo.icon} size={20} color="#222" style={styles.icon} />
        <View>
          <Text style={styles.infoTitle}>{privacyInfo.title}</Text>
          <Text style={styles.infoSubtitle}>{privacyInfo.subtitle}</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <Icon name="account-group-outline" size={20} color="#222" style={styles.icon} />
        <View>
          <Text style={styles.infoTitle}>{memberCount} member{memberCount !== '1' ? 's' : ''}</Text>
          <Text style={styles.infoSubtitle}>Total members in this group</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <Icon name="calendar-clock" size={20} color="#222" style={styles.icon} />
        <View>
          <Text style={styles.infoTitle}>Active {lastActive}</Text>
        </View>
      </View>
      <View style={styles.sectionDivider} />
      <Text style={styles.header}>DESCRIPTION</Text>
      <Text style={styles.description}>{description || 'No description available'}</Text>
      
      {groupData?.enable_forum ? (
        <>
        <View style={styles.sectionDivider} />
        <View style={styles.infoRow}>
          <Icon name="forum-outline" size={20} color="#222" style={styles.icon} />
          <View>
            <Text style={styles.infoTitle}>Forum Enabled</Text>
            <Text style={styles.infoSubtitle}>Group discussion forum</Text>
          </View>
        </View>
        </>
      ) : null}
      <TouchableOpacity style={styles.showAllBtn} onPress={() => navigation.navigate('GroupMenu', { screen: 'MembersScreen', params: { groupId: groupData.id } })}>
        <Text style={styles.showAllText}>View Members</Text>
        <Icon name="chevron-right" size={20} color="#222" />
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafbfc',
    padding: 16,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#222',
    marginTop: 16,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  infoTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#222',
  },
  infoSubtitle: {
    color: '#8a8a8a',
    fontSize: 13,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  description: {
    color: '#6a6a6a',
    fontSize: 14,
    marginBottom: 8,
  },
  showAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    paddingVertical: 10,
    justifyContent: 'center',
    marginTop: 16,
  },
  showAllText: {
    color: '#222',
    fontWeight: '500',
    fontSize: 15,
    marginRight: 6,
  },
});

export default GroupInfo; 