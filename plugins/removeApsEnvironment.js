const { withEntitlementsPlist } = require('@expo/config-plugins');

// Personal Team (ücretsiz) Apple hesaplarında Push Notifications desteklenmiyor.
// expo-notifications bu entitlement'ı otomatik ekliyor; bu plugin onu siler.
module.exports = function removeApsEnvironment(config) {
  return withEntitlementsPlist(config, (mod) => {
    delete mod.modResults['aps-environment'];
    return mod;
  });
};
