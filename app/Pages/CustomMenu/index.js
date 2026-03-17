import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { IconButton, Button } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import agent from '@/agent';

const CustomMenu = () => {
  const navigation = useNavigation();
  const [menuItems, setMenuItems] = useState([]);
  const [showLoader, setShowLoader] = useState(false);
  const [statusProps, setStatusProps] = useState({ type: '', message: '' });
  const [showStatus, setShowStatus] = useState(false);

  const fetchCustomMenus = async () => {
    try {
      setShowLoader(true);
      const response = await agent.Auth.getCustomMenus();

      if (response && response.isSuccess && response.data && response.data.menus) {
        const customMenuItems = Object.entries(response.data.menus).map(([title, url], index) => ({
          id: `custom-menu-${index}`,
          name: title,
          url: url
        }));

        setMenuItems(customMenuItems);
      } else {
        setMenuItems([]);
      }
    } catch (error) {
      console.error('Error fetching custom menus:', error);
      setStatusProps({
        type: 'error',
        message: 'Failed to load custom menus'
      });
      setShowStatus(true);
      setMenuItems([]);
    } finally {
      setShowLoader(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCustomMenus();
    }, [])
  );

  const handleRowPress = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        setStatusProps({
          type: 'error',
          message: 'Cannot open URL: ' + url
        });
        setShowStatus(true);
      }
    } catch (error) {
      setStatusProps({
        type: 'error',
        message: 'Error opening URL'
      });
      //setShowStatus(true);
    }
  };

  const EmptyStateMessage = () => (
    <View style={styles.emptyStateContainer}>
      <IconButton
        icon="menu"
        size={50}
        iconColor="#122b46"
        style={styles.emptyStateIcon}
      />
      <Text style={styles.emptyStateTitle}>No Menu Items Yet</Text>
      <Text style={styles.emptyStateMessage}>
        No custom menu items available
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      
      {showStatus && (
        <View style={[styles.statusContainer, statusProps.type === 'error' ? styles.errorStatus : styles.successStatus]}>
          <Text style={styles.statusText}>{statusProps.message}</Text>
          <IconButton
            icon="close"
            size={20}
            onPress={() => setShowStatus(false)}
            style={styles.closeStatusButton}
          />
        </View>
      )}
      
      {showLoader && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#122b46" />
        </View>
      )}

      <ScrollView style={styles.scrollView}>
        {menuItems.length === 0 ? (
          <EmptyStateMessage />
        ) : (
          menuItems.map((item) => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItemRow}
              onPress={() => handleRowPress(item.url)}
            >
              <View style={styles.menuItemContent}>
                <IconButton
                  icon="link-variant"
                  size={24}
                  iconColor="#122b46"
                  style={styles.menuItemIcon}
                />
                <Text style={styles.menuItemName}>{item.name}</Text>
              </View>
              <IconButton
                icon="chevron-right"
                size={24}
                iconColor="#666"
              />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
    marginTop: 20
  },
  menuItemRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    margin: 0,
    marginRight: 12,
  },
  menuItemName: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyStateIcon: {
    backgroundColor: '#f0f0f0',
    borderRadius: 50,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#122b46',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorStatus: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
    borderWidth: 1,
  },
  successStatus: {
    backgroundColor: '#e8f5e9',
    borderColor: '#c8e6c9',
    borderWidth: 1,
  },
  statusText: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  closeStatusButton: {
    margin: 0,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  addButtonContainer: {
    width: '100%',
  },
  addButton: {
    backgroundColor: '#122b46',
    borderRadius: 8,
    elevation: 2,
  },
  addButtonContent: {
    height: 48,
  },
  addButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});

export default CustomMenu; 