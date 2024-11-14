# FileCompressorCompanion

#NOTICE
A recent change by Discord has finally removed the obsolete file path property from Electron https://www.electronjs.org/docs/latest/api/file-object, making this useless. There are possibly ways to work around this by caching the file in a known directory first, but would cause a huge performance hit and are annoying to deal with.

A companion app for the BetterDiscord FileCompressor app to allow for audio and video compression.

### Building

Build with `pkg . -t node18-linuxstatic-x64,node18-macos-x64,node18-win-x64`
