import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#028dd0',
    primaryDark: '#003d82',
    primaryLight: '#3385ff',
    secondary: '#e6e6e6',
    secondaryDark: '#c73e3e',
    secondaryLight: '#ff9999',
    background: '#f5f5f5',
    surface: '#ffffff',
    error: '#d32f2f',
    text: '#333333',
    textSecondary: '#666666',
    disabled: '#9e9e9e',
    placeholder: '#bdbdbd',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#f50057',
    success: '#4caf50',
    warning: '#ff9800',
    info: '#2196f3',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  roundness: 8,
  typography: {
    fontFamily: 'System',
    fontWeights: {
      regular: '400',
      medium: '500',
      bold: '700',
    },
    sizes: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
    },
  },
  elevation: {
    small: 2,
    medium: 4,
    large: 8,
  },
};

export type Theme = typeof theme;

export const getContrastText = (background: string) => {
  // This is a simple implementation. For production, consider using a more sophisticated
  // algorithm that takes into account the perceived brightness of the background color.
  const rgb = parseInt(background.slice(1), 16);
  const r = (rgb >> 16) & 0xff;
  const g = (rgb >> 8) & 0xff;
  const b = (rgb >> 0) & 0xff;
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
};