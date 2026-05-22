/**
 * Minimal bootstrap for a screencast-only DevTools frontend.
 *
 * Initializes just enough of the DevTools infrastructure to get a CDP
 * WebSocket connection and mount ScreencastView — no panels, no console,
 * no network tab.
 */

// --- Side-effect imports: order matters ---

// 1. DOM patches (Element.createChild, Event.consume) used everywhere in DevTools UI
import '../../ui/dom_extension/dom_extension.js';

// 2. Register InputModel so ScreencastView can forward mouse/keyboard
import '../../panels/screencast/screencast.js';

// 3. Register only the settings needed for screencast
import './register-settings.js';

// --- Regular imports ---
import * as Common from '../../core/common/common.js';
import * as Host from '../../core/host/host.js';
import * as i18n from '../../core/i18n/i18n.js';
import * as Root from '../../core/root/root.js';
import * as SDK from '../../core/sdk/sdk.js';
import * as UI from '../../ui/legacy/legacy.js';
import * as ThemeSupport from '../../ui/legacy/theme_support/theme_support.js';

import {ScreencastOnlyApp, ScreencastOnlyAppProvider} from './screencast-only-app.js';

async function boot(): Promise<void> {
  // --- Phase 1: Host bindings ---
  Root.Runtime.Runtime.setPlatform(Host.Platform.platform());

  const config = await new Promise<Root.Runtime.HostConfig>(resolve => {
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.getHostConfig(resolve);
  });
  const prefs = await new Promise<Record<string, string>>(resolve => {
    Host.InspectorFrontendHost.InspectorFrontendHostInstance.getPreferences(resolve);
  });
  Object.assign(Root.Runtime.hostConfig, config);

  // --- Phase 2: Settings + TargetManager (manual, bypassing Universe) ---
  // Universe creates CSSWorkspaceBinding, DebuggerWorkspaceBinding, etc. which
  // register model observers that force CSSModel, DebuggerModel, DOMModel, and
  // RuntimeModel to autostart — enabling ~12 extra CDP domains on Chrome.
  // We set up only what we actually need.
  const settingsStorage = createSettingsStorage(prefs);
  const context = new Root.DevToolsContext.WritableDevToolsContext();

  const settings = Common.Settings.Settings.instance({
    forceNew: true,
    ...settingsStorage,
    settingRegistrations: Common.SettingRegistration.getRegisteredSettings(),
    logSettingAccess: () => {},
    runSettingsMigration: false,
  });
  context.set(Common.Settings.Settings, settings);
  context.set(Common.Console.Console, new Common.Console.Console());

  // Empty override = suppress ALL autostart models.
  // ResourceTreeModel still starts (early: true) — handles navigation.
  // ScreenCaptureModel + InputModel are created on-demand by ScreencastView.
  // This keeps Chrome server load to just: Page + Network + Input domains.
  const overrideAutoStartModels = new Set<SDK.SDKModel.SDKModelConstructor>();
  const targetManager = new SDK.TargetManager.TargetManager(context, overrideAutoStartModels);
  context.set(SDK.TargetManager.TargetManager, targetManager);
  context.set(SDK.FrameManager.FrameManager, new SDK.FrameManager.FrameManager(targetManager));

  // MultitargetNetworkManager + PageResourceLoader are needed by
  // CSSModel's SourceMapManager at runtime when stylesheets arrive.
  const multitargetNetworkManager = new SDK.NetworkManager.MultitargetNetworkManager(targetManager);
  context.set(SDK.NetworkManager.MultitargetNetworkManager, multitargetNetworkManager);
  const pageResourceLoader =
      new SDK.PageResourceLoader.PageResourceLoader(targetManager, settings, multitargetNetworkManager, null);
  context.set(SDK.PageResourceLoader.PageResourceLoader, pageResourceLoader);

  // Register the one experiment DebuggerModel checks during enableDebugger()
  Root.Runtime.experiments.register(
      Root.ExperimentNames.ExperimentName.INSTRUMENTATION_BREAKPOINTS,
      'Enable instrumentation breakpoints');

  Root.DevToolsContext.setGlobalInstance(context as Root.DevToolsContext.WritableDevToolsContext);

  // --- Phase 3: i18n ---
  i18n.DevToolsLocale.DevToolsLocale.instance({
    create: true,
    data: {
      navigatorLanguage: navigator.language,
      settingLanguage: 'en-US',
      lookupClosestDevToolsLocale: i18n.i18n.lookupClosestSupportedDevToolsLocale,
    },
  });
  // For en-US (default), register empty locale data — the system falls through to UIStrings
  i18n.i18n.registerLocaleDataForTest('en-US', {});

  // --- Phase 4: Theme + UI init ---
  UI.UIUtils.initializeUIUtils(document);
  const themeSetting = settings.createSetting('ui-theme', 'systemPreferred');
  if (!ThemeSupport.ThemeSupport.hasInstance()) {
    ThemeSupport.ThemeSupport.instance({forceNew: true, setting: themeSetting});
  }
  UI.UIUtils.addPlatformClass(document.documentElement);
  UI.UIUtils.installComponentRootStyles(document.body);
  ThemeSupport.ThemeSupport.instance().fetchColorsAndApplyHostTheme();

  // ViewManager is required by the UI framework even though we don't use panels
  UI.ViewManager.ViewManager.instance({forceNew: true});

  // DockController is required by InspectorView internals
  const canDock = false;
  UI.DockController.DockController.instance({forceNew: true, canDock});

  // ActionRegistry + ShortcutRegistry needed for keyboard shortcuts in ScreencastView
  const actionRegistry = UI.ActionRegistry.ActionRegistry.instance({forceNew: true});
  UI.ShortcutRegistry.ShortcutRegistry.instance({forceNew: true, actionRegistry});

  // ZoomManager needed by some UI components
  UI.ZoomManager.ZoomManager.instance({
    forceNew: true,
    win: window,
    frontendHost: Host.InspectorFrontendHost.InspectorFrontendHostInstance,
  });

  // --- Phase 5: Show connection UI or auto-connect ---
  const wsParam = new URLSearchParams(window.location.search).get('ws');
  const wssParam = new URLSearchParams(window.location.search).get('wss');

  if (wsParam || wssParam) {
    await connectAndStart();
  } else {
    showConnectionUI();
  }
}

function createSettingsStorage(prefs: Record<string, string>): {
  syncedStorage: Common.Settings.SettingsStorage,
  globalStorage: Common.Settings.SettingsStorage,
  localStorage: Common.Settings.SettingsStorage,
} {
  let localStorage: Common.Settings.SettingsStorage;
  if (window.localStorage) {
    localStorage = new Common.Settings.SettingsStorage(
      window.localStorage, undefined, 'remoteBrowser_');
  } else {
    localStorage = new Common.Settings.SettingsStorage({}, undefined, 'remoteBrowser_');
  }
  const globalStorage = new Common.Settings.SettingsStorage(prefs, undefined, 'remoteBrowser_');
  const syncedStorage = new Common.Settings.SettingsStorage(prefs, undefined, 'remoteBrowser_');
  return {syncedStorage, globalStorage, localStorage};
}

async function connectAndStart(): Promise<void> {
  // Register our app provider so the screencast launches
  UI.AppProvider.registerAppProvider({
    async loadAppProvider() {
      return new ScreencastOnlyAppProvider();
    },
    order: 0,
  });

  // Present the app UI
  const appProvider = UI.AppProvider.getRegisteredAppProviders()[0];
  if (!appProvider) {
    throw new Error('No app provider registered');
  }
  const provider = await appProvider.loadAppProvider();
  const app = provider.createApp();

  UI.DockController.DockController.instance().initialize();
  app.presentUI(document);
  Host.InspectorFrontendHost.InspectorFrontendHostInstance.loadCompleted();

  // Connect to the remote browser via CDP WebSocket
  await SDK.Connections.initMainConnection(async () => {
    const target = SDK.TargetManager.TargetManager.instance().createTarget(
      'main', 'Main', SDK.Target.Type.FRAME, null);
    // Wait for target to be ready
    await new Promise<void>(resolve => {
      const tm = SDK.TargetManager.TargetManager.instance();
      if (tm.primaryPageTarget()) {
        resolve();
        return;
      }
      tm.observeTargets({
        targetAdded: (t: SDK.Target.Target) => {
          if (t === tm.primaryPageTarget()) {
            resolve();
          }
        },
        targetRemoved: () => {},
      });
    });
  }, (message) => {
    showDisconnected(message);
  });
}

// --- Connection UI ---

function showConnectionUI(): void {
  const container = document.getElementById('connection-ui');
  if (!container) {
    return;
  }
  container.style.display = 'flex';
  container.innerHTML = `
    <div class="connection-card">
      <h1>Remote Browser</h1>
      <p>Connect to a Chrome instance running with <code>--remote-debugging-port=9222</code></p>

      <div class="input-group">
        <label for="debug-url">Chrome Debug URL</label>
        <input type="text" id="debug-url" placeholder="localhost:9222" value="localhost:9222" />
      </div>

      <button id="fetch-targets" class="primary-btn">Find Targets</button>

      <div id="targets-list" class="targets-list" style="display:none"></div>
      <div id="connection-error" class="error-msg" style="display:none"></div>

      <div class="help-text">
        <details>
          <summary>How to start Chrome with remote debugging</summary>
          <pre>google-chrome --remote-debugging-port=9222</pre>
          <p>Or on macOS:</p>
          <pre>/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222</pre>
        </details>
      </div>
    </div>
  `;

  document.getElementById('fetch-targets')?.addEventListener('click', fetchTargets);
  document.getElementById('debug-url')?.addEventListener('keyup', (e: Event) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      fetchTargets();
    }
  });
}

async function fetchTargets(): Promise<void> {
  const urlInput = document.getElementById('debug-url') as HTMLInputElement;
  const targetsList = document.getElementById('targets-list') as HTMLElement;
  const errorEl = document.getElementById('connection-error') as HTMLElement;

  errorEl.style.display = 'none';
  targetsList.style.display = 'none';

  const baseUrl = urlInput.value.trim();
  if (!baseUrl) {
    return;
  }

  try {
    const proxyUrl = `/debug-proxy?host=${encodeURIComponent(baseUrl)}&endpoint=/json`;
    const resp = await fetch(proxyUrl);
    const targets = await resp.json() as Array<{
      id: string;
      title: string;
      url: string;
      type: string;
      webSocketDebuggerUrl?: string;
    }>;

    const pages = targets.filter(t => t.type === 'page');
    if (pages.length === 0) {
      errorEl.textContent = 'No page targets found. Make sure a tab is open in Chrome.';
      errorEl.style.display = 'block';
      return;
    }

    targetsList.innerHTML = '<h3>Select a target:</h3>';
    for (const target of pages) {
      const item = document.createElement('button');
      item.className = 'target-item';
      item.innerHTML = `
        <span class="target-title">${escapeHtml(target.title || 'Untitled')}</span>
        <span class="target-url">${escapeHtml(target.url)}</span>
      `;
      item.addEventListener('click', () => {
        connectToTarget(baseUrl, target);
      });
      targetsList.appendChild(item);
    }
    targetsList.style.display = 'block';
  } catch (err) {
    errorEl.textContent = `Failed to connect to ${baseUrl}. Make sure Chrome is running with --remote-debugging-port and CORS is not blocking the request.`;
    errorEl.style.display = 'block';
  }
}

function connectToTarget(
  baseUrl: string,
  target: {id: string; webSocketDebuggerUrl?: string},
): void {
  let wsUrl: string;
  if (target.webSocketDebuggerUrl) {
    const parsed = new URL(target.webSocketDebuggerUrl);
    wsUrl = `${parsed.host}${parsed.pathname}`;
  } else {
    wsUrl = `${baseUrl}/devtools/page/${target.id}`;
  }

  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws';
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set(scheme, wsUrl);
  window.location.href = newUrl.toString();
}

function showDisconnected(message: string): void {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 10000;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.7); color: white; font-size: 18px;
    font-family: system-ui, sans-serif;
  `;
  overlay.innerHTML = `
    <div style="text-align:center; padding:40px;">
      <h2>Disconnected</h2>
      <p>${escapeHtml(message)}</p>
      <button onclick="location.search=''" style="margin-top:16px;padding:8px 24px;font-size:16px;cursor:pointer;">
        Reconnect
      </button>
    </div>
  `;
  document.body.appendChild(overlay);
}

function escapeHtml(str: string): string {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// --- Go ---
boot().catch(err => {
  console.error('Boot failed:', err);
  document.body.innerHTML = `<pre style="color:red;padding:20px;font-size:14px;">Boot failed:\n${err.stack || err}</pre>`;
});
