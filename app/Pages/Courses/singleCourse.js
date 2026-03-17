import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, FlatList, Dimensions, SafeAreaView, Platform } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from '@react-navigation/native'; 
import { StatusBar, PageLoader } from '@/components';
import agent from '@/agent';
let LinearGradient;
if (Platform.OS === 'web') {
} else {
  LinearGradient = require('react-native-linear-gradient').default;
}
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');


export default function SingleCourseScreen({ route, navigation }) {
  const { courseId, courseTitle } = route.params;

  const [expanded, setExpanded] = useState({});
  const [expandedAll, setExpandedAll] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [loaderVisible, setLoaderVisible] = useState(false);
  const [progressData, setProgressData] = useState(null);
  const [courseStepData, setCourseStepData] = useState(null);
  const [pageLoaded, setPageLoaded] = useState(false);

  const toggleExpand = (index) => {
    setExpandedAll(false)
    setExpanded(prev => ({ ...prev, [index]: !prev[index] }));
  };
 

  const fetchCourseData = async (courseId) => {
    setLoaderVisible(true)
    
      
      try {
      
        const Response = await agent.Auth.fetchCourseData(courseId); 

       
        
        if(Response && Response.data && Response.data.coursedata && Response.data.coursedata.ID){

          //console.log(JSON.stringify(Response.data.coursedata,null,2))

          setCourseData(Response.data.coursedata);

        }
        setLoaderVisible(false)

      } catch (error) {
        setLoaderVisible(false)
        console.error('Error fetching thread data:', error);
      } 
  };
  useEffect(() => {
    setCourseData(null);
    fetchCourseData(courseId);
  }, [courseId,pageLoaded]);

  useFocusEffect(
    React.useCallback(() => {
      setPageLoaded(true);
      return () => {
        setPageLoaded(false); // Set loading to false when the page leaves
      };
    }, [setPageLoaded])
  );

  useEffect(() => {
    if(courseData){

      let courseStatus = "Start Course";
      let progressWidth = 0; // Default to 0%
      let progressColor = "#2196F3"; // Default color for "Start Course"
      let badgeColor = "#F6E7C1"; // Default color for "Start Course badge"
      
      if (courseData.progress) {
        if (courseData.progress.completed === courseData.progress.total) {
          courseStatus = "Complete";
          progressWidth = 100;
          progressColor = "#4caf50"; // Green color for "Complete"
          badgeColor = "#4caf50"; // Green badge for "Complete"
        } else if (courseData.progress.completed !== courseData.progress.total) {
          courseStatus = "In Progress";
          // Calculate progress percentage
          progressWidth = (courseData.progress.completed / courseData.progress.total) * 100;
          progressColor = "#ff9800"; // Orange color for "In Progress"
          badgeColor = "#F6E7C1"; // Orange badge for "In Progress"
        }
      }
      progressWidth = Math.trunc(progressWidth);

      var progressDataJson = {courseStatus,progressWidth,progressColor,badgeColor};

      setProgressData(progressDataJson);

      var stepsData = flattenCourseSteps(courseData);

      

      var courseStepStruture = {stepsData,courseId: courseData.ID}

      setCourseStepData(courseStepStruture)

      // console.log(JSON.stringify(courseStepStruture,null,2))

    }else{
      setProgressData(null);
      setCourseStepData(stepsData)
    }
  }, [courseData]);

  // Expand All functionality
  const handleExpandAll = () => {
    setExpanded({})
    setExpandedAll(!expandedAll)
  };

  // Helper for circular progress
  const ProgressCircle = ({ percent, size = 32, strokeWidth = 4, color = '#E6A23C', bgColor = '#F3F3F3' }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = circumference * (1 - percent / 100);
    return (
      <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={bgColor}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={progress}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={{ fontSize: 12, color: color, fontWeight: 'bold', position: 'absolute' }}>{percent}%</Text>
      </View>
    );
  };

  useEffect(() => {
    console.log('Course ID:', courseId);
    console.log('Course Title:', courseTitle);
  }, [courseId, courseTitle]);

  const renderLessonContent = (lesson,courseData,idx) => {
    const progressMap = courseData.progresCompleted || {};
  
    const totalSteps = (lesson.topics?.length || 0);
  
    const lessonCompleted = progressMap[lesson.id] === 1 ? 1 : 0;
  
    const topicsCompleted = lesson.topics?.filter(topic => progressMap[topic.id] === 1).length || 0;
  
    const completedSteps = topicsCompleted;
  
  
    const isLessonComplete = lessonCompleted;

  
    return (
      <View key={`lesson-${lesson.id}`} style={styles.accordionSection}>
        <TouchableOpacity style={styles.accordionHeader} onPress={() => toggleExpand(lesson.id)}>
          <Icon
              name={
                totalSteps > 0
                  ? expanded[lesson.ID] ? "chevron-down" : "chevron-right"
                  : "newspaper-variant-outline" // or any fallback icon
              }
              size={22}
              color="#222"
              style={{marginRight: 10}}
          />
          <TouchableOpacity
            style={styles.accordionTitleMain}
            onPress={() =>
              navigation.navigate('CourseStepsStack', {
                screen: 'CourseStepsScreen',
                params: {
                  progressMap: progressMap,
                  courseStepData: courseStepData,
                  currentIndex: courseStepData.stepsData.findIndex(s => s.id === lesson.id),
                }
              })
            }
          >
            <Text style={styles.accordionTitle}>{lesson.title}</Text>
          </TouchableOpacity>
          {totalSteps > 0 && (
            <Text style={styles.accordionSteps}>
              {completedSteps}/{totalSteps} steps
            </Text>
          )}
          <View style={styles.accordionProgressCircle}>
            <View style={isLessonComplete ? styles.circleFilled : styles.circleEmpty}>
              {isLessonComplete ? <Icon name="check" size={16} color="#fff" /> : null}
            </View>
          </View>
          
        </TouchableOpacity>
  
        {(expanded[lesson.id] || expandedAll) && (
          <View style={styles.accordionContent}>
            {lesson.topics?.map((topic, tIdx) => {
              const isCompleted = progressMap[topic.id] === 1;
              return (
                <TouchableOpacity
                    key={`topic-${topic.id}`}
                    style={styles.accordionTitle}
                    onPress={() =>
                      navigation.navigate('CourseStepsStack', {
                        screen: 'CourseStepsScreen',
                        params: {
                          courseStepData: courseStepData,
                          progressMap: progressMap,
                          currentIndex: courseStepData.stepsData.findIndex(s => s.id === topic.id),
                        }
                      })
                    }
                >
                  <View style={styles.stepItem}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Icon name="newspaper-variant-outline" size={22} color="#222" />
                      <Text style={styles.stepTitle}>{topic.title}</Text>
                    </View>
                    <View style={isCompleted ? styles.circleFilled : styles.circleEmpty}>
                      {isCompleted && <Icon name="check" size={16} color="#fff" />}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header image and fade */}
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtnWrapper} onPress={() => navigation.goBack()}>
            <View style={styles.backBtn}>
              <Icon name="arrow-left" size={30} color="#B8860B" />
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.headerContainer}>
          {(courseData && courseData.thumbnail) && (
            <Image
              source={{ uri: courseData.thumbnail }}
              style={styles.headerImage}
              resizeMode="cover"
            />
          )}
          {(LinearGradient) && (
            <LinearGradient
              colors={['rgba(0, 0, 0, 0.85)', 'rgba(3, 3, 3, 0)']}
              style={styles.headerFade}
            />
          )}
          <View style={styles.headerContent}>
            
            <Text style={styles.headerTitle}>{courseTitle}</Text>
            {(courseData) && (
              <View style={styles.headerInstructorRow}>
                {(courseData.author_image) &&(
                  <Image
                    source={{ uri: courseData.author_image }}
                    style={styles.avatar}
                  />
                )}
                <Text style={styles.instructorName}>{courseData.author_name}</Text>
                <Text style={styles.headerDot}>•</Text>
                <Text style={styles.headerDate}>{formatDate(courseData.post_date)}</Text>
              </View>
            )}
          </View>
        </View>

        {(courseData) && (
          <View style={styles.mainContent}>
            <View style={styles.progressCard}>
              <View style={styles.progressCardRow}>
                {progressData?.progressWidth > 0 ? (
                  <>
                    <View>
                      {progressData?.courseStatus && (
                        <Text style={styles.progressStatus}>
                          {progressData.courseStatus}
                        </Text>
                      )}
                      <Text style={styles.lastActivity}>Last activity: {formatDate(courseData.last_activity)}</Text>
                    </View>
                    <View style={styles.progressCircleWrap}>
                        {progressData?.progressWidth > 0 && (
                          <ProgressCircle
                            percent={progressData.progressWidth}
                            size={44}
                            strokeWidth={4}
                            color={progressData.progressColor}
                            bgColor={progressData.badgeColor}
                          />
                        )}
                    </View>
                  </>
                ):(
                  <View style={{ marginTop: 0 }}>
                    <Text style={styles.cr_inc}>Course Includes</Text>
                  
                    <View style={{ marginTop: 10 }}>
                      <View style={styles.courseRow}>
                        <Icon name="book-open-page-variant" size={20} color="#444" style={styles.iconSpacing} />
                        <Text style={styles.courseItem}>{courseData?.courseSteps?.totalLessons || 0} lessons</Text>
                      </View>

                      <View style={styles.courseRow}>
                        <Icon name="format-list-bulleted" size={20} color="#444" style={styles.iconSpacing} />
                        <Text style={styles.courseItem}>{courseData?.courseSteps?.totalTopics || 0} topics</Text>
                      </View>
                      {courseData.courseSteps &&
                          courseData.courseSteps.quizzes &&
                          courseData.courseSteps.quizzes.length > 0 && (
                        <View style={styles.courseRow}>
                          <Icon name="format-list-bulleted" size={20} color="#444" style={styles.iconSpacing} />
                          <Text style={styles.courseItem}>{courseData?.courseSteps?.quizzes?.length} Quiz</Text>
                        </View>
                      )}

                      {courseData?.certificate && (
                        <View style={styles.courseRow}>
                          <Icon name="certificate" size={20} color="#444" style={styles.iconSpacing} />
                          <Text style={styles.courseItem}>Course certificate</Text>
                        </View>
                      )}
                    </View>
                  </View>

                )}  
              </View>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
              {courseData?.courseSteps?.lessons?.length > 0 && (  
                <View style={styles.contentSection}>
                  <View style={styles.contentHeaderRow}>
                    <Text style={styles.sectionTitle}>Course Content</Text>
                    <TouchableOpacity onPress={handleExpandAll}>
                      <Text style={styles.expandAll}>{expandedAll ? 'Collapse All' : 'Expand All'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.accordionContainer}>

                    {courseData.courseSteps?.lessons?.map((lesson, idx) => {

                      if (lesson.steps) {
                        return (
                          <View key={`section-${idx}`}>
                            <View style={{ marginBottom: 10 }}>
                              <Text style={{ color: "#666", fontWeight: "bold", margin: 6 }}>
                                {lesson.post_title}
                              </Text>
                            </View>
                            {lesson.steps.map((lessonDD, idx2) => (
                              <View key={`lesson-${idx}-step-${idx2}`}>
                                {renderLessonContent(lessonDD, courseData, `${idx}-${idx2}`)}
                              </View>
                            ))}
                          </View>
                        );
                      } else {
                        return (
                          <View key={`lesson-${idx}`}>
                            {renderLessonContent(lesson, courseData, idx)}
                          </View>
                        );
                      }
                    })}
                  
                  </View>
                </View>
              )}
              {(courseData.courseSteps && courseData.courseSteps.quizzes && courseData.courseSteps.quizzes.length > 0) && (
                <View style={styles.contentSection}>
                      <View style={styles.contentHeaderRow}>
                        <Text style={styles.sectionTitle}>Final Quizzes</Text>
                      </View>
                      <View style={styles.accordionContainer}>

                        {courseData.courseSteps?.quizzes?.map((quiz, idx) => {

                          
                            return (
                              <View key={`quiz-${idx}`}>
                                {renderLessonContent(quiz, courseData, idx)}
                              </View>
                            );
                        })}
                      
                      </View>
                </View>
              )}
              
            </ScrollView>

            {(progressData?.progressWidth != 100 && (courseData?.courseSteps?.lessons?.length > 0 || courseData?.courseSteps?.quizzes?.length > 0)) && (
              <View style={styles.bottomBar}>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    if (!courseStepData || !courseStepData.stepsData) return;

                    const progressMap = courseData.progresCompleted || {};


                    navigation.navigate('CourseStepsStack', {
                      screen: 'CourseStepsScreen',
                      params: {
                        courseStepData: courseStepData,
                        progressMap: progressMap,
                        currentIndex: 0,
                      }
                    });
                  }}
                >
                  <Text style={styles.continueButtonText}>
                    {progressData?.progressWidth > 0 ? "Continue" : "Start Course"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        <View style={loaderVisible ? { zIndex: 99999 } : {}}>
          <PageLoader visible={loaderVisible} setVisible={setLoaderVisible} />
        </View>
      </View>
      
    </SafeAreaView>
  );
}



const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
};
const flattenCourseSteps = (courseData) => {

  const sequence = [];

  if(courseData && courseData.courseSteps && courseData.courseSteps.lessons){

    let totalLessons = courseData.courseSteps.totalLessons;

    let lessonCount = 1;

    courseData.courseSteps.lessons.map((lesson, idx) => {

      if (lesson.steps) {

        

        lesson.steps.forEach((step) => {

          sequence.push({
            id: step.id,
            title: step.title,
            type: 'lesson',
            child: step.topics,
            totalLessons: totalLessons,
            lessonCount
          });
      
          step.topics.forEach((topic, topicCount) => {
            sequence.push({
              id: topic.id,
              title: topic.title,
              type: 'topic',
              parentStep: step.title,
              lessonCount,
              totalLessons: totalLessons,
              topicCount: topicCount+1,
            });
          });

          lessonCount++;
           
        })

         
      } else {

        sequence.push({
          id: lesson.id,
          title: lesson.title,
          type: 'lesson',
          child: lesson.topics,
          totalLessons: totalLessons,
          lessonCount
        });
    
        lesson.topics.forEach((topic,topicCount) => {
          sequence.push({
            id: topic.id,
            title: topic.title,
            type: 'topic',
            parentStep: lesson.title,
            lessonCount,
            totalLessons: totalLessons,
            topicCount: topicCount+1,
          });
        });
        lessonCount++;
      }
      
    })

  }
  
  if(courseData && courseData.courseSteps && courseData.courseSteps.quizzes){

    let totalLessons = courseData.courseSteps.totalLessons;

    let lessonCount = 1;

    courseData.courseSteps.quizzes.map((quiz, idx) => {

      

        sequence.push({
          id: quiz.id,
          title: quiz.title,
          type: 'quiz',
          child: null,
          totalLessons: totalLessons,
          lessonCount
        });
      
    })

  }
  
  return sequence;
};

const stepData = (step) => {
    
    
  return sequence;

}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  safeArea: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 200,
    overflow: 'hidden',
    zIndex: 10,
  },
  headerImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  headerFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
  },
  headerContent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 50,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  headerRow: {
    position: 'absolute',
    top: 50,
    left: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    zIndex: 50, 
    zIndex: 99999999
  },
  backBtnWrapper: {
    padding: 8,
    marginTop: -43,
    zIndex: 100,
  },
  backBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.61)',
    borderRadius: 30,
    padding: 3,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 0,
  },
  headerInstructorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  avatar: {
    width: 28,
    height: 28,
    marginRight: 8,
    backgroundColor: '#eee',
  },
  instructorName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  headerDot: {
    marginHorizontal: 6,
    color: '#fff',
    fontSize: 16,
  },
  headerDate: {
    color: '#fff',
    fontSize: 13,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    zIndex: 999,
  },
  progressCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStatus: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  lastActivity: {
    color: '#888',
    fontSize: 13,
  },
  progressCircleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircleOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F6E7C1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E6A23C',
  },
  progressPercentText: {
    color: '#E6A23C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contentSection: {
    marginTop: 18,
    flex: 1,
  },
  contentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  expandAll: {
    color: '#E6A23C',
    fontWeight: '600',
    fontSize: 14,
  },
  accordionContainer: {
    paddingHorizontal: 12,
  },
  accordionSection: {
    backgroundColor: '#fff',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
  },
  accordionTitleMain: {
    flex: 1,
  },
  accordionTitle: {
    fontSize: 15,
    color: '#222',
    fontWeight: '500',
  },
  accordionSteps: {
    color: '#888',
    fontSize: 13,
    marginRight: 10,
  },
  accordionProgressCircle: {
    marginLeft: 2,
  },
  circleFilled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6A23C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E6A23C',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionContent: {
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3F3F3',
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  continueButton: {
    backgroundColor: '#E6A23C',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#E6A23C',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  mainContent: {
    paddingTop: 150, 
    flex: 1,
    zIndex: 1000,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 10,
    marginLeft: 10,
    justifyContent: "space-between",
  },
  stepTitle: {
    fontSize: 15,
    color: '#222',
    marginLeft: 10,
  },
  circleFilled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#E6A23C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E6A23C',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  iconSpacing: {
    marginRight: 8,
  },
  courseItem: {
    fontSize: 15,
    color: '#444',
  },
  cr_inc: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    fontWeight: "bold"
  },
  
});