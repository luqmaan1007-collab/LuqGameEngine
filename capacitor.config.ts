import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.luqmaan.luqgameengine',
  appName: 'LuqGameEngine',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: { allowMixedContent: false }
};
export default config;
