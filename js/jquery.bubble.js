(function ( $ ) {
    $.fn.bubble = function(options) {
        var defaults = {
            domElement: this,
            diameter: $(this).width()
        }

        var options = $.extend(defaults,options)
        Bubble.initialize(options);
        return this;
    };

    var Bubble = (function ($) {

        var public = {};
        var flarejson = {};

        // public methods
        public.initialize = function (options) {
            $('.tooltip').remove();
            var userFlarejson = retrieveFlarejson(options);

            if (isEmpty(userFlarejson)) return;
            
            drawBubble(userFlarejson, options)
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
                    drawBubble(flarejson,options);
                }
            })
        }

        function drawBubble(root,options){
            var diameter = options.diameter,
                format = d3.format(",d"),
                color = d3.scale.category20c();

            var tooltip = d3.select("body")
                .append("div")
                .attr("class","tooltip")
                .style("position", "absolute")
                .style("z-index", "10")
                .style("display", "none")


            var bubble = d3.layout.pack()
                .sort(null)
                .size([diameter, diameter])
                .padding(1.5);

            var svg = d3.select(options.domElement.selector).append("svg")
                .attr("width", diameter)
                .attr("height", diameter)
                .attr("class", "bubble");

            var node = svg.selectAll(".node")
                .data(bubble.nodes(classes(root))
                    .filter(function(d) { return !d.children; }))
                .enter().append("g")
                .attr("class", "node")
                .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });


            node.append("circle")
                .attr("r", function(d) { return d.r; })
                .style("fill", function(d) { return color(d.packageName); })
                .on("click", function(d){
                    $(options.domElement.selector + " g circle").css("stroke-width", "0px");
                    d3.select(this).style("stroke-width",4).style("stroke", "green");
                    tooltip.html("Category: " + d.className + "<br>" +
                        "Investor: " +  d.packageName + "<br> " +
                        "Amount: " + d.value.formatMoney(d)
                    );
                    tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px").style("display","block");

                })

            node.append("text")
                .attr("dy", ".3em")
                .style("text-anchor", "middle")
                .text(function(d) { return d.className.substring(0, d.r / 3); });


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

    Number.prototype.formatMoney = function(c, d, t){
        var n = this,
            c = isNaN(c = Math.abs(c)) ? 2 : c,
            d = d == undefined ? "." : d,
            t = t == undefined ? "," : t,
            s = n < 0 ? "-" : "",
            i = parseInt(n = Math.abs(+n || 0).toFixed(c)) + "",
            j = (j = i.length) > 3 ? j % 3 : 0;
        return s + (j ? i.substr(0, j) + t : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : "");
    };
}( jQuery ));
