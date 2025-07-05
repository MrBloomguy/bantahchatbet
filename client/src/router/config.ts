import { RouterProviderProps } from 'react-router-dom';

export const routerConfig: Partial<RouterProviderProps> = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true
  }
};