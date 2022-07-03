/* eslint-disable @typescript-eslint/no-var-requires */
import './globals.js';
import 'react-native-get-random-values';
import 'react-native-gesture-handler';
import React from 'react';
import { AppRegistry, LogBox, Platform, UIManager } from 'react-native';
import Config from 'react-native-config';
import { enableLayoutAnimations } from 'react-native-reanimated/lib/reanimated2/core';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import appJson from './app.json';
import Notifications from './src/services/notifications';

enableLayoutAnimations(true);
const appName = appJson.name;
if (Config.isTesting) {
  Date.prototype.toLocaleString = () => 'XX-XX-XX';
}

enableScreens(true);
UIManager.setLayoutAnimationEnabledExperimental &&
  UIManager.setLayoutAnimationEnabledExperimental(true);

if (__DEV__) {
  LogBox.ignoreAllLogs();
}

let App;
let NotesnookShare;
Notifications.init();
let QuickNoteIOS;

const AppProvider = () => {
  App = require('./App').default;
  return <App />;
};

AppRegistry.registerComponent(appName, () => AppProvider);

const ShareProvider = () => {
  NotesnookShare = require('./share/index').default;
  return Platform.OS === 'ios' ? (
    <SafeAreaProvider>
      <NotesnookShare quicknote={false} />
    </SafeAreaProvider>
  ) : (
    <NotesnookShare quicknote={false} />
  );
};

AppRegistry.registerComponent('NotesnookShare', () => ShareProvider);

const QuickNoteProvider = () => {
  QuickNoteIOS = require('./share/quicknote').default;
  return (
    <SafeAreaProvider>
      <QuickNoteIOS />
    </SafeAreaProvider>
  );
};

AppRegistry.registerComponent('QuickNoteIOS', () => QuickNoteProvider);
