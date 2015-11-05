// TODO : some codes are camel case which is against to code convention. Please check and fix them.
/* jshint camelcase:false */

define(['monitorApi', 'js/data', 'toastr', 'moment'], function (monitorApi, dataMgr, toastr, moment) {
    'use strict';

    function init() {

        var gridObj = $('#jsGrid-pf-current-stat');
        var pf = monitorApi.pf;

        dataMgr.getSvcTypeList(function (err, result) {
            if (err) {
                return console.error(err);
            }

            $('#option-svctype').find('option:not(:first)').remove();
            for (var i in result) {
                if (result.hasOwnProperty(i)) {
                    var val = result[i];
                    var o = new Option(val.svc_type, val.svc_type);
                    $('#option-svctype').append(o);
                }
            }
        });


        dataMgr.getInstNameList(function (err, result) {
            if (err) {
                return console.error(err);
            }

            $('#option-svcname').find('option:not(:first)').remove();
            for (var i in result) {
                if (result.hasOwnProperty(i)) {
                    var val = result[i];
                    var o = new Option(val.inst_name, val.inst_name);
                    $('#option-svcname').append(o);
                }
            }
        });


        pf.getInstList(function (err, result) {
            if (err) {
                return console.error(err);
            }

            $('#option-instid').find('option:not(:first)').remove();
            for (var i in result) {
                if (result.hasOwnProperty(i)) {
                    var val = result[i];
                    var str = val.inst_id + '| => ' + val.started_at + ' ~ ' + val.ended_at;
                    var o = new Option(str, str);
                    $('#option-instid').append(o);
                }
            }
        });

        $('#option-svcname').change(function () {
            var sel = getSel('#option-svcname');
            if (sel !== 'All') {
                $('#option-instid').find('option:not(:first)').remove();

                pf.getInstListByInstName(sel, function (err, result) {
                    if (err) {
                        return console.error(err);
                    }

                    for (var i in result) {
                        if (result.hasOwnProperty(i)) {
                            var val = result[i];
                            var str = val.inst_id + '| => ' + val.started_at + ' ~ ' + val.ended_at;
                            var o = new Option(str, str);
                            $('#option-instid').append(o);
                        }
                    }
                });
            }
        });

        dataMgr.getUrlList(function (err, result) {
            if (err) {
                return console.error(err);
            }
            $('#option-url').find('option:not(:first)').remove();
            for (var i in result) {
                if (result.hasOwnProperty(i)) {
                    var val = result[i];

                    /* jshint camelcase:false */
                    var url = val.req_url + '+' + val.req_method;
                    /* jshint camelcase:true */

                    var o = new Option(url, url);
                    $('#option-url').append(o);
                }
            }
        });


        function applyStartDate() {
            var sel = getSel('#option-period');
            var startTime;
            if (sel === '1 Day') {
                startTime = moment().subtract(1, 'day');
            } else if (sel === '7 Days') {
                startTime = moment().subtract(7, 'day');

            } else if (sel === '15 Days') {
                startTime = moment().subtract(15, 'day');
            }

            $('#tmstart').datetimepicker('update', startTime.toDate());
        }
        applyStartDate();
        $('#tmend').datetimepicker('update', new Date());

        $('#option-period').change(function () {
            applyStartDate();
        });

        var gridOptions = {
            width: '100%',
            height: '550px',

            //filtering: true,
            editing: false,
            sorting: true,
            paging: true,

            confirmDeleting: false,

            pageSize: 15,


            fields: [{
                name: 'ID',
                type: 'text',
                width: 30
            }, {
                name: 'Name',
                type: 'text',
                width: 50
            }, {
                name: 'Type',
                type: 'text',
                width: 50
            }, {
                name: 'URL',
                type: 'text',
                width: 250
            }, {
                name: 'Method',
                type: 'text',
                width: 50
            }, {
                name: 'Min',
                type: 'number',
                sorting: true
            }, {
                name: 'Max',
                type: 'number',
                sorting: true
            }, {
                name: 'Avg',
                type: 'number',
                sorting: true
            }, {
                name: 'Total',
                type: 'number',
                sorting: true
            }, {
                name: 'Date',
                type: 'text',
                sorting: true
            }]
        };


        gridObj.jsGrid(gridOptions);

        function getSel(selector) {
            var sel = $(selector).get(0);
            return sel.options[sel.selectedIndex].text;
        }

        /* jshint ignore:start */
        function isEmptyObj(obj) {
            return JSON.stringify(obj) === '{}';
        }
        /* jshint ignore:end */

        function getQueryOptions() {

            var option = {};

            var valOfSvcType = getSel('#option-svctype');
            if (valOfSvcType !== 'All') {
                option.svc_type = valOfSvcType;
            }

            var valOfSvcName = getSel('#option-svcname');
            if (valOfSvcName !== 'All') {
                option.inst_name = valOfSvcName;
            }

            var valOfIstid = getSel('#option-instid');
            if (valOfIstid !== 'All') {
                var valsFromIstid = valOfIstid.split('|');
                option.inst_id = valsFromIstid[0];
            }

            var valOfUrl = getSel('#option-url');
            if (valOfUrl !== 'All') {
                var valsFromUrl = valOfUrl.split('+');
                option.req_url = valsFromUrl[0];
                option.req_method = valsFromUrl[1];
            }

            return option;
        }

        function getPeriodOption() {
            var val = getSel('#option-period');
            console.log('period =', val);
            if (val !== 'All') {
                return true;
            }
            return false;
        }

        $('#btn-pf-curr-st-query').click(function () {
            var startTime = $('#tmstart').val();
            var endTime = $('#tmend').val();
            var options = getQueryOptions();
            console.log('options = ', options);
            var params = {};
            var isResultMerge = true;
            var isPeriod = getPeriodOption();

            pf.getCurrentReqsStat(isPeriod, startTime, endTime, options, params, isResultMerge,
                function (err, result) {
                    if (err) {
                        console.error('failed to get currentReqs');
                    } else {
                        for (var i in result) {
                            if (result.hasOwnProperty(i)) {
                                var val = result[i];
                                //console.log('val = ', val);
                                var row = {
                                    ID: val.inst_id,
                                    Name: val.inst_name,
                                    Type: val.svc_type,
                                    URL: val.req_url,
                                    Method: val.req_method,
                                    Min: val.min,
                                    Max: val.max,
                                    Avg: val.avg,
                                    Total: val.total //,
                                        //Date: val.started + '\n~' + val.ended
                                };
                                gridObj.jsGrid('insertItem', row);
                            }
                        }
                    }
                });
        });

        $('#btn-pf-curr-st-reset').click(function () {
            var rows = gridObj.jsGrid('option', 'data');
            console.log(rows, rows.length);

            var rowCount = rows.length;
            for (var i = 0; i < rowCount; i++) {
                rows = gridObj.jsGrid('option', 'data');
                gridObj.jsGrid('deleteItem', rows[0]);
            }
        });
    }


    return {
        init: init
    };
});