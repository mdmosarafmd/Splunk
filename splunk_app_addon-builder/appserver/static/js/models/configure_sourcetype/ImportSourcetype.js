import Backbone from "backbone";
import { getCustomURLPrefix } from "app/utils/AppInfo";

export default Backbone.Model.extend({
    url: getCustomURLPrefix() + "/app_edit_sourcetype/import_sourcetype"
});