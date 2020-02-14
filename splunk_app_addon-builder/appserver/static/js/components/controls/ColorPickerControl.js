import $ from "jquery";
import ColorPicker from "views/shared/controls/colors/ColorPicker";
import ColorPickerControl from "views/shared/controls/ColorPickerControl";

export default ColorPickerControl.extend({
    events: {
        "click .color-square": function(e) {
            e.preventDefault();
            var $target = $(e.target);
            this.children.colorPicker = new ColorPicker({
                model: this.mediatorModel,
                paletteColors: this.options.paletteColors,
                shadeColor: function(color) {
                    return color;
                },
                onHiddenRemove: true
            });
            var popContainer = this.options.popContainer || $("body");
            this.children.colorPicker.render().appendTo(popContainer);
            this.children.colorPicker.show($target);
        }
    },

    initialize: function() {
        ColorPickerControl.prototype.initialize.apply(this, arguments);
    }
});
