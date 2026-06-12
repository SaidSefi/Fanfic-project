import type { Preview } from '@storybook/react-vite'
import React from 'react'
import { ThemeProvider } from '../src/components/theme-provider'
import '../src/index.css'
import '../src/lib/i18n'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
       color: /(background|color)$/i,
       date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => (
      <ThemeProvider>
        <Story />
      </ThemeProvider>
    ),
  ],
};

export default preview;