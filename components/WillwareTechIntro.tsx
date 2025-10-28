import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface WillwareTechIntroProps {
  onComplete: () => void;
}

export const WillwareTechIntro: React.FC<WillwareTechIntroProps> = ({ onComplete }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const startAnimation = () => {
      // Logo rotation animation
      Animated.loop(
        Animated.timing(logoRotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      // Pulse animation for logo
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Main intro animation sequence
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Hold the animation for a moment, then complete
        setTimeout(() => {
          Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }).start(() => {
            onComplete();
          });
        }, 2000);
      });
    };

    startAnimation();
  }, []);

  const logoRotate = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1565C0" />
      <View style={styles.gradient}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Animated Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { rotate: logoRotate },
                  { scale: pulseAnim },
                ],
              },
            ]}
          >
            <View style={styles.logoBackground}>
              <Ionicons name="business" size={60} color="#FFFFFF" />
            </View>
          </Animated.View>

          {/* Company Name */}
          <Animated.View
            style={[
              styles.textContainer,
              {
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.companyName}>WillwareTech</Text>
            <Text style={styles.tagline}>Attendance Management System</Text>
            <View style={styles.loadingDots}>
              <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
              <Animated.View style={[styles.dot, { opacity: pulseAnim }]} />
            </View>
          </Animated.View>

          {/* Loading Text */}
          <Animated.Text
            style={[
              styles.loadingText,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            Loading your workspace...
          </Animated.Text>
        </Animated.View>

        {/* Background Animation Elements */}
        <View style={styles.backgroundElements}>
          <Animated.View
            style={[
              styles.backgroundCircle,
              styles.circle1,
              {
                transform: [{ rotate: logoRotate }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.backgroundCircle,
              styles.circle2,
              {
                transform: [{ rotate: logoRotate }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.backgroundCircle,
              styles.circle3,
              {
                transform: [{ rotate: logoRotate }],
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: '#1565C0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  companyName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 8,
    letterSpacing: 1,
  },
  loadingDots: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  backgroundElements: {
    position: 'absolute',
    width: width,
    height: height,
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 200,
    height: 200,
    top: height * 0.1,
    left: -50,
  },
  circle2: {
    width: 150,
    height: 150,
    bottom: height * 0.2,
    right: -30,
  },
  circle3: {
    width: 100,
    height: 100,
    top: height * 0.3,
    right: width * 0.1,
  },
});

export default WillwareTechIntro;