define(['monitorApi', 'js/data', 'toastr', 'moment'], function (monitorApi, dataMgr, toastr, moment){
    'use strict';
    function init() {

        var gridObj = $('#stat-history-jsGrid');
        var pf = monitorApi.pf;

        dataMgr.getSvcTypeList(function (err, result) {
            if (err) {
                return console.error(err);
            }

            $('#stat-history-option-svctype').find('option:not(:first)').remove();
            for (var i in result) {
                var val = result[i];
                var o = new Option(val.svc_type, val.svc_type);
                $('#stat-history-option-svctype').append(o);
            }  
        });
        
        
        dataMgr.getInstNameList(function (err, result) {
            if (err) {
                return console.error(err);
            }

            $('#stat-history-option-svcname').find('option:not(:first)').remove();
            for (var i in result) {
                var val = result[i];
                var o = new Option(val.inst_name, val.inst_name);
                $('#stat-history-option-svcname').append(o);
            }  
        });
        
        
        dataMgr.getUrlList(function (err, result) {
            if (err) {
                return console.error(err);
            }

            $('#stat-history-option-url').find('option:not(:first)').remove();
            for (var i in result) {
                var val = result[i];
                var url = val.req_url + '+' + val.req_method;

                var o = new Option(url, url);
                $('#stat-history-option-url').append(o);
            }  
        });
        
        
        function applyStartDate() {
            var sel = getSel('#stat-history-option-period');
            var startTime;
            if (sel === '1 Day') {
                startTime = moment().subtract(1, 'day');
            } else if (sel === '7 Days') {
                startTime = moment().subtract(7, 'day');

            } else if (sel === '15 Days') {
                startTime = moment().subtract(15, 'day');
            }

            $('#stat-history-tmstart').datetimepicker('update', startTime.toDate());
        }
        applyStartDate();
        $('#stat-history-tmend').datetimepicker('update', new Date());
        
        $('#stat-history-option-period').change(function () {
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


            fields: [
                { name: 'Name', type: 'text', width: 50 },
                { name: 'Type', type: 'text', width: 50 },
                { name: 'URL', type: 'text', width: 250 },
                { name: 'Method', type: 'text', width: 50 },
                { name: 'Min', type: 'number', sorting: true },
                { name: 'Max', type: 'number', sorting: true },
                { name: 'Avg', type: 'number', sorting: true },
                { name: 'Total', type: 'number', sorting: true },
                { name: 'Date', type: 'text', sorting: true }
            ]
        };


        gridObj.jsGrid(gridOptions);

        function getSel(selector) {
            var sel = $(selector).get(0);
            return sel.options[sel.selectedIndex].text;
        }

        function isEmptyObj(obj) {
            return JSON.stringify(obj) === '{}';
        }

        function getQueryOptions() {

            var option = {};
            var vals = '';

            var val = getSel('#stat-history-option-svctype');
            if (val !== 'All') {
                option.svc_type = val;
            }

            val = getSel('#stat-history-option-svcname');
            if (val !== 'All') {
                option.inst_name = val;
            }

            val = getSel('#stat-history-option-url');
            if (val !== 'All') {
                vals = val.split('+');
                option.req_url = vals[0];
                option.req_method = vals[1];
            }
            
            return option;
        }

        
        function getUnitTime() {
            var val = getSel('#stat-history-option-unit-time');
            return val;
        }
        
        function getPeriodOption() {
            var val = getSel('#stat-history-option-period');
            if (val !== 'All') {
                return true;
            }
            return false;
        }

        $('#stat-history-btn-query').click(function () {
            var startTime = $('#stat-history-tmstart').val();
            var endTime = $('#stat-history-tmend').val();
            var options = getQueryOptions();
            console.log('options = ', options);
            var params = {};
            var isPeriod = getPeriodOption();
            
            
            var unitTime = getUnitTime();
            
            pf.getStatisticsHistory(unitTime, startTime, endTime, options, false, function (err, result){
                if (err) {
                    console.error('failed to get currentReqs');
                } else {
                    for (var i in result) {
                        var val = result[i];
                        var row = {
                            Name: val.inst_name,
                            Type: val.svc_type,
                            URL: val['req_url'],
                            Method: val['req_method'],
                            Min: val['min'],
                            Max: val['max'],
                            Avg: val['avg'],
                            Total: val['total'],
                            Date: val.issue_date
                        };
                        gridObj.jsGrid('insertItem', row);
                    }
                }
            });
           
        });

        $('#stat-history-btn-reset').click(function () {
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