import React,  { useState, useEffect, Fragment } from 'react';
import { connect } from 'react-redux';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Button } from 'react-native-paper';  // Importing button from react-native-paper
import { useNavigation, useIsFocused } from '@react-navigation/native'; // Import useNavigation and useIsFocused
import agent from '@/agent';

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
  isLoggedIn: state.common.isLoggedIn,
});
const mapDispatchToProps = dispatch => ({});

const Home = (props) => {
  const { currentUser, token, isLoggedIn, checkLoginValue, loationId } = props;
  const navigation = useNavigation(); // Get navigation prop
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const isFocused = useIsFocused();

  // Handle Button Click
  const handleButtonClick = () => {
    alert('Button clicked!');
  }

  // Handle Messages Button Click
  const handleMessagesClick = () => {
    navigation.navigate('Message'); // Navigate to Messages screen
  }

  const handleNotificationsClick = () => {
    navigation.navigate('Notification');
  }

  useEffect(() => {
    if(currentUser) {
     //console.log("cr",currentUser)
    }
  }, [currentUser])

  const fetchUnreadNotificationCount = async () => {
    try {
      const response = await agent.Auth.getUnreadNotificationCount();
      if (
        response &&
        response.isSuccess &&
        response.data &&
        typeof response.data.unreadCount === 'number'
      ) {
        setUnreadNotificationCount(response.data.unreadCount);
      } else {
        setUnreadNotificationCount(0);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      setUnreadNotificationCount(0);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchUnreadNotificationCount();
    }
  }, [isFocused]);

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Hi {(currentUser && currentUser.user) ? 
        (currentUser.user.first_name ? currentUser.user.first_name : 
         (currentUser.user.display_name ? currentUser.user.display_name : null)) : null}</Text>
    
      
      <TouchableOpacity style={styles.buttonContainer} onPress={handleMessagesClick}>
        <Button mode="contained" style={styles.button}><Text style={{color:"#fff"}}>Messages</Text></Button> 
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonContainer} onPress={() => navigation.navigate('CustomMenu')}>
        <Button mode="contained" style={styles.button}><Text style={{color:"#fff"}}>Custom Menus</Text></Button> 
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonContainer} onPress={() => navigation.navigate('Projects')}>
        <Button mode="contained" style={styles.button}><Text style={{color:"#fff"}}>Task & Projects Centre</Text></Button> 
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonContainer} onPress={() => navigation.navigate('Courses')}>
        <Button mode="contained" style={styles.button}><Text style={{color:"#fff"}}>Training Courses</Text></Button> 
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonContainer} onPress={handleNotificationsClick}>
        <Button mode="contained" style={styles.button}>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Notifications</Text>
            {unreadNotificationCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadNotificationCount > 9999 ? '9999+' : unreadNotificationCount}
                </Text>
              </View>
            )}
          </View>
        </Button> 
      </TouchableOpacity>
      
      
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  heading: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: "center"
  },
  image: {
    width: 150,
    height: 150,
    marginBottom: 20,
    resizeMode: 'contain',
  },
  buttonContainer: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#122b46',
    paddingHorizontal: 50,
    paddingVertical: 8,
    width: 340
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    marginTop: Platform.OS === 'android' ? 0 : 6,
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#ffb300',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    marginTop: Platform.OS === 'android' ? 0 : 6,
  },
  badgeText: {
    color: '#122b46',
    fontSize: 12,
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: '#555',
    paddingHorizontal: 20,
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Home);
