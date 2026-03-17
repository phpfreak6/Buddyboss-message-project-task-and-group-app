// screens/LessonDetailScreen.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, SafeAreaView, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HtmlRenderer from '@/components/htmlRenderer'; 
import agent from '@/agent';
import Video from 'react-native-video';
import YoutubePlayer from "react-native-youtube-iframe";
import { StatusBar, PageLoader } from '@/components';
import QuizSteps from './QuizStepsScreen';

const CourseStepsScreen = ({ route, navigation }) => {
  const { courseStepData, currentIndex, progressMap } = route.params;
  const stepsData = courseStepData.stepsData;

  
  const currentStep = stepsData[currentIndex];
  const [stepDataItem, setStepData] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizMain, setQuizMainData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loaderVisible, setLoaderVisible] = useState(false);

  const [contentChecks, setContentChecks] = useState(null);

  const isFetchingRef = useRef(false);


  const fetchStepData = async () => {
    if (isFetchingRef.current) return; // prevent overlapping calls
    isFetchingRef.current = true;
    setLoading(true);
    try {
      setQuizData(null);
      setQuizMainData(null);
      setStepData(null);
      let responseData = null;
      if(currentStep.type == "quiz"){
        responseData = await agent.Auth.fetchCourseQuizData(currentStep.id); 
        //console.log("_____________________",JSON.stringify(responseData,null,2))
        if (responseData && responseData.data && responseData.data.quizMain  && responseData.data.quizMain.questions_data && responseData.data.quizMain.questions_data.length > 0) {
          setQuizData(responseData.data.quizMain.questions_data);
          setQuizMainData(responseData.data.quizMain);
        }else{
          setQuizData(null);
        }
      }else{
        responseData = await agent.Auth.fetchCourseStepData(currentStep.id,currentStep.type); 
        if (responseData && responseData.data && responseData.data.stepdata && responseData.data.stepdata.ID) {
          setStepData(responseData.data.stepdata);
        }else{
          setStepData(null);
        }
      }

    } catch (error) {
      console.error('Error fetching thread data:', error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchStepData();
      if (currentStep.child) {
        setContentChecks(currentStep.child);
      } else {
        setContentChecks(null);
      }
    }, [currentStep])
  );

  useEffect(() => {
   //console.log(stepDataItem)
  }, [stepDataItem]);


  

  const goToStep = (index) => {
    if (index >= 0 && index < stepsData.length) {
      const direction = index > currentIndex ? 'forward' : 'backward';
      navigation.replace('CourseStepsScreen', {
        progressMap,
        courseStepData,
        currentIndex: index,
        transitionDirection: direction
      });
    }
  };

  const handleCheck = (idx) => {
    setContentChecks((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, checked: !item.checked } : item))
    );
  };

  const handleMarkComplete = async () => {
    try {
      setLoading(true);
      const response = await agent.Auth.markStepComplete(courseStepData.courseId,currentStep.id);
      if (response && response.data && response.data.stepdata && response.data.stepdata.step_id) {
        
        const updatedProgressMap = { ...progressMap, [currentStep.id]: 1 };
        navigation.setParams({ progressMap: updatedProgressMap });
      }
      setLoading(false);
    } catch (error) {
      console.error('Error marking step complete:', error);
      setLoading(false);
    }
  };

  

  // Helper to extract YouTube video ID
  function getYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Icon name="arrow-left" size={26} color="#B8860B" />
          </TouchableOpacity>
          <View style={styles.headerNavBtns}>
            <TouchableOpacity
              style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
              disabled={currentIndex === 0}
              onPress={() => goToStep(currentIndex - 1)}
            >
              <Text style={styles.navBtnText}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.navBtn, currentIndex === stepsData.length - 1 && styles.navBtnDisabled]}
              disabled={currentIndex === stepsData.length - 1}
              onPress={() => goToStep(currentIndex + 1)}
            >
              <Text style={styles.navBtnText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{currentStep.title}</Text>
            {(currentStep && currentStep.type == "lesson") ? (
               <Text style={styles.headerSubtitle}>Lesson {currentStep.lessonCount} of {currentStep.totalLessons}</Text>
            ) : (currentStep && currentStep.type == "topic") ? (
              <Text style={styles.headerSubtitle}>Lesson {currentStep.lessonCount} - Topic {currentStep.topicCount}</Text>
            ): ''}
            
        </View>

        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.textContent}>
              
              
           
              {stepDataItem && stepDataItem.video_url && (
                <View style={styles.videoContainer}>
                  {stepDataItem.video_url.includes('youtu.be') || stepDataItem.video_url.includes('youtube.com') ? (
                    <YoutubePlayer
                      height={220}
                      play={false}
                      videoId={getYouTubeId(stepDataItem.video_url)}
                    />
                  ) : (
                    <Video
                      source={{ uri: stepDataItem.video_url }}
                      style={styles.video}
                      controls={true}
                      resizeMode="contain"
                      onError={e => console.log('Video error:', e)}
                      onLoad={data => console.log('Video loaded:', data)}
                      onBuffer={data => console.log('Buffering:', data)}
                    />
                  )}
                </View>
              )}
              {(stepDataItem && stepDataItem.post_content)&&(<HtmlRenderer message={stepDataItem.post_content} />)}

              {stepDataItem && stepDataItem.short_desc && stepDataItem.short_desc != "" && (
                <View style={styles.short_desc}>
                  <HtmlRenderer message={stepDataItem.short_desc} />
                </View>
              )} 

              {stepDataItem && stepDataItem.topic_desc && stepDataItem.topic_desc != "" && (
                <View style={styles.short_desc}>
                  <HtmlRenderer message={stepDataItem.topic_desc} />
                </View>
              )} 

              {currentStep.type === "quiz" && quizData && quizData.length > 0 && quizMain && (
                <QuizSteps 
                  quizData={quizData} 
                  quizMain={quizMain} 
                  setLoading={setLoading}
                />
              )}
          </View>  
          {(contentChecks && contentChecks.length > 0) && (
            <View style={styles.mainBottomContent}>
              <Text style={styles.sectionTitle}>Lesson Content</Text>
              <View style={styles.lessonContentList}>
                  <View style={styles.accordionContent}>
                    {contentChecks.map((topic, tIdx) => {

                      //console.log("---======================",progressMap)
                      const isCompleted = progressMap[topic.id] === 1;
                      return (
                        <TouchableOpacity
                            style={styles.accordionTitle}
                            onPress={() =>
                              navigation.navigate('CourseStepsStack', {
                                screen: 'CourseStepsScreen',
                                params: {
                                  progressMap: progressMap,
                                  courseStepData: courseStepData,
                                  currentIndex: courseStepData.stepsData.findIndex(s => s.id === topic.id),
                                }
                              })
                            }
                            key={tIdx+topic.id}
                        >
                          <View  style={styles.stepItem}>
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
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Button */}
        <View style={styles.bottomBar}>
          {progressMap && progressMap[currentStep.id] === 1 && currentStep.type != "quiz" ? (
            <View style={styles.completedBadge}>
              <Icon name="check-circle" size={20} color="#E6A23C" />
              <Text style={styles.completedText}>Completed</Text>
            </View>
          ) :  ((currentStep.type == "lesson" && currentStep.child.length == 0) || (currentStep.type == "topic")) ? (
            <TouchableOpacity 
              style={styles.markCompleteBtn} 
              activeOpacity={0.85}
              onPress={handleMarkComplete}
            >
              <Text style={styles.markCompleteText}>Mark Complete</Text>
            </TouchableOpacity>
          ):""}
        </View>
      </View>
        
        {loading && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}>
            <Image source={require('@/assets/images/loader.gif')} style={{ width: 80, height: 80 }} />
          </View>
        )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? 18 : 8,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 10
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 13,
    marginTop: 0,
  },
  headerNavBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  navBtn: {
    backgroundColor: '#eee',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginLeft: 8,
    minWidth: 60,
    alignItems: 'center',
  },
  navBtnDisabled: {
    opacity: 0.5,
  },
  navBtnText: {
    color: '#222',
    fontWeight: '600',
    fontSize: 15,
  },
  imageWrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lessonImage: {
    width: '92%',
    height: 170,
    borderRadius: 14,
    backgroundColor: '#eee',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
    marginTop: 30
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  mainBottomContent: {
    backgroundColor: '#fafafa',
    padding: 10
  },
  lessonContentList: {
    backgroundColor: '#fafafa',
    borderRadius: 10,
    padding: 2,
  },
  lessonContentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
    paddingHorizontal: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lessonContentText: {
    fontSize: 15,
    color: '#222',
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    paddingBottom: Platform.OS === 'android' ? 18 : 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f3f3',
    zIndex: 20,
  },
  markCompleteBtn: {
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
  markCompleteText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  videoContainer: {
    width: '100%',
    height: 220,
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  short_desc:{
    marginBottom: 20
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
    backgroundColor: "#fff",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,

  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingLeft: 2,
    marginLeft: 2,
    justifyContent: "space-between",
    
  },
  stepTitle: {
    fontSize: 15,
    color: '#222',
    marginLeft: 10,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  completedText: {
    color: '#E6A23C',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  quizContainer: {
    padding: 16,
  },
  quizTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
  },
  scoreContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  scorePercentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E6A23C',
  },
  questionContainer: {
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#E6A23C',
  },
  correctOption: {
    backgroundColor: '#DFF6DD',
  },
  wrongOption: {
    backgroundColor: '#FFDEDE',
  },
  optionText: {
    fontSize: 15,
    color: '#222',
  },
  selectedOptionText: {
    fontWeight: 'bold',
  },
  correctOptionText: {
    fontWeight: 'bold',
    color: '#222',
  },
  submitButton: {
    backgroundColor: '#E6A23C',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
});

export default CourseStepsScreen;
