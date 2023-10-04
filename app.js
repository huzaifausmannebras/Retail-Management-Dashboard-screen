// Section 01
(async () => {

    const topology = await fetch(
        'https://code.highcharts.com/mapdata/custom/world.topo.json'
    ).then(response => response.json());

    const csv = await fetch(
        'https://cdn.jsdelivr.net/gh/highcharts/highcharts@v7.0.0/samples/data/world-population-history.csv'
    ).then(response => response.text());

    // Very simple and case-specific CSV string splitting
    const CSVtoArray = text => text.replace(/^"/, '')
        .replace(/",$/, '')
        .split('","');

    const csvArr = csv.split(/\n/),
        countries = {},
        numRegex = /^[0-9\.]+$/,
        lastCommaRegex = /,\s$/,
        quoteRegex = /\"/g,
        categories = CSVtoArray(csvArr[2]).slice(4);

    let countryChart;
    // Parse the CSV into arrays, one array each country
    csvArr.slice(3).forEach(function (line) {
        var row = CSVtoArray(line),
            data = row.slice(4);

        data.forEach(function (val, i) {
            val = val.replace(quoteRegex, '');
            if (numRegex.test(val)) {
                val = parseInt(val, 10);
            } else if (!val || lastCommaRegex.test(val)) {
                val = null;
            }
            data[i] = val;
        });

        countries[row[1]] = {
            name: row[0],
            code3: row[1],
            data: data
        };
    });
    // For each country, use the latest value for current population
    const data = [];
    for (const code3 in countries) {
        if (Object.hasOwnProperty.call(countries, code3)) {
            const itemData = countries[code3].data;
            let value = null,
                i = itemData.length,
                year;

            while (i--) {
                if (typeof itemData[i] === 'number') {
                    value = itemData[i];
                    year = categories[i];
                    break;
                }
            }
            data.push({
                name: countries[code3].name,
                code3: code3,
                value: value,
                year: year
            });
        }
    }
    // Add lower case codes to the data set for inclusion in the tooltip.pointFormat
    const mapData = Highcharts.geojson(topology);
    mapData.forEach(function (country) {
        country.id = country.properties['hc-key']; // for Chart.get()
        country.flag = country.id.replace('UK', 'GB').toLowerCase();
    });

    // Wrap point.select to get to the total selected points
    Highcharts.wrap(Highcharts.Point.prototype, 'select', function (proceed) {

        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        const points = this.series.chart.getSelectedPoints();
        if (points.length) {
            if (points.length === 1) {
                document.querySelector('#info #flag')
                    .className = 'flag ' + points[0].flag;
                document.querySelector('#info h2').innerHTML = points[0].name;
            } else {
                document.querySelector('#info #flag')
                    .className = 'flag';
                document.querySelector('#info h2').innerHTML = 'Comparing countries';

            }
            document.querySelector('#info .subheader')
                .innerHTML = '<h4>Historical population</h4><small><em>Shift + Click on map to compare countries</em></small>';

            if (!countryChart) {
                countryChart = Highcharts.chart('country-chart', {
                    chart: {
                        height: 250
                    },
                    credits: {
                        enabled: false
                    },
                    title: {
                        text: null
                    },
                    subtitle: {
                        text: null
                    },
                    xAxis: {
                        tickPixelInterval: 50,
                        crosshair: true
                    },
                    yAxis: {
                        title: null,
                        opposite: true
                    },
                    tooltip: {
                        split: true
                    },
                    plotOptions: {
                        series: {
                            animation: {
                                duration: 500
                            },
                            marker: {
                                enabled: false
                            },
                            threshold: 0,
                            pointStart: parseInt(categories[0], 10)
                        }
                    }
                });
            }

            countryChart.series.slice(0).forEach(function (s) {
                s.remove(false);
            });
            points.forEach(function (p) {
                countryChart.addSeries({
                    name: p.name,
                    data: countries[p.code3].data,
                    type: points.length > 1 ? 'line' : 'area'
                }, false);
            });
            countryChart.redraw();

        } else {
            document.querySelector('#info #flag').className = '';
            document.querySelector('#info h2').innerHTML = '';
            document.querySelector('#info .subheader').innerHTML = '';
            if (countryChart) {
                countryChart = countryChart.destroy();
            }
        }
    });

    // Initiate the map chart
    const mapChart = Highcharts.mapChart('map', {

        chart: {
            map: topology,
            spacing: 1
        },

        title: {
            text: 'Sales Management',
            align: 'left',
            style: {
                fontSize: '1.5rem'
            }
        },

        subtitle: {

        },

        mapNavigation: {
            enabled: true,
            buttonOptions: {
                verticalAlign: 'bottom'
            }
        },

        mapView: {
            fitToGeometry: {
                type: 'MultiPoint',
                coordinates: [
                    // Alaska west
                    [-164, 54],
                    // Greenland north
                    [-35, 84],
                    // New Zealand east
                    [179, -38],
                    // Chile south
                    [-68, -55]
                ]
            }
        },

        colorAxis: {
            type: 'logarithmic',
            endOnTick: false,
            startOnTick: false,
            min: 50000
        },

        tooltip: {
            footerFormat: '<span style="font-size: 10px">(Click for details)</span>'
        },


        series: [{
            data: data,
            mapData: mapData,
            joinBy: ['iso-a3', 'code3'],
            name: 'Current population',
            allowPointSelect: true,
            cursor: 'pointer',
            states: {
                select: {
                    color: '#a4edba',
                    borderColor: 'black',
                    dashStyle: 'shortdot'
                }
            },
            borderWidth: 0.5
        }],
        legend: {
            enabled: false
        },
    });

    // Pre-select a country
    mapChart.get('us').select();

})();
const saleByCountry = document.getElementById('sale_by_country');

let saleByCountrySampleData = [
    { property: 'Sales', value: 2031, currency: 'AED' },
    { property: 'CreditSale', value: 300031, currency: 'AED' },
    { property: 'CashSales', value: 4500012, currency: 'AED' },
    { property: 'Discount', value: 6500, currency: 'AED' },
    // { property: 'Free Of Costs', value: 9800, currency: 'AED' }
];

const SampleMappedData = saleByCountrySampleData.map((data, index) => {
    return `
    <div style="display:flex;justify-content:space-between;color:#4e5f8e; line-height: 1.5; font-size: 0.85em; border-bottom: 0.1px solid #e6e6e6; padding: 25px 5px; letter-spacing: 0.25px;">
        <div style="font-size:1.1rem;font-weight:'300';font-family ;color: #4e5f8e ;text-transform: uppercase;
        ">${data.property}</div>
        <div style="><span style="font-size:10px"> ${data.currency}</span> <span style="font-size:1.5rem;font-weight:bold">${data.value}</span></div>
        </div>
    `;
});

saleByCountry.innerHTML = `
    <div id="myTasksCtrlTesting">
        <div style="display:flex;justify-content:space-between;align-items:center;color: rgb(51, 51, 51);font-size: 18px;font-weight: bold;margin-bottom: 10px;">
            <span style="font-size:1.5rem; color: #4e5f8e">Sales By Country</span>
        </div>
        <div id="myTasksList">
            <div ng-repeat="task in vehicleStatus" style="color: black; line-height: 1.5; font-size: 0.85em; border-bottom: 0.1px solid #e6e6e6; padding: 10px 0 10px; letter-spacing: 0.25px;">
                    ${SampleMappedData.join('')}
            </div>
        </div>
    </div>`;


Highcharts.chart('top_5_product', {
    chart: {
        plotBackgroundColor: null,
        plotBorderWidth: 0,
        plotShadow: false
    },
    title: {
        text: 'Top 5 Product Sale',
        align: 'left',
    },
    tooltip: {
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b>'
    },
    accessibility: {
        point: {
            valueSuffix: '%'
        }
    },
    plotOptions: {
        pie: {
            showInLegend: true,
            dataLabels: {
                enabled: false,
                distance: -50,
                style: {
                    fontWeight: 'bold',
                    color: 'white'
                },


            },
            startAngle: -90,
            endAngle: 90,
            center: ['50%', '95%'], // Adjusted center to move labels to the bottom
            size: '110%',
            connectorPadding: 10 // Added space between labels and slices
        }
    },
    series: [{
        type: 'pie',
        name: 'Sold',
        innerSize: '50%',
        data: [
            ['OUD & ROSES', 40],
            ['MTR MALIKINI', 15],
            ['MTR KHUSUSI', 15],
            ['SHAIKHA HIND', 15],
            ['TOUCH OUDH', 15],
        ]
    }],
});



Highcharts.chart('sale_of_product', {
    title: {
        text: 'Sales of products Based On Outlet',
        align: 'left'
    },
    xAxis: {
        categories: ['Outlet #1', 'Outlet #2', 'Outlet #3', 'Outlet #4', 'Outlet #5']
    },
    yAxis: {
        title: {
            text: 'Sale'
        }
    },
    tooltip: {
        valuePrefix: '%',
        // valueSuffix: ' Growth'
    },

    plotOptions: {
        series: {
            borderRadius: '5%'
        }
    },
    series: [
        {
            tooltip: {
                valuePrefix: '%',
                // valueSuffix: ' Growth'
            },

            type: 'column',
            name: 'Credit Sale',

            color: '#febf8e',
            data: [59, 83, 65, 228, 184]
        }, {
            type: 'column',
            name: 'Cash Sale',
            color: '#9F4D41',
            data: [24, 79, 72, 240, 167]
        },]
});





// Section 02



Highcharts.chart('simple_column', {
    chart: {
        type: 'column'
    },
    title: {

        align: 'left',
        text: 'Brandwise Sales',
        style: {
            fontSize: '15px'
        }
    },
    subtitle: {
        align: 'left',
        // text: 'Click the columns to view versions. Source: <a href="http://statcounter.com" target="_blank">statcounter.com</a>'
    },
    accessibility: {
        announceNewData: {
            enabled: true
        }
    },
    xAxis: {
        type: 'category'
    },
    yAxis: {
        title: {
            text: 'Rating'
        }

    },
    legend: {
        enabled: false
    },
    plotOptions: {
        series: {
            color: 'red',
            dataLabels: {
                enabled: true,
                format: '{point.y:.1f}%'
            }
        }
    },

    tooltip: {
        headerFormat: '<span style="font-size:11px">{series.name}</span><br>',
        pointFormat: '<span style="color:{point.color}">{point.name}</span>: <b>{point.y:.2f}%</b> of total<br/>'

    },
    series: [{
        color: '#d484a3',
        name: 'months',
        // colorByPoint: true,
        data: [
            {
                name: 'Jan',
                y: 1.0,
                drilldown: 'Jan'
            },
            {
                name: 'Feb',
                y: 1.3,
                drilldown: 'Feb'
            },
            {
                name: 'Mar',
                y: 1.3,
                drilldown: 'Mar'
            },
            {
                name: 'Apr',
                y: 1.8,
                drilldown: 'Apr'
            },
            {
                name: 'May',
                y: 1.4,
                drilldown: 'May'
            },
            {
                name: 'Jun',
                y: 2.0,
                drilldown: 'Jun'
            },
            {
                name: 'Jul',
                y: 2.0,
                drilldown: 'Jul'
            },
            {
                name: 'Aug',
                y: 2.0,
                drilldown: 'Aug'
            },

        ]
    }
    ],
    drilldown: {
        breadcrumbs: {
            position: {
                align: 'right'
            }
        },
        series: [
            {
                name: 'Chrome',
                id: 'Chrome',
                data: [
                    [
                        'v65.0',
                        0.1
                    ],
                    [
                        'v64.0',
                        1.3
                    ],
                    [
                        'v63.0',
                        53.02
                    ],
                    [
                        'v62.0',
                        1.4
                    ],
                    [
                        'v61.0',
                        0.88
                    ],
                    [
                        'v60.0',
                        0.56
                    ],
                    [
                        'v59.0',
                        0.45
                    ],
                    [
                        'v58.0',
                        0.49
                    ],
                    [
                        'v57.0',
                        0.32
                    ],
                    [
                        'v56.0',
                        0.29
                    ],
                    [
                        'v55.0',
                        0.79
                    ],
                    [
                        'v54.0',
                        0.18
                    ],
                    [
                        'v51.0',
                        0.13
                    ],
                    [
                        'v49.0',
                        2.16
                    ],
                    [
                        'v48.0',
                        0.13
                    ],
                    [
                        'v47.0',
                        0.11
                    ],
                    [
                        'v43.0',
                        0.17
                    ],
                    [
                        'v29.0',
                        0.26
                    ]
                ]
            },
            {
                name: 'Firefox',
                id: 'Firefox',
                data: [
                    [
                        'v58.0',
                        1.02
                    ],
                    [
                        'v57.0',
                        7.36
                    ],
                    [
                        'v56.0',
                        0.35
                    ],
                    [
                        'v55.0',
                        0.11
                    ],
                    [
                        'v54.0',
                        0.1
                    ],
                    [
                        'v52.0',
                        0.95
                    ],
                    [
                        'v51.0',
                        0.15
                    ],
                    [
                        'v50.0',
                        0.1
                    ],
                    [
                        'v48.0',
                        0.31
                    ],
                    [
                        'v47.0',
                        0.12
                    ]
                ]
            },
            {
                name: 'Internet Explorer',
                id: 'Internet Explorer',
                data: [
                    [
                        'v11.0',
                        6.2
                    ],
                    [
                        'v10.0',
                        0.29
                    ],
                    [
                        'v9.0',
                        0.27
                    ],
                    [
                        'v8.0',
                        0.47
                    ]
                ]
            },
            {
                name: 'Safari',
                id: 'Safari',
                data: [
                    [
                        'v11.0',
                        3.39
                    ],
                    [
                        'v10.1',
                        0.96
                    ],
                    [
                        'v10.0',
                        0.36
                    ],
                    [
                        'v9.1',
                        0.54
                    ],
                    [
                        'v9.0',
                        0.13
                    ],
                    [
                        'v5.1',
                        0.2
                    ]
                ]
            },
            {
                name: 'Edge',
                id: 'Edge',
                data: [
                    [
                        'v16',
                        2.6
                    ],
                    [
                        'v15',
                        0.92
                    ],
                    [
                        'v14',
                        0.4
                    ],
                    [
                        'v13',
                        0.1
                    ]
                ]
            },
            {
                name: 'Opera',
                id: 'Opera',
                data: [
                    [
                        'v50.0',
                        0.96
                    ],
                    [
                        'v49.0',
                        0.82
                    ],
                    [
                        'v12.1',
                        0.14
                    ]
                ]
            }
        ]
    }
});


Highcharts.chart('line_and_column', {
    chart: {
        zoomType: 'xy'
    },
    title: {
        text: 'Gross Margin & Gross Profit Margin by Category',
        align: 'left',
        style: {
            fontSize: '15px'
        }
    },

    xAxis: [{
        categories: ['Meat/Poultry', 'Dairy Products', 'Beverages', 'Confections', 'Produce', 'Condiments',
            'Grains/Cereals', 'Seafood'],
        crosshair: true
    }],
    yAxis: [{ // Primary yAxis
        labels: {
            format: '${value}k',
            style: {
                color: 'Highcharts.getOptions().colors[1]'
            }
        },
        title: {
            text: 'Gross Margin',
        }
    }, { // Secondary yAxis
        title: {
            text: 'Gross Profit Margin'
        },
        labels: {
            format: '{value}%',
        },
        opposite: true
    }],

    series: [{
        name: 'Gross Margin',
        type: 'column',
        yAxis: 1,
        color: '#9a0059',
        data: [101.160, 128.8, 201.7, 224.1, 259.0, 180.4, 200.6, 130.7],
        tooltip: {
            valueSuffix: '%',
        },

    }, {
        name: 'Gross Profit Margin',
        type: 'spline',
        data: [121.160, 128.8, 221.7, 204.1, 229.0, 180.4, 200.6, 130.7],
        tooltip: {
            valueSuffix: '%'
        }
    }]
});


Highcharts.chart('bubble_chart', {

    chart: {
        type: 'bubble',
        plotBorderWidth: 1,
        zoomType: 'xy'
    },

    title: {
        text: 'Acverage Transaction Value by Month',
        align: 'left'
    },

    xAxis: {
        gridLineWidth: 1,
        accessibility: {
            rangeDescription: 'Range: 0 to 100.'
        }
    },

    yAxis: {
        startOnTick: false,
        endOnTick: false,
        accessibility: {
            rangeDescription: 'Range: 0 to 100.'
        }
    },

    series: [{

    }, {
        data: [
            [0, 38, 170],
            [6, 50, 170],
            [1, 60, 170],
            [57, 55, 170],
            [80, 65, 170],
            [11, 60, 170],
            [88, 90, 170],
            [30, 47, 49],
            [57, 62, 98],
            [4, 16, 16],
            [46, 10, 11],
            [22, 87, 89],
            [57, 91, 82],
            [45, 15, 98]
        ],
        marker: {
            fillColor: {
                radialGradient: { cx: 0.4, cy: 0.3, r: 0.7 },
                stops: [
                    // [0, 'purple'],
                    [1, '#000080']
                    // [1, Highcharts.color(Highcharts.getOptions().colors[1]).setOpacity(0.5).get('rgba')]
                ]
            }
        }
    }]

});


Highcharts.chart('multiline_and_graphs', {
    title: {
        text: 'Sales of petroleum products March, Norway',
        align: 'left'
    },
    xAxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    },
    yAxis: {
        title: {
            text: 'Sale'
        }
    },
    tooltip: {
        valuePrefix: '%',
        valueSuffix: ' Growth'
    },

    plotOptions: {
        series: {
            borderRadius: '5%'
        }
    },
    series: [
        {
            tooltip: {
                valuePrefix: '%',
                valueSuffix: ' Growth'
            },

            type: 'column',
            name: '2020',
            color: '#feef8e',
            data: [59, 83, 65, 228, 184, 203, 230, 100, 128, 320, 150, 220,]
        }, {
            type: 'column',
            name: '2021',
            color: '#9F4D71',
            data: [24, 79, 72, 240, 167, 203, 230, 100, 128, 320, 150, 220,]
        }, {
            type: 'column',
            name: '2022',
            color: '#385dbd',
            data: [58, 88, 75, 250, 176, 203, 230, 100, 128, 320, 150, 220,]
        }, {
            type: 'spline',
            name: 'Sale 2022',
            data: [267, 277, 260.66, 260.33, 260.33, 260.33, 300, 240, 280, 320, 350, 190],
            marker: {
                lineWidth: 2,
                lineColor: Highcharts.getOptions().colors[4],
                fillColor: 'white'
            }
        }, {
            type: 'spline',
            name: 'Sale 2021',
            data: [257, 257, 247.66, 359.33, 359.33, 359.33, 359.33, 380, 300, 350, 300, 230],
            // data: [199, 200.33, 240, 300.33, 230.66,300, 180, 220.66, 333.33,352],
            marker: {
                lineWidth: 2,
                lineColor: Highcharts.getOptions().colors[3],
                fillColor: 'white'
            }
        },]
});
