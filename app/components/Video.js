import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TouchableOpacity, View, TouchableWithoutFeedback } from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';

const VideoPlayer = ({
  source,
  style,
  controls = false,
  autoPlay = false,
  resizeMode = 'stretch',
  onPress,
  ...props
}) => {
  const [isPlaying, setIsPlaying] = useState(!!autoPlay);
  const videoRef = useRef(null); // Create a reference to the Video component

  // Function to toggle between play and pause
  const handleVideoPress = () => {
    if (onPress) {
      onPress();
      return;
    }
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
    videoRef.current?.seek?.(0);
  };

  useEffect(() => {
    if (autoPlay) setIsPlaying(true);
  }, [autoPlay]);

  return (
    <View style={{ position: 'relative' }}>
      {controls ? (
        <Video
          ref={videoRef}
          source={{ uri: source }}
          style={style}
          controls={true}
          resizeMode={resizeMode}
          paused={false}
          onEnd={handleVideoEnd}
          {...props}
        />
      ) : (
        <TouchableWithoutFeedback onPress={handleVideoPress}>
          <View>
            <Video
              ref={videoRef} // Attach the ref to the Video component
              source={{ uri: source }}
              style={style}
              controls={false}
              resizeMode={resizeMode}
              paused={!isPlaying} // If isPlaying is false, the video is paused
              onEnd={handleVideoEnd} // Handle video end event
              {...props}
            />
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Play button */}
      {!controls && !isPlaying ? (
        <TouchableOpacity
          style={styles.playButtonContainer}
          onPress={handleVideoPress}
        >
          <View style={styles.playButton}>
            <Icon name="play" size={30} color="white" />
          </View>
        </TouchableOpacity>
      ) : null}
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
