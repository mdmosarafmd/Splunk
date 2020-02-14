import _ from "lodash";
import BaseInputModel from "models/services/data/inputs/BaseInputModel";

export default BaseInputModel.extend({
    url: "data/inputs/monitor",
    urlRoot: "data/inputs/monitor",
    validation: {
        file: [
            {
                required: true,
                msg: _.t("File must be selected.")
            }
        ]
    }
});
