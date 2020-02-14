require([
    "app/routers/AppRouter",
    "app/controllers/AppController",
    "util/router_utils",
    "splunkjs/mvc/simplexml/controller",
    "splunkjs/mvc/sharedmodels"
], function(
    AppRouter,
    AppController,
    Router_utils,
    SplunkController,
    SharedModels
) {
    AppRouter = AppRouter["default"];
    AppController = AppController["default"];

    const router = new AppRouter({
        controller: AppController
    });

    /*
     * ------- HACK FOR SPLUNK DASHBOARD --------
     */

    delete window.__splunkjs_router_disabled__;
    SplunkController.router = router;
    SplunkController.collection = {};
    SplunkController.model.app = SharedModels.get("app");
    SplunkController.model.appLocal = SharedModels.get("appLocal");
    SplunkController.model.user = SharedModels.get("user");
    SplunkController.model.userPref = SharedModels.get("userPref");
    SplunkController.collection.times = SharedModels.get("times");
    SplunkController.model.serverInfo = SharedModels.get("serverInfo");
    /*
     * ------- HACK END --------
     */

    Router_utils.start_backbone_history();
});
