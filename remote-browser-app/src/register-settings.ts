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
import * as Common from '../../core/common/common.js';

const S = Common.Settings;

// Core UI framework
S.registerSettingExtension({settingName: 'ui-theme', settingType: S.SettingType.ENUM, defaultValue: 'systemPreferred'});
S.registerSettingExtension({settingName: 'chrome-theme-colors', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'currentDockState', settingType: S.SettingType.ENUM, defaultValue: 'right'});
S.registerSettingExtension({settingName: 'active-keybind-set', settingType: S.SettingType.ENUM, defaultValue: 'devToolsDefault'});
S.registerSettingExtension({settingName: 'user-shortcuts', settingType: S.SettingType.ARRAY, defaultValue: []});
S.registerSettingExtension({settingName: 'sidebar-position', settingType: S.SettingType.ENUM, defaultValue: 'auto'});
S.registerSettingExtension({settingName: 'language', settingType: S.SettingType.ENUM, defaultValue: 'en-US'});

// NetworkManager (pulled by ResourceTreeModel)
S.registerSettingExtension({settingName: 'request-blocking-enabled', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'cache-disabled', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'monitoring-xhr-enabled', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'network-log.preserve-log', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'network.enable-remote-file-loading', settingType: S.SettingType.BOOLEAN, defaultValue: false});

// RuntimeModel
S.registerSettingExtension({settingName: 'custom-formatters', settingType: S.SettingType.BOOLEAN, defaultValue: false});

// DOMModel
S.registerSettingExtension({settingName: 'show-ua-shadow-dom', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'text-editor-indent', settingType: S.SettingType.ENUM, defaultValue: '    '});

// OverlayModel
S.registerSettingExtension({settingName: 'disable-paused-state-overlay', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'show-paint-rects', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'show-layout-shift-regions', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'show-ad-highlights', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'show-debug-borders', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'show-fps-counter', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'show-scroll-bottleneck-rects', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'show-metrics-rulers', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'apca', settingType: S.SettingType.BOOLEAN, defaultValue: false});

// OverlayPersistentHighlighter
S.registerSettingExtension({settingName: 'show-grid-line-labels', settingType: S.SettingType.ENUM, defaultValue: 'none'});
S.registerSettingExtension({settingName: 'extend-grid-lines', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'show-grid-areas', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'show-grid-track-sizes', settingType: S.SettingType.BOOLEAN, defaultValue: false});

// CSSModel (pulled by OverlayModel -> WindowControls -> DOMModel.cssModel())
S.registerSettingExtension({settingName: 'css-source-maps-enabled', settingType: S.SettingType.BOOLEAN, defaultValue: true});

// DebuggerModel (pulled by OverlayModel)
S.registerSettingExtension({settingName: 'pause-on-exception-enabled', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'pause-on-caught-exception', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'pause-on-uncaught-exception', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'disable-async-stack-traces', settingType: S.SettingType.BOOLEAN, defaultValue: false});
S.registerSettingExtension({settingName: 'breakpoints-active', settingType: S.SettingType.BOOLEAN, defaultValue: true});
S.registerSettingExtension({settingName: 'js-source-maps-enabled', settingType: S.SettingType.BOOLEAN, defaultValue: true});
