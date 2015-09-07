


define(['toastr'], function (toastr) {
   
    'use strict';
    
    function getTree() {
        var tree = [
            {
                text: 'System',
                icon: 'glyphicon glyphicon-cloud',
                nodes: [
                    {
                        text: 'Concurrent Usages',
                        nodes: [
                            {
                                text: 'CPU',
                                href: '#under-construction'
                            },
                            {
                                text: 'Memory',
                                href: '#under-construction'
                            }
                        ]
                    },
                    {
                        text: 'Log..',
                        href: '#under-construction'
                    }
                ]
            },
            {
                text: 'Servers',
                icon: 'glyphicon glyphicon-eye-open',
                nodes: [
                    {
                        text: 'CU',
                        href: '#under-construction'
                    },
                    {
                        text: 'LOG',
                        href: '#under-construction'
                    }
                ]
            },
            {
                text: 'Users',
                icon: 'glyphicon glyphicon-user'
            },
            {
                text: 'Request Profiling',
                icon: 'glyphicon glyphicon-th-list',
                nodes: [
                    {
                        text: 'Current',
                        href: '#pf-current'
                    },
                    {
                        text: 'Current statistics',
                        href: '#pf-current-stat'
                    },
                    {
                        text: 'Hourly statistics',
                        href: '#pf-for-hours'
                    },
                    {
                        text: 'Daily statistics',
                        href: '#pf-for-days'
                    }
                ]
            }
        ];
        
        return tree;
    }
    
    return {
        getTree: getTree
    };
});