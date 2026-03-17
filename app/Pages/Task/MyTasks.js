import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { connect } from 'react-redux';
import { ViewLayout } from '@/Pages/Layouts';
import agent from '@/agent';

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
});

const PAGE_SIZE = 50;

const MyTasks = props => {
  const { currentUser } = props;

  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCompletedTasks, setShowCompletedTasks] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const formatDate = dateString => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch (e) {
      return '';
    }
  };

  const fetchTasks = useCallback(
    async (pageNumber = 1, silent = false) => {
      try {
        if (!silent) {
          setIsLoading(true);
        }
        const filter = showCompletedTasks ? 'all' : 'active';
        const response = await agent.Tasks.getMyTasks({
          filter,
          search: searchQuery,
          limit: PAGE_SIZE,
          page: pageNumber,
        });

        if (response && response.data) {
          if (response.data.tasks && response.data.pagination) {
            setTasks(response.data.tasks);
            const apiPagination = response.data.pagination;
            setPagination({
              currentPage: apiPagination.currentPage || pageNumber,
              totalPages: apiPagination.totalPages || 1,
              hasNext:
                (apiPagination.currentPage || pageNumber) <
                (apiPagination.totalPages || 1),
              hasPrev: (apiPagination.currentPage || pageNumber) > 1,
            });
          } else if (Array.isArray(response.data)) {
            setTasks(response.data);
            setPagination(prev => ({
              ...prev,
              currentPage: pageNumber,
              totalPages: 1,
              hasNext: false,
              hasPrev: false,
            }));
          } else {
            setTasks([]);
          }
        } else {
          setTasks([]);
        }
      } catch (err) {
        console.error('Failed to fetch tasks:', err);
        setTasks([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [searchQuery, showCompletedTasks],
  );

  useEffect(() => {
    fetchTasks(1);
  }, [fetchTasks]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchTasks(1);
    }, 500);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, showCompletedTasks, fetchTasks]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTasks(1, true);
  };

  const handleLoadMore = () => {
    if (!isLoading && pagination.hasNext) {
      const nextPage = pagination.currentPage + 1;
      fetchTasks(nextPage);
    }
  };

  const renderTaskItem = ({ item }) => {
    const title = item.title || item.name || 'Untitled task';
    const project = item.project || {};
    const dueDate =
      item.due_date || item.dueDate || item.due || item.due_at;
    const assignees =
      item.assignees || item.assigned_users || item.users || [];

    return (
      <View style={styles.taskItem}>
        <View style={styles.taskMainRow}>
          <Text style={styles.taskTitle} numberOfLines={2}>
            {title}
          </Text>
          {project && (project.title || project.name) ? (
            <Text style={styles.taskProject} numberOfLines={1}>
              {project.title || project.name}
            </Text>
          ) : null}
        </View>
        <View style={styles.taskMetaRow}>
          <View style={styles.taskMetaLeft}>
            {assignees && assignees.length > 0 ? (
              <Text style={styles.taskAssignee} numberOfLines={1}>
                {assignees
                  .map(
                    u =>
                      u.display_name ||
                      u.name ||
                      (u.email || '').split('@')[0] ||
                      'User',
                  )
                  .join(', ')}
              </Text>
            ) : (
              <Text style={styles.taskAssigneeEmpty}>Unassigned</Text>
            )}
          </View>
          <View style={styles.taskMetaRight}>
            {dueDate ? (
              <Text style={styles.taskDueDate}>{formatDate(dueDate)}</Text>
            ) : (
              <Text style={styles.taskDueDateEmpty}>No due date</Text>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <ViewLayout>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Tasks</Text>
        </View>

        <View style={styles.controlsRow}>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search tasks..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              showCompletedTasks && styles.toggleButtonActive,
            ]}
            onPress={() => setShowCompletedTasks(v => !v)}
          >
            <Text
              style={[
                styles.toggleButtonText,
                showCompletedTasks && styles.toggleButtonTextActive,
              ]}
            >
              Show completed
            </Text>
          </TouchableOpacity>
        </View>

        {isLoading && tasks.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ff7a08" />
            <Text style={styles.loaderText}>Loading tasks...</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>
              No tasks found.{' '}
              {searchQuery
                ? 'Try a different search query.'
                : 'You have no tasks assigned yet.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={tasks}
            keyExtractor={(item, index) =>
              (item.id || item.task_id || index).toString()
            }
            renderItem={renderTaskItem}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={onRefresh}
              />
            }
            ListFooterComponent={
              isLoading && tasks.length > 0 ? (
                <View style={styles.loadMoreContainer}>
                  <ActivityIndicator size="small" color="#ff7a08" />
                </View>
              ) : null
            }
          />
        )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  controlsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchContainer: {
    marginBottom: 8,
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 15,
  },
  toggleButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  toggleButtonActive: {
    backgroundColor: '#ff7a08',
    borderColor: '#ff7a08',
  },
  toggleButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  toggleButtonTextActive: {
    color: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loaderText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataContainer: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  noDataText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  taskItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  taskMainRow: {
    marginBottom: 4,
  },
  taskTitle: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  taskProject: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskMetaLeft: {
    flex: 1,
    paddingRight: 8,
  },
  taskAssignee: {
    fontSize: 12,
    color: '#555',
  },
  taskAssigneeEmpty: {
    fontSize: 12,
    color: '#bbb',
    fontStyle: 'italic',
  },
  taskMetaRight: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  taskDueDate: {
    fontSize: 12,
    color: '#555',
  },
  taskDueDateEmpty: {
    fontSize: 12,
    color: '#bbb',
    fontStyle: 'italic',
  },
  loadMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});

export default connect(mapStateToProps)(MyTasks);
