
define(['monitorApi', 'js/data', 'toastr', 'moment'], function (monitorApi, dataMgr, toastr, moment) {
    'use strict';
    function init() {
        
        var gridObj = $('#jsGrid-pf-current');
        var pf = monitorApi.pf;
        
        dataMgr.getSvcTypeList(function (err, result) {
            if (err) {
                return console.error(err);
            }

            $('#cur-option-svctype').find('option:not(:first)').remove();
            for (var i in result) {
                var val = result[i];
                var o = new Option(val.svc_type, val.svc_type);
                $('#cur-option-svctype').append(o);
            }  
        });
       
        dataMgr.getInstNameList(function (err, result) {
            if (err) {
                return console.error(err);
            }

            $('#cur-option-svcname').find('option:not(:first)').remove();
            for (var i in result) {
                var val = result[i];
                var o = new Option(val.inst_name, val.inst_name);
                $('#cur-option-svcname').append(o);
            }  
        });
        
        pf.getInstList(function (err, result) {
            if (err) {
                return console.error(err);
            }

            $('#cur-option-instid').find('option:not(:first)').remove();
            
            for (var i in result) {
                var val = result[i];
                var str = val.inst_id + '| => ' + val.started_at + ' ~ ' + val.ended_at;
                var o = new Option(str, str);
                $('#cur-option-instid').append(o);
            }
        });
        
        $('#cur-option-svcname').change(function () {
            var sel = getSel('#cur-option-svcname');
            if (sel !== 'All') {
                $('#cur-option-instid').find('option:not(:first)').remove();
                
                pf.getInstListByInstName(sel, function (err, result) {
                    if (err) {
                        return console.error(err);
                    }

                    for (var i in result) {
                        var val = result[i];
                        var str = val.inst_id + '| => ' + val.started_at + ' ~ ' + val.ended_at;
                        var o = new Option(str, str);
                        $('#cur-option-instid').append(o);
                    }
                });
            }
        });

        dataMgr.getUrlList(function (err, result) {
            if (err) {
                return console.error(err);
            }
            $('#cur-option-url').find('option:not(:first)').remove();
            for (var i in result) {
                var val = result[i];
                var url = val.req_url + '+' + val.req_method;
                
                var o = new Option(url, url);
                $('#cur-option-url').append(o);
            }  
        });
        
        
        function applyStartDate() {
            var sel = getSel('#cur-option-period');
            var startTime;
            if (sel === '1 Day') {
                startTime = moment().subtract(1, 'day');
            } else if (sel === '7 Days') {
                startTime = moment().subtract(7, 'day');

            } else if (sel === '15 Days') {
                startTime = moment().subtract(15, 'day');
            }

            $('#cur-tmstart').datetimepicker('update', startTime.toDate());
        }
        applyStartDate();
        $('#cur-tmend').datetimepicker('update', new Date());

        $('#cur-option-period').change(function () {
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
                { name: 'ID', type: 'text', width: 30 },
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

            var val = getSel('#cur-option-svctype');
            if (val !== 'All') {
                option.svc_type = val;
            }
            
            var val = getSel('#cur-option-svcname');
            if (val !== 'All') {
                option.inst_name = val;
            }
            
            var val = getSel('#cur-option-instid');
            if (val !== 'All') {
                var vals = val.split('|');
                option.inst_id = vals[0];
            }
            
            var val = getSel('#cur-option-url');
            if (val !== 'All') {
                var vals = val.split('+');
                option.req_url = vals[0];
                option.req_method = vals[1];
            }
            
            return option;
        }
        
        function getPeriodOption() {
            var val = getSel('#cur-option-period');
            if (val !== 'All') {
                return true;
            }
            return false;
        }
        
        $('#btn-pf-curr-query').click(function () {
            var startTime = $('#cur-tmstart').val();
            var endTime = $('#cur-tmend').val();
            var options = getQueryOptions();
            console.log('options = ', options);
            var params = {};
            var isPeriod = getPeriodOption();
            
            pf.getCurrentReqs(isPeriod, startTime, endTime, options, params, function (err, result){
                if (err) {
                    console.error('failed to get currentReqs');
                } else {
                    for (var i in result) {
                        var val = result[i];
                        //console.log('val = ', val);
                        var row = {
                            ID: val['inst_id'],
                            Name: val.inst_name,
                            Type: val.svc_type,
                            URL: val['req_url'],
                            Method: val['req_method'],
                            Min: val['min'],
                            Max: val['max'],
                            Avg: val['avg'],
                            Total: val['total'],
                            Date: val.created_at
                        };
                        gridObj.jsGrid('insertItem', row);
                    }
                }
            });
        });
        
        $('#btn-pf-curr-reset').click(function () {
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