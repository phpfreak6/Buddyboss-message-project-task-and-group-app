import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Image, ActivityIndicator, RefreshControl, Modal, Alert, Platform, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {  useFocusEffect } from '@react-navigation/native';
import agent from '@/agent';
import RNFS from 'react-native-fs';
import { check, PERMISSIONS, request, RESULTS } from 'react-native-permissions';
import Share from 'react-native-share';
import VideoPlayer from '@/components/Video2';

const VideosScreen = ({ navigation, route }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isOptionsVisible, setIsOptionsVisible] = useState(false);

  const groupId = route.params?.groupId;

  useFocusEffect(
    React.useCallback(() => {
      fetchVideos(true);
    }, [])
  );

  const fetchVideos = async (reset = false) => {
    setLoading(reset);
    setIsFetchingMore(!reset);
    try {
      let pageToFetch = reset ? 1 : page;
      let size = 20;

      const response = await agent.Groups.getGroupVideos(groupId, pageToFetch, size);
      console.log(JSON.stringify(response, null, 2))
      const videosData = response?.data?.videos || [];
      const pagination = response?.data?.pagination || {};
      
      setVideos(reset ? videosData : [...videos, ...videosData]);
      setPage(pageToFetch + 1);
      setHasMore(pageToFetch < (pagination.totalPages || 1));
    } catch (error) {
      console.error('Error fetching videos:', error);
      Alert.alert("Error", "Failed to fetch videos. Please try again.");
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !loading && videos.length > 0) {
      fetchVideos(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setPage(1);
    fetchVideos(true).finally(() => setRefreshing(false));
  }, []);

  const handleVideoPress = (video) => {
    console.log('Video URL:', video.url);
    // Validate URL format
    if (!video.url || !video.url.startsWith('http')) {
      Alert.alert(
        "Error",
        "Invalid video URL format",
        [{ text: "OK" }]
      );
      return;
    }
    setSelectedVideo(video);
    setIsModalVisible(true);
  };

  const handleOptionsPress = () => {
    setIsOptionsVisible(true);
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
      
      const videoUrl = selectedVideo.url;
      const timestamp = new Date().getTime();
      const fileName = `video_${timestamp}.mp4`;

      if (Platform.OS === 'ios') {
        // For iOS, use share sheet to save to Photos
        const tempPath = `${RNFS.CachesDirectoryPath}/${fileName}`;
        
        // Download to temp location first
        const downloadResult = await RNFS.downloadFile({
          fromUrl: videoUrl,
          toFile: tempPath,
          background: true,
        }).promise;

        if (downloadResult.statusCode === 200) {
          // Share the video
          await Share.open({
            url: Platform.OS === 'ios' ? tempPath : `file://${tempPath}`,
            type: 'video/mp4',
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
          fromUrl: videoUrl,
          toFile: downloadPath,
          background: true,
        }).promise;

        if (downloadResult.statusCode === 200) {
          Alert.alert(
            "Success",
            "Video has been saved to your Downloads folder.",
            [{ text: "OK" }]
          );
        } else {
          throw new Error('Download failed');
        }
      }
    } catch (error) {
      console.error('Error downloading video:', error);
      Alert.alert(
        "Error",
        "Failed to download video. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleOpenVideo = async () => {
    try {
      const videoUrl = selectedVideo.url;
      
      // Check if the URL can be opened
      const canOpen = await Linking.canOpenURL(videoUrl);
      
      if (canOpen) {
        await Linking.openURL(videoUrl);
      } else {
        Alert.alert(
          "Error",
          "Could not open the video. Please try downloading it instead.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error('Error opening video:', error);
      Alert.alert(
        "Error",
        "Could not open the video. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const renderVideoDetail = () => (
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
          <View style={styles.videoPlayerContainer}>
            <VideoPlayer 
              source={selectedVideo?.url} 
              style={styles.videoPlayer}
              controls={true}
              onError={(error) => {
                console.log('Video Player Error:', {
                  url: selectedVideo?.url,
                  error: error
                });
              }}
            />
          </View>
          <View style={styles.modalInfo}>
            <Text style={styles.videoTitle} numberOfLines={2}>
              {selectedVideo?.title}
            </Text>
            <Text style={styles.videoDate}>
              {new Date(selectedVideo?.date_created).toLocaleDateString()}
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
          <TouchableOpacity style={styles.optionsOption} onPress={handleOpenVideo}>
            <Icon name="eye" size={24} color="#122b46" />
            <Text style={styles.optionText}>Open</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionsOption} onPress={handleDownload}>
            <Icon name="download" size={24} color="#122b46" />
            <Text style={styles.optionText}>Download</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderVideo = ({ item }) => (
    <TouchableOpacity 
      style={styles.videoContainer}
      onPress={() => handleVideoPress(item)}
    >
      <View style={styles.thumbnailContainer}>
        <Image
          source={{ uri: item.thumbnail_url || 'https://via.placeholder.com/320x180?text=Video' }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.playButton}>
          <Icon name="play" size={24} color="#fff" />
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.videoDate}>{new Date(item.date_created).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Videos</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => navigation.navigate('GroupMenu', { screen: 'AddGroupVideo', params: { groupId } })}
        >
          <Icon name="plus" size={24} color="#122b46" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#122b46" style={styles.loader} />
        ) : (
          <FlatList
            data={videos}
            renderItem={renderVideo}
            keyExtractor={(item) => item.id.toString()}
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
              <Text style={styles.emptyText}>No videos found</Text>
            }
          />
        )}
      </View>
      {renderVideoDetail()}
      {renderOptionsModal()}
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
  loader: {
    marginTop: 20,
  },
  videoContainer: {
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  thumbnailContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 16/9,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  duration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationText: {
    color: '#fff',
    fontSize: 12,
  },
  videoInfo: {
    padding: 12,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  videoDate: {
    fontSize: 12,
    color: '#666',
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
  videoPlayerContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#000',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  modalInfo: {
    padding: 16,
    backgroundColor: '#fff',
  },
  videoDuration: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
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
});

export default VideosScreen; 