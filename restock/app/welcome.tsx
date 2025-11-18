import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Animated
} from 'react-native';
import { router } from 'expo-router';
import { welcomeStyles } from '../styles/components/welcome';

const { width: screenWidth } = Dimensions.get('window');

interface WalkthroughSlide {
  id: number;
  title: string;
  subtitle: string;
  image: any;
}

const walkthroughSlides: WalkthroughSlide[] = [
  {
    id: 1,
    title: 'Walk',
    subtitle: 'Move through your store easily',
    image: require('../assets/images/placeholder.jpeg')
  },
  {
    id: 2,
    title: 'Log',
    subtitle: 'Capture products as you go',
    image: require('../assets/images/placeholder.jpeg')
  },
  {
    id: 3,
    title: 'Send',
    subtitle: 'Generate emails instantly',
    image: require('../assets/images/placeholder.jpeg')
  }
];

export default function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const paginationAnimations = useRef(
    walkthroughSlides.map(() => new Animated.Value(0))
  ).current;

  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const slideIndex = Math.round(offsetX / screenWidth);
    setCurrentSlide(slideIndex);

    paginationAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: index === slideIndex ? 1 : 0,
        duration: 250,
        useNativeDriver: false
      }).start();
    });
  };

  const goToSlide = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true
    });

    setCurrentSlide(index);

    paginationAnimations.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: i === index ? 1 : 0,
        duration: 250,
        useNativeDriver: false
      }).start();
    });
  };

  const handleContinue = () => {
    router.push('/auth/sender-setup');
  };

  return (
    <View style={welcomeStyles.container}>
      {/* Header */}
      <View style={welcomeStyles.header}>
        <Text style={welcomeStyles.appTitle}>Restock</Text>
      </View>

      {/* Main Title */}
      <View style={welcomeStyles.titleContainer}>
        <Text style={welcomeStyles.mainTitle}>Walk. Log. Send.</Text>
        <Text style={welcomeStyles.mainSubtitle}>
          A simpler way to restock your store
        </Text>
      </View>

      {/* Carousel */}
      <View style={welcomeStyles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleGestureEvent}
          onMomentumScrollEnd={handleScrollEnd}
          scrollEventThrottle={16}
          style={welcomeStyles.carouselScrollView}
        >
          {walkthroughSlides.map((slide) => (
            <View key={slide.id} style={welcomeStyles.slideContainer}>
              <View style={welcomeStyles.imageContainer}>
                <Image
                  source={slide.image}
                  style={welcomeStyles.slideImage}
                  resizeMode="contain"
                />
              </View>

              <View style={welcomeStyles.textContainer}>
                <Text style={welcomeStyles.slideTitle}>{slide.title}</Text>
                <Text style={slide.subtitle ? welcomeStyles.slideSubtitle : null}>
                  {slide.subtitle}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Pagination */}
      <View style={welcomeStyles.paginationContainer}>
        {walkthroughSlides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToSlide(index)}
            style={welcomeStyles.paginationDotContainer}
          >
            <Animated.View
              style={[
                welcomeStyles.paginationDot,
                {
                  width: paginationAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [8, 24]
                  }),
                  backgroundColor: paginationAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: ['#DEE2E6', '#6B7F6B']
                  })
                }
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Continue Button */}
      <View style={welcomeStyles.authButtonsContainer}>
        <TouchableOpacity
          style={welcomeStyles.signUpButton}
          onPress={handleContinue}
        >
          <Text style={welcomeStyles.signUpButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
