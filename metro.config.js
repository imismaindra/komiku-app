// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add wasm to asset extensions so Metro can bundle expo-sqlite's WebAssembly file for web
config.resolver.assetExts.push('wasm');

// Ensure worker files from expo-sqlite are handled correctly
config.resolver.sourceExts.push('mjs');

module.exports = config;
