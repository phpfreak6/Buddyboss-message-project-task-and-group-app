import { NODE_BACKEND } from '@env';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, FlatList, Alert} from 'react-native';
import { connect } from 'react-redux';
import agent from '../../agent';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesomeIcon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MessageInput from '../../components/MessageInput'; // Adjust the import path as necessary
import { StatusBar, PageLoader } from '../../components';
import { LOAD_PAGE } from '../../constants';


const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
  socketConnection: state.common.socket,
});
const mapDispatchToProps = dispatch => ({
  setLoadPage: (value) => dispatch({ type: LOAD_PAGE, payload: value })
});

const API_ROOT = NODE_BACKEND;

const NewMessage = ({ navigation, socketConnection, currentUser }) => {

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showContacts, setShowContacts] = useState(true);
  const [message, setMessage] = useState('');
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [showKeyword, setShowKeyword] = useState(false);
  
  useEffect(() => {
    fetchContacts(); // Initial fetch when component mounts
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearchQuery !== '') {
      fetchContacts(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery]);

  const fetchContacts = async (query = '') => {
    try {
      setLoaderVisible(true)
      setShowContacts(true)
      const Response = await agent.Auth.getUsers(1,20,query); // Replace with your API URL

      if (Response && Response.data  && Response.data.users && Response.data.users.users && Response.data.users.pagination && Response.data.users.users.length > 0) {

        const {users, pagination} = Response.data.users;

        setContacts(users); 
      } else {
        setContacts([]);
      }
      setLoaderVisible(false)
      //const data = await response.json();
      //setContacts(data); 
    } catch (error) {
      setLoaderVisible(false)
      setContacts([]);
      console.error(error);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  const handleMessage = (query) => {
    setMessage(query);
  };
  const handleSendMessage =  async (messageText) => {

    

    
    const formData = new FormData(); 

      setLoaderVisible(true);

      
      formData.append('message', messageText.message); 
      messageText.images.forEach(image => {
        
          formData.append('images', {
              uri: image.uri,
              type: image.type,
              name: image.fileName,
          }); 
      });
      messageText.videos.forEach(video => {
        
          formData.append('videos', {
              uri: video.uri,
              type: video.type,
              name: video.fileName,
          }); 
      });
      if (messageText.documents && messageText.documents.length > 0) {

        const flatDocuments = messageText.documents.flat();

        console.log("flatDocuments", flatDocuments);
    
        flatDocuments.forEach(document => {
          formData.append('documents', {
            uri: document.uri,
            type: document.type,
            name: document.name,
          });
        });
      }

      if(selectedUsers && selectedUsers.length > 0){

        selectedUsers.forEach(users => {
        
            formData.append('users', users.ID); 
        });
      
      }

      try {

        

        let token = await AsyncStorage.getItem('jwt');

        var url = `/messages/sendNewMessage/`;

        const Response = await fetch(`${API_ROOT}${url}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        })
        .then((response) => response.json())
        .then((data) => {
          setLoaderVisible(false);
           return data;
          
        })
        .catch((error) => {
          setLoaderVisible(false);
          return error;
        });
        console.log("Response----------------", Response.data);

        if(Response && Response.isSuccess && Response.data && Response.data.thread_id && Response.data.message_id){
          setLoaderVisible(false);


          if(socketConnection && selectedUsers && selectedUsers.length > 0){

            const recipientIds = selectedUsers.map(recipient => recipient.ID);

            const fcmTokenUsers = recipientIds;
            recipientIds.push(currentUser.user.id)

            var dataMessages = {
              recipientIds,
              messageId: Response.data.message_id
            }

            //console.log("dataMessages", dataMessages);
            socketConnection.emit('sendmessage', dataMessages);
            socketConnection.emit('fcmTokens', {fcmTokenUsers,messageId: Response.data.message_id});

          }
          setSelectedUsers([]);
          navigation.navigate('ThreadScreen', { threadId: Response.data.thread_id });

            
        }else{
          setLoaderVisible(false);
          Alert.alert(Response.message);
        }



        //console.log("res",Response)

        
        // await agent.Auth.sendMessage(threadId, formData); // Send form data
      } catch (error) {
        setLoaderVisible(false);
          console.error('Error sending message:', error);
      }
  };

  const handleSelectUser = (user) => {
    if (!selectedUsers.find(selected => selected.ID === user.ID)) {
      setSelectedUsers([...selectedUsers, user]);
      setShowContacts(false);
    }

    setSearchQuery("");
    
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(user => user.ID !== userId));
  };

  const handleUpload = (type) => {
    // Implement the upload functionality based on the type
    console.log(`Upload ${type} functionality to be implemented.`);
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity 
      style={[styles.contactItem, selectedUsers.find(selected => selected.ID === item.ID) && styles.selectedContactItem]}
      onPress={() => handleSelectUser(item)}
      index={item.ID}
    >
      <Image source={{ uri: item.image }} style={styles.avatar} />
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.display_name}</Text>
        <Text style={styles.contactMessage}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>New Message</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButton}>Cancel</Text>
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder="To:"
        value={searchQuery}
        onChangeText={handleSearch}
        placeholderTextColor="#999"
      />

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <View style={styles.selectedUsersContainer}>
          <FlatList
            horizontal
            data={selectedUsers}
            keyExtractor={item => item.ID}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.selectedUser}
                onPress={() => handleRemoveUser(item.ID)}
              >
                <Text style={styles.selectedUserText}>{item.display_name}</Text>
                <Text style={styles.removeIcon}>×</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {showContacts && (
        <FlatList
          data={contacts}
          renderItem={renderContact}
          keyExtractor={item => item.ID.toString()}
          style={styles.contactsList}
        />
      )}

      {/* Show input and upload options only when users are selected */}
      {selectedUsers.length > 0 && (
        <MessageInput 
          isExpanded={isExpanded} 
          setIsExpanded={setIsExpanded} 
          message={message} 
          handleMessage={handleMessage} 
          handleSendMessage={handleSendMessage}
          setShowKeyword={setShowKeyword} 
          messageInputFrom={"NewMessage"}
        />
      )}

      <PageLoader visible={loaderVisible} setVisible={setLoaderVisible} />
    </View>
    
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cancelButton: {
    fontSize: 16,
    color: '#6200ee',
  },
  searchInput: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 16,
  },
  selectedUsersContainer: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginHorizontal: 4,
  },
  selectedUserText: {
    fontSize: 14,
    marginRight: 4,
  },
  removeIcon: {
    fontSize: 18,
    color: '#666',
  },
  contactsList: {
    flex: 1,
    height: 200,
    maxHeight: 500
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactMessage: {
    fontSize: 14,
    color: '#999',
  },
  selectedContactItem: {
    backgroundColor: '#e0f7fa',
  },
  selectedUsersDisplay: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 16,
  },
  selectedUsersText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  selectedUsersNames: {
    fontSize: 14,
    color: '#333',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
  },
  iconContainer: {
    width: '60%',
    display: 'flex',
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  uploadOptionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  uploadButton: {
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    color: '#6200ee',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'end',
    width: '40%',
  },
  submitButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#6200ee',
    borderRadius: 8,
    justifyContent: "end"
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  iconContainer2: {
    position: 'absolute',
    right: 20,
    top: 18,
  },
});

export default connect(mapStateToProps)(NewMessage); 