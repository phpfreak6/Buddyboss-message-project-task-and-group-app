import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert, RefreshControl, Image, ScrollView, Modal, Platform } from 'react-native';
import DropDownPicker from 'react-native-dropdown-picker';
import { connect } from 'react-redux';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { IconButton } from 'react-native-paper';
import agent from '../../agent';
import { ViewLayout } from '../Layouts';
import { StatusBar, NoData } from '../../components';
import NewProjectModal from './NewProjectModal';

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
  isLoggedIn: state.common.isLoggedIn,
});

const Projects = (props) => {
  const { currentUser, navigation } = props;
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState('active');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [categoryItems, setCategoryItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [selectedProjectUsers, setSelectedProjectUsers] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
    has_next: false,
    has_prev: false,
  });

  const filterTabs = [
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'favourite', label: 'Favourite' },
    { id: 'all', label: 'All' }
  ];

  const fetchCategories = async () => {
    try {
      const response = await agent.Projects.getProjectCategories();
      if (response && response.data) {
        const fetchedCategories = response.data.categories || response.data.data || response.data || [];
        setCategories(fetchedCategories);
        // Prepare items for dropdown picker
        const items = [
          { label: 'All', value: '' },
          ...fetchedCategories.map((category) => ({
            label: category.name || category.title,
            value: category.id || category.category_id,
          }))
        ];
        setCategoryItems(items);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchProjects = async (pageNumber = 1, isLoadMore = false) => {
    if (isLoadMore) {
      setIsLoadingMore(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await agent.Projects.getProjects({
        search: searchQuery,
        filter: activeFilter,
        category: selectedCategory,
        limit: pagination.limit,
        page: pageNumber,
      });

      if (response && response.data) {
        const fetchedProjects = response.data.projects || [];
        
        if (pageNumber === 1) {
          setProjects(fetchedProjects);
        } else {
          setProjects(prev => [...prev, ...fetchedProjects]);
        }

        if (response.data.pagination) {
          const apiPagination = response.data.pagination;
          setPagination(prev => ({
            ...prev,
            page: apiPagination.currentPage || pageNumber,
            limit: apiPagination.pageSize || prev.limit,
            total: apiPagination.totalCount || 0,
            total_pages: apiPagination.totalPages || 1,
            has_next: (apiPagination.currentPage || pageNumber) < (apiPagination.totalPages || 1),
            has_prev: (apiPagination.currentPage || pageNumber) > 1
          }));
        }
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      Alert.alert('Error', 'Failed to load projects');
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchCategories();
      fetchProjects(1);
    }, [])
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchProjects(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  useEffect(() => {
    fetchProjects(1);
  }, [activeFilter, selectedCategory]);


  const handleLoadMore = () => {
    if (pagination.has_next && !isLoadingMore && !isLoading) {
      fetchProjects(pagination.page + 1, true);
    }
  };

  const handleToggleFavorite = async (projectId, currentFavouriteStatus) => {
    try {
      const newFavouriteStatus = !currentFavouriteStatus;
      const response = await agent.Projects.toggleProjectFavorite(projectId, newFavouriteStatus);

      if (response && response.data) {
        setProjects(prevProjects =>
          prevProjects.map(project => {
            if (project.id === projectId || project.project_id === projectId) {
              return { ...project, favourite: newFavouriteStatus };
            }
            return project;
          })
        );
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
      Alert.alert('Error', 'Failed to update favorite status');
    }
  };

  const handleSetProjectStatus = async (projectId, newStatus) => {
    try {
      const response = await agent.Projects.updateProjectStatus(projectId, newStatus);
      if (response && response.data) {
        setProjects(prevProjects =>
          prevProjects.map(project => {
            if (project.id === projectId || project.project_id === projectId) {
              return { ...project, status: parseInt(newStatus) };
            }
            return project;
          })
        );
      }
    } catch (err) {
      console.error('Failed to update project status:', err);
      Alert.alert('Error', 'Failed to update project status');
    }
  };

  const handleDeleteProject = async (projectId) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await agent.Projects.deleteProject(projectId);
              if (response && response.data) {
                fetchProjects(1);
              }
            } catch (err) {
              console.error('Failed to delete project:', err);
              Alert.alert('Error', 'Failed to delete project');
            }
          }
        }
      ]
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects(1).finally(() => setRefreshing(false));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
      return '';
    }
  };

  const renderProjectItem = ({ item }) => {
    const projectId = item.id || item.project_id;
    const isFavourite = item.favourite || (item.favourite && item.favourite !== '0' && item.favourite !== '');
    const projectUsers = item.users || [];
    const projectCategories = item.categories || [];
    
    // Generate a color for the icon based on project ID
    const projectIconColors = ['#9333ea', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
    const iconColor = projectIconColors[projectId % projectIconColors.length];

    return (
      <TouchableOpacity
        style={styles.projectItem}
        onPress={() => navigation.navigate('SingleProject', { projectId })}
      >
        <View style={styles.projectMainRow}>
          <View style={[styles.projectIconBox, { backgroundColor: iconColor }]}>
            <IconButton 
              icon="format-list-bulleted" 
              size={20} 
              iconColor="#fff" 
              style={styles.projectIconButton}
            />
          </View>
          <View style={styles.projectContent}>
            <View style={styles.projectHeaderRow}>
              <Text style={styles.projectName} numberOfLines={1}>
                {item.title || item.name}
              </Text>
              <View style={styles.projectActions}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(projectId, isFavourite);
                  }}
                >
                  <IconButton
                    icon={isFavourite ? 'star' : 'star-outline'}
                    size={20}
                    iconColor={isFavourite ? '#FFD700' : '#ccc'}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    Alert.alert(
                      'Project Actions',
                      'Choose an action',
                      [
                        {
                          text: item.status === 1 ? 'Restore' : 'Complete',
                          onPress: () => {
                            const newStatus = item.status === 1 ? 0 : 1;
                            handleSetProjectStatus(projectId, newStatus);
                          }
                        },
                        {
                          text: 'Delete',
                          style: 'destructive',
                          onPress: () => handleDeleteProject(projectId)
                        },
                        { text: 'Cancel', style: 'cancel' }
                      ]
                    );
                  }}
                >
                  <IconButton icon="dots-vertical" size={20} iconColor="#666" />
                </TouchableOpacity>
              </View>
            </View>

            {projectCategories.length > 0 && (
              <View style={styles.categoriesContainer}>
                {projectCategories.slice(0, 3).map((category, index) => (
                  <View key={category.id || category.category_id || index} style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{category.name || category.title}</Text>
                  </View>
                ))}
              </View>
            )}

            {projectUsers.length > 0 && (
              <View style={styles.membersContainer}>
                {projectUsers.slice(0, 5).map((user, index) => (
                  <TouchableOpacity
                    key={user.ID || user.id || index}
                    style={styles.memberAvatar}
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedProjectUsers(projectUsers);
                      setIsMembersModalOpen(true);
                    }}
                  >
                    {user.image ? (
                      <Image source={{ uri: user.image }} style={styles.avatarImage} />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarText}>
                          {(user.display_name || user.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
                {projectUsers.length > 5 && (
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation();
                      setSelectedProjectUsers(projectUsers);
                      setIsMembersModalOpen(true);
                    }}
                  >
                    <Text style={styles.moreMembers}>+{projectUsers.length - 5}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            

            <Text style={styles.lastModified}>
              Last modified: {formatDate(item.updated_at || item.created_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const filteredProjects = projects.filter((project) => {
    if (project.status === 1 && activeFilter === 'active') return false;
    if (project.status === 0 && activeFilter === 'completed') return false;
    if (activeFilter === 'favourite' && !project.favourite) return false;
    return true;
  });

  return (
    <ViewLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Projects</Text>
          <TouchableOpacity
            style={styles.newProjectButton}
            onPress={() => setIsNewProjectModalOpen(true)}
          >
            <Text style={styles.newProjectButtonText}>+ New</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filtersContainer}>
          <View style={styles.filterTabs}>
            {filterTabs.map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.filterTab,
                  activeFilter === tab.id && styles.filterTabActive
                ]}
                onPress={() => setActiveFilter(tab.id)}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === tab.id && styles.filterTabTextActive
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {categories.length > 0 && (
              <View style={styles.categorySelectContainer}>
                <Text style={styles.categorySelectLabel}>Category:</Text>
                <View style={styles.pickerWrapper}>
                  <DropDownPicker
                    open={categoryOpen}
                    value={selectedCategory}
                    items={categoryItems}
                    setOpen={setCategoryOpen}
                    setValue={setSelectedCategory}
                    setItems={setCategoryItems}
                    placeholder="All"
                    listMode="SCROLLVIEW"
                    style={styles.dropdownPicker}
                    dropDownContainerStyle={styles.dropdownPickerContainer}
                    textStyle={styles.dropdownPickerText}
                    labelStyle={styles.dropdownPickerLabel}
                    selectedItemLabelStyle={styles.dropdownPickerSelectedLabel}
                    placeholderStyle={styles.dropdownPickerPlaceholder}
                    arrowIconStyle={styles.dropdownPickerArrow}
                    tickIconStyle={styles.dropdownPickerTick}
                    closeAfterSelecting={true}
                    zIndex={3000}
                    zIndexInverse={1000}
                  />
                </View>
              </View>
            )}
          </View>
        </View>

        {isLoading && projects.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ff7a08" />
            <Text style={styles.loaderText}>Loading projects...</Text>
          </View>
        ) : filteredProjects.length === 0 && !isLoading ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No projects found.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredProjects}
            renderItem={renderProjectItem}
            keyExtractor={(item, index) => (item.id || item.project_id || index).toString()}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListFooterComponent={
              isLoadingMore ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color="#ff7a08" />
                </View>
              ) : null
            }
          />
        )}

        {/* Members Modal */}
        <Modal
          visible={isMembersModalOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setIsMembersModalOpen(false)}
        >
          <View style={styles.membersModalOverlay}>
            <View style={styles.membersModalContent}>
              <View style={styles.membersModalHeader}>
                <Text style={styles.membersModalTitle}>Project Members</Text>
                <TouchableOpacity onPress={() => setIsMembersModalOpen(false)}>
                  <IconButton icon="close" size={22} />
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.membersModalList}>
                {selectedProjectUsers.map((user, index) => (
                  <View key={user.ID || user.id || index} style={styles.membersModalItem}>
                    {user.image ? (
                      <Image source={{ uri: user.image }} style={styles.membersModalAvatar} />
                    ) : (
                      <View style={styles.membersModalAvatarPlaceholder}>
                        <Text style={styles.membersModalAvatarText}>
                          {(user.display_name || user.name || 'U').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.membersModalInfo}>
                      <Text style={styles.membersModalName}>
                        {user.display_name || user.name || 'User'}
                      </Text>
                      {user.email && (
                        <Text style={styles.membersModalEmail}>{user.email}</Text>
                      )}
                    </View>
                  </View>
                ))}
                {selectedProjectUsers.length === 0 && (
                  <Text style={styles.membersModalEmpty}>No members found.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <NewProjectModal
          visible={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
          categories={categories}
          onProjectCreated={() => {
            setIsNewProjectModalOpen(false);
            fetchProjects(1);
          }}
        />

      </View>
    </ViewLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  newProjectButton: {
    backgroundColor: '#ff7a08',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newProjectButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 2000,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  filterTab: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 5,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  filterTabActive: {
    backgroundColor: '#ff7a08',
  },
  filterTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  searchContainer: {
    padding: 15,
    zIndex: 3000,
    position: 'relative',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 10,
  },
  categorySelectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    zIndex: 3500,
  },
  categorySelectLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 10,
    fontWeight: '500',
    flexShrink: 0,
  },
  pickerWrapper: {
    flex: 1,
    minWidth: 0,
    zIndex: 1000,
  },
  dropdownPicker: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    minHeight: 44,
  },
  dropdownPickerContainer: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    marginTop: 5,
    // Ensure the dropdown appears above the FlatList / other content
    zIndex: 4000,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  dropdownPickerText: {
    fontSize: 14,
    color: '#333',
  },
  dropdownPickerLabel: {
    fontSize: 14,
    color: '#333',
  },
  dropdownPickerSelectedLabel: {
    fontWeight: '600',
    color: '#333',
  },
  dropdownPickerPlaceholder: {
    color: '#999',
  },
  dropdownPickerArrow: {
    width: 20,
    height: 20,
  },
  dropdownPickerTick: {
    width: 20,
    height: 20,
  },
  projectItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  projectMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  projectIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  projectIconButton: {
    margin: 0,
  },
  projectContent: {
    flex: 1,
    minWidth: 0,
  },
  projectHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  projectName: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginRight: 8,
    minWidth: 0,
  },
  projectActions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    height: 30,
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: -6,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    backgroundColor: '#fff',
    zIndex: 1,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  moreMembers: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 6,
    marginTop: 2,
  },
  categoryBadge: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 11,
    color: '#1976d2',
    fontWeight: '500',
  },
  lastModified: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loadMoreContainer: {
    padding: 20,
    alignItems: 'center',
  },
  noDataContainer: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    paddingTop: 100,
    display: 'flex',
  },
  noDataText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    textAlign: 'center',
  },
  membersModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersModalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingBottom: 10,
  },
  membersModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  membersModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  membersModalList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  membersModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  membersModalAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  membersModalAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ff7a08',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  membersModalAvatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  membersModalInfo: {
    flex: 1,
  },
  membersModalName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  membersModalEmail: {
    fontSize: 13,
    color: '#777',
    marginTop: 2,
  },
  membersModalEmpty: {
    textAlign: 'center',
    paddingVertical: 16,
    color: '#666',
  },
});

export default connect(mapStateToProps)(Projects);
