import { WORDPRESS_URL } from '@env';
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, SafeAreaView, ActivityIndicator, Text } from 'react-native';
import { connect } from 'react-redux';
import { ViewLayout } from '@/Pages/Layouts';
import { StatusBar } from '@/components';
import WebView from 'react-native-webview';
import agent from '@/agent';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mapStateToProps = state => ({
    ...state,
    currentUser: state.common.currentUser,
});

const TrainingDashboard = (props) => {
    const { navigation, currentUser } = props;
    const [showLoader, setShowLoader] = useState(true);
    const [showStatus, setShowStatus] = useState(false);
    const [statusProps, setStatusProps] = useState(null);
    const [trainingUrl, setTrainingUrl] = useState('');
    const webViewRef = useRef(null);

    useEffect(() => {
        fetchTrainingUrl();
        
        return () => {
            // Cleanup WebView when component unmounts
            if (webViewRef.current) {
                webViewRef.current.stopLoading();
            }
        };
    }, []);

    useEffect(() => {
        if (showLoader) {
            const timeout = setTimeout(() => setShowLoader(false), 15000); // 15 seconds fallback
            return () => clearTimeout(timeout);
        }
    }, [showLoader]);

    const fetchTrainingUrl = async () => {
        try {
            setShowLoader(true);
            const token = await AsyncStorage.getItem('jwt');
            setTrainingUrl(`${WORDPRESS_URL}/training-dashboard-app?token=${token}&v=3`);
        } catch (error) {
            console.error('Error fetching training URL:', error);
            setStatusProps({
                type: 'error',
                message: 'Failed to load training dashboard'
            });
            setShowStatus(true);
            setShowLoader(false);
        }
    };

    return (
        <ViewLayout>
            <SafeAreaView style={styles.container}>
                {showStatus ? <StatusBar {...statusProps} /> : null}

                {trainingUrl ? (
                    <WebView
                        ref={webViewRef}
                        source={{ 
                            uri: trainingUrl
                        }}
                        style={styles.webview}
                        onLoadStart={() => setShowLoader(true)}
                        onLoadEnd={() => setShowLoader(false)}
                        onLoadProgress={({ nativeEvent }) => {
                            if (nativeEvent.progress === 1) {
                                setShowLoader(false);
                            }
                        }}
                        injectedJavaScript={`
                            const meta = document.createElement('meta'); meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'); meta.setAttribute('name', 'viewport'); document.getElementsByTagName('head')[0].appendChild(meta);
                        `}
                    />
                ) : null}

                {showLoader && (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#0000ff" />
                        <Text style={styles.loadingText}>
                            We are gathering all your training information...
                        </Text>
                    </View>
                )}
            </SafeAreaView>
        </ViewLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    webview: {
        flex: 1,
    },
    loaderContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default connect(mapStateToProps)(TrainingDashboard); 