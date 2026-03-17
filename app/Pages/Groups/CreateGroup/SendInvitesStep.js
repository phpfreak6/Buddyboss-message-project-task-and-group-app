import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, Image, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const DEFAULT_AVATAR = require('@/assets/images/icons/dummy-user.png'); // Update path if needed

const SendInvitesStep = ({ selectedMembers: initialMembers, setSelectedMembers, onBack, onSend, sendingInvites }) => {
  const [selectedMembersLocal, setSelectedMembersLocal] = useState(initialMembers || []);
  const [inviteMessage, setInviteMessage] = useState('');

  const handleRemove = (id) => {
    const updated = selectedMembersLocal.filter(m => m.ID !== id);
    setSelectedMembersLocal(updated);
    setSelectedMembers(updated);
  };

  const handleSend = () => {
    if (selectedMembersLocal.length === 0) return;
    const memberIds = selectedMembersLocal.map(m => m.ID);
    onSend(memberIds, inviteMessage);
  };

  const renderMember = ({ item }) => (
    <View style={styles.memberRow}>
      <Image
        source={item.image ? { uri: item.image } : DEFAULT_AVATAR}
        style={styles.avatar}
      />
      <Text style={styles.memberName}>{item.display_name || item.name || item.email}</Text>
      <TouchableOpacity onPress={() => handleRemove(item.ID)}>
        <Icon name="close" size={22} color="#888" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.topNav}>
        <TouchableOpacity style={styles.navButtonBack} onPress={onBack}>
          <Icon name="arrow-left" size={22} color="#122b46" />
          <Text style={styles.navButtonTextBack}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.stepHeadingTop}>Send Invites</Text>
        <View style={{ width: 50 }} />
      </View>
      <FlatList
        data={selectedMembersLocal}
        renderItem={renderMember}
        keyExtractor={item => item.ID?.toString() || item.id?.toString() || item.email}
        ListEmptyComponent={<Text style={styles.emptyText}>No members selected.</Text>}
        style={{ flex: 1 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.messageBox}>
          <TextInput
            style={styles.textArea}
            placeholder="Customize the message of your invite"
            value={inviteMessage}
            onChangeText={setInviteMessage}
            multiline
            numberOfLines={2}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity
          style={[styles.sendButton, selectedMembersLocal.length === 0 && { backgroundColor: '#ccc' }]}
          onPress={handleSend}
          disabled={selectedMembersLocal.length === 0 || sendingInvites}
        >
          {sendingInvites ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.sendButtonText}>Send</Text>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
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
  navButtonTextBack: {
    fontSize: 15,
    color: '#122b46',
    fontWeight: '500',
    marginHorizontal: 4,
  },
  stepHeadingTop: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 32,
  },
  messageBox: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    borderWidth: 0,
    fontSize: 16,
    color: '#333',
    backgroundColor: 'transparent',
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#122b46',
    margin: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SendInvitesStep; 