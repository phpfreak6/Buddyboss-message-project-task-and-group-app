import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import agent from '@/agent';
import CourseCard from '@/Pages/Courses/CourseCard';

const GroupCoursesScreen = ({ navigation, route }) => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const groupId = route.params?.groupId;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await agent.Groups.getGroupCourses(groupId);
      const coursesData = response?.data?.courses || [];
      setCourses(coursesData);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCoursePress = (course) => {
    navigation.navigate('singleCourse', { courseId: course.ID, courseTitle: course.post_title });
  };

  const renderCourse = ({ item }) => (
    <CourseCard course={item} onPress={() => handleCoursePress(item)} />
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Courses</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#122b46" style={styles.loader} />
        ) : (
          <FlatList
            data={courses}
            renderItem={renderCourse}
            keyExtractor={(item) => item.ID?.toString() || Math.random().toString()}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No courses found</Text>
            }
            contentContainerStyle={styles.coursesContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#122b46',
    paddingTop: 8,
    paddingBottom: 12,
    paddingHorizontal: 8,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  loader: {
    marginTop: 20,
  },
  coursesContainer: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default GroupCoursesScreen; 