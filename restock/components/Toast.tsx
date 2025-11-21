import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { toastStyles } from '../styles/components/toast';
import colors from '../lib/theme/colors';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastProps = {
  visible: boolean;
  message: string;
  subtext?: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
};

export const Toast = ({
  visible,
  message,
  subtext,
  type = 'error',
  duration = 5000,
  onClose
}: ToastProps) => {
  const slideAnim = React.useRef(new Animated.Value(-100)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();

      // Auto-dismiss after duration
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Slide out and fade out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [visible, duration]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true
      })
    ]).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  const getIconName = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'warning':
        return 'warning';
      case 'info':
        return 'information-circle';
      default:
        return 'information-circle';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.status.success;
      case 'error':
        return colors.status.error;
      case 'warning':
        return colors.status.warning;
      case 'info':
        return colors.status.info;
      default:
        return colors.status.error;
    }
  };

  const getBorderStyle = () => {
    switch (type) {
      case 'success':
        return toastStyles.toastSuccess;
      case 'error':
        return toastStyles.toastError;
      case 'warning':
        return toastStyles.toastWarning;
      case 'info':
        return toastStyles.toastInfo;
      default:
        return toastStyles.toastError;
    }
  };

  return (
    <Animated.View
      style={[
        toastStyles.toastContainer,
        getBorderStyle(),
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim
        }
      ]}
    >
      <View style={toastStyles.toastContent}>
        <View style={[toastStyles.toastIcon, { backgroundColor: getIconColor() }]}>
          <Ionicons name={getIconName()} size={20} color="white" />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={toastStyles.toastText}>{message}</Text>
          {subtext && <Text style={toastStyles.toastSubtext}>{subtext}</Text>}
        </View>

        <TouchableOpacity
          onPress={handleClose}
          style={toastStyles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={16} color={colors.neutral.medium} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

export default Toast;

