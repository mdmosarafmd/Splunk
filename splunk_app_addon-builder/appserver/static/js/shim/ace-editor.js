define(
    ["splunk.util", "script!lib/ace/ace", "script!lib/ace/ext-language_tools"],
    function(splunkUtil) {
        var basePath = splunkUtil.make_url(
            "static/app/splunk_app_addon-builder/lib/ace"
        );
        window.ace.config.set("basePath", basePath);
        return window.ace;
    }
);
