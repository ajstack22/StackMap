#import <React/RCTBridgeModule.h>

/**
 * Native module to expose BuildConfig constants to React Native JavaScript
 * Derives BUILD_TYPE_ENV from CFBundleDisplayName set via xcconfig
 * Pure Objective-C implementation for reliable Legacy Architecture support
 */
@interface BuildConfigModule : NSObject <RCTBridgeModule>
@end

@implementation BuildConfigModule

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (NSDictionary *)constantsToExport {
    NSString *displayName = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"CFBundleDisplayName"] ?: @"";
    NSString *buildType = @"prod";

    // Derive build type from display name
    // xcconfig sets: QUAL="StackMap QUAL", STAGE="StackMap STAGE", BETA/PROD="StackMap"
    if ([displayName.uppercaseString containsString:@"QUAL"]) {
        buildType = @"qual";
    } else if ([displayName.uppercaseString containsString:@"STAGE"]) {
        buildType = @"stage";
    } else if ([displayName.uppercaseString containsString:@"BETA"]) {
        buildType = @"beta";
    }

    return @{
        @"BUILD_TYPE_ENV": buildType,
        @"DISPLAY_NAME": displayName
    };
}

@end
