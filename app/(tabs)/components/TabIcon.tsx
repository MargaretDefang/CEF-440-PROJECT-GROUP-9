import React from 'react';
import { StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface TabIconProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  focused: boolean;
  color: string;
}

export const TabIcon: React.FC<TabIconProps> = ({ icon, focused, color }) => {
  return (
    <MaterialIcons
      name={icon}
      size={24}
      color={color}
      style={styles.icon}
    />
  );
};

const styles = StyleSheet.create({
  icon: {
    width: 24,
    height: 24,
  },
});
