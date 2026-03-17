import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ViewLayout } from '../Layouts';
import ScrollViewList from '../../components/ScrollViewList';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ScrollViewExample = ({ navigation }) => {
  const [selectedItem, setSelectedItem] = useState(null);

  // Sample data for the list
  const listItems = [
    { id: 1, title: 'Item 1', icon: 'star' },
    { id: 2, title: 'Item 2', icon: 'heart' },
    { id: 3, title: 'Item 3', icon: 'bell' },
    { id: 4, title: 'Item 4', icon: 'bookmark' },
    { id: 5, title: 'Item 5', icon: 'calendar' },
    { id: 6, title: 'Item 6', icon: 'camera' },
    { id: 7, title: 'Item 7', icon: 'clock' },
    { id: 8, title: 'Item 8', icon: 'cloud' },
    { id: 9, title: 'Item 9', icon: 'code' },
    { id: 10, title: 'Item 10', icon: 'database' },
  ];

  // Custom render function example
  const customRenderItem = (item, index) => (
    <TouchableOpacity 
      key={index} 
      style={[
        styles.customItem,
        selectedItem === item.id && styles.selectedItem
      ]}
      onPress={() => setSelectedItem(item.id)}
    >
      <View style={styles.customItemContent}>
        <Icon name={item.icon} size={24} color="#333" style={styles.itemIcon} />
        <Text style={styles.customItemText}>{item.title}</Text>
      </View>
      <Icon 
        name={selectedItem === item.id ? "check-circle" : "circle-outline"} 
        size={20} 
        color={selectedItem === item.id ? "#4CAF50" : "#666"} 
      />
    </TouchableOpacity>
  );

  return (
    <ViewLayout>
      <View style={styles.container}>
        <Text style={styles.title}>ScrollView List Example</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default List</Text>
          <ScrollViewList 
            items={listItems.slice(0, 5)} 
            onItemPress={(item) => console.log('Pressed:', item.title)}
          />
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Custom List</Text>
          <ScrollViewList 
            items={listItems} 
            renderItem={customRenderItem}
            contentContainerStyle={styles.customListContainer}
          />
        </View>
      </View>
    </ViewLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#555',
  },
  customListContainer: {
    paddingVertical: 0,
  },
  customItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
  },
  customItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  customItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ScrollViewExample; 