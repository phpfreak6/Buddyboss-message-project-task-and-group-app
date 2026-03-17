import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator, RefreshControl, Modal, TextInput, Alert, Platform, Linking } from 'react-native';
import {  useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';
import RNFS from 'react-native-fs';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Share from 'react-native-share';

const PhotosScreen = ({ navigation, route }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [editedCaption, setEditedCaption] = useState('');

  const groupId = route.params?.groupId;

  // useEffect(() => {
  //   fetchPhotos(true);
  // }, []);
  useFocusEffect(
    React.useCallback(() => {
      fetchPhotos(true);
    }, [])
  );

  const fetchPhotos = async (reset = false) => {
    setLoading(reset);
    setIsFetchingMore(!reset);
    try {
      let pageToFetch = reset ? 1 : page;
      let size = 10000;

      const response = await agent.Groups.getGroupPhotos(groupId, pageToFetch, size);

     
      const photosData = response?.data?.photos || [];
      const pagination = response?.data?.pagination || {};
      
      setPhotos(reset ? photosData : [...photos, ...photosData]);
      setPage(pageToFetch + 1);
      setHasMore(pagination.currentPage < pagination.totalPages);
    } catch (error) {
      console.error('Error fetching photos:', error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !loading && photos.length > 0) {
      fetchPhotos(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchPhotos(true).finally(() => setRefreshing(false));
  }, []);

  const handlePhotoPress = (photo) => {
    setSelectedPhoto(photo);
    setEditedCaption(photo.description || '');
    setIsModalVisible(true);
  };

  const handleOptionsPress = () => {
    setIsOptionsVisible(true);
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Photo",
      "Are you sure you want to delete this photo?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await agent.Groups.deleteGroupPhoto(groupId, selectedPhoto.id);
              setPhotos(photos.filter(p => p.id !== selectedPhoto.id));
              setIsOptionsVisible(false);
              setIsModalVisible(false);
            } catch (error) {
              console.error('Error deleting photo:', error);
              Alert.alert("Error", "Failed to delete photo. Please try again.");
            }
          }
        }
      ]
    );
  };

  const checkAndRequestPermission = async () => {
    if (Platform.OS === 'ios') {
      const result = await check(PERMISSIONS.IOS.PHOTO_LIBRARY);
      if (result === RESULTS.GRANTED) return true;
      if (result === RESULTS.DENIED) {
        const requestResult = await request(PERMISSIONS.IOS.PHOTO_LIBRARY);
        return requestResult === RESULTS.GRANTED;
      }
    }
    return true; // Android doesn't need permission for Download directory
  };

  const handleDownload = async () => {
    try {
      setIsOptionsVisible(false);
      
      const photoUrl = selectedPhoto.url;
      const timestamp = new Date().getTime();
      
      // Get file extension from URL or default to .jpg
      const getFileExtension = (url) => {
        const match = url.match(/\.([^./?#]+)(?:\?|$)/);
        return match ? `.${match[1].toLowerCase()}` : '.jpg';
      };
      
      const fileExtension = getFileExtension(photoUrl);
      const fileName = `photo_${timestamp}${fileExtension}`;

      if (Platform.OS === 'ios') {
        // For iOS, use share sheet to save to Photos
        const tempPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        
        // Download to temp location first
        const downloadResult = await RNFS.downloadFile({
          fromUrl: photoUrl,
          toFile: tempPath,
          background: true,
        }).promise;

        if (downloadResult.statusCode === 200) {
          // Share the photo
          await Share.open({
            url: Platform.OS === 'ios' ? tempPath : `file://${tempPath}`,
            type: 'image/jpeg',
            saveToFiles: true,
          });
          
          // Clean up temp file
          await RNFS.unlink(tempPath);
        } else {
          throw new Error('Download failed');
        }
      } else {
        // For Android, save to Download directory
        const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        
        const downloadResult = await RNFS.downloadFile({
          fromUrl: photoUrl,
          toFile: downloadPath,
          background: true,
        }).promise;

        if (downloadResult.statusCode === 200) {
          Alert.alert(
            "Success",
            "Photo has been saved to your Downloads folder.",
            [{ text: "OK" }]
          );
        } else {
          throw new Error('Download failed');
        }
      }
    } catch (error) {
      console.error('Error downloading photo:', error);
      Alert.alert(
        "Error",
        "Failed to download photo. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleMove = () => {
    // Implement move functionality
    setIsOptionsVisible(false);
  };

  const handleSaveCaption = async () => {
    try {
      await agent.Groups.updateGroupPhotoDetail(groupId, selectedPhoto.id, { description: editedCaption });
      
      // Update the photos array with the new description
      const updatedPhotos = photos.map(p => 
        p.id === selectedPhoto.id ? { ...p, description: editedCaption } : p
      );
      setPhotos(updatedPhotos);
      
      // Update the selected photo as well
      setSelectedPhoto(prev => ({ ...prev, description: editedCaption }));
      
      setIsEditingCaption(false);
      setIsModalVisible(false);
    } catch (error) {
      console.error('Error updating caption:', error);
      Alert.alert(
        "Error",
        "Failed to update caption. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleOpenPhoto = async () => {
    try {
      const photoUrl = selectedPhoto.url;
      
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(photoUrl);
      
      if (canOpen) {
        await Linking.openURL(photoUrl);
      } else {
        // If direct URL opening fails, try downloading and opening locally
        const timestamp = new Date().getTime();
        const fileName = `photo_${timestamp}.jpg`;
        const downloadPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;

        const downloadResult = await RNFS.downloadFile({
          fromUrl: photoUrl,
          toFile: downloadPath,
          background: true,
        }).promise;

        if (downloadResult.statusCode === 200) {
          const fileUrl = Platform.OS === 'ios' ? downloadPath : `file://${downloadPath}`;
          await Linking.openURL(fileUrl);
          
          // Clean up the temporary file after a delay
          setTimeout(async () => {
            try {
              await RNFS.unlink(downloadPath);
            } catch (error) {
              console.error('Error cleaning up file:', error);
            }
          }, 1000);
        } else {
          throw new Error('Failed to download photo');
        }
      }
    } catch (error) {
      console.error('Error opening photo:', error);
      Alert.alert(
        "Error",
        "Could not open the photo. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const renderPhotoDetail = () => (
    <Modal
      visible={isModalVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setIsModalVisible(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Icon name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleOptionsPress}>
              <Icon name="dots-vertical" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: selectedPhoto?.url }}
            style={styles.modalPhoto}
            resizeMode="contain"
          />
          <View style={styles.modalInfo}>
            {isEditingCaption ? (
              <View style={styles.captionEditContainer}>
                <TextInput
                  style={styles.captionInput}
                  value={editedCaption}
                  onChangeText={setEditedCaption}
                  multiline
                  placeholder="Add a caption..."
                />
                <View style={styles.captionEditButtons}>
                  <TouchableOpacity onPress={() => setIsEditingCaption(false)}>
                    <Text style={styles.captionButton}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleSaveCaption}>
                    <Text style={[styles.captionButton, styles.saveButton]}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.captionContainer}
                onPress={() => setIsEditingCaption(true)}
              >
                <Text style={styles.captionText}>
                  {selectedPhoto?.description  || 'Add a caption...'}
                </Text>
                <Icon name="pencil" size={16} color="#666" />
              </TouchableOpacity>
            )}
            <Text style={styles.photoDate}>
              {new Date(selectedPhoto?.date_created).toLocaleDateString()}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderOptionsModal = () => (
    <Modal
      visible={isOptionsVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsOptionsVisible(false)}
    >
      <TouchableOpacity 
        style={styles.optionsOverlay}
        activeOpacity={1}
        onPress={() => setIsOptionsVisible(false)}
      >
        <View style={styles.optionsContainer}>
          <TouchableOpacity style={styles.optionsOption} onPress={handleOpenPhoto}>
            <Icon name="eye" size={24} color="#122b46" />
            <Text style={styles.optionText}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionsOption} onPress={handleDownload}>
            <Icon name="download" size={24} color="#122b46" />
            <Text style={styles.optionText}>Download</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity style={styles.optionsOption} onPress={handleMove}>
            <Icon name="folder-move" size={24} color="#122b46" />
            <Text style={styles.optionText}>Move</Text>
          </TouchableOpacity> */}
          {/* <TouchableOpacity style={styles.optionsOption} onPress={handleDelete}>
            <Icon name="delete" size={24} color="#ff4444" />
            <Text style={[styles.optionText, styles.deleteText]}>Delete</Text>
          </TouchableOpacity> */}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderPhoto = ({ item }) => (
    <TouchableOpacity 
      style={styles.photoContainer}
      onPress={() => handlePhotoPress(item)}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.photo}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photos</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('GroupMenu', { screen: 'AddGroupPhoto', params: { groupId } })}
        >
          <Icon name="plus" size={24} color="#122b46" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#122b46" style={styles.loader} />
        ) : (
          <FlatList
            data={photos}
            renderItem={renderPhoto}
            keyExtractor={(item) => item.id.toString()}
            numColumns={4}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#122b46']}
                tintColor="#122b46"
              />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No photos found</Text>
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
      {renderPhotoDetail()}
      {renderOptionsModal()}
    </View>
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
    paddingVertical: 12,
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
  addButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  loader: {
    marginTop: 20,
  },
  photoContainer: {
    flex: 1,
    margin: 4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
  },
  photoInfo: {
    padding: 8,
  },
  photoDate: {
    fontSize: 12,
    color: '#666',
  },
  photoCaption: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingVertical: 50,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  modalPhoto: {
    flex: 1,
    width: '100%',
  },
  modalInfo: {
    padding: 16,
    backgroundColor: '#fff',
  },
  captionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  captionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  captionEditContainer: {
    marginBottom: 8,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    minHeight: 80,
  },
  captionEditButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  captionButton: {
    fontSize: 16,
    color: '#666',
    marginLeft: 16,
  },
  saveButton: {
    color: '#122b46',
    fontWeight: 'bold',
  },
  optionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  optionsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 16,
    color: '#122b46',
  },
  deleteText: {
    color: '#ff4444',
  },
});

export default PhotosScreen; 