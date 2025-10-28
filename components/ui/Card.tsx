import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
} from 'react-native';
import { Colors, Typography, Spacing, Theme } from '../../constants/theme';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  shadow?: boolean;
  variant?: 'default' | 'elevated' | 'outlined';
  style?: ViewStyle;
  titleStyle?: TextStyle;
  onPress?: () => void;
  touchable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  title,
  children,
  padding = 'md',
  shadow = true,
  variant = 'default',
  style,
  titleStyle,
  onPress,
  touchable = false,
}) => {
  const cardStyle = [
    styles.base,
    styles[variant],
    styles[padding],
    shadow && styles.shadow,
    style,
  ];

  const titleStyleCombined = [
    styles.title,
    titleStyle,
  ];

  const CardComponent = touchable || onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={cardStyle}
      onPress={onPress}
      activeOpacity={touchable || onPress ? 0.7 : 1}
    >
      {title && <Text style={titleStyleCombined}>{title}</Text>}
      {children}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadius.lg,
    marginVertical: Spacing.xs,
  },

  // Variants
  default: {
    backgroundColor: Colors.surface,
  },

  elevated: {
    backgroundColor: Colors.surface,
    ...Theme.shadows.lg,
  },

  outlined: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Padding variants
  sm: {
    padding: Spacing.sm,
  },

  md: {
    padding: Spacing.md,
  },

  lg: {
    padding: Spacing.lg,
  },

  // Shadow
  shadow: {
    ...Theme.shadows.md,
  },

  // Title
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
});

export default Card;