(function ( $ ) {
    $.fn.treeMap = function(options) {
        var defaults = {
            domElement: this,
            width: $(this).width(), 
            height: $(this).width()/2,
            colorValues: {},
            customShading: {}
        }
        var options = $.extend(defaults,options)
        TreeMap.initialize(options);
        return this;
    }

    var TreeMap = (function ($) {

        var public = {};
        var flarejson = {};

        // public methods
        public.initialize = function (options) {
            var userFlarejson = retrieveFlarejson(options);

            if (isEmpty(userFlarejson)) return;
            
            drawTreeMap(userFlarejson, options)
        }

        function retrieveFlarejson(options) {
            var data = {};

            if (options.flarejson && !isEmpty(options.flarejson)) {
                data = options.flarejson;
            } else if(options.flarejsonUrl && options.flarejsonUrl != "") {
                retrieveFlarejsonFromServer(options);
            } else {
                alert("Error! Both the Flarejson data and server url were empty.");
            }

            return data;
        }

        function retrieveFlarejsonFromServer(options) {
            $.ajax({
                url: options.flarejsonUrl,
                type: "post",
                dataType: "jsonp",
                success: function (serverData) {
                    options["flarejson"] = serverData;
                    options["flarejsonUrl"] = "";
                    public.initialize(options);
                }
            })
        }

        function drawTreeMap(root, options) {
          var w = options.width,
              h = options.height,
              x = d3.scale.linear().range([0, w]),
              y = d3.scale.linear().range([0, h]),
              color = d3.scale.category20c(),
              root,
              node;

          var treemap = d3.layout.treemap()
              .round(false)
              .size([w, h])
              .sticky(true)
              .value(function(d) { 
                return d.size; });

          var svg = d3.select(options.domElement.selector).append("div")
              .attr("class", "chart")
              .style("width", w + "px")
              .style("height", h + "px")
            .append("svg:svg")
              .attr("width", w)
              .attr("height", h)
            .append("svg:g")
              .attr("transform", "translate(.5,.5)");
            drawZoom(root);

          function drawZoom(data) {
            var tooltip = d3.select(options.domElement.selector + " .qc-tooltip");

            node = root = data;

            var nodes = treemap.nodes(root)
                .filter(function(d) { return !d.children; });

            var cell = svg.selectAll("g")
                .data(nodes)
              .enter().append("svg:g")
                .attr("class", "cell")
                .attr("transform", function(d) { 
                  return "translate(" + d.x + "," + d.y + ")"; })
                .on("click", function(d) { return zoom(node == d.parent ? root : d.parent); });

            cell.append("svg:rect")
                .attr("width", function(d) { 
                  var width = d.dx -1;
                  return (width < 0) ? 0 : width; })
                .attr("height", function(d) { 
                  var height = d.dy - 1; 
                  return (height < 0) ? 0 : height; })
                .style("fill", function(d) {
                  var colorValue = "#000000";
                  
                  if (!$.isEmptyObject(options.colorValues)) {
                    colorValue = "#" + options.colorValues[d.parent.name][d.name][0];
                  } else if(!$.isEmptyObject(options.customShading)) {
                    colorValue = shadeColor(color(d.parent.name), options.customShading[d.name]);
                  } else {
                    colorValue = color(d.parent.name);
                  }
                  return colorValue;
                })
                .on("mouseover",function(d) {
                    var parentSelector = options.domElement.selector;

                    var emoticon = {
                      Unsat: ["frown", "Unsat", "unsat"], 
                      HighRisk: ["frown", "High Risk", "high-risk"], 
                      LowRisk: ["meh", "Low Risk", "low-risk"]
                    };

                    d3.select(parentSelector + " .dept").html(d.department);
                    d3.select(parentSelector + " .audit-name").html(d.audit_name);
                    d3.select(parentSelector + " .audit-date").html(d.month + " " + d.year);
                    d3.select(parentSelector + " .upb-value").html(format(d.count));
                    d3.select(parentSelector + " .trend-value-positive").html("");
                    d3.select(parentSelector + " .trend-value-negative").html("");

                    var findingHtml = "<span class='finding-level'>" + emoticon[d.name][1] + "</span> ";
                    findingHtml += "<i class='fa fa-" + emoticon[d.name][0] + "-o'></i>";
                    d3.select(options.domElement.selector + " .finding-holder")
                    .classed("unsat", false)
                    .classed("high-risk", false)
                    .classed("low-risk", false)
                    .classed(emoticon[d.name][2], true)
                    .html(findingHtml);

                    if (d.trend > 0) {
                      d3.select(parentSelector + " .trend-value-positive").html("+" + d.trend + "%");
                    } else {
                      d3.select(parentSelector + " .trend-value-negative").html(d.trend + "%");
                    }

                    showTooltip(d3, this, d);
                })
                .on("mouseout",function(d) {
                    var el = d3.select(this);
                    el.style("stroke-width",1);
                    tooltip.style('display','none');
                })

               function showTooltip(d3, rect, d) {
                 var el = d3.select(rect);
                 var xpos = $(rect).position().left + el.attr("width")/2 + 8;
                 var ypos = $(rect).position().top - 5;

                 el.style("stroke-width",3);
                 tooltip.style("top", ypos + "px").style("left", xpos + "px").style("display","block");
               }
            cell.append("svg:text")
                .attr("x", function(d) { return d.dx / 2; })
                .attr("y", function(d) { return d.dy / 2; })
                .attr("dy", ".35em")
                .attr("fill", function(d) {
                  return "#000000";
                })
                .attr("font-size", function(d) {
                  var width = d.dx -1;
                  var height = d.dy - 1; 

                  var fontSize = "12";

                  if (width < 30 || height < 20) {
                    fontSize = "0";
                  } else if (width < 60 && height > 20) {
                    fontSize = "8";
                  } else if (width > 60 && height > 30) {
                    fontSize = "9";
                  } else {
                    fontSize = "10";
                  }

                  return fontSize + "px";
                })
                .attr("text-anchor", "middle")
                .text(function(d) { 
                  return d.name; 
                })
                .style("opacity", function(d) { 
                  d.w = this.getComputedTextLength(); 
                  var width = d.dx -1;
                  var height = d.dy - 1; 
                  //return (width > 60 && height > 30) ? 1 : 0; 
                  return 1;
                 });

            d3.select(window).on("click", function() { zoom(root); });

            d3.selectAll(options.domElement.selector + " .tree-map-input").on("change", function change() {
              treemap.value(this.value == "size" ? size : count).nodes(root);
              zoom(node);
            });
          }

          function size(d) {
            return d.size;
          }

          function count(d) {
            return d.count;
          }

          function zoom(d) {
            var kx = w / d.dx, ky = h / d.dy;
            x.domain([d.x, d.x + d.dx]);
            y.domain([d.y, d.y + d.dy]);

            var t = svg.selectAll("g.cell").transition()
                .duration(d3.event.altKey ? 7500 : 750)
                .attr("transform", function(d) { return "translate(" + x(d.x) + "," + y(d.y) + ")"; });

            t.select("rect")
                .attr("width", function(d) { 
                  var width = kx * d.dx -1;
                  return (width < 0) ? 0 : width; })
                .attr("height", function(d) { 
                  var height = ky * d.dy -1;
                  return (height < 0) ? 0 : height; })

            t.select("text")
                .attr("x", function(d) { return kx * d.dx / 2; })
                .attr("y", function(d) { return ky * d.dy / 2; })
                .style("opacity", function(d) { return kx * d.dx > d.w ? 1 : 0; });

            node = d;
            d3.event.stopPropagation();
          }
        }

        function isEmpty(ob){
            for(var i in ob){ return false; }
            return true;
        }
        
        function format(number) {
          var number = number.toString(),
              dollars = number.split('.')[0],
              cents = (number.split('.')[1] || '') +'00';
              dollars = dollars.split('').reverse().join('')
              .replace(/(\d{3}(?!$))/g, '$1,')
              .split('').reverse().join('');
          return '$' + dollars
        }

        function drawLegend(colorValues) {
          var $colorTable = $("#viz1");
          var rowHTML = "<table class='qc-color-table'><thead><tr>";
          rowHTML += "<th>Dept</th>";
          rowHTML += "<th>Unsat</th>";
          rowHTML += "<th>High Risk</th>";
          rowHTML += "<th>Low Risk</th>";
          rowHTML += "</tr></thead>";
          rowHTML += "<tbody>";
        
          for(i in colorValues) {
            rowHTML += "<tr>";
            rowHTML += "<td class='firsties'>" + i + "</td>";
            rowHTML += "<td><div class='color-block' style='background-color: #" + colorValues[i].UnsatTrend[0] + "'></div>";
            rowHTML += "<td><div class='color-block' style='background-color: #" + colorValues[i].HighRiskTrend[0] + "'></div>";
            rowHTML += "<td><div class='color-block' style='background-color: #" + colorValues[i].LowRiskTrend[0] + "'></div>";
            rowHTML += "</tr>";
          }
        
          rowHTML += "</tbody></table>";
          $colorTable.append(rowHTML);
        }

        function shadeColor(color, percent) {   
          var num = parseInt(color.slice(1),16), amt = Math.round(2.55 * percent), R = (num >> 16) + amt, G = (num >> 8 & 0x00FF) + amt, B = (num & 0x0000FF) + amt;
          return "#" + (0x1000000 + (R<255?R<1?0:R:255)*0x10000 + (G<255?G<1?0:G:255)*0x100 + (B<255?B<1?0:B:255)).toString(16).slice(1);
        }
        return public;
    }(jQuery));

}( jQuery ));
