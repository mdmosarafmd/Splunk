import $ from "jquery";
import _ from "lodash";
import React from "react";
import "select2/select2";
import { createTestHook } from "app/utils/testSupport";
import PropTypes from "prop-types";

const DELIMITER = "::::";

export default class MultiSelectControl extends React.Component {
    static defaultProps = {
        allowClear: false,
        value: [],
        formatResult: _.noop,
        onChange: _.noop,
        disabled: false,
        items: []
    };

    static propTypes = {
        items: PropTypes.array,
        value: PropTypes.arrayOf(PropTypes.string),
        placeholder: PropTypes.string,
        formatResult: PropTypes.func,
        onChange: PropTypes.func,
        disabled: PropTypes.bool
    };
    constructor(...args) {
        super(...args);
    }
    shouldComponentUpdate(nextProps) {
        return !_.isEqual(nextProps, this.props);
    }
    componentWillMount() {
        this._value = this.props.value;
    }
    componentWillUpdate(props) {
        this._value = props.value;
    }
    componentDidMount() {
        this.updateSelectControl(true);
    }
    componentDidUpdate( prevProps ) {
        let isOptionsNeedUpdate = false;
        if(
            prevProps.placeholder !== this.props.placeholder
            ||
            this.props.formatResult.toString() !== prevProps.formatResult.toString()
        ){
            isOptionsNeedUpdate = true;
        }
        // placeholder: this.props.placeholder,
        this.updateSelectControl(isOptionsNeedUpdate);
    }
    componentWillUnmount() {
        this.removeSelectControl();
    }
    updateSelectControl(isOptionsNeedUpdate = false) {
        if(isOptionsNeedUpdate){
            let options = {
                placeholder: this.props.placeholder,
                formatNoMatches: function() {
                    return "No matches found";
                },
                dropdownCssClass: "empty-results-allowed",
                // SPL-77050, this needs to be false for use inside popdowns/modals
                separator: DELIMITER,
                openOnEnter: false
            };
            if (
                _.isFunction(this.props.formatResult) &&
                this.props.formatResult !== _.noop
            ) {
                options.formatResult = this.props.formatResult;
            }
            $(this.refs.input).select2(options);
        }
        $(this.refs.input)
            .select2("val", this._value || [])
            .select2("enable", !this.props.disabled)
            .off("change", this.onChange)
            .on("change", this.onChange);
    }
    removeSelectControl() {
        if (this.refs.input) {
            $(this.refs.input).select2("close").select2("destroy");
        }
    }
    render() {
        let items = _.map(this.props.items, (item, i) => {
            return <option key={ i } value={ item.value }>{item.label}</option>;
        });
        return (
            <div
                style={ { width: "100%" } }
                className="control multiselect-input-control splunk-multidropdown"
                { ...createTestHook(__filename) }
            >
                <select multiple="multiple" ref="input">
                    {items}
                </select>
            </div>
        );
    }
    onChange(event) {
        this._value = event.val;
        this.props.onChange(event, { value: this._value });
    }
    setValue(value) {
        this._value = value;
        this.refs.input.select2("val", this._value);
    }
    getValue() {
        return this._value;
    }
}
