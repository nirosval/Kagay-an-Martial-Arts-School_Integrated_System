const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. I-watch lahat ng files sa workspace
config.watchFolders = [workspaceRoot];

// 2. Resolver setup para sa PNPM
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. I-bypass ang LightningCSS native transformer error sa Windows
config.transformer = {
  ...config.transformer,
  maxWorkers: 2,
  css: false, // I-off muna ang LightningCSS processing
};

module.exports = config;