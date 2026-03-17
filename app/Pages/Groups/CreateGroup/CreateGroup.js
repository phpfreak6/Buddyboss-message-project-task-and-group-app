import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  DetailsStep,
  SettingsStep,
  ForumStep,
  PhotoStep,
  CoverPhotoStep,
  InvitesStep,
  CoursesStep,
} from './index';
import agent from '@/agent';

const CreateGroup = ({ navigation, route }) => {
  const [currentStep, setCurrentStep] = useState(route.params?.initialStep || 0);
  const [groupId, setGroupId] = useState(route.params?.groupId || null);
  const [loading, setLoading] = useState(false);

  const steps = [
    { title: 'Details', component: DetailsStep },
    { title: 'Settings', component: SettingsStep },
    { title: 'Forum', component: ForumStep },
    { title: 'Photo', component: PhotoStep },
    { title: 'Cover Photo', component: CoverPhotoStep },
    { title: 'Invites', component: InvitesStep },
    { title: 'Courses', component: CoursesStep },
  ];

  const CurrentStepComponent = steps[currentStep].component;

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Handle final submission
      try {
        setLoading(true);
        // Final step completion, possibly navigate away or show success
        Alert.alert('Success', 'Group creation/update complete!');
        navigation.goBack();
      } catch (error) {
        console.error('Error completing group process:', error);
        Alert.alert('Error', 'Failed to complete group process.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      

      <View style={styles.content}>
        <CurrentStepComponent 
          groupId={groupId}
          {...(currentStep === 0 ? { setGroupId: setGroupId } : {})}
          onBack={handleBack}
          onNext={handleNext}
          isDirectAccess={route.params?.isDirectAccess}
        />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  topNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  prevButton: {
    backgroundColor: '#f0f0f0',
  },
  nextButton: {
    backgroundColor: '#f0f0f0',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginHorizontal: 4,
  },
  prevButtonText: {
    color: '#6B46C1',
  },
  nextButtonText: {
    color: '#6B46C1',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  stepIndicator: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#6B46C1',
  },
  stepNumber: {
    fontSize: 14,
    color: '#666',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepTitle: {
    fontSize: 12,
    color: '#666',
  },
  stepTitleActive: {
    color: '#6B46C1',
    fontWeight: '500',
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#eee',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#6B46C1',
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#6B46C1',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
});

export default CreateGroup; 