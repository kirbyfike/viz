(function ( $ ) {
    $.fn.USMap = function(options) {
        var defaults = {
            domElement: this
        }

        var options = $.extend(defaults,options)
        USMap.initialize(options);
        return this;
    };

    var USMap = (function($) {
        var public = {};
        var SVG_WIDTH =  700;
        var SVG_HEIGHT = 400;
        var MAP_SCALE = 700;
        var QUANTILE_RANGE = 4;
        var LEGEND_WIDTH = 20;
        var LEGEND_HEIGHT = 250;


        // public methods
        public.initialize = function(options) {
            console.log("here");
            var userTopojson = retrieveTopojson(options);

            if (isEmpty(userTopojson)) return;

            clearMap(options.domElement);
            var stateData = topojson.feature(userTopojson, userTopojson.objects.us_states).features;
            var colorQuantiles = generateColorQuantiles(stateData, options.quantitativeID);
            drawMap(options.domElement, options.quantitativeID, stateData, colorQuantiles, options.toolTip)
            drawLegend(colorQuantiles,LEGEND_WIDTH,LEGEND_HEIGHT);

        }

        function retrieveTopojson(options) {
            var data = {};

            if (options.mapTopojson && !isEmpty(options.mapTopojson)) {
                data = options.mapTopojson;
            } else if(options.topojsonUrl && options.topojsonUrl != "") {
                retrieveTopojsonFromServer(options);
            } else {
                alert("Error! Both the Topojson data and server url were empty.");
            }

            return data;
        }

        function isEmpty(ob){
            for(var i in ob){ return false; }
            return true;
        }

        function retrieveTopojsonFromServer(options) {
            var options = options;

            //setTopojsonUrlToDom(options.topojsonUrl);

            $.ajax({
                url: options.topojsonUrl,
                type: "post",
                dataType: "jsonp",
                success: function(serverData) {
                    options["mapTopojson"] = serverData;
                    options["topojsonUrl"] = "";
                    public.initialize(options);
                }
            })
        }

        function setTopojsonUrlToDom(url) {
            var appendUrl = "<script src='" + url + "' type='text/javascript'></script>";
            $("body").append(appendUrl);
        }

        function clearMap(domElement) {
            $(domElement.selector).find("svg").remove();
        }

        function drawMap(domElement, quantitativeID, stateData, colorQuantiles, toolTipOptions) {
            $(domElement.selector).append("<div class='hidden us-tooltip'><span></span></div>");

            var projection = d3.geo.albersUsa().scale(MAP_SCALE);
            var path = d3.geo.path().projection(projection);
            var svg = d3.select(domElement.selector).append("svg")
                .attr("width", SVG_WIDTH)
                .attr("height", SVG_HEIGHT);

            var g = svg.append("g")
                .attr("class", "states")
                .attr("transform", "translate(-230,-60)")
                .selectAll("path")
                .data(stateData)
                .enter().append("path")
                .attr("class", function (d) {
                    if (d.properties[quantitativeID] == 0) {
                        return "q4"
                    } else {
                        return colorQuantiles((d.properties[quantitativeID]));
                    }
                })
                .on("mouseover", function(d) {
                    var $tooltip = $(this).closest("svg").siblings(".us-tooltip");
                    var position = $(this).position();

                    if (toolTipOptions && !isEmpty(toolTipOptions)) {
                        showToolTip(position.left, position.top, $tooltip, d, toolTipOptions);
                    }
                })
                .on("mouseout", function(d) {
                    var $tooltip = $(this).closest("svg").siblings(".us-tooltip");
                    hideToolTip($tooltip);
                })
                .attr("d", path)
        }

        function hideToolTip($tooltip) {
            $(".us-tooltip").hide();
        }

        function showToolTip(x, y, $tooltip, d, toolTipOptions) {
            $tooltip.html(toolTipHtml(d, toolTipOptions));
            $tooltip.css({left: x, top: y + 100}).html(toolTipHtml(d, toolTipOptions))

            $tooltip.show();
        }

        function toolTipHtml(d, toolTipOptions) {
            var toolTipHtml = "<b>" + d.properties["state_name"] + "</b> (" + d.properties["state_code"] + ")<br><br>";

            for (key in toolTipOptions) {
                toolTipHtml += "<b>" + toolTipOptions[key] + "</b> " + d.properties[key] + "<br>"
            }

            return toolTipHtml;
        }

        function drawLegend(color_quantiles, vh, vw) {

            var width  = vw,
                height = 50,
                padding = 0,

                formatTicks = d3.format(".1f");

            var x = d3.scale.linear()
                .domain([0,d3.max(color_quantiles.domain())])
                .range([padding,width-padding]);
            vticks = color_quantiles.range().map(function(v){return color_quantiles.invertExtent(v)[1];})

            var xAxis = d3.svg.axis()
                .scale(x)
                .orient("top")
                .tickValues(vticks)
                .tickFormat(function(d){return formatTicks(d) + "%" ;})
                .tickSize(0)

            var svg = d3.select("svg")

            var g = svg.append("g")
                .attr("class", "legend")
                .attr("transform", "translate(300, 20)")

            g.selectAll("rect")
                .data(color_quantiles.range().map(function(v){return color_quantiles.invertExtent(v);}))
                .enter().append("rect")
                .attr("class",function(d){return color_quantiles(d[0])})
                .attr("height", 15)
                .attr("x", function(d) { return x(d[0]); })
                .attr("width", function(d){return x(d[1] - d[0]); })
            g.call(xAxis);
        }

        function generateColorQuantiles(stateData, quantitativeID) {
            var domain_values = stateData.map(function(d) {
                return d.properties[quantitativeID];
            });

            return d3.scale.quantile().domain(domain_values).range(d3.range(QUANTILE_RANGE).map(function(i) { return "q" + i; }));
        }

        return public;
    }(jQuery));

}( jQuery ));
