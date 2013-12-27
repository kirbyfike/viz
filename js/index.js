$(document).ready(function(){
  retrieveFlare();
  retrieveMapData();

  $('input:radio').change(function(){
    var showID = $(this).val()
    $('.containers').hide()
    $("#" + showID).show()
  });  
})

function retrieveFlare() {
    $.ajax({
        url: "http://localhost:3001/1/delinquency/investors/tree_maps/upb.json",
        type: "post",
        dataType: "jsonp",
        success: function (serverData) {
            drawViz(serverData);
            drawTreeMap(serverData);
        }
    })
}

function retrieveMapData() {
  drawMap();
}

function drawTreeMap(data) {
  var treeMapValue = $("input[name=tree]:checked").val();

  $("#container_treemap").treeMap({width: 880, flarejson: data, filterName: treeMapValue});
}

function drawMap(api_topo_json) {
  var options = {
    topojsonUrl: "http://localhost:3001/1/delinquency/maps/us.json",
    quantitativeID: "delinquent_60_days_rate",
    toolTip: {
      delinquent_30_days_upb: "Delinquent UPB",
      delinquent_loan_count: "Delinquent Count",
      delinquent_30_days_rate: "Delinquent Rate"
    }
  }

  $("#map-container").USMap(options);
}

function drawViz(serverData) {
  $("#container_bubble").bubble({flarejson: serverData});
  $("#container_circlepacking").circlePacking({flarejson: serverData});
}
;
