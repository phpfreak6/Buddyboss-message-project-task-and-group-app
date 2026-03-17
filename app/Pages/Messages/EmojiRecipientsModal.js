import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView, ActivityIndicator } from 'react-native';
import FastImage from 'react-native-fast-image';
import EmojiRenderer from '../../components/EmojiRenderer'; 

const SeenRecipientsModal = ({ visible, recipientsData, onClose }) => {
  const [imageLoadProgress, setImageLoadProgress] = useState({});

  return (
    <Modal
      animationType="slide" // Bottom to top animation
      transparent={true}
      visible={visible}
      onRequestClose={onClose} // Close modal on back press
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Users Reactions</Text>
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {recipientsData && recipientsData.map((recipient, index) => (
              <View key={index} style={styles.recipientContainerMain}>
                <View style={styles.recipientContainer}>
                  <View style={styles.recipientImageContainer}>
                    <FastImage 
                      source={{ uri: recipient.userData.image }}
                      style={styles.recipientImage}
                      onLoadStart={() => setImageLoadProgress(prev => ({...prev, [index]: 0}))}
                      onProgress={({ nativeEvent }) => {
                        const progress = nativeEvent.loaded / nativeEvent.total;
                        setImageLoadProgress(prev => ({...prev, [index]: progress}));
                      }}
                      onLoadEnd={() => setImageLoadProgress(prev => ({...prev, [index]: 1}))}
                    />
                    {imageLoadProgress[index] < 1 && (
                      <View style={styles.progressOverlay}>
                        <ActivityIndicator size="small" color="#0000ff" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.recipientItem}>
                    {recipient.userData.display_name}
                  </Text>
                </View>
                <View style={styles.recipientImoji}>
                  <Text style={styles.recipientItem}>
                     <EmojiRenderer message={recipient.emoji} width={10} />
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Align modal to the bottom
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Overlay background
  },
  modalContent: {
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  recipientContainerMain: {
    flexDirection: 'row', // Align items in a row
    alignItems: 'center', // Center items vertically
    justifyContent: "space-between",
  },
  recipientContainer: {
    flexDirection: 'row', // Align items in a row
    alignItems: 'center', // Center items vertically
    marginVertical: 5,
  },
  recipientImageContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    marginRight: 10,
  },
  recipientImage: {
    width: 40, // Set width for the image
    height: 40, // Set height for the image
    borderRadius: 20, // Make the image circular
  },
  recipientItem: {
    fontSize: 16,
    marginVertical: 5,
  },
  closeButton: {
    marginTop: 20,
    color: 'blue',
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 600, // Set your desired maximum height
  },
  progressOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SeenRecipientsModal; 