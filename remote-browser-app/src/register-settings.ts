/**
 * Registers settings needed by the screencast-only app.
 *
 * We bypass Universe to avoid CSSWorkspaceBinding / DebuggerWorkspaceBinding
 * observers. With an empty overrideAutoStartModels, the model cascade from
 * ScreencastView creates:
 *
 *   ResourceTreeModel -> NetworkManager -> Page + Network
 *   DOMModel -> RuntimeModel           -> DOM + Runtime
 *   OverlayModel -> DebuggerModel       -> Overlay + Debugger
 *   OverlayModel -> WindowControls -> CSSModel -> CSS
 *   InputModel                          -> Input
 *   ScreenCaptureModel                  -> (shares Page agent)
 *
 * Total: 8 CDP domains (Page, Network, DOM, Runtime, Overlay, Debugger, CSS, Input)
 */
import * as Common from '../../out/Default/gen/front_end/core/common/common.js';

// GN compiles const enums (like SettingType) to inline string literals,
// so we use the raw values directly.
const reg = Common.SettingRegistration.registerSettingExtension;
const ENUM = 'enum' as any;
const BOOLEAN = 'boolean' as any;
const ARRAY = 'array' as any;

// Core UI framework
reg({settingName: 'ui-theme', settingType: ENUM, defaultValue: 'systemPreferred'});
reg({settingName: 'chrome-theme-colors', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'currentDockState', settingType: ENUM, defaultValue: 'right'});
reg({settingName: 'active-keybind-set', settingType: ENUM, defaultValue: 'devToolsDefault'});
reg({settingName: 'user-shortcuts', settingType: ARRAY, defaultValue: []});
reg({settingName: 'sidebar-position', settingType: ENUM, defaultValue: 'auto'});
reg({settingName: 'language', settingType: ENUM, defaultValue: 'en-US'});

// EmulationModel (pulled by ScreencastView.stopCasting)
reg({settingName: 'java-script-disabled', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'emulation.touch', settingType: ENUM, defaultValue: 'none'});
reg({settingName: 'emulation.idle-detection', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulation.cpu-pressure', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulated-css-media', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulated-css-media-feature-color-gamut', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulated-css-media-feature-prefers-color-scheme', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulated-css-media-feature-forced-colors', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulated-css-media-feature-prefers-contrast', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulated-css-media-feature-prefers-reduced-data', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulated-css-media-feature-prefers-reduced-transparency', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulated-css-media-feature-prefers-reduced-motion', settingType: ENUM, defaultValue: ''});
reg({settingName: 'emulate-auto-dark-mode', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'emulated-vision-deficiency', settingType: ENUM, defaultValue: 'none'});
reg({settingName: 'emulated-os-text-scale', settingType: ENUM, defaultValue: ''});
reg({settingName: 'local-fonts-disabled', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'avif-format-disabled', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'jpeg-xl-format-disabled', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'webp-format-disabled', settingType: BOOLEAN, defaultValue: false});

// NetworkManager (pulled by ResourceTreeModel)
reg({settingName: 'request-blocking-enabled', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'cache-disabled', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'monitoring-xhr-enabled', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'network-log.preserve-log', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'network.enable-remote-file-loading', settingType: BOOLEAN, defaultValue: false});

// RuntimeModel
reg({settingName: 'custom-formatters', settingType: BOOLEAN, defaultValue: false});

// DOMModel
reg({settingName: 'show-ua-shadow-dom', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'text-editor-indent', settingType: ENUM, defaultValue: '    '});

// OverlayModel
reg({settingName: 'disable-paused-state-overlay', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'show-paint-rects', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'show-layout-shift-regions', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'show-ad-highlights', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'show-debug-borders', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'show-fps-counter', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'show-scroll-bottleneck-rects', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'show-metrics-rulers', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'apca', settingType: BOOLEAN, defaultValue: false});

// OverlayPersistentHighlighter
reg({settingName: 'show-grid-line-labels', settingType: ENUM, defaultValue: 'none'});
reg({settingName: 'extend-grid-lines', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'show-grid-areas', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'show-grid-track-sizes', settingType: BOOLEAN, defaultValue: false});

// CSSModel (pulled by OverlayModel -> WindowControls -> DOMModel.cssModel())
reg({settingName: 'css-source-maps-enabled', settingType: BOOLEAN, defaultValue: true});

// DebuggerModel (pulled by OverlayModel)
reg({settingName: 'pause-on-exception-enabled', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'pause-on-caught-exception', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'pause-on-uncaught-exception', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'disable-async-stack-traces', settingType: BOOLEAN, defaultValue: false});
reg({settingName: 'breakpoints-active', settingType: BOOLEAN, defaultValue: true});
reg({settingName: 'js-source-maps-enabled', settingType: BOOLEAN, defaultValue: true});
