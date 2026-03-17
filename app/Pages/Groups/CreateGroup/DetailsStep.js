import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';
import { useNavigation } from '@react-navigation/native';

const DetailsStep = ({ navigation: propNavigation, groupId: initialGroupId, setGroupId, onBack, onNext, isDirectAccess }) => {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch initial data if editing an existing group
  useEffect(() => {
    const fetchGroupDetails = async () => {
      if (initialGroupId) {
        try {
          setLoading(true);
          const response = await agent.Groups.getdetails(initialGroupId);
          if (response?.data?.group?.id) {
            setName(response.data.group.name);
            setDescription(response.data.group.description);
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
  }, [initialGroupId]); // Re-run effect if initialGroupId changes

  const handleSave = async () => {
    if (!name) {
      Alert.alert('Validation', 'Group name required.');
      return;
    }
    try {
      setLoading(true);
      let response;
      if (initialGroupId) {
        // Update existing group
        response = await agent.Groups.updateDetails(initialGroupId, {
          name: name,
          description: description,
        });

        console.log(response)
        if (response?.data?.group?.id) {
          if (isDirectAccess) {
            return;
          }else{
            onNext(initialGroupId); 
          }
          
        } else {
          Alert.alert('Error', 'Failed to update group.');
        }
      } else {
        // Create new group
        response = await agent.Groups.createGroup({
          name: name,
          description: description,
        });
        if (response?.data?.group_id) {
          const newGroupId = response.data.group_id;
          setGroupId(newGroupId); 
          onNext(newGroupId); 
        } else {
          Alert.alert('Error', 'Failed to create group.');
        }
      }
    } catch (error) {
      console.error('Error saving group:', error);
      Alert.alert('Error', 'Failed to save group.');
    } finally {
      setLoading(false);
    }
  };

  // Call handleSave when the 'Next' button is pressed
  const handleNextPress = () => {
    
    handleSave();
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
        <Text style={styles.stepHeadingTop}>Details</Text>
        <TouchableOpacity style={styles.navButton} onPress={handleNextPress} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.navButtonText}>{isDirectAccess ? 'Save' : 'Save'}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Form Content */}
      <View style={styles.stepContent}>
        {loading && !name && !description ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#122b46" />
          </View>
        ) : (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Group Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter group name"
                value={name}
                onChangeText={setName}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your group"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </>
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
    color: "#fff"
  },
  navBackButtonText: {
    fontSize: 15,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  navButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  stepContent: {
    padding: 16,
    flex: 1,
  },
  stepHeadingTop: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  saveButton: {
    backgroundColor: '#122b46',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DetailsStep; 