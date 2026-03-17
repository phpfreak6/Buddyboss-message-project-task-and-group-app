// screens/LessonDetailScreen.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, SafeAreaView, Platform, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import HtmlRenderer from '@/components/htmlRenderer'; 
import agent from '@/agent';
import Video from 'react-native-video';
import YoutubePlayer from "react-native-youtube-iframe";
import { StatusBar, PageLoader } from '@/components';
import DraggableFlatList from 'react-native-draggable-flatlist';
import { AnimatedCircularProgress } from 'react-native-circular-progress';
import QuizResults from './QuizResults';

const QuizSteps = ({ quizData, quizMain, setLoading }) => {
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const quizMetaData = quizMain?.quizMetaData || {};
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [sortOrder, setSortOrder] = useState({});
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [duration, setDuration] = useState(0);

  const calculateTotalPoints = useCallback(() => {
    return quizData.reduce((total, question) => {
      return total + parseInt(question.points);
    }, 0);
  }, [quizData]);

  const totalPoints = useMemo(() => calculateTotalPoints(), [calculateTotalPoints]);

  const renderersProps = useMemo(() => ({
    a: { onPress: () => {} }
  }), []);

  const handleAnswerSelect = useCallback((questionId, answerId) => {
    setSelectedAnswers(prev => {
      const currentAnswers = prev[questionId] || [];
      const question = quizData.find(q => q.id === questionId);
      
      if (question.question_type === 'multiple') {
        // For multiple choice, toggle the answer in the array
        if (currentAnswers.includes(answerId)) {
          return {
            ...prev,
            [questionId]: currentAnswers.filter(id => id !== answerId)
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentAnswers, answerId]
          };
        }
      } else {
        // For single choice, replace the answer
        return {
          ...prev,
          [questionId]: answerId
        };
      }
    });
  }, [quizData]);

  const calculateScore = () => {
    let totalScore = 0;

    quizData.forEach(question => {
      const selectedAnswer = selectedAnswers[question.id];
      const correctOptions = question.answers.filter(answer => answer._correct);
      const questionPoints = parseInt(question.points);
      
      if (question.question_type === 'multiple') {
        // For multiple choice, calculate points proportionally
        const totalCorrectOptions = correctOptions.length;
        const pointsPerCorrectAnswer = questionPoints / totalCorrectOptions;
        
        // Count how many correct answers were selected
        const correctSelected = correctOptions.filter(correct => 
          selectedAnswer && selectedAnswer.includes(correct._answer)
        ).length;
        
        // Count how many incorrect answers were selected
        const incorrectSelected = question.answers.filter(answer => 
          !answer._correct && selectedAnswer && selectedAnswer.includes(answer._answer)
        ).length;
        
        // If no incorrect answers were selected, award points proportionally
        if (incorrectSelected === 0) {
          totalScore += correctSelected * pointsPerCorrectAnswer;
        }
      } else {
        // For single choice, check if the selected answer is correct
        if (correctOptions[0] && selectedAnswer === correctOptions[0]._answer) {
          totalScore += questionPoints;
        }
      }
    });
    return Math.round(totalScore * 100) / 100; // Round to 2 decimal places
  };

  useEffect(() => {
    if (!showResults) {
      setStartTime(Date.now());
    }
  }, [showResults]);

  const handleSubmit = async () => {
    const finalScore = calculateScore();
    const endTimeRes = Date.now();
    const durationRes = Math.floor((endTimeRes - startTime) / 1000);
    setScore(finalScore);
    setEndTime(endTimeRes);
    setShowResults(true);
    setDuration(durationRes); 

    const percentage = (finalScore / quizData.length) * 100;
   
    const passingPercentage = quizMetaData?.["sfwd-quiz_passingpercentage"];
    const isPassing = passingPercentage ? percentage >= parseInt(passingPercentage) : null;

   
    var dataSend = {
      "quiz_id": quizMain.id,
      "quiz_results": selectedAnswers,
      "score": finalScore,
      "duration": durationRes,
      "is_passing": isPassing
    }
    //console.log("_____________________",JSON.stringify(dataSend,null,2))

 

    try {
      setLoading(true);

     
      
      // // Here you can handle the quiz results
      // console.log('Quiz Results:', quizResults);
      
      // If you want to mark the quiz as complete after submission
      //const response = await agent.Auth.quizComplete(courseStepData.courseId, currentStep.id);
      // if (response && response.data && response.data.stepdata && response.data.stepdata.step_id) {
      //   const updatedProgressMap = { ...progressMap, [currentStep.id]: 1 };
      //   navigation.setParams({ progressMap: updatedProgressMap });
      // }
      setLoading(false);
    } catch (error) {
      // console.error('Error handling quiz completion:', error);
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSortChange = (questionId, newOrder) => {
    setSortOrder(prev => ({
      ...prev,
      [questionId]: newOrder
    }));
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: newOrder.map(item => item._answer)
    }));
  };

  const handleTakeAgain = () => {
    setSelectedAnswers({});
    setShowResults(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSortOrder({});
    setStartTime(null);
    setEndTime(null);
    setDuration(0);
  };

  const renderSortAnswer = (question) => {

    function shuffleArray(array) {
      const newArray = [...array];
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
      return newArray;
    }

    let dragData;

    if (sortOrder[question.id] && sortOrder[question.id].length > 0) {
      dragData = sortOrder[question.id];
    } else {
      dragData = shuffleArray(question.answers);
    }

    

    return (
      <DraggableFlatList
        data={dragData}
        keyExtractor={(item) => item._answer}
        onDragEnd={({ data }) => handleSortChange(question.id, data)}
        renderItem={({ item, drag, isActive }) => {
          return (
            <TouchableOpacity
              style={[
                styles.optionButtonRow,
                { 
                  opacity: isActive ? 0.8 : 1,
                  backgroundColor: isActive ? '#F5F5F5' : '#fff',
                  elevation: isActive ? 3 : 0,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isActive ? 0.25 : 0,
                  shadowRadius: 3.84,
                  zIndex: isActive ? 999 : 1,
                }
              ]}
              onPressIn={drag}
              activeOpacity={0.7}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Icon name="drag" size={22} color="#C4C4C4" style={{ marginRight: 10 }} />
                <Text style={styles.optionTextRow}>{item._answer}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
        scrollEnabled={false}
        containerStyle={{ minHeight: 200 }}
      />
    );
  };

  const question = quizData[currentQuestionIndex];

  return (
    <FlatList
      data={[1]} 
      renderItem={() => (
        <View style={styles.quizContainer}>
          {showResults ? (
            <QuizResults
              score={score}
              totalPoints={totalPoints}
              duration={duration}
              onTakeAgain={handleTakeAgain}
              onViewDetails={() => {  }}
              quizMetaData={quizMetaData}
              quizData={quizData}
              selectedAnswers={selectedAnswers}
            />
          ) : (
            <>
              <View key={question.id} style={styles.questionContainer}>
                <View style={{ maxHeight: 60 }}>
                  <Text style={styles.questionText}>
                    <HtmlRenderer 
                      message={question.question} 
                      renderersProps={renderersProps}
                    />
                  </Text>
                </View>
                {question.question_type === 'sort_answer' ? (
                  <View style={styles.sortAnswerContainer}>
                    {renderSortAnswer(question)}
                  </View>
                ) : (
                  question.answers.map((answer) => (
                    <TouchableOpacity
                      key={answer._answer}
                      style={styles.optionButtonRow}
                      onPress={() => !showResults && handleAnswerSelect(question.id, answer._answer)}
                      disabled={showResults}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.optionTextRow}>
                        {answer._answer}
                      </Text>
                      <Icon
                        name={
                          question.question_type === 'multiple'
                            ? (selectedAnswers[question.id]?.includes(answer._answer)
                                ? 'checkbox-marked'
                                : 'checkbox-blank-outline')
                            : (selectedAnswers[question.id] === answer._answer
                                ? 'radiobox-marked'
                                : 'radiobox-blank')
                        }
                        size={24}
                        color={
                          question.question_type === 'multiple'
                            ? (selectedAnswers[question.id]?.includes(answer._answer)
                                ? '#E6A23C'
                                : '#C4C4C4')
                            : (selectedAnswers[question.id] === answer._answer
                                ? '#E6A23C'
                                : '#C4C4C4')
                        }
                      />
                    </TouchableOpacity>
                  ))
                )}
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
                <TouchableOpacity
                  style={[styles.submitButton, { flex: 1, marginRight: 8 }, currentQuestionIndex === 0 && styles.submitButtonDisabled]}
                  onPress={handlePrev}
                  disabled={currentQuestionIndex === 0}
                >
                  <Text style={styles.submitButtonText}>Prev</Text>
                </TouchableOpacity>
                {currentQuestionIndex < quizData.length - 1 ? (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { flex: 1, marginLeft: 8 },
                      (!selectedAnswers[question.id] || 
                       (question.question_type === 'multiple' && selectedAnswers[question.id].length === 0)) && 
                      styles.submitButtonDisabled
                    ]}
                    onPress={handleNext}
                    disabled={!selectedAnswers[question.id] || 
                             (question.question_type === 'multiple' && selectedAnswers[question.id].length === 0)}
                  >
                    <Text style={styles.submitButtonText}>Next</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { flex: 1, marginLeft: 8 },
                      (!selectedAnswers[question.id] || 
                       (question.question_type === 'multiple' && selectedAnswers[question.id].length === 0)) && 
                      styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmit}
                    disabled={!selectedAnswers[question.id] || 
                             (question.question_type === 'multiple' && selectedAnswers[question.id].length === 0)}
                  >
                    <Text style={styles.submitButtonText}>Submit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      )}
      keyExtractor={() => 'quiz-container'}
      scrollEnabled={false}
    />
  );
};


const styles = StyleSheet.create({
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
  optionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  optionTextRow: {
    fontSize: 15,
    color: '#222',
    flex: 1,
  },
  sortAnswerContainer: {
    flex: 1,
    minHeight: 300,
  },
  passFailText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  takeAgainButton: {
    backgroundColor: '#E6A23C',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  viewDetailsButton: {
    backgroundColor: '#F5F6FA',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },
});

export default QuizSteps;
