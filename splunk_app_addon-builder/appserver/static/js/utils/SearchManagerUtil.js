import _ from "lodash";
import SearchManager from "splunkjs/mvc/searchmanager";
import { getCurrentApp } from "splunkjs/mvc/utils";
var cachedSearchManagers = {};

const getOrCreateSearchManager = function(options) {
    let id = options.id;
    let manager = cachedSearchManagers[id];
    if (!manager) {
        manager = cachedSearchManagers[id] = new SearchManager(
            _.extend(
                {
                    cancelOnUnload: true,
                    status_buckets: 300,
                    auto_cancel: 90,
                    earliest_time: "$earliest_search_time$",
                    latest_time: "$latest_search_time$",
                    preview: true,
                    app: getCurrentApp(),
                    runWhenTimeIsUndefined: false,
                    search_mode: "$search_mode$"
                    // "refresh": 10,
                    // "refreshType": "interval"
                },
                options
            ),
            {
                tokens: true
            }
        );
    }
    return manager;
};

export { getOrCreateSearchManager };
