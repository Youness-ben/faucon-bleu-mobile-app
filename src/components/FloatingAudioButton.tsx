import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Dimensions, Image, View } from 'react-native';
import RecordingModal from './RecordingModal';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useFloatingButton } from '../useFloatingButton';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

interface FloatingAudioButtonProps {
  onSendAudio: (audioUri: string) => void;
}

const FloatingAudioButton: React.FC<FloatingAudioButtonProps> = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const { isVisible } = useFloatingButton();

  const translateX = useSharedValue(width - 80);
  const translateY = useSharedValue(height / 2 - 30);
  const scale = useSharedValue(1);
  const waveOpacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    waveOpacity.value = withRepeat(
      withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
    onEnd: () => {
      translateX.value = withSpring(Math.min(Math.max(translateX.value, 0), width - 60));
      translateY.value = withSpring(Math.min(Math.max(translateY.value, 0), height - 60));
    },
  });

  const animatedStyles = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  const waveStyles = useAnimatedStyle(() => {
    return {
      opacity: waveOpacity.value,
    };
  });

  const handlePress = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
  };


  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View style={[styles.buttonContainer, animatedStyles]}>
          {
          //<Animated.View style={[styles.wave, waveStyles]} />
          }
          <TouchableOpacity
            onPress={handlePress}
            style={styles.button}
            activeOpacity={0.7}
          >
            {/*  <LottieView
                source={require('../../assets/sending.json')}
                autoPlay
                loop
                speed={2}
                style={{height:200,width:200,position:'absolute'}}
              /> */}
              <Image
                source={require('../../assets/tech.png')}
                style={{height:100,width:100,position:'absolute'}}
              />
          </TouchableOpacity>
        </Animated.View>
      </PanGestureHandler>
      <RecordingModal
        isVisible={isModalVisible}
        onClose={handleCloseModal}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  buttonContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
  },
  button: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  wave: {
    position: 'absolute',
    width: 90,
    height: 90,
    top:-10,
    borderRadius: 40,
    backgroundColor: 'rgba(181, 180, 177, 0.5)',
  },
});

export default FloatingAudioButton;

