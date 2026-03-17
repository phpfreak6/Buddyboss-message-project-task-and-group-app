import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Switch, StyleSheet, Alert, ActivityIndicator, SafeAreaView, ScrollView, LayoutAnimation, Platform, UIManager } from 'react-native';
import agent from '@/agent';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const COLLAPSIBLE_SECTIONS = [
  { key: 'privacy', label: 'Privacy Options' },
  { key: 'invitation', label: 'Group Invitations' },
  { key: 'activity', label: 'Activity Feeds' },
  { key: 'photos', label: 'Group Photos' },
  { key: 'albums', label: 'Group Albums' },
  { key: 'documents', label: 'Group Documents' },
  { key: 'videos', label: 'Group Videos' },
  { key: 'messages', label: 'Group Messages' },
];

// Helper to render multiline description
const renderMultilineText = (text, style) =>
  text.split('\n').map((line, idx) => (
    <Text key={idx} style={style}>{line}</Text>
  ));

const BulletList = ({ items }) => (
  <View style={{ marginTop: 4, marginBottom: 4, marginLeft: 8 }}>
    {items.map((item, idx) => (
      <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 }}>
        <Text style={{ fontSize: 16, color: '#666', marginRight: 8, lineHeight: 27 }}>{'\u2022'}</Text>
        <Text style={{ flex: 1, fontSize: 14, color: '#666', lineHeight: 27 }}>{item}</Text>
      </View>
    ))}
  </View>
);

const SettingsStep = ({ groupId, onBack, onNext, isDirectAccess }) => {
  const navigation = useNavigation();
  const [settings, setSettings] = useState({
    privacy: 'private',
    requireApproval: false,
    invitationPermission: 'members',
    activityFeedPermission: 'members',
    photosPermission: 'members',
    albumsPermission: 'members',
    documentsPermission: 'members',
    videosPermission: 'members',
    messagesPermission: 'mods',
    rules: '',
  });
  const [loading, setLoading] = useState(false);
  const [openSections, setOpenSections] = useState({
    privacy: true,
    invitation: true,
    activity: true,
    photos: true,
    albums: true,
    documents: true,
    videos: true,
    messages: true,
  });

  // Fetch initial data if editing an existing group
  useEffect(() => {
    const fetchGroupSettings = async () => {
      if (groupId) {
        try {
          setLoading(true);
          // Assuming there's an API endpoint to get specific step data
          // Replace with the actual API call if different
          const response = await agent.Groups.getdetails(groupId);
          if (response?.data?.group?.meta_data) {
            const meta_data = response.data.group.meta_data;
            const group_data = response.data.group;
            setSettings(prev => ({
              ...prev,
              ...meta_data,
              privacy: group_data.status || prev.privacy,
              invitationPermission: meta_data.invite_status || prev.invitationPermission,
              invitationPermission: meta_data.invite_status || prev.invitationPermission,
              activityFeedPermission: meta_data.activity_feed_status || prev.activityFeedPermission,
              photosPermission: meta_data.media_status || prev.photosPermission,
              albumsPermission: meta_data.album_status || prev.albumsPermission,
              documentsPermission: meta_data.document_status || prev.documentsPermission,
              videosPermission: meta_data.video_status || prev.videosPermission,
              messagesPermission: meta_data.message_status || prev.messagesPermission,
            }));
            console.log(meta_data);
          } else {
            // Handle case where settings might not exist yet for a new group being edited
            console.log('No settings found for this group yet.');
          }
        } catch (error) {
          console.error('Error fetching group settings:', error);
          Alert.alert('Error', 'Failed to fetch group settings.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchGroupSettings();
  }, [groupId]); // Re-run effect if groupId changes

  const handleChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      // Assuming there's an API endpoint to update specific step data
      // Replace with the actual API call if different
      const response = await agent.Groups.updateGroupSettings(groupId, settings);

      if (response?.data?.group?.id) {
        if (isDirectAccess) {
          //navigation.goBack();
        } else {
          onNext(groupId);
        }
      } else {
        Alert.alert('Error', 'Failed to save group settings.');
      }
    } catch (error) {
      console.error('Error saving group settings:', error);
      Alert.alert('Error', 'Failed to save group settings.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBackPress = () => {
    if (isDirectAccess) {
      navigation.goBack();
    } else {
      onBack();
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButtonBack} onPress={handleBackPress}>
          <Icon name="arrow-left" size={22} color="#122b46" />
          <Text style={styles.navButtonText}>Prev</Text>
        </TouchableOpacity>
        <Text style={styles.stepHeadingTop}>Settings</Text>
        <TouchableOpacity style={styles.navButton} onPress={handleSaveSettings} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#6B46C1" />
          ) : (
            <Text style={styles.navButtonText}>{isDirectAccess ? 'Save' : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.stepContent}>
        {loading && !settings.privacy ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6B46C1" />
          </View>
        ) : (
          <>

            {/* Privacy Options */}
            <View style={styles.collapsibleSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('privacy')}>
                <Text style={styles.sectionHeaderText}>Privacy Options</Text>
                <Icon name={openSections.privacy ? 'chevron-up' : 'chevron-down'} size={22} color="#6B46C1" />
              </TouchableOpacity>
              {openSections.privacy && (
                <View style={styles.sectionContent}>
                  {/* Public Group */}
                  <TouchableOpacity
                    style={[styles.radioOption, { marginTop: 12, marginBottom: 12, display: 'flex', flexDirection: 'row' }]}
                    onPress={() => handleChange('privacy', 'public')}
                  >
                    <View style={[styles.radioButtonMain, { marginRight: 12, marginTop: 0, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%' }]}>
                      <View style={styles.radioButton}>
                        {settings.privacy === 'public' && <View style={styles.radioButtonSelected} />}
                      </View>
                    </View>
                    <View style={styles.radioTextContainer}>
                      <Text style={styles.radioLabel}>This is a public group</Text>
                      <BulletList items={[
                        'Any site member can join this group.',
                        'This group will be listed in the groups directory and in search results.',
                        'Group content and activity will be visible to any site member.'
                      ]} />
                    </View>
                  </TouchableOpacity>
                  {/* Private Group */}
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('privacy', 'private')}
                  >
                    <View style={[styles.radioButtonMain, { marginRight: 12, marginTop: 0, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%' }]}>
                      <View style={styles.radioButton}>
                        {settings.privacy === 'private' && <View style={styles.radioButtonSelected} />}
                      </View>
                    </View>
                    <View style={styles.radioTextContainer}>
                      <Text style={styles.radioLabel}>This is a private group</Text>
                      <BulletList items={[
                        'Only people who request membership and are accepted can join the group.',
                        'This group will be listed in the groups directory and in search results.',
                        'Group content and activity will only be visible to members of the group.'
                      ]} />
                    </View>
                  </TouchableOpacity>
                  {/* Hidden Group */}
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('privacy', 'hidden')}
                  >
                    <View style={[styles.radioButtonMain, { marginRight: 12, marginTop: 0, display: 'flex', flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%' }]}>
                      <View style={styles.radioButton}>
                        {settings.privacy === 'hidden' && <View style={styles.radioButtonSelected} />}
                      </View>
                    </View>
                    <View style={styles.radioTextContainer}>
                      <Text style={styles.radioLabel}>This is a hidden group</Text>
                      <BulletList items={[
                        'Only people who are invited can join the group.',
                        'This group will not be listed in the groups directory or search results.',
                        'Group content and activity will only be visible to members of the group.'
                      ]} />
                    </View>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Group Invitations */}
            <View style={styles.collapsibleSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('invitation')}>
                <Text style={styles.sectionHeaderText}>Group Invitations</Text>
                <Icon name={openSections.invitation ? 'chevron-up' : 'chevron-down'} size={22} color="#6B46C1" />
              </TouchableOpacity>
              {openSections.invitation && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionSubLabel}>Which members of this group are allowed to invite others?</Text>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('invitationPermission', 'members')}
                  >
                    <View style={styles.radioButton}>
                      {settings.invitationPermission === 'members' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>All group members</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('invitationPermission', 'mods')}
                  >
                    <View style={styles.radioButton}>
                      {settings.invitationPermission === 'mods' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers and Moderators only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('invitationPermission', 'admins')}
                  >
                    <View style={styles.radioButton}>
                      {settings.invitationPermission === 'admins' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers only</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Activity Feeds */}
            <View style={styles.collapsibleSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('activity')}>
                <Text style={styles.sectionHeaderText}>Activity Feeds</Text>
                <Icon name={openSections.activity ? 'chevron-up' : 'chevron-down'} size={22} color="#6B46C1" />
              </TouchableOpacity>
              {openSections.activity && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionSubLabel}>Which members of this group are allowed to post into the activity feed?</Text>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('activityFeedPermission', 'members')}
                  >
                    <View style={styles.radioButton}>
                      {settings.activityFeedPermission === 'members' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>All group members</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('activityFeedPermission', 'mods')}
                  >
                    <View style={styles.radioButton}>
                      {settings.activityFeedPermission === 'mods' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers and Moderators only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('activityFeedPermission', 'admins')}
                  >
                    <View style={styles.radioButton}>
                      {settings.activityFeedPermission === 'admins' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers only</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Group Photos */}
            <View style={styles.collapsibleSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('photos')}>
                <Text style={styles.sectionHeaderText}>Group Photos</Text>
                <Icon name={openSections.photos ? 'chevron-up' : 'chevron-down'} size={22} color="#6B46C1" />
              </TouchableOpacity>
              {openSections.photos && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionSubLabel}>Which members of this group are allowed to upload photos?</Text>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('photosPermission', 'members')}
                  >
                    <View style={styles.radioButton}>
                      {settings.photosPermission === 'members' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>All group members</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('photosPermission', 'mods')}
                  >
                    <View style={styles.radioButton}>
                      {settings.photosPermission === 'mods' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers and Moderators only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('photosPermission', 'admins')}
                  >
                    <View style={styles.radioButton}>
                      {settings.photosPermission === 'admins' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers only</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Group Albums */}
            <View style={styles.collapsibleSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('albums')}>
                <Text style={styles.sectionHeaderText}>Group Albums</Text>
                <Icon name={openSections.albums ? 'chevron-up' : 'chevron-down'} size={22} color="#6B46C1" />
              </TouchableOpacity>
              {openSections.albums && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionSubLabel}>Which members of this group are allowed to create albums?</Text>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('albumsPermission', 'members')}
                  >
                    <View style={styles.radioButton}>
                      {settings.albumsPermission === 'members' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>All group members</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('albumsPermission', 'mods')}
                  >
                    <View style={styles.radioButton}>
                      {settings.albumsPermission === 'mods' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers and Moderators only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('albumsPermission', 'admins')}
                  >
                    <View style={styles.radioButton}>
                      {settings.albumsPermission === 'admins' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers only</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Group Documents */}
            <View style={styles.collapsibleSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('documents')}>
                <Text style={styles.sectionHeaderText}>Group Documents</Text>
                <Icon name={openSections.documents ? 'chevron-up' : 'chevron-down'} size={22} color="#6B46C1" />
              </TouchableOpacity>
              {openSections.documents && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionSubLabel}>Which members of this group are allowed to upload documents?</Text>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('documentsPermission', 'members')}
                  >
                    <View style={styles.radioButton}>
                      {settings.documentsPermission === 'members' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>All group members</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('documentsPermission', 'mods')}
                  >
                    <View style={styles.radioButton}>
                      {settings.documentsPermission === 'mods' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers and Moderators only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('documentsPermission', 'admins')}
                  >
                    <View style={styles.radioButton}>
                      {settings.documentsPermission === 'admins' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers only</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Group Videos */}
            <View style={styles.collapsibleSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('videos')}>
                <Text style={styles.sectionHeaderText}>Group Videos</Text>
                <Icon name={openSections.videos ? 'chevron-up' : 'chevron-down'} size={22} color="#6B46C1" />
              </TouchableOpacity>
              {openSections.videos && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionSubLabel}>Which members of this group are allowed to upload videos?</Text>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('videosPermission', 'members')}
                  >
                    <View style={styles.radioButton}>
                      {settings.videosPermission === 'members' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>All group members</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('videosPermission', 'mods')}
                  >
                    <View style={styles.radioButton}>
                      {settings.videosPermission === 'mods' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers and Moderators only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('videosPermission', 'admins')}
                  >
                    <View style={styles.radioButton}>
                      {settings.videosPermission === 'admins' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers only</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Group Messages */}
            <View style={styles.collapsibleSection}>
              <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('messages')}>
                <Text style={styles.sectionHeaderText}>Group Messages</Text>
                <Icon name={openSections.messages ? 'chevron-up' : 'chevron-down'} size={22} color="#6B46C1" />
              </TouchableOpacity>
              {openSections.messages && (
                <View style={styles.sectionContent}>
                  <Text style={styles.sectionSubLabel}>Which members of this group are allowed to send group messages?</Text>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('messagesPermission', 'members')}
                  >
                    <View style={styles.radioButton}>
                      {settings.messagesPermission === 'members' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>All group members</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('messagesPermission', 'mods')}
                  >
                    <View style={styles.radioButton}>
                      {settings.messagesPermission === 'mods' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers and Moderators only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.radioOption}
                    onPress={() => handleChange('messagesPermission', 'admins')}
                  >
                    <View style={styles.radioButton}>
                      {settings.messagesPermission === 'admins' && <View style={styles.radioButtonSelected} />}
                    </View>
                    <Text style={styles.radioLabel}>Organizers only</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

           
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  navButtonBack: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#122b46',
  },
  navButtonText: {
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  stepContent: {
    padding: 16,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  stepHeadingTop: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  collapsibleSection: {
    marginBottom: 18,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fafaff',
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#f3f0fa',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B46C1',
  },
  sectionContent: {
    padding: 14,
    backgroundColor: '#fff',
  },
  sectionSubLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  radioGroup: {
    marginTop: 8,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B46C1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioButtonSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#6B46C1',
  },
  radioTextContainer: {
    flex: 1,
  },
  radioLabel: {
    fontSize: 16,
    color: '#333',
    marginBottom: 2,
  },
  radioDescription: {
    fontSize: 14,
    color: '#666',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  },
});

export default SettingsStep; 