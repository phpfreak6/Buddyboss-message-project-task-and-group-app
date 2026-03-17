import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';
import { useNavigation } from '@react-navigation/native';

const CoursesStep = ({ groupId, onBack, onNext, isDirectAccess }) => {
  const navigation = useNavigation();
  const [hasCourse, setHasCourse] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (groupId) {
        try {
          setLoading(true);
          const response = await agent.Groups.getdetails(groupId);
          console.log(JSON.stringify(response, null, 2));
          if (response?.data?.group?.meta_data) {
            if(response.data.group.meta_data && response.data.group.meta_data._sync_group_id && response.data.group.meta_data._sync_group_id != ""){
              setHasCourse(true);
            }else{
              setHasCourse(false);
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
      const response = await agent.Groups.updateGroupCourse(groupId, { 
        hasCourse 
      });
     
      if (response?.data?.group?.group_id) {
        if (isDirectAccess) {
          return;
        } else {
          onNext && onNext(groupId);
        }
      } else {
        Alert.alert('Error', 'Failed to save settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings.');
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
        <Text style={styles.stepHeadingTop}>Courses</Text>
        <TouchableOpacity style={styles.navButton} onPress={handleSaveSettings} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.navButtonText}>{isDirectAccess ? 'Save' : 'Finish'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.stepContent}>
        <View style={styles.container}>
          <Text style={styles.heading}>Group Course Settings</Text>
          <Text style={styles.description}>
            Create and associate to a LearnDash group, allowing courses to be managed within the group.
          </Text>
          
          <View style={styles.settingsContainer}>
            
            <View style={styles.settingItem}>
              <View style={styles.checkboxContainer}>
                <Switch
                  value={hasCourse}
                  onValueChange={setHasCourse}
                  trackColor={{ false: '#ddd', true: '#6B46C1' }}
                  thumbColor="#fff"
                />
                <Text style={styles.checkboxLabel}>
                  Yes, I want this group to sync with a LearnDash group.
                </Text>
              </View>
            </View>
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
  settingsContainer: {
    gap: 24,
  },
  settingItem: {
    marginBottom: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginLeft: -15,
  },
  checkboxLabel: {
    fontSize: 17,
    color: '#223',
    marginLeft: 10,
    fontWeight: '600',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 14,
    marginTop: 4,
  },
  navBackButtonText: {
    fontSize: 15,
    color: '#122b46',
    fontWeight: '500',
    marginHorizontal: 4,
  },
});

export default CoursesStep; 