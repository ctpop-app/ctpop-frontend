import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const ChatRoomSkeleton = () => {
  const animatedValue = new Animated.Value(0);

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          <Animated.View style={[styles.avatar, { opacity }]} />
          <View style={styles.textSection}>
            <Animated.View style={[styles.name, { opacity }]} />
            <Animated.View style={[styles.message, { opacity }]} />
          </View>
        </View>
        <View style={styles.rightSection}>
          <Animated.View style={[styles.time, { opacity }]} />
          <Animated.View style={[styles.badge, { opacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  content: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E1E9EE',
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  name: {
    width: 120,
    height: 16,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    marginBottom: 8,
  },
  message: {
    width: 200,
    height: 14,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  time: {
    width: 40,
    height: 12,
    backgroundColor: '#E1E9EE',
    borderRadius: 4,
    marginBottom: 8,
  },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E1E9EE',
  },
});

export default ChatRoomSkeleton; 