import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TabSafeContainerProps {
  children: React.ReactNode;
  style?: any;
}

export const TabSafeContainer: React.FC<TabSafeContainerProps> = ({ children, style }) => {
  const insets = useSafeAreaInsets();
  
  return (
    <View 
      style={[
        styles.container, 
        {
          // Add padding to account for tab bar height
          paddingBottom: Platform.OS === 'android' ? 
            70 + Math.max(insets.bottom, 0) : // Tab bar height + system navigation
            70 // Just tab bar height on iOS
        },
        style
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default TabSafeContainer;