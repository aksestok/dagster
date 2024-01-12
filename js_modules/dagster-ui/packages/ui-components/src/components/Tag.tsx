// eslint-disable-next-line no-restricted-imports
import {Tag as BlueprintTag} from '@blueprintjs/core';
import * as React from 'react';

import {
  colorAccentBlue,
  colorAccentGray,
  colorAccentGreen,
  colorAccentRed,
  colorAccentYellow,
  colorBackgroundBlue,
  colorBackgroundGray,
  colorBackgroundGreen,
  colorBackgroundRed,
  colorBackgroundYellow,
  colorTextBlue,
  colorTextDefault,
  colorTextGreen,
  colorTextRed,
  colorTextYellow,
} from '../theme/color';

import {BaseTag} from './BaseTag';
import {IconName, Icon} from './Icon';
import {Spinner} from './Spinner';
import { AnimatedAutomatorIcon } from './AutomationIcon';

const intentToFillColor = (intent: React.ComponentProps<typeof BlueprintTag>['intent']) => {
  switch (intent) {
    case 'primary':
      return colorBackgroundBlue();
    case 'danger':
      return colorBackgroundRed();
    case 'success':
      return colorBackgroundGreen();
    case 'warning':
      return colorBackgroundYellow();
    case 'none':
    default:
      return colorBackgroundGray();
  }
};

const intentToTextColor = (intent: React.ComponentProps<typeof BlueprintTag>['intent']) => {
  switch (intent) {
    case 'primary':
      return colorTextBlue();
    case 'danger':
      return colorTextRed();
    case 'success':
      return colorTextGreen();
    case 'warning':
      return colorTextYellow();
    case 'none':
    default:
      return colorTextDefault();
  }
};

const intentToIconColor = (intent: React.ComponentProps<typeof BlueprintTag>['intent']) => {
  switch (intent) {
    case 'primary':
      return colorAccentBlue();
    case 'danger':
      return colorAccentRed();
    case 'success':
      return colorAccentGreen();
    case 'warning':
      return colorAccentYellow();
    case 'none':
    default:
      return colorAccentGray();
  }
};

interface Props extends Omit<React.ComponentProps<typeof BlueprintTag>, 'icon' | 'rightIcon'> {
  children?: React.ReactNode;
  icon?: IconName | 'spinner' | 'automator';
  rightIcon?: IconName | 'spinner' | 'automator';
  animatedIcon?: boolean;
  tooltipText?: string;
}

interface IconOrSpinnerProps {
  icon: IconName | 'spinner' | 'automator' | null;
  color: string;
  stopped?: boolean;
}

const IconOrSpinner = React.memo(({icon, color, stopped}: IconOrSpinnerProps) => {
  if (icon === 'spinner') {
    return <Spinner fillColor={color} purpose="body-text" stopped={stopped}/>;
  }
  if (icon === 'automator') {
    return <AnimatedAutomatorIcon fillColor={color} stopped={stopped} />;
  }
  return icon ? <Icon name={icon} color={color} /> : null;
});

export const Tag = (props: Props) => {
  const {children, icon = null, rightIcon = null, intent, animatedIcon = false, ...rest} = props;

  const fillColor = intentToFillColor(intent);
  const textColor = intentToTextColor(intent);
  const iconColor = intentToIconColor(intent);

  return (
    <BaseTag
      {...rest}
      fillColor={fillColor}
      textColor={textColor}
      icon={<IconOrSpinner icon={icon} color={iconColor} stopped={animatedIcon}/>}
      rightIcon={<IconOrSpinner icon={rightIcon} color={iconColor} />}
      label={children}
    />
  );
};
