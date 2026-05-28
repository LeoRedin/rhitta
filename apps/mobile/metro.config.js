// Rhitta overlay: Metro pnpm monorepo resolution.
// Metro must traverse symlinked workspace deps; default Metro config does not.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('node:path')
const repoRoot = path.resolve(__dirname, '../..')
const defaultConfig = getDefaultConfig(__dirname)
defaultConfig.watchFolders = [repoRoot, path.resolve(__dirname, 'node_modules')]
defaultConfig.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
  path.resolve(repoRoot, 'node_modules'),
]
module.exports = defaultConfig
