import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import { IconButton } from 'react-native-paper';

// Shared Status Configuration
export const STATUS_CONFIG = {
  0: { label: 'TO DO', icon: 'circle-outline', iconType: 'dashed', color: '#ff9800', category: 'statuses' },
  1: { label: 'COMPLETE', icon: 'check', color: '#34a853', category: 'closed' },
  2: { label: 'IN PROGRESS', icon: 'clock-outline', color: '#ffc53d', category: 'statuses' },
  3: { label: 'WAITING', icon: 'clock-outline', color: '#9c27b0', category: 'statuses' }
};

export const getStatusLabel = (status) => {
  return STATUS_CONFIG[status]?.label || 'TO DO';
};

export const getStatusIcon = (status) => {
  const config = STATUS_CONFIG[status];
  if (!config) return 'circle-outline';
  return config.icon;
};

export const getStatusColor = (status) => {
  return STATUS_CONFIG[status]?.color || '#ff9800';
};

const StatusDropdown = ({
  currentStatus = 0,
  onStatusChange,
  size = 'medium', // 'small', 'medium', 'large'
  showLabel = false, // Show label text next to icon
  buttonStyle = {},
  containerStyle = {},
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter statuses based on search query
  const filteredStatuses = Object.entries(STATUS_CONFIG).filter(([status, config]) => {
    if (!searchQuery.trim()) return true;
    const searchLower = searchQuery.toLowerCase();
    return config.label.toLowerCase().includes(searchLower);
  });

  const statusConfig = STATUS_CONFIG[currentStatus ?? 0];
  const isComplete = currentStatus === 1;

  // Size configurations
  const sizeConfig = {
    small: { width: 18, height: 18, iconSize: 10 },
    medium: { width: 20, height: 20, iconSize: 12 },
    large: { width: 24, height: 24, iconSize: 14 },
  };

  const currentSize = sizeConfig[size] || sizeConfig.medium;

  const handleStatusSelect = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(newStatus);
    }
    setShowDropdown(false);
    setSearchQuery('');
  };

  const renderStatusIcon = () => {
    const statusColor = getStatusColor(currentStatus ?? 0);
    const iconSize = currentSize.width;
    
    // TO DO - Dashed circle
    if (statusConfig?.iconType === 'dashed') {
      return (
        <View
          style={[
            styles.statusBadge,
            {
              width: iconSize,
              height: iconSize,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: statusColor,
              backgroundColor: 'transparent',
            },
          ]}
        />
      );
    }

    // COMPLETE - Filled circle with checkmark
    if (currentStatus === 1) {
      return (
        <View
          style={[
            styles.statusBadge,
            styles.statusBadgeFilled,
            {
              width: iconSize,
              height: iconSize,
              backgroundColor: statusColor,
            },
          ]}
        >
          <IconButton
            icon="check"
            size={currentSize.iconSize - 2}
            iconColor="#fff"
            style={{ margin: 0 }}
          />
        </View>
      );
    }

    // IN PROGRESS - Filled circle with clock icon
    if (currentStatus === 2) {
      return (
        <View
          style={[
            styles.statusBadge,
            styles.statusBadgeFilled,
            {
              width: iconSize,
              height: iconSize,
              backgroundColor: statusColor,
            },
          ]}
        >
          <IconButton
            icon="clock-outline"
            size={currentSize.iconSize - 2}
            iconColor="#fff"
            style={{ margin: 0 }}
          />
        </View>
      );
    }

    // WAITING - Filled circle with different pattern
    if (currentStatus === 3) {
      return (
        <View
          style={[
            styles.statusBadge,
            styles.statusBadgeFilled,
            {
              width: iconSize,
              height: iconSize,
              backgroundColor: statusColor,
            },
          ]}
        >
          <View style={styles.waitingIndicator}>
            <View style={[styles.waitingDot, { backgroundColor: '#fff' }]} />
            <View style={[styles.waitingDot, { backgroundColor: '#fff' }]} />
            <View style={[styles.waitingDot, { backgroundColor: '#fff' }]} />
          </View>
        </View>
      );
    }

    // Default - Filled circle
    return (
      <View
        style={[
          styles.statusBadge,
          styles.statusBadgeFilled,
          {
            width: iconSize,
            height: iconSize,
            backgroundColor: statusColor,
          },
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <TouchableOpacity
        style={[
          styles.button,
          showLabel ? styles.buttonWithLabel : {},
          {
            width: showLabel ? 'auto' : currentSize.width,
            height: showLabel ? 'auto' : currentSize.height,
            backgroundColor: isComplete ? '#34a853' : 'transparent',
            borderColor: isComplete ? '#34a853' : getStatusColor(currentStatus ?? 0),
          },
          buttonStyle,
        ]}
        onPress={() => setShowDropdown(true)}
        activeOpacity={0.7}
      >
        {renderStatusIcon()}
        {showLabel && (
          <View style={styles.labelContainer}>
            <Text
              style={[
                styles.labelText,
                { color: isComplete ? '#fff' : '#202124' },
              ]}
            >
              {getStatusLabel(currentStatus ?? 0)}
            </Text>
            <IconButton
              icon="chevron-down"
              size={10}
              iconColor={isComplete ? '#fff' : '#5f6368'}
              style={{ margin: 0 }}
            />
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={showDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowDropdown(false);
          setSearchQuery('');
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowDropdown(false);
            setSearchQuery('');
          }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.slideModalContainer}
          >
            {/* Handle bar */}
            <View style={styles.handleBar}>
              <View style={styles.handleBarIndicator} />
            </View>

            {/* Header with search */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Status</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowDropdown(false);
                  setSearchQuery('');
                }}
                style={styles.closeButton}
              >
                <IconButton
                  icon="close"
                  size={20}
                  iconColor="#5f6368"
                  style={{ margin: 0 }}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search status..."
                placeholderTextColor="#9aa0a6"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
            </View>

            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
              {/* Statuses Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>Statuses</Text>
                </View>
                {filteredStatuses
                  .filter(([status, config]) => config.category === 'statuses')
                  .map(([status, config]) => {
                    const statusNum = parseInt(status, 10);
                    const isSelected = (currentStatus ?? 0) === statusNum;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                        ]}
                        onPress={() => handleStatusSelect(statusNum)}
                        activeOpacity={0.7}
                      >
                        {config.iconType === 'dashed' ? (
                          <View
                            style={[
                              styles.statusBadge,
                              {
                                width: 20,
                                height: 20,
                                borderWidth: 2,
                                borderStyle: 'dashed',
                                borderColor: config.color,
                                backgroundColor: 'transparent',
                              },
                            ]}
                          />
                        ) : statusNum === 1 ? (
                          <View
                            style={[
                              styles.statusBadge,
                              styles.statusBadgeFilled,
                              {
                                width: 20,
                                height: 20,
                                backgroundColor: config.color,
                              },
                            ]}
                          >
                            <IconButton
                              icon="check"
                              size={12}
                              iconColor="#fff"
                              style={{ margin: 0 }}
                            />
                          </View>
                        ) : statusNum === 2 ? (
                          <View
                            style={[
                              styles.statusBadge,
                              styles.statusBadgeFilled,
                              {
                                width: 20,
                                height: 20,
                                backgroundColor: config.color,
                              },
                            ]}
                          >
                            <IconButton
                              icon="clock-outline"
                              size={12}
                              iconColor="#fff"
                              style={{ margin: 0 }}
                            />
                          </View>
                        ) : statusNum === 3 ? (
                          <View
                            style={[
                              styles.statusBadge,
                              styles.statusBadgeFilled,
                              {
                                width: 20,
                                height: 20,
                                backgroundColor: config.color,
                              },
                            ]}
                          >
                            <View style={styles.waitingIndicator}>
                              <View style={[styles.waitingDot, { backgroundColor: '#fff' }]} />
                              <View style={[styles.waitingDot, { backgroundColor: '#fff' }]} />
                              <View style={[styles.waitingDot, { backgroundColor: '#fff' }]} />
                            </View>
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.statusBadge,
                              styles.statusBadgeFilled,
                              {
                                width: 20,
                                height: 20,
                                backgroundColor: config.color,
                              },
                            ]}
                          />
                        )}
                        <Text style={styles.dropdownItemText}>{config.label}</Text>
                        {isSelected && (
                          <IconButton
                            icon="check"
                            size={14}
                            iconColor="#202124"
                            style={{ margin: 0, marginLeft: 'auto' }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>

              {/* Closed Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionHeaderText}>Closed</Text>
                </View>
                {filteredStatuses
                  .filter(([status, config]) => config.category === 'closed')
                  .map(([status, config]) => {
                    const statusNum = parseInt(status, 10);
                    const isSelected = (currentStatus ?? 0) === statusNum;
                    return (
                      <TouchableOpacity
                        key={status}
                        style={[
                          styles.dropdownItem,
                          isSelected && styles.dropdownItemSelected,
                        ]}
                        onPress={() => handleStatusSelect(statusNum)}
                        activeOpacity={0.7}
                      >
                        {statusNum === 1 ? (
                          <View
                            style={[
                              styles.statusBadge,
                              styles.statusBadgeFilled,
                              {
                                width: 20,
                                height: 20,
                                backgroundColor: config.color,
                              },
                            ]}
                          >
                            <IconButton
                              icon="check"
                              size={12}
                              iconColor="#fff"
                              style={{ margin: 0 }}
                            />
                          </View>
                        ) : (
                          <View
                            style={[
                              styles.statusBadge,
                              styles.statusBadgeFilled,
                              {
                                width: 20,
                                height: 20,
                                backgroundColor: config.color,
                              },
                            ]}
                          >
                            <IconButton
                              icon={config.icon}
                              size={12}
                              iconColor="#fff"
                              style={{ margin: 0 }}
                            />
                          </View>
                        )}
                        <Text style={styles.dropdownItemText}>{config.label}</Text>
                        {isSelected && (
                          <IconButton
                            icon="check"
                            size={14}
                            iconColor="#202124"
                            style={{ margin: 0, marginLeft: 'auto' }}
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    flexShrink: 0,
  },
  button: {
    borderWidth: 2,
    borderRadius: 50,
    borderColor: '#cbd5e1',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonWithLabel: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 120,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 4,
  },
  statusBadge: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  statusBadgeFilled: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  waitingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitingDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    marginHorizontal: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  slideModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handleBar: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handleBarIndicator: {
    width: 40,
    height: 4,
    backgroundColor: '#dadce0',
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202124',
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
  },
  searchInput: {
    padding: 12,
    fontSize: 14,
    color: '#202124',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  dropdownList: {
    maxHeight: 400,
  },
  section: {
    paddingVertical: 8,
  },
  sectionHeader: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e8eaed',
    marginBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5f6368',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
  },
  dropdownItemSelected: {
    backgroundColor: '#f1f3f4',
  },
  dropdownItemText: {
    flex: 1,
    fontSize: 14,
    color: '#202124',
    marginLeft: 12,
  },
});

export default StatusDropdown;
