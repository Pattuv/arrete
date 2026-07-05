import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react'],
  vite: () => ({
    plugins: [tailwindcss()],
    envPrefix: ['VITE_', 'GOOGLE_'],
  }),
  manifest: {
    name: 'Arrête',
    description: 'Stop before you spend. Arrête detects scam sites before they cost you.',
    permissions: ['storage', 'activeTab'],
    host_permissions: ['<all_urls>'],
    icons: {
      16: 'icons/icon16.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png',
    },
    web_accessible_resources: [
      {
        resources: ['pindemo.mov'],
        matches: ['<all_urls>'],
      },
    ],
    action: {
      default_popup: 'popup.html',
      default_icon: {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
      },
    },
  },
});
