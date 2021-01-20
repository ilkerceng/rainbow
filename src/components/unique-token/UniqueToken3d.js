import * as React from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import {
  Viro3DObject,
  Viro3DSceneNavigator,
  ViroAmbientLight,
  ViroScene,
} from 'react-viro';
import { magicMemo } from '../../utils';

const styles = StyleSheet.create({
  fill: { height: '100%', width: '100%' },
});

function SimpleAnimation({ animationUrl: uri, backgroundColor }) {
  const ref = React.useRef();
  const rotate = React.useMemo(() => new Animated.Value(0), []);
  const source = React.useMemo(() => ({ uri }), [uri]);
  const position = React.useMemo(() => [0, -0.5, -1.2], []);
  const rotation = React.useMemo(() => [0, 0, 0], []);
  const scale = React.useMemo(() => [4, 4, 4], []);
  const cycle = React.useCallback(
    function shouldCycleAnimation() {
      rotate.setValue(0);
      Animated.timing(rotate, {
        duration: 5000,
        easing: Easing.linear,
        toValue: 1,
        useNativeDriver: true,
      }).start(shouldCycleAnimation);
    },
    [rotate]
  );
  React.useEffect(() => {
    rotate.addListener(({ value }) => {
      ref.current?.setNativeProps({
        rotation: [0, value * 360, 0],
      });
    }, []);
    cycle();
    return () => rotate.removeAllListeners();
  }, [cycle, rotate, ref]);
  return (
    <ViroScene backgroundColor={backgroundColor}>
      <Viro3DObject
        position={position}
        ref={ref}
        rotation={rotation}
        scale={scale}
        source={source}
        type="GLB"
      />
      <ViroAmbientLight color="white" />
    </ViroScene>
  );
}

function UniqueToken3d({ backgroundColor, animationUrl }) {
  return (
    <View style={styles.fill}>
      <Viro3DSceneNavigator
        bloomEnabled
        hdrEnabled
        initialScene={{
          passProps: { animationUrl, backgroundColor },
          scene: SimpleAnimation,
        }}
        shadowsEnabled
        vrModeEnabled={false}
      />
    </View>
  );
}

export default magicMemo(UniqueToken3d, 'imageUrl');
