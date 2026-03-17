import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Button, IconButton } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import agent from '@/agent';

const AddMenuItem = () => {
  const navigation = useNavigation();
  const [menuItems, setMenuItems] = useState([]);
  const [newItemName, setNewItemName] = useState('');
  const [newItemUrl, setNewItemUrl] = useState('');
  const [showAddFields, setShowAddFields] = useState(false);
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

  useEffect(() => {
    fetchCustomMenus();
  }, []);

  const saveMenuItems = async (items) => {
    try {
      setShowLoader(true);
      const menus = items.reduce((acc, item) => {
        acc[item.name] = item.url;
        return acc;
      }, {});

      console.log(menus)

      const response = await agent.Auth.updateCustomMenus({ menus });
      
      if (response && response.isSuccess) {
        setStatusProps({
          type: 'success',
          message: 'Menu items saved successfully'
        });
        setShowStatus(true);
        //navigation.goBack();
        return true;
      } else {
        throw new Error('Failed to save menu items');
      }
    } catch (error) {
      console.error('Error saving menu items:', error);
      setStatusProps({
        type: 'error',
        message: 'Failed to save menu items'
      });
      setShowStatus(true);
      return false;
    } finally {
      setShowLoader(false);
    }
  };

  const handleDeleteItem = async (id) => {
    Alert.alert(
      "Delete Menu Item",
      "Are you sure you want to delete this menu item?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Yes",
          onPress: async () => {
            const updatedItems = menuItems.filter(item => item.id !== id);
            setMenuItems(updatedItems);
            
            const success = await saveMenuItems(updatedItems);
            if (!success) {
              // Revert the deletion if save failed
              setMenuItems(menuItems);
            }
          }
        }
      ]
    );
  };

  const handleAddItem = () => {
    if (newItemName.trim() && newItemUrl.trim()) {
      const newItem = {
        id: Date.now(),
        name: newItemName.trim(),
        url: newItemUrl.trim()
      };
      setMenuItems([...menuItems, newItem]);
      setNewItemName('');
      setNewItemUrl('');
      setShowAddFields(false);
    }
  };

  const handleUpdateItem = (id, field, value) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const handleSubmitAll = async () => {
    const success = await saveMenuItems(menuItems);
    if (!success) {
      // Optionally handle failure case
      console.error('Failed to save all menu items');
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
        Click the plus button above to add your first menu item
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Add/Update Menu</Text>
        {!showAddFields && (
          <TouchableOpacity 
            style={styles.addButtonContainer} 
            onPress={() => setShowAddFields(true)}
          >
            <IconButton
              icon="plus"
              size={24}
              iconColor="#fff"
              style={styles.addButton}
            />
          </TouchableOpacity>
        )}
      </View>

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
        {showAddFields && (
          <View style={styles.inputContainer}>
            <View style={styles.inputHeader}>
              <Text style={styles.inputHeaderText}>Add New Menu Item</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={() => {
                  setShowAddFields(false);
                  setNewItemName('');
                  setNewItemUrl('');
                }}
              />
            </View>
            <TextInput
              style={styles.input}
              value={newItemName}
              onChangeText={setNewItemName}
              placeholder="Enter menu item name"
            />
            <TextInput
              style={styles.input}
              value={newItemUrl}
              onChangeText={setNewItemUrl}
              placeholder="Enter menu item URL"
              keyboardType="url"
              autoCapitalize="none"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.buttonContainer}>
                <Button 
                  mode="contained" 
                  style={styles.button}
                  onPress={handleAddItem}
                >
                  <Text style={{color:"#fff"}}>Add Menu Item</Text>
                </Button>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButtonContainer}
                onPress={() => {
                  setShowAddFields(false);
                  setNewItemName('');
                  setNewItemUrl('');
                }}
              >
                <Button 
                  mode="outlined" 
                  style={styles.cancelButton}
                >
                  <Text style={{color:"#122b46"}}>Cancel</Text>
                </Button>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {menuItems.length === 0 ? (
          <EmptyStateMessage />
        ) : (
          menuItems.map((item) => (
            <View key={item.id} style={styles.menuItemRow}>
              <View style={styles.menuItemContent}>
                <TextInput
                  style={styles.rowInput}
                  value={item.name}
                  onChangeText={(value) => handleUpdateItem(item.id, 'name', value)}
                  placeholder="Menu item name"
                />
                <TextInput
                  style={styles.rowInput}
                  value={item.url}
                  onChangeText={(value) => handleUpdateItem(item.id, 'url', value)}
                  placeholder="Menu item URL"
                  keyboardType="url"
                  autoCapitalize="none"
                />
              </View>
              <IconButton
                icon="delete"
                size={24}
                onPress={() => handleDeleteItem(item.id)}
                style={styles.deleteButton}
              />
            </View>
          ))
        )}
      </ScrollView>

      {menuItems.length > 0 && !showAddFields && (
        <View style={styles.submitButtonContainer}>
          <Button 
            mode="contained" 
            style={styles.submitButton}
            onPress={handleSubmitAll}
          >
            <Text style={{color:"#fff"}}>Save All Changes</Text>
          </Button>
        </View>
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
  },
  scrollView: {
    flex: 1,
  },
  menuItemRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  rowInput: {
    backgroundColor: '#f5f5f5',
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  deleteButton: {
    margin: 0,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonContainer: {
    flex: 1,
    marginRight: 8,
  },
  cancelButtonContainer: {
    flex: 1,
    marginLeft: 8,
  },
  button: {
    backgroundColor: '#122b46',
    paddingVertical: 10,
  },
  cancelButton: {
    borderColor: '#122b46',
    paddingVertical: 10,
  },
  submitButtonContainer: {
    marginTop: 16,
    marginBottom: 30,
  },
  submitButton: {
    backgroundColor: '#122b46',
    paddingHorizontal: 50,
    paddingVertical: 10,
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
  inputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#122b46',
  },
  addButtonContainer: {
    backgroundColor: '#122b46',
    borderRadius: 30,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addButton: {
    margin: 0,
  },
});

export default AddMenuItem; 