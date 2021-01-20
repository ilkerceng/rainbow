import React from 'react';
import styled from 'styled-components/primitives';
import { useDimensions, useImageMetadata } from '../../../hooks';
import { magicMemo } from '../../../utils';
import { Centered } from '../../layout';
import { UniqueToken3d, UniqueTokenImage } from '../../unique-token';
import { margin, padding, position } from '@rainbow-me/styles';

const paddingHorizontal = 19;

const Container = styled(Centered)`
  ${padding(0, paddingHorizontal)};
  height: ${({ height }) => height};
  ${android ? `margin-bottom: 10;` : ``}
`;

const ImageWrapper = styled(Centered)`
  ${({ isImageHuge }) => margin(isImageHuge ? paddingHorizontal : 0, 0)};
  ${position.size('100%')};
  border-radius: 10;
  overflow: hidden;
`;

const UniqueTokenExpandedStateImage = ({ asset }) => {
  const { width: deviceWidth } = useDimensions();

  const imageUrl = asset.image_preview_url;
  const { dimensions: imageDimensions } = useImageMetadata(imageUrl);

  const maxImageWidth = deviceWidth - paddingHorizontal * 2;
  const maxImageHeight = maxImageWidth * 1.5;

  const heightForDeviceSize =
    (maxImageWidth * imageDimensions.height) / imageDimensions.width;

  const containerHeight =
    heightForDeviceSize > maxImageHeight ? maxImageWidth : heightForDeviceSize;

  const { animation_url: animationUrl } = asset;

  const supports3D =
    typeof animationUrl === 'string' && animationUrl.endsWith('.glb');

  const backgroundColor = asset.background;
  return (
    <Container height={containerHeight}>
      <ImageWrapper isImageHuge={heightForDeviceSize > maxImageHeight}>
        {supports3D ? (
          <UniqueToken3d
            animationUrl={animationUrl}
            backgroundColor={backgroundColor}
          />
        ) : (
          <UniqueTokenImage
            backgroundColor={backgroundColor}
            imageUrl={imageUrl}
            item={asset}
            resizeMode="contain"
          />
        )}
      </ImageWrapper>
    </Container>
  );
};

export default magicMemo(UniqueTokenExpandedStateImage, 'asset.uniqueId');
