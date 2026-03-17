import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

/**
 * ScrollViewList Component
 * 
 * A reusable component that displays a list of items in a ScrollView
 * with customizable styling and item rendering.
 * 
 * @param {Object} props
 * @param {Array} props.items - Array of items to display in the list
 * @param {Function} props.renderItem - Function to render each item
 * @param {Function} props.onItemPress - Function called when an item is pressed
 * @param {Object} props.style - Additional styles for the ScrollView
 * @param {Object} props.contentContainerStyle - Additional styles for the content container
 * @param {boolean} props.showsVerticalScrollIndicator - Whether to show the vertical scroll indicator
 * @param {boolean} props.bounces - Whether the ScrollView should bounce when it reaches the end
 */
const ScrollViewList = ({
  items = [],
  renderItem,
  onItemPress,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = false,
  bounces = true,
}) => {
  // Default render function if none provided
  const defaultRenderItem = (item, index) => (
    <TouchableOpacity 
      key={index} 
      style={styles.listItem}
      onPress={() => onItemPress && onItemPress(item, index)}
    >
      <View style={styles.itemContent}>
        {item.icon && <Icon name={item.icon} size={24} color="#333" style={styles.itemIcon} />}
        <Text style={styles.itemText}>{item.title}</Text>
      </View>
      <Icon name="chevron-right" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.scrollView, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      bounces={bounces}
    >
      {items.map((item, index) => 
        renderItem ? renderItem(item, index) : defaultRenderItem(item, index)
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 10,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default ScrollViewList; 