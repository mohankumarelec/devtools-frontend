import * as SDK from '../../out/Default/gen/front_end/core/sdk/sdk.js';
import * as UI from '../../out/Default/gen/front_end/ui/legacy/legacy.js';

import {ScreencastView} from '../../out/Default/gen/front_end/panels/screencast/ScreencastView.js';

export class ScreencastOnlyApp implements UI.App.App,
                                          SDK.TargetManager.SDKModelObserver<SDK.ScreenCaptureModel.ScreenCaptureModel> {
  private rootView?: UI.RootView.RootView;
  private screencastView?: ScreencastView;
  private screenCaptureModel?: SDK.ScreenCaptureModel.ScreenCaptureModel;

  constructor() {
    SDK.TargetManager.TargetManager.instance().observeModels(SDK.ScreenCaptureModel.ScreenCaptureModel, this);
  }

  presentUI(document: Document): void {
    this.rootView = new UI.RootView.RootView();
    this.rootView.attachToDocument(document);
    this.rootView.focus();
  }

  modelAdded(screenCaptureModel: SDK.ScreenCaptureModel.ScreenCaptureModel): void {
    if (screenCaptureModel.target() !== SDK.TargetManager.TargetManager.instance().primaryPageTarget()) {
      return;
    }
    this.screenCaptureModel = screenCaptureModel;
    this.screencastView = new ScreencastView(screenCaptureModel);
    if (this.rootView) {
      this.screencastView.show(this.rootView.element);
    }
    this.screencastView.initialize();
  }

  modelRemoved(screenCaptureModel: SDK.ScreenCaptureModel.ScreenCaptureModel): void {
    if (this.screenCaptureModel !== screenCaptureModel) {
      return;
    }
    delete this.screenCaptureModel;
    if (this.screencastView) {
      this.screencastView.detach();
      delete this.screencastView;
    }
  }
}

export class ScreencastOnlyAppProvider implements UI.AppProvider.AppProvider {
  private static appInstance?: ScreencastOnlyApp;

  createApp(): UI.App.App {
    if (!ScreencastOnlyAppProvider.appInstance) {
      ScreencastOnlyAppProvider.appInstance = new ScreencastOnlyApp();
    }
    return ScreencastOnlyAppProvider.appInstance;
  }
}
