import $ from "jquery";
import _ from "lodash";
import React from "react";
import "select2/select2";
import { createTestHook } from "app/utils/testSupport";
import PropTypes from "prop-types";
import Immutable from 'immutable';
export default class SingleSelectControl extends React.Component {
    static defaultProps = {
        allowClear: false,
        disableSearch: true,
        onChange: _.noop,
        disabled: false,
        formatResult: _.noop,
        noMatchText: "&nbsp;"
    };

    static propTypes = {
        items: PropTypes.array,
        value: PropTypes.string,
        placeholder: PropTypes.string,
        allowClear: PropTypes.bool,
        disableSearch: PropTypes.bool,
        onChange: PropTypes.func,
        disabled: PropTypes.bool,
        formatResult: PropTypes.func,
        noMatchText: PropTypes.string
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
    componentDidUpdate(prevProps) {
        let isOptionsNeedUpdate = false;
        if(
            prevProps.placeholder !== this.props.placeholder
            ||
            this.props.formatResult.toString() !== prevProps.formatResult.toString()
            ||
            this.props.allowClear !== prevProps.allowClear
            ||
            this.props.noMatchText !== prevProps.noMatchText
            ||
            this.props.disableSearch !== prevProps.disableSearch
            ||
            (!Immutable.fromJS(this.props.items).equals(Immutable.fromJS(prevProps.items)))
        ){
            isOptionsNeedUpdate = true;
        }
        this.updateSelectControl(isOptionsNeedUpdate);
    }
    componentWillUnmount() {
        this.removeSelectControl();
    }
    updateSelectControl(isOptionsNeedUpdate) {
        if(isOptionsNeedUpdate){
            let data = _.map(this.props.items, item => {
                return {
                    id: item.value,
                    text: item.label
                };
            });
            let options = {
                placeholder: this.props.placeholder,
                data: data,
                formatNoMatches: () => {
                    return this.props.noMatchText;
                },
                dropdownCssClass: "empty-results-allowed",
                // SPL-77050, this needs to be false for use inside popdowns/modals
                openOnEnter: false,
                multiple: false,
                combobox: true,
                allowClear: this.props.allowClear
            };
            if (this.props.disableSearch) {
                options.minimumResultsForSearch = Infinity;
            }
            if (
                _.isFunction(this.props.formatResult) &&
                this.props.formatResult !== _.noop
            ) {
                options.formatResult = this.props.formatResult;
            }
            $(this.refs.input).select2(options);
        }
        $(this.refs.input)
            .select2("val", this._value)
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
        return (
            <div style={ { width: "100%" } } { ...createTestHook(__filename) }>
                <input type="hidden" ref="input" />
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
