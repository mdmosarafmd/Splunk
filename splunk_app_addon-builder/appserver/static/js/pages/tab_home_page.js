require([
    "app/routers/AppRouter",
    "app/controllers/AppHomeController",
    "util/router_utils"
], function(AppRouter, AppHomeController, Router_utils) {
    AppRouter = AppRouter["default"];
    AppHomeController = AppHomeController["default"];

    new AppRouter({
        controller: AppHomeController
    });

    Router_utils.start_backbone_history();
});
