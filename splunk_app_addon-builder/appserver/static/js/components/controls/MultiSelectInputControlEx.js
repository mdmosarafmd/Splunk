import Control from "views/shared/controls/Control";
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

export default Control.extend({
    className: "control multiselect-input-control splunk-multidropdown",
    initialize: function() {
        if (this.options.modelAttribute) {
            this.$el.attr("data-name", this.options.modelAttribute);
        }
        Control.prototype.initialize.call(this, this.options);
    },
    render: function() {
        this.$el.html(this.compiledTemplate());
        this.$(".select2_multiselect")
            .select2({
                tags: this.options.tags
            })
            .select2("val", this._value || "");
        this.$(".select2-search-choice").css({
            "max-width": "160px",
            "overflow-x": "scroll"
        });
        return this;
    },

    setTags: function(tags, render) {
        render = render || true;
        this.options.tags = tags;
        if (render) {
            this.render();
        }
    },

    remove: function() {
        this.$("select").select2("close").select2("destroy");
        return Control.prototype.remove.apply(this, arguments);
    },
    events: {
        "change input": function(e) {
            var values = e.val || [];
            this.setValue(values, false);
        }
    },
    enable: function() {
        this.$(".select2_multiselect").select2("enable", true);
        Control.prototype.enable.apply(this);
    },
    disable: function() {
        this.$(".select2_multiselect").select2("enable", false);
        Control.prototype.disable.apply(this);
    },
    template: '<input type="hidden" class="select2_multiselect">'
});
