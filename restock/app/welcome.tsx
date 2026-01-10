import React, { useState, useRef, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { welcomeStyles } from '../styles/components/welcome';
import { useSenderProfileStore, useSenderProfileHydrated } from '../store/useSenderProfileStore';
import colors from '../lib/theme/colors';

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
    image: require('../assets/images/onboarding/walk.jpeg')
  },
  {
    id: 2,
    title: 'Log',
    subtitle: 'Capture products as you go',
    image: require('../assets/images/onboarding/4bf2de6a-1231-47ee-b646-3f98dbdc052a.jpeg')
  },
  {
    id: 3,
    title: 'Send',
    subtitle: 'Generate emails instantly',
    image: require('../assets/images/onboarding/b4097274-1909-4165-9f62-7aca86ab3316.jpeg')
  }
];

export default function WelcomeScreen() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const paginationAnimations = useRef(
    walkthroughSlides.map(() => new Animated.Value(0))
  ).current;
  
  const senderProfile = useSenderProfileStore((state) => state.senderProfile);
  const isHydrated = useSenderProfileHydrated();
  const loadProfileFromStorage = useSenderProfileStore((state) => state.loadProfileFromStorage);

  // Check if profile exists on mount - if so, redirect to tabs
  useEffect(() => {
    const checkProfile = async () => {
      if (!isHydrated) {
        await loadProfileFromStorage();
      }
    };
    checkProfile();
  }, [isHydrated, loadProfileFromStorage]);

  // Redirect if profile exists after hydration
  useEffect(() => {
    if (isHydrated && senderProfile) {
      router.replace('/');
    }
  }, [isHydrated, senderProfile]);

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
      <View style={welcomeStyles.header}>
        <View style={welcomeStyles.titleBackground}>

          <Text style={welcomeStyles.title}>Restock</Text>
        </View>
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
                  resizeMode="cover"
                />
              </View>

              <View style={welcomeStyles.textContainer}>
                <View style={welcomeStyles.slideTextBackground}>
                  <Text style={welcomeStyles.slideTitle}>{slide.title}</Text>
                  <Text style={slide.subtitle ? welcomeStyles.slideSubtitle : null}>
                    {slide.subtitle}
                  </Text>
                </View>
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
                    outputRange: [8, 28]
                  }),
                  backgroundColor: paginationAnimations[index].interpolate({
                    inputRange: [0, 1],
                    outputRange: [colors.neutral.medium, colors.cypress.deep]
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
          activeOpacity={0.8}
        >
          <Text style={welcomeStyles.signUpButtonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
