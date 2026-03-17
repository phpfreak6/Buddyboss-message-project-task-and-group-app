import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';
import { useNavigation } from '@react-navigation/native';

const ForumStep = ({ groupId, onBack, onNext, isDirectAccess }) => {
  const navigation = useNavigation();
  const [hasForum, setHasForum] = useState(false);
  const [loading, setLoading] = useState(false);


  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (groupId) {
        try {
          setLoading(true);
          const response = await agent.Groups.getdetails(groupId);
          if (response?.data?.group?.id) {
            if(response.data.group.enable_forum == "1"){
              setHasForum(true);
            }else{
              setHasForum(false);
            }
          } else {
            Alert.alert('Error', 'Failed to fetch group details.');
          }
        } catch (error) {
          console.error('Error fetching group details:', error);
          Alert.alert('Error', 'Failed to fetch group details.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGroupDetails();
  }, [groupId]);

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const response = await agent.Groups.updateGroupForum(groupId, { hasForum });
      if (response?.data?.group?.group_id) {
        if (isDirectAccess) {
          return;
        } else {
          onNext && onNext(groupId);
        }
      } else {
        Alert.alert('Error', 'Failed to save forum setting.');
      }
    } catch (error) {
      console.error('Error saving forum setting:', error);
      Alert.alert('Error', 'Failed to save forum setting.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (isDirectAccess) {
      navigation.goBack();
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButtonBack} onPress={handleBackPress}>
          <Icon name="arrow-left" size={22} color="#122b46" />
          <Text style={styles.navBackButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepHeadingTop}>Forum</Text>
        <TouchableOpacity style={styles.navButton} onPress={handleSaveSettings} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.navButtonText}>{isDirectAccess ? 'Save' : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.stepContent}>
        <View style={styles.container}>
          <Text style={styles.heading}>Group Forum</Text>
          <Text style={styles.description}>
            Create a discussion forum to allow members of this group to communicate in a structured, bulletin-board style fashion.
          </Text>
          <View style={styles.checkboxContainer}>
            <Switch
              value={hasForum}
              onValueChange={setHasForum}
              trackColor={{ false: '#ddd', true: '#6B46C1' }}
              thumbColor="#fff"
            />
            <Text style={styles.checkboxLabel}>
              Yes, I want this group to have a discussion forum.
            </Text>
          </View>
        </View>
      </ScrollView>
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
  stepContent: {
    padding: 16,
  },
  stepHeadingTop: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    minHeight: 400,
    paddingTop: 10,
  },
  container: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#223',
    marginBottom: 18,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
    textAlign: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 17,
    color: '#223',
    marginLeft: 14,
    fontWeight: '600',
  },
  navBackButtonText: {
    fontSize: 15,
    color: '#122b46',
    fontWeight: '500',
    marginHorizontal: 4,
  },
});

export default ForumStep; 