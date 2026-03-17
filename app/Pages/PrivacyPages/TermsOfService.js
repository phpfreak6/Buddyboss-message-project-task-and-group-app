import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import HtmlRenderer from '@/components/htmlRenderer';
import agent from '@/agent';

const mapStateToProps = state => ({
  ...state,
  currentUser: state.common.currentUser,
  isLoggedIn: state.common.isLoggedIn,
});

const mapDispatchToProps = dispatch => ({});

const TermsOfService = (props) => {
  const [privacyContent, setPrivacyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrivacyPolicy();
  }, []);

  const fetchPrivacyPolicy = async () => {
    try {
      setLoading(true);
      const response = await agent.common.getPrivacyPolicy();

      if (response && response.data && response.data.html) {
        setPrivacyContent(response.data.html || '');
      }
    } catch (err) {
      console.error('Error fetching privacy policy:', err);
      setError('Failed to load privacy policy');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#122b46" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {privacyContent ? (
        <HtmlRenderer message={privacyContent} />
      ) : (
        <Text style={styles.errorText}>No privacy policy content available</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 25,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    fontSize: 16,
  }
});

export default connect(mapStateToProps, mapDispatchToProps)(TermsOfService);
