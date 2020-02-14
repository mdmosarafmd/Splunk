import Control from "views/shared/controls/Control";
import splunkUtils from "splunk.util";
import "select2/select2";

/**
 * Radio button Group
 *
 * @param {Object} options
 *            {Object} model The model to operate on
 *            {String} modelAttribute The attribute on the model to observe and update on selection
 *            {Object} items An array of one-level deep data structures:
 *                                      label (textual display),
 *                                      value (value to store in model)
 */
var DELIMITER = "::::";

export default Control.extend({
    className: "control multiselect-input-control splunk-multidropdown",
    initialize: function() {
        if (this.options.modelAttribute) {
            this.$el.attr("data-name", this.options.modelAttribute);
        }
        Control.prototype.initialize.call(this, this.options);
    },
    render: function() {
        this.$el.html(
            this.compiledTemplate({
                items: this.options.items
            })
        );
        this.$("select")
            .select2({
                placeholder: this.options.placeholder,
                formatNoMatches: function() {
                    return "No matches found";
                },
                value: this._value,
                dropdownCssClass: "empty-results-allowed",
                separator: DELIMITER,
                // SPL-77050, this needs to be false for use inside popdowns/modals
                openOnEnter: false
            })
            .select2("val", splunkUtils.stringToFieldList(this._value || ""));
        return this;
    },
    setItems: function(items, render) {
        render = render || true;
        this.options.items = items;
        if (render) {
            this.render();
        }
    },
    remove: function() {
        this.$("select").select2("close").select2("destroy");
        return Control.prototype.remove.apply(this, arguments);
    },
    events: {
        "change select": function(e) {
            var values = e.val || [];
            this.setValue(splunkUtils.fieldListToString(values), false);
        }
    },
    enable: function() {
        this.$("select").select2("enable", true);
        Control.prototype.enable.apply(this);
    },
    disable: function() {
        this.$("select").select2("enable", false);
        Control.prototype.disable.apply(this);
    },
    template: [
        '<select multiple="multiple">',
        "<% _.each(items, function(item, index){ %>",
        '<option value="<%- item.value %>"><%- item.label %></option>',
        "<% }) %>",
        "</select>"
    ].join("")
});
