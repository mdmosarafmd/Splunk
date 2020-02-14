'use strict';

/*
 * Copyright (C) 2017 Splunk Inc. All Rights Reserved.
 */

require(['jquery', 'underscore', 'splunkjs/mvc', 'splunk.util', 'splunkjs/mvc/tokenawaremodel', 'splunkjs/mvc/utils', 'views/shared/results_table/renderers/BaseCellRenderer', 'splunkjs/mvc/simplexml/ready!'], function ($, _, mvc, splunkUtil, TokenAwareModel, utils, BaseCellRenderer) {

    $('#predictOptionsDialog').text(_('Advanced...').t());
    $('#openCorrelationSearchDialog').text(_('Save as Correlation Search ...').t());

    //
    // Token Handling
    //
    var submittedTokens = mvc.Components.get('submitted');

    // When the function token changes...
    submittedTokens.on('change:function change:attribute', _.debounce(function () {
        // if function exists
        if (submittedTokens.has('function') && submittedTokens.get('function') !== null) {
            var func = submittedTokens.get('function');

            if (submittedTokens.has('attribute') && submittedTokens.get('attribute') !== null && submittedTokens.get('attribute') !== '*') {
                // if attribute exists and is not *

                var attrib = submittedTokens.get('attribute');

                submittedTokens.set('aggregate', func + '(' + attrib + ')');
            } else {
                // if attribute does not exist or is *

                if (func === 'count') {
                    // if function is count
                    submittedTokens.set('aggregate', func);
                } else {
                    // if function is not count
                    window.alert(_('All functions other than count require an attribute!').t());
                }
            }
        } else {
            window.alert(_('Please select a function!').t());
        }
    }));

    // update on load
    if (submittedTokens.has('function') && submittedTokens.get('function') !== null) {
        submittedTokens.trigger('change:function');
    }

    //
    // Table Styling
    //
    var table1Element = mvc.Components.get('table1');

    var CustomIconCellRenderer = BaseCellRenderer.extend({
        canRender: function canRender(cell) {
            var excludedFields = ['_time', 'predict'];

            if (cell.field.substring(0, 5) == 'lower' || cell.field.substring(0, 5) == 'upper') {
                return false;
            }

            return !_.contains(excludedFields, cell.field);
        },

        render: function render($td, cell) {
            var cell_value = cell.value;

            var decoration = cell_value.match(/##icon-\S+##/);

            if (decoration !== null) {
                cell_value = cell_value.replace(decoration[0], '');

                decoration = decoration[0].replace(/##/g, '');

                $td.addClass('icon').html(_.template('<%- cell_value %><i class="<%- decoration %>" title="<%- decoration %>"></i>', {
                    cell_value: cell_value,
                    decoration: decoration
                }));
            } else {
                $td.html(_.template('<%- cell_value %>', {
                    cell_value: cell_value
                }));
            }
        }
    });

    table1Element.getVisualization(function (tableView) {
        tableView.addCellRenderer(new CustomIconCellRenderer());
        tableView.render();
    });

    //
    // Make Correlation Search
    //
    var getCorrelationSearch = function getCorrelationSearch() {
        return new TokenAwareModel({
            earliest: mvc.tokenSafe('$earliest$'),
            latest: mvc.tokenSafe('$latest$'),
            search: mvc.tokenSafe('| tstats $aggregate$ from datamodel=$dm$ where nodename="$object$" by _time span=$span$ | predict lower$lower$=lower upper$upper$=upper $predict_options$ $aggregate$ as predict | where (\'$aggregate$\'<\'lower$lower$(predict)\' OR \'$aggregate$\'>\'upper$upper$(predict)\')')
        }, {
            tokens: true,
            tokenNamespace: 'submitted'
        });
    };

    var initEditor = function initEditor() {
        $('#nameField').val('');
        $('#severityField').val('');
        $('#descriptionField').val('');
        $('#domainField').val('');
    };

    var showSuccessMessage = function showSuccessMessage(sid) {
        $('#successMessage').html(_.template(splunkUtil.sprintf(_('The correlation search was successfully created.<p><br/><a target="_blank" href="correlation_search_edit?search=%s">View created search</a></p>').t(), encodeURIComponent(sid))));
    };

    var isInputValid = function isInputValid() {
        var failed = false;

        // Check the search name
        if ($('#nameField').val().length === 0) {
            $('#correlationSearchNameGroup').addClass('error');
            failed = true;
        } else {
            $('#correlationSearchNameGroup').removeClass('error');
        }

        // Check the search description
        if ($('#descriptionField').val().length === 0) {
            $('#correlationSearchDescriptionGroup').addClass('error');
            failed = true;
        } else {
            $('#correlationSearchDescriptionGroup').removeClass('error');
        }

        return !failed;
    };

    // Wire up the button to save the correlation search dialog
    $('#makeCorrelationSearch').click(function () {
        // Get the search
        var searchModel = getCorrelationSearch();

        // Don't try to submit the input if the content is not valid
        if (!isInputValid()) {
            return;
        }

        $('#makeCorrelationSearch').text(_('Saving...').t());
        $('#makeCorrelationSearch').attr('disabled', 'true');
        $('.loading').show();

        var app = utils.getCurrentApp();
        var url = splunkUtil.make_full_url('/splunkd/__raw/servicesNS/nobody/' + encodeURIComponent(app) + '/saved/searches/', {
            output_mode: 'json'
        });
        var name = $('#nameField').val();
        var description = $('#descriptionField').val() || '';
        var severity = $('#severityField').val();

        // create correlation search
        var data = {
            name: name,
            description: description,
            search: searchModel.attributes.search,
            'request.ui_dispatch_app': app,
            is_visible: 0,
            'action.correlationsearch.enabled': 1,
            'action.correlationsearch.label': name,
            'action.correlationsearch.related_searches': '[]',
            'action.notable.param.security_domain': $('#domainField').val() || 'threat',
            'action.notable.param.severity': severity !== 'unknown' ? severity : 'high',
            'action.notable.param.rule_title': name,
            'action.notable.param.rule_description': description,
            actions: ['notable'].join(','),
            is_scheduled: 1,
            cron_schedule: '*/5 * * * *',
            realtime_schedule: 1,
            'alert.digest_mode': 1,
            'alert.track': 0,
            'alert.suppress': 0,
            'alert.suppress.fields': '',
            'alert.suppress.period': '',
            'dispatch.rt_backfill': 1,
            'dispatch.earliest_time': searchModel.attributes.earliest,
            'dispatch.latest_time': searchModel.attributes.latest
        };

        $.ajax({
            url: url,
            type: 'POST',
            data: data,
            async: true
        }).done(function (data) {
            $('#successMessage').show();

            showSuccessMessage(data.entry[0].name);

            $('#editor').hide();
            $('.loading').hide();
            $('#makeCorrelationSearch').hide();
            $('#makeCorrelationSearch').text(_('Save').t());
            $('#makeCorrelationSearch').removeAttr('disabled');

            initEditor();
        }).fail(function () {
            window.alert(_('Correlation search could not be saved').t());

            $('.loading').hide();
            $('#makeCorrelationSearch').text(_('Save').t());
            $('#makeCorrelationSearch').removeAttr('disabled');
        });
    });

    /**
     * Populates the drop down display in the View
     *
     * @param {String} elementRef
     * @param {Array} options
     *
     * @private
     */
    var _populateDropDownFields = function _populateDropDownFields(elementRef, options) {

        if (!_.isString(elementRef)) {
            throw new Error('\'elementRef\' needs to be a String');
        }

        if (!_.isArray(options)) {
            throw new Error('\'options\' needs to be an Array.');
        } else {
            for (var i = 0; i < options.length; i++) {
                if (!options[i].hasOwnProperty('value') || !options[i].hasOwnProperty('label')) {
                    throw new Error('Each item in the \'options\' array needs to have \'value\' and \'label\' attributes.');
                }
            }
        }

        var _currentValue = $(elementRef).val();

        // Clear the field
        $(elementRef).html('');

        // Populate the drop down
        options.forEach(function (item) {
            var option = _.template('<option value="<%- value %>" <%- selected %>><%- label %></option>', {
                value: item.value,
                label: item.label,
                selected: item.value === _currentValue ? 'selected' : ''
            });

            $(elementRef).append(option);
        });
    };

    var _populateDomainField = function _populateDomainField() {
        _populateDropDownFields('#domainField', [{
            value: 'access',
            label: _('Access').t()
        }, {
            value: 'audit',
            label: _('Audit').t()
        }, {
            value: 'endpoint',
            label: _('Endpoint').t()
        }, {
            value: 'identity',
            label: _('Identity').t()
        }, {
            value: 'network',
            label: _('Network').t()
        }, {
            value: 'threat',
            label: _('Threat').t()
        }]);
    };

    var _populateSeverityField = function _populateSeverityField() {
        _populateDropDownFields('#severityField', [{
            value: 'unknown',
            label: _('Unknown').t()
        }, {
            value: 'informational',
            label: _('Informational').t()
        }, {
            value: 'low',
            label: _('Low').t()
        }, {
            value: 'medium',
            label: _('Medium').t()
        }, {
            value: 'high',
            label: _('High').t()
        }, {
            value: 'critical',
            label: _('Critical').t()
        }]);
    };

    var _updateCorrelationDialogView = function _updateCorrelationDialogView() {
        //
        // Create Correlation Search Modal
        //

        $('#createCorrelationSearchModalTitle').text(_('Save as Correlation Search').t());

        $('#domainFieldLabel').text(_('Security Domain').t());
        _populateDomainField();

        $('#severityFieldLabel').text(_('Severity').t());
        _populateSeverityField();

        $('#nameFieldLabel').text(_('Correlation Search Name').t());
        $('#nameField').attr('placeholder', _('Enter the name of the correlation search').t());

        $('#descriptionFieldLabel').text(_('Correlation Search Description').t());
        $('#descriptionField').attr('placeholder', _('Enter a description of the correlation search').t());

        $('#successMessage').text(_('The correlation search was successfully created').t());

        $('#createCorrelationSearchModalCloseButton').text(_('Close').t());
        $('#makeCorrelationSearch').text(_('Save').t());

        //
        // Run Search First Modal
        //

        $('#runSearchFirstModalTitle').text(_('Run Search First').t());
        $('#runSearchFirstModalBody').text(_('You need to run the search first before attempting to make a correlation search.').t());

        $('#runSearchFirstModalCloseButton').text(_('Close').t());
    };

    // Wire up the button to open the correlation search dialog
    $('#openCorrelationSearchDialog').click(function () {
        _updateCorrelationDialogView();

        var table1_search = mvc.Components.get('table1').settings.get('managerid');

        if (mvc.Components.get(table1_search).search.attributes.global_earliest_time === undefined) {
            $('#runSearchFirstModal').modal();
            return;
        }

        $('#successMessage').hide();
        $('#editor').show();
        $('#makeCorrelationSearch').show();
        $('#createCorrelationSearchModal').modal();
    });

    $('#nameField').keyup(isInputValid);
    $('#descriptionField').keyup(isInputValid);

    //
    // Predictive Analytics advanced options
    //
    function updateDisplayedOptions() {

        $('#myModalLabel').text(_('Advanced Predict Options').t());

        $('#spanFieldLabel').text(_('Predict Timespan').t());
        $('#spanField').attr('placeholder', _('defaults to 10m').t());
        $('#spanFieldHelp').text(_('Use time specifiers: y, mon, d, h, m, s').t());

        $('#algorithmFieldLabel').text(_('Algorithm').t());
        _populateAlgorithmField();

        $('#correlateFieldLabel').text(_('Correlate').t());
        $('#correlateFieldHelp').text(_('For bivariate model, indicates the field to correlate against').t());

        $('#futureTimespanFieldLabel').text(_('Future Timespan').t());
        $('#futureTimespanField').attr('placeholder', _('Must be a non-negative number').t());
        $('#futureTimespanFieldHelp').text(_('The length of prediction into the future').t());

        $('#holdbackFieldLabel').text(_('Holdback').t());
        $('#holdbackFieldHelp').text(_('Specifies the \'number\' of data points from the end that are NOT used to build the model').t());

        $('#lowerFieldLabel').text(_('Lower confidence interval').t());
        $('#lowerField').attr('placeholder', _('Must be between 0-100; defaults to 95').t());
        $('#lowerFieldHelp').text(_('Specifies a field name for the lower \'int\' percentage confidence interval').t());

        $('#upperFieldLabel').text(_('Upper confidence interval').t());
        $('#upperField').attr('placeholder', _('Must be between 0-100; defaults to 95').t());
        $('#upperFieldHelp').text(_('Specifies a field name for the upper \'int\' percentage confidence interval').t());

        $('#periodFieldLabel').text(_('Period').t());
        $('#periodFieldHelp').text(_('Specifies the seasonal period of the time series data').t());

        $('#predictHelpLink').text(_('Predict command help').t());

        $('#setPredictOptions').text(_('Apply').t());

        // Hide future_timespan and show correlate if LLB algorithm is selected
        if ($('#algorithmField').val() === 'LLB') {
            $('#futureTimespan').hide();
            $('#correlate').show();
        } else {
            $('#futureTimespan').show();
            $('#correlate').hide();
        }

        // Hide period unless LLP algorithm is selected
        if ($('#algorithmField').val() === 'LLP') {
            $('#period').show();
        } else {
            $('#period').hide();
        }
    }

    function _populateAlgorithmField() {
        _populateDropDownFields('#algorithmField', [{
            value: 'LL',
            label: _('Local level').t()
        }, {
            value: 'LLP',
            label: _('Seasonal local level').t()
        },
        // {
        //     value: 'LLB',
        //     label: _('Bivariate local level').t()
        // },
        {
            value: 'LLT',
            label: _('Local level trend').t()
        }]);
    }

    function getAdvancedPredictArgs() {
        var args = {
            algorithm: $('#algorithmField').val(),
            future_timespan: $('#futureTimespanField').val(),
            //correlate: $('#correlateField').val(), //LLB is not supported yet
            holdback: $('#holdbackField').val(),
            period: $('#periodField').val()
        };

        var arg_string = [];

        for (var key in args) {
            if (args[key] !== '') {
                arg_string.push(key + '=' + args[key]);
            }
        }

        return arg_string.join(' ');
    }

    function performValidate(field_selector, val, message, test_function) {
        if (!test_function(val)) {
            $('.help-inline', field_selector).show().text(message);
            $(field_selector).addClass('error');

            return 1;
        } else {
            $('.help-inline', field_selector).hide();
            $(field_selector).removeClass('error');

            return 0;
        }
    }

    function parseIntIfValid(val) {
        var intRegex = /^[-]?\d+$/;

        if (!intRegex.test(val)) {
            return NaN;
        } else {
            return parseInt(val, 10);
        }
    }

    function isValidTimespan(span) {
        var spanRegex = /^([0-9]+)(y|(mon)|d|h|m|s)$/i;
        var matches = spanRegex.exec(span);

        return matches ? true : false;
    }

    function validateOptions() {
        // Record the number of failures
        var failures = 0;

        // Verify span is valid
        failures += performValidate($('#span'), $('#spanField').val(), _('Must be a valid timespan').t(), function (val) {
            return val.length === 0 || isValidTimespan(val);
        });

        // Verify lower is between 0-100
        failures += performValidate($('#lower'), $('#lowerField').val(), _('Must be between 0 and 100').t(), function (val) {
            return val.length === 0 || parseIntIfValid(val, 10) > 0 && parseIntIfValid(val, 10) < 100;
        });

        // Verify upper is between 0-100
        failures += performValidate($('#upper'), $('#upperField').val(), _('Must be between 0 and 100').t(), function (val) {
            return val.length === 0 || parseIntIfValid(val, 10) > 0 && parseIntIfValid(val, 10) < 100;
        });

        // Verify holdback is positive (if set)
        failures += performValidate($('#holdback'), $('#holdbackField').val(), _('Must be a positive integer').t(), function (val) {
            return val.length === 0 || parseIntIfValid(val, 10) > 0;
        });

        // Verify future timespan is zero or more (if set) if algorithm is not LLB
        failures += performValidate($('#futureTimespan'), $('#futureTimespanField').val(), _('Must be zero or more').t(), function (val) {
            return $('#algorithmField').val() === 'LLB' || val.length === 0 || parseIntIfValid(val, 10) >= 0;
        });

        // Verify that the correlate field is provided if algorithm is LLB
        failures += performValidate($('#correlate'), $('#correlateField').val(), _('Must not be empty').t(), function (val) {
            return $('#algorithmField').val() != 'LLB' || val.length > 0;
        });

        // Return a boolean indicating the validation succeeded or not
        return failures === 0;
    }

    // Wire up the button to open the predict options dialog
    $('#predictOptionsDialog').click(function () {
        updateDisplayedOptions();
        $('#predictCommandOptionsModal').modal();
    });

    // If the algorithm field changes, make sure that options that do not apply are hidden
    $('#algorithmField').change(function () {
        updateDisplayedOptions();
    });

    // If a field value changes, then validate the new values
    $('#options input').change(validateOptions);

    // If close is pressed, then validate the arguments and close the modal
    $('#setPredictOptions').on('click', function () {
        if (validateOptions()) {

            // Set the span
            var span = $('#spanField').val();

            if (span !== null && span.length > 0) {
                submittedTokens.set('span', span);
            } else {
                submittedTokens.set('span', '10m');
            }

            // Set the advanced predict options
            submittedTokens.set('predict_options', getAdvancedPredictArgs());

            // Set the lower and upper settings
            var lower = $('#lowerField').val();
            var upper = $('#upperField').val();

            if (lower.length === 0) {
                lower = '95';
            }

            if (upper.length === 0) {
                upper = '95';
            }

            submittedTokens.set('lower', lower);
            submittedTokens.set('upper', upper);

            // Hide the modal
            $('#predictCommandOptionsModal').modal('hide');
        }
    });

    //
    // Fill the tokens with some default values so that the search can be kicked off even if the user didn't change
    // items in the advanced dialog
    //
    submittedTokens.set('predict_options', '');
    submittedTokens.set('lower', '95');
    submittedTokens.set('upper', '95');
    submittedTokens.set('span', '10m');
});
