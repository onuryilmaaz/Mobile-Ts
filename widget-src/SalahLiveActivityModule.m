#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(SalahLiveActivityModule, NSObject)

RCT_EXTERN_METHOD(startPrayerActivity:(NSDictionary *)params
                  resolve:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(endPrayerActivity:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(updateWidgetData:(NSDictionary *)params)

RCT_EXTERN_METHOD(updatePrayerTrackerData:(NSDictionary *)params)

RCT_EXTERN_METHOD(updateAmelData:(NSDictionary *)params)

RCT_EXTERN_METHOD(updateInspirationData:(NSDictionary *)params)

RCT_EXTERN_METHOD(getPendingWidgetPrayers:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject)

@end
