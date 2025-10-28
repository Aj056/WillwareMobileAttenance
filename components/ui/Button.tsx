import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Theme } from '../../constants/theme';

interface ButtonProps {
  text: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  onPress: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  text,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  onPress,
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyleCombined = [
    styles.baseText,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;
  const iconColor = variant === 'primary' || variant === 'danger' 
    ? Colors.white 
    : variant === 'secondary' 
    ? Colors.primary 
    : Colors.textPrimary;

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator 
          size="small" 
          color={variant === 'primary' || variant === 'danger' ? Colors.white : Colors.primary} 
        />
      );
    }

    const textElement = <Text style={textStyleCombined}>{text}</Text>;

    if (!icon) {
      return textElement;
    }

    const iconElement = (
      <Ionicons 
        name={icon} 
        size={iconSize} 
        color={iconColor} 
        style={iconPosition === 'left' ? styles.iconLeft : styles.iconRight}
      />
    );

    return (
      <View style={styles.contentContainer}>
        {iconPosition === 'left' && iconElement}
        {textElement}
        {iconPosition === 'right' && iconElement}
      </View>
    );
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: Theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },

  // Variants
  primary: {
    backgroundColor: Colors.primary,
    ...Theme.shadows.sm,
  },

  secondary: {
    backgroundColor: Colors.secondary,
    ...Theme.shadows.sm,
  },

  danger: {
    backgroundColor: Colors.error,
    ...Theme.shadows.sm,
  },

  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  ghost: {
    backgroundColor: 'transparent',
  },

  // Sizes
  sm: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    minHeight: 36,
  },

  md: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 48,
  },

  lg: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    minHeight: 56,
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  fullWidth: {
    width: '100%',
  },

  // Text styles
  baseText: {
    fontWeight: Typography.fontWeight.semiBold,
    textAlign: 'center',
  },

  primaryText: {
    color: Colors.textOnPrimary,
  },

  secondaryText: {
    color: Colors.textOnSecondary,
  },

  dangerText: {
    color: Colors.textOnPrimary,
  },

  outlineText: {
    color: Colors.primary,
  },

  ghostText: {
    color: Colors.primary,
  },

  disabledText: {
    opacity: 0.7,
  },

  // Size-specific text styles
  smText: {
    fontSize: Typography.fontSize.sm,
  },

  mdText: {
    fontSize: Typography.fontSize.base,
  },

  lgText: {
    fontSize: Typography.fontSize.lg,
  },

  // Icon styles
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  iconLeft: {
    marginRight: Spacing.sm,
  },

  iconRight: {
    marginLeft: Spacing.sm,
  },
});

export default Button;