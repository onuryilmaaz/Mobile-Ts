const { withXcodeProject, withEntitlementsPlist } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_TARGET_NAME = 'SitePongLiveActivityWidget';
const APP_GROUP = 'group.com.onur6541.salah';
const BUNDLE_ID = 'com.onur6541.salah.SitePongLiveActivityWidget';
const DEPLOYMENT_TARGET = '16.2';

const WIDGET_SRC = path.join(__dirname, '../widget-src');
const EXT_SRC = path.join(WIDGET_SRC, 'Extension');

// Files compiled into the widget extension target
const EXTENSION_SWIFT_FILES = [
  'SitePongActivityAttributes.swift',
  'SitePongLiveActivityWidget.swift',
  'SitePongLiveActivityWidgetLiveActivity.swift',
  'PrayerTimesWidget.swift',
  'PrayerTrackerWidget.swift',
  'AmelWidget.swift',
  'InspirationWidget.swift',
  'SharedData.swift',
  'SharedColors.swift',
  'MarkPrayerIntent.swift',
];

// Files compiled into the main app target
const MAIN_APP_SWIFT_FILES = [
  { file: 'SitePongActivityAttributes.swift', src: WIDGET_SRC },
  { file: 'SalahLiveActivityModule.swift', src: WIDGET_SRC },
];
const MAIN_APP_OBJC_FILES = [
  { file: 'SalahLiveActivityModule.m', src: WIDGET_SRC },
];

// ---- file copy ----

function copyFiles(iosPath) {
  const widgetDir = path.join(iosPath, WIDGET_TARGET_NAME);
  fs.mkdirSync(widgetDir, { recursive: true });

  // SitePongActivityAttributes.swift comes from widget-src root
  fs.copyFileSync(
    path.join(WIDGET_SRC, 'SitePongActivityAttributes.swift'),
    path.join(widgetDir, 'SitePongActivityAttributes.swift')
  );

  // All other extension Swift files come from Extension folder
  for (const file of EXTENSION_SWIFT_FILES.filter((f) => f !== 'SitePongActivityAttributes.swift')) {
    fs.copyFileSync(path.join(EXT_SRC, file), path.join(widgetDir, file));
  }

  fs.copyFileSync(path.join(EXT_SRC, 'Info.plist'), path.join(widgetDir, 'Info.plist'));
  fs.copyFileSync(
    path.join(EXT_SRC, 'SitePongLiveActivityWidget.entitlements'),
    path.join(widgetDir, 'SitePongLiveActivityWidget.entitlements')
  );

  const appDir = path.join(iosPath, 'Salah');
  for (const { file, src } of [...MAIN_APP_SWIFT_FILES, ...MAIN_APP_OBJC_FILES]) {
    fs.copyFileSync(path.join(src, file), path.join(appDir, file));
  }
}

// ---- pbxproj manipulation ----

function addWidgetTarget(project, iosPath) {
  // Guard: skip if already added
  const nativeTargets = project.pbxNativeTargetSection();
  const alreadyAdded = Object.values(nativeTargets).some(
    (t) => t && t.name && t.name.replace(/"/g, '') === WIDGET_TARGET_NAME
  );
  if (alreadyAdded) {
    console.log(`[withSalahWidgets] ${WIDGET_TARGET_NAME} already exists, skipping.`);
    return;
  }

  // 1. Create the native target
  const target = project.addTarget(
    WIDGET_TARGET_NAME,
    'app_extension',
    WIDGET_TARGET_NAME,
    BUNDLE_ID
  );
  const targetUUID = target.uuid;

  // 2. Create PBXGroup with all extension Swift files + Info.plist
  //    Group path = WIDGET_TARGET_NAME folder; file references use just the filename.
  //    Xcode resolves: {group.path}/{fileRef.path} = SitePongLiveActivityWidget/Foo.swift
  const { uuid: groupUUID } = project.addPbxGroup(
    [...EXTENSION_SWIFT_FILES, 'Info.plist'],
    WIDGET_TARGET_NAME,
    WIDGET_TARGET_NAME
  );

  // 3. Add group to the main project group so it appears in Xcode navigator
  const pbxGroups = project.hash.project.objects['PBXGroup'];
  const pbxProject = project.hash.project.objects['PBXProject'];
  const projectObj = Object.values(pbxProject).find((v) => v && v.mainGroup);
  if (projectObj) {
    const mainGroupUUID = projectObj.mainGroup;
    const mainGroup = pbxGroups[mainGroupUUID];
    if (mainGroup && mainGroup.children) {
      const alreadyChild = mainGroup.children.some((c) => c.value === groupUUID);
      if (!alreadyChild) {
        mainGroup.children.push({ value: groupUUID, comment: WIDGET_TARGET_NAME });
      }
    }
  }

  // 4. Add Sources build phase — use just filenames to match the addPbxGroup file references
  project.addBuildPhase(
    EXTENSION_SWIFT_FILES,
    'PBXSourcesBuildPhase',
    'Sources',
    targetUUID
  );

  // 5. Add empty Resources build phase (Info.plist is handled by INFOPLIST_FILE build setting)
  project.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', targetUUID);

  // 6. Add Frameworks build phase
  project.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', targetUUID);

  // 7. Update build settings
  const buildConfigurations = project.pbxXCBuildConfigurationSection();
  const configListUUID = project.pbxNativeTargetSection()[targetUUID].buildConfigurationList;
  const configList = project.pbxXCConfigurationList()[configListUUID];
  const targetConfigUUIDs = (configList.buildConfigurations || []).map((c) =>
    typeof c === 'object' ? c.value : c
  );

  // Read development team from main app target
  const mainTargetForTeam = project.getFirstTarget();
  let devTeam = '';
  if (mainTargetForTeam) {
    const mainCfgListUUID = project.pbxNativeTargetSection()[mainTargetForTeam.uuid].buildConfigurationList;
    const mainCfgList = project.pbxXCConfigurationList()[mainCfgListUUID];
    const mainCfgUUIDs = (mainCfgList.buildConfigurations || []).map((c) =>
      typeof c === 'object' ? c.value : c
    );
    for (const cfgUUID of mainCfgUUIDs) {
      const team = buildConfigurations[cfgUUID]?.buildSettings?.DEVELOPMENT_TEAM;
      if (team && team !== '""') { devTeam = team; break; }
    }
  }

  targetConfigUUIDs.forEach((cfgUUID) => {
    const cfg = buildConfigurations[cfgUUID];
    if (!cfg || !cfg.buildSettings) return;
    const bs = cfg.buildSettings;
    bs.SWIFT_VERSION = '5.0';
    bs.IPHONEOS_DEPLOYMENT_TARGET = DEPLOYMENT_TARGET;
    bs.PRODUCT_BUNDLE_IDENTIFIER = `"${BUNDLE_ID}"`;
    bs.INFOPLIST_FILE = `"${WIDGET_TARGET_NAME}/Info.plist"`;
    bs.CODE_SIGN_ENTITLEMENTS = `"${WIDGET_TARGET_NAME}/SitePongLiveActivityWidget.entitlements"`;
    bs.SKIP_INSTALL = 'YES';
    bs.CODE_SIGN_STYLE = 'Automatic';
    bs.TARGETED_DEVICE_FAMILY = '"1,2"';
    bs.ALWAYS_EMBED_SWIFT_STANDARD_LIBRARIES = 'NO';
    bs.CLANG_ENABLE_MODULES = 'YES';
    if (devTeam) bs.DEVELOPMENT_TEAM = devTeam;
  });

  // 8. Add shared files to main app target's EXISTING Sources build phase
  const mainTarget = project.getFirstTarget();
  if (mainTarget) {
    const mainTargetUUID = mainTarget.uuid;
    const mainTargetObj = project.pbxNativeTargetSection()[mainTargetUUID];

    // Find the existing PBXSourcesBuildPhase for the main target
    const sourcesSection = project.hash.project.objects['PBXSourcesBuildPhase'] || {};
    const mainTargetPhaseUUID = (mainTargetObj.buildPhases || []).find((phase) => {
      const val = typeof phase === 'object' ? phase.value : phase;
      return !!sourcesSection[val];
    });
    const existingSourcesPhase = mainTargetPhaseUUID
      ? sourcesSection[typeof mainTargetPhaseUUID === 'object' ? mainTargetPhaseUUID.value : mainTargetPhaseUUID]
      : null;

    const sharedFiles = [
      ...MAIN_APP_SWIFT_FILES.map((x) => `Salah/${x.file}`),
      ...MAIN_APP_OBJC_FILES.map((x) => `Salah/${x.file}`),
    ];

    for (const filePath of sharedFiles) {
      // Skip if file reference already exists
      const fileRefs = project.pbxFileReferenceSection();
      const alreadyExists = Object.values(fileRefs).some((ref) => {
        const p = ref && (ref.path || '');
        return p.replace(/"/g, '') === filePath;
      });
      if (alreadyExists) continue;

      // Create file reference
      const { pbxFile } = require('xcode');
      const fileRefUUID = project.generateUuid();
      const buildFileUUID = project.generateUuid();
      const basename = path.basename(filePath);
      const ext = path.extname(filePath);
      const fileType = ext === '.m' ? 'sourcecode.c.objc' : 'sourcecode.swift';

      // Add PBXFileReference
      project.hash.project.objects['PBXFileReference'][fileRefUUID] = {
        isa: 'PBXFileReference',
        fileEncoding: 4,
        lastKnownFileType: fileType,
        name: `"${basename}"`,
        path: `"${filePath}"`,
        sourceTree: '"<group>"',
      };
      project.hash.project.objects['PBXFileReference'][`${fileRefUUID}_comment`] = basename;

      // Add PBXBuildFile
      project.hash.project.objects['PBXBuildFile'][buildFileUUID] = {
        isa: 'PBXBuildFile',
        fileRef: fileRefUUID,
        fileRef_comment: basename,
      };
      project.hash.project.objects['PBXBuildFile'][`${buildFileUUID}_comment`] = `${basename} in Sources`;

      // Add to existing Sources build phase
      if (existingSourcesPhase) {
        existingSourcesPhase.files.push({ value: buildFileUUID, comment: `${basename} in Sources` });
      }

      // Also add to Salah PBXGroup so it shows in navigator
      const salahGroup = Object.entries(pbxGroups).find(
        ([k, v]) => v && !k.endsWith('_comment') && v.name && v.name.replace(/"/g, '') === 'Salah'
      );
      if (salahGroup) {
        pbxGroups[salahGroup[0]].children.push({ value: fileRefUUID, comment: basename });
      }
    }
  }

  console.log(`[withSalahWidgets] Added widget extension target: ${targetUUID}`);
}

// ---- plugin entry ----

const withSalahWidgets = (config) => {
  // Add App Group to main app entitlements
  config = withEntitlementsPlist(config, (mod) => {
    const groups = mod.modResults['com.apple.security.application-groups'] ?? [];
    if (!groups.includes(APP_GROUP)) {
      mod.modResults['com.apple.security.application-groups'] = [...groups, APP_GROUP];
    }
    return mod;
  });

  // Copy files + patch Xcode project
  config = withXcodeProject(config, (mod) => {
    const iosPath = path.join(mod.modRequest.projectRoot, 'ios');
    copyFiles(iosPath);
    addWidgetTarget(mod.modResults, iosPath);
    return mod;
  });

  return config;
};

module.exports = withSalahWidgets;
