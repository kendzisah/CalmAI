const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const defaultBlockList = config.resolver.blockList;
const appleDoublePattern = /\/\._[^/]+$/;

if (defaultBlockList instanceof RegExp) {
  config.resolver.blockList = [defaultBlockList, appleDoublePattern];
} else if (Array.isArray(defaultBlockList)) {
  config.resolver.blockList = [...defaultBlockList, appleDoublePattern];
} else {
  config.resolver.blockList = [appleDoublePattern];
}

module.exports = config;
