const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// SQLite veritabanı dosyasını (db) asset olarak tanımasını sağlıyoruz
config.resolver.assetExts.push('db');

module.exports = withNativeWind(config, { input: './global.css' });
