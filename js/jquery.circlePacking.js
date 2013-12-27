(function ( $ ) {
    $.fn.circlePacking = function(options) {
        var defaults = {
            domElement: this,
            diameter: $(this).width()
        }

        var options = $.extend(defaults,options)

        CirclePacking.initialize(options);
        return this;
    };

    var CirclePacking = (function ($) {

        var public = {};
        var flarejson = {};

        // public methods
        public.initialize = function (options) {
            var userFlarejson = retrieveFlarejson(options);

            if (isEmpty(userFlarejson)) return;
            
            drawPacking(userFlarejson, options)
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
                url: "http://localhost:3001/1/delinquency/investors/tree_maps/upb.json",
                type: "post",
                dataType: "jsonp",
                success: function (serverData) {
                    flarejson = serverData;
                    drawPacking(flarejson,options);
                }
            })
        }

        function drawPacking(root,options) {
            var tooltip = d3.select("body")
                .append("div")
                .attr("class","tooltip")
                .style("position", "absolute")
                .style("z-index", "10")

            var diameter = options.diameter,
                format = d3.format(",d");

            var pack = d3.layout.pack()
                .size([diameter - 4, diameter - 4])
                .value(function(d) { return d.size; });

            var svg = d3.select(options.domElement.selector).append("svg")
                .attr("width", diameter)
                .attr("height", diameter)
                .append("g")
                .attr("transform", "translate(2,2)");


            var node = svg.datum(root).selectAll("#container_circlepacking .node")
                .data(pack.nodes)
                .enter().append("g")
                .attr("class", function(d) { return d.children ? "node" : "leaf node_" + d.parent.name; })
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });


            node.append("circle")
                .attr("r", function(d) { return d.r; })
                .on("click", function(d){
                    $(options.domElement.selector + " circle").css("stroke-width", "0px")
                    d3.select(this).style("stroke-width",4).style("stroke", "green");
                    var name;
                    if (d.children ) {
                        if (d.name == "flare") {
                            name = "Total Portfolio";
                        }else{
                            name = d.name;
                        }
                        tooltip.html(
                            "Investor: " + name + "<br> " +
                            "Total Invested: " + d.value.formatMoney(d)
                        );

                    }else {
                        tooltip.html("Category: " + d.name + "<br>" +
                                     "Amount: " + d.value.formatMoney(d)
                        );


                    }
                    tooltip.style("top", (event.pageY-5)+"px").style("left",(event.pageX+10)+"px").style("display","block");
                })


            node.filter(function(d) { return !d.children; }).append("text")
                .attr("dy", ".3em")
                .style("text-anchor", "middle")
                .text(function(d) { return d.name.substring(0, d.r / 3); });
        }

        // Returns a flattened hierarchy containing all leaf nodes under the root.
        function classes(root) {
            var classes = [];

            function recurse(name, node) {
                if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
                else classes.push({packageName: name, className: node.name, value: node.size});
            }

            recurse(null, root);
            return {children: classes};
        }

        function isEmpty(ob){
            for(var i in ob){ return false; }
            return true;
        }
        return public;
    }(jQuery));

}( jQuery ));
