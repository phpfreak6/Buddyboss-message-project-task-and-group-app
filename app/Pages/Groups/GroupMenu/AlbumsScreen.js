import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, FlatList, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';

const AlbumsScreen = ({ navigation, route }) => {
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const groupId = route.params?.groupId;

  useEffect(() => {
    fetchAlbums(true);
  }, []);

  const fetchAlbums = async (reset = false) => {
    setLoading(reset);
    setIsFetchingMore(!reset);
    try {
      let pageToFetch = reset ? 1 : page;
      let size = 20;

      const response = await agent.Groups.getGroupAlbums(groupId, pageToFetch, size);
      const albumsData = response?.data?.albums || [];
      const pagination = response?.data?.pagination || {};
      
      setAlbums(reset ? albumsData : [...albums, ...albumsData]);
      setPage(pageToFetch + 1);
      setHasMore(pageToFetch < (pagination.totalPages || 1));
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleLoadMore = () => {
    if (!isFetchingMore && hasMore && !loading && albums.length > 0) {
      fetchAlbums(false);
    }
  };

  const renderAlbum = ({ item }) => (
    <TouchableOpacity style={styles.albumContainer}>
      <View style={styles.albumCover}>
        {item.cover_photo ? (
          <Image
            source={{ uri: item.cover_photo }}
            style={styles.coverImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderCover}>
            <Icon name="image-multiple" size={40} color="#666" />
          </View>
        )}
        <View style={styles.photoCount}>
          <Text style={styles.photoCountText}>{item.photo_count} photos</Text>
        </View>
      </View>
      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.albumDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Albums</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#122b46" style={styles.loader} />
        ) : (
          <FlatList
            data={albums}
            renderItem={renderAlbum}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No albums found</Text>
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
  albumContainer: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
  },
  albumCover: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  placeholderCover: {
    width: '100%',
    height: '100%',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoCount: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  photoCountText: {
    color: '#fff',
    fontSize: 12,
  },
  albumInfo: {
    padding: 12,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  albumDate: {
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
});

export default AlbumsScreen; 