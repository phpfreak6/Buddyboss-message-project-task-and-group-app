import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const CourseCard = ({ course, onPress }) => {
  // Check the course progress status
  let courseStatus = 'Start Course';
  let progressWidth = '0%'; // Default to 0%
  let progressColor = '#2196F3'; // Default color for "Start Course"
  let badgeColor = '#2196F3'; // Default color for "Start Course badge"

  if (course.progress) {
    if (course.progress.completed === course.progress.total) {
      courseStatus = 'Complete';
      progressWidth = '100%';
      progressColor = '#4caf50'; // Green color for "Complete"
      badgeColor = '#4caf50'; // Green badge for "Complete"
    } else if (course.progress.completed !== course.progress.total) {
      courseStatus = 'In Progress';
      // Calculate progress percentage
      progressWidth = `${(course.progress.completed / course.progress.total) * 100}%`;
      progressColor = '#ff9800'; // Orange color for "In Progress"
      badgeColor = '#ff9800'; // Orange badge for "In Progress"
    }
  }

  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress}>
      <View style={styles.cardContainer}>
        <View style={styles.imageSection}>
          <Image
            source={course.thumbnail ? { uri: course.thumbnail } : require('@/assets/images/cource-placeholder.png')}
            style={styles.courseImage}
          />

          {/* Course Progress */}
          <View style={[styles.progressBadge, { backgroundColor: badgeColor }]}>
            <Text style={[styles.progressText, { color: '#fff' }]}>{courseStatus}</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: progressWidth, backgroundColor: progressColor }]} />
          </View>
        </View>

        <View style={styles.contentSection}>
          <View style={[styles.courseInfo, { display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }]}>
            <View style={{ display: 'flex', flexDirection: 'column' }}>
              <Text style={styles.courseTitle} numberOfLines={2}>
                {course.post_title}
              </Text>
              <Text style={styles.courseAuthor}>{course.author_name}</Text>
            </View>

            <Text style={[styles.courseDate, { marginTop: 8 }]}> 
              {course.last_activity
                ? formatDate(course.last_activity)
                : course.post_date
                ? formatDate(course.post_date)
                : null}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 7,
    paddingBottom: 25,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  cardContainer: {
    flexDirection: 'row',
    height: 100,
    padding: 10,
  },
  imageSection: {
    width: 100,
    height: 100,
    position: 'relative',
  },
  courseImage: {
    width: 100,
    height: 100,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
  },
  contentSection: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  courseInfo: {
    flex: 1,
  },
  courseTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  courseAuthor: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  courseDate: {
    fontSize: 12,
    color: '#999',
  },
  progressBadge: {
    position: 'absolute',
    top: 8,
    left: 0,
    backgroundColor: '#6B46C1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  progressText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '500',
  },
  progressBar: {
    position: 'absolute',
    bottom: 20,
    left: 10,
    right: 0,
    height: 3,
    backgroundColor: '#E5E5E5',
    width: '80%',
  },
  progressFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#F59E0B',
  },
});

export default CourseCard; 