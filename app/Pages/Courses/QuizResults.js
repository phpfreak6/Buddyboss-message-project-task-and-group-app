import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

const QuizResults = ({ score, totalPoints, duration, onTakeAgain, onViewDetails, quizMetaData, quizData, selectedAnswers }) => {
  const percentage = (score / totalPoints) * 100;
  const passingPercentage = quizMetaData?.["sfwd-quiz_passingpercentage"];
  const isPassing = passingPercentage ? percentage >= passingPercentage : null;
  const progressColor = isPassing === null ? '#E6A23C' : (isPassing ? '#4CAF50' : '#F44336');

  const calculateCorrectAnswers = () => {
    let correctCount = 0;
    quizData.forEach(question => {
      const selectedAnswer = selectedAnswers[question.id];
      const correctOptions = question.answers.filter(answer => answer._correct);
      
      if (question.question_type === 'multiple') {
        const selectedCorrect = correctOptions.every(correct => 
          selectedAnswer && selectedAnswer.includes(correct._answer)
        );
        const noIncorrectSelected = !question.answers.some(answer => 
          !answer._correct && selectedAnswer && selectedAnswer.includes(answer._answer)
        );
        
        if (selectedCorrect && noIncorrectSelected) {
          correctCount++;
        }
      } else {
        if (correctOptions[0] && selectedAnswer === correctOptions[0]._answer) {
          correctCount++;
        }
      }
    });
    return correctCount;
  };

  const correctAnswers = calculateCorrectAnswers();

  return (
    <View style={styles.scoreContainer}>
      <AnimatedCircularProgress
        size={140}
        width={10}
        fill={percentage}
        tintColor={progressColor}
        backgroundColor="#F0F0F0"
        rotation={0}
        lineCap="round"
      >
        {() => (
          <Text style={{ fontSize: 32, fontWeight: 'bold' }}>
            {Math.round(percentage)}%
          </Text>
        )}
      </AnimatedCircularProgress>
      <Text style={{ marginTop: 16, fontSize: 16 }}>
        {score.toFixed(2)} of {totalPoints} points earned
      </Text>
      <Text style={{ marginTop: 8, fontSize: 16 }}>
        {correctAnswers} of {quizData.length} questions answered correctly
      </Text>
      <Text style={{ marginTop: 8, fontSize: 16 }}>
        Time Spent: {Math.floor(duration / 60)}:{('0' + (duration % 60)).slice(-2)} min
      </Text>
      {isPassing !== null && (
        <Text style={[styles.passFailText, { color: progressColor }]}>
          {isPassing ? 'Passed' : 'Failed'}
        </Text>
      )}
      <TouchableOpacity 
        style={[styles.takeAgainButton, { backgroundColor: progressColor }]} 
        onPress={onTakeAgain}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Take Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.viewDetailsButton} onPress={onViewDetails}>
        <Text style={{ color: '#222', fontWeight: 'bold' }}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  scoreContainer: {
    alignItems: 'center',
    padding: 20,
  },
  takeAgainButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  viewDetailsButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
    display: 'none'
  },
  passFailText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
});

export default QuizResults; 