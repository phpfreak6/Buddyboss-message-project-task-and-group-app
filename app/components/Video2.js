import React, { useState, useRef } from 'react';
import { StyleSheet, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';

const VideoPlayer = ({ source, style, controls = false, ...props }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef(null); // Create a reference to the Video component

  // Function to toggle between play and pause
  const handleVideoPress = () => {
    if (isPlaying) {
      // Pause the video if it's playing
      setIsPlaying(false);
    } else {
      // If paused, seek to the beginning and play the video
      setIsPlaying(true);
       // Seek to the beginning of the video
    }
  };

  // Function to handle video end and pause
  const handleVideoEnd = () => {
    setIsPlaying(false); // Pause the video when it finishes
    videoRef.current.seek(0);
  };

  return (
    <View style={{ position: 'relative' }}>
      <TouchableWithoutFeedback onPress={handleVideoPress}>
        <View>
          <Video
            ref={videoRef}
            source={{ uri: source }}
            style={style}
            controls={controls}
            resizeMode="contain"
            paused={!isPlaying}
            onEnd={handleVideoEnd}
            repeat={false}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
            progressUpdateInterval={1000}
            onError={(error) => console.log('Video Error:', error)}
            onLoad={(data) => console.log('Video Loaded:', data)}
          />
        </View>
      </TouchableWithoutFeedback>

      {/* Play button */}
      {isPlaying ? null : (
        <TouchableOpacity
          style={styles.playButtonContainer}
          onPress={handleVideoPress}
        >
          <View style={styles.playButton}>
            <Icon name="play" size={30} color="white" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  video: {
    width: "100%",
    height: "100%",
  },
  playButtonContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  playButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
    borderRadius: 50,
  },
});

export default VideoPlayer;
