var chartWidth = parseInt(d3.select('#stacked').style('width'), 10);

var margin = {top: 50, right: 100, bottom: 150, left: 100},
    width = chartWidth - margin.left - margin.right,
    height = (chartWidth / 2) - margin.top - margin.bottom;

var formatPercent = d3.format("%");
var titleSize = '180%';
var tableLabels = ['Type', 'Total', 'Percentage'];
var xDivisors = [0, .3, .4, .5, 1],
    yDivisors = [0, .1, .25, .35, 1];

var x = d3.scale.linear(),
    y = d3.scale.ordinal(),
    color = d3.scale.ordinal();

var tooltip = d3.select("body").append("div")
    .attr("class", "stacked_tooltip")
    .style("opacity", 0);

var svg = d3.select('#stacked').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

var svgStacked =  svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
    .attr('class', 'table');

d3.json('activities.json', function(error, jsonData) {
  if (error) throw error;

  var data = jsonData.data;
      breadcrumb = jsonData.breadcrumb.join(' / '),
      scopes = jsonData.data.map(function(d) { return d.scope; }),
      pices = [],
      colors = [],
      picesLabels = [];

  // Get colors and labels for the legend
  for (var pice in jsonData.legend) {
    colors.push(jsonData.legend[pice].color)
    picesLabels.push(jsonData.legend[pice].text)
  }


  // Calculate the data for the table figures
  var nestedData = [],
      total;
  jsonData.data.forEach(function(d, i) {
    var rObj = {},
        sum = 0;
    for (var prop in d.pices) {
      sum += parseFloat(d.pices[prop])
      if (i == 0) {
        pices.push(prop)
      }
    }
    
    if (d.scope == "All") {
      total = sum;
    }
    
    rObj['scope'] = d.scope;
    rObj['total'] = sum;
    rObj['percentage'] = sum / total;
    nestedData.push(rObj);
  });

  // Calculate the 'stacked' lengths
  data.forEach(function(d) {
    var x0 = 0;
    d.plotPices = pices.map(function(name, i) { return {name: name, x0: x0, x1: x0 += +d.pices[name], value: d.pices[name], label: picesLabels[i]}; });
    d.total = d.plotPices[d.plotPices.length - 1].x1;
  });

  // Define the scales

  x.domain([0, d3.max(data, function(d) { return d.total; })])
    .range([xDivisors[3], xDivisors[3] * width])
  
  y.domain(scopes)
    .rangeRoundBands([0, height * (yDivisors[4] - yDivisors[3])], .1);

  color.domain(pices)
    .range(colors);

  // Add svg
  svgStacked.selectAll('.title')
    .data([jsonData.title])
    .enter()
    .append('text')
    .attr('class', 'title')
    .attr('x', 0)
    .attr('y', 0)
    .style('font-size', titleSize)
    .text(function(d) { return d; });

  svgStacked.selectAll('.breadcrumb')
    .data([breadcrumb])
    .enter()
    .append('text')
    .attr('class', 'breadcrumb')
    .attr('x', 0)
    .attr('y', (yDivisors[1] * height) + 'px')
    .style('fill', '#707070')
    .style('font-size', '120%')
    .text(function(d) { return d; })

  var tableHeader = svgStacked.append('g')
    .attr('class', 'tableHeader')
    .attr('transform', 'translate(0,' + (yDivisors[2] * height) + ')');

  tableHeader.selectAll('tableLabels')
    .data(tableLabels)
    .enter()
    .append('text')
    .attr('x', function(d, i) { return xDivisors[i] * width; })
    .attr('y', 0)
    .text(function(d) { return d; });

  tableHeader
    .append('line')
    .attr('x1', 0)
    .attr('y1', 10)
    .attr('x2', width)
    .attr('y2', 10)
    .attr('stroke', 'black')
    .attr('stroke-width', '1px');

  var tableChart = svgStacked.append('g')
    .attr('class', 'tableChart')
    .attr('transform', 'translate(0,' + (yDivisors[3] * height) + ')');

  var type = tableChart.append('g')
    .attr('class', 'type');

  var total = tableChart.append('g')
    .attr('class', 'total')
    .attr('transform', 'translate(' + (xDivisors[1] * width) + ',0)');

  var percentage = tableChart.append('g')
    .attr('class', 'percentage')
    .attr('transform', 'translate(' + (xDivisors[2] * width) + ',0)');

  var chart = tableChart.append('g')
    .attr('class', 'chart')
    .attr('transform', 'translate(' + (xDivisors[3] * width) + ',0)');

  type.selectAll('text')
    .data(scopes)
    .enter()
    .append('text')
    .attr('x', 0)
    .attr('y', function(d, i) { return y(d); })
    .attr('dy', y.rangeBand()/5)
    .text(function(d) { return d; });

  total.selectAll('text')
    .data(nestedData)
    .enter()
    .append('text')
    .attr('x', 0)
    .attr('y', function(d, i) { return y(d.scope); })
    .attr('dy', y.rangeBand()/5)
    .text(function(d) { return d.total ; });

  percentage.selectAll('text')
    .data(nestedData)
    .enter()
    .append('text')
    .attr('x', 0)
    .attr('y', function(d, i) { return y(d.scope); })
    .attr('dy', y.rangeBand()/5)
    .text(function(d) { return formatPercent(d.percentage) ; })

  // Draw the chart:
  // a group for each scope

  var scope = chart.selectAll(".scope")
      .data(data)
    .enter().append("g")
      .attr("class", function(d) { return "g scope " + normalize(d.scope); })
      .attr("transform", function(d) { return "translate(0," + (y(d.scope) - y.rangeBand()/2) + ")"; });

  // and inside each group
  scope.selectAll("rect")
      .data(function(d) { return d.plotPices; })
    .enter().append("rect")
      .attr('class', function(d, i) { return 'bar ' + d.name; })
      .attr("height", y.rangeBand())
      .attr("x", function(d) { return x(d.x0); })
      .attr("width", function(d) { return x(d.x1) - x(d.x0); })
      .style("fill", function(d) { return color(d.name); })
      .style('stroke', 'white')
      .on('mouseover', function(d) {
        var thisData = d3.select(this).data()[0];
        var thisClass = this.classList;

        d3.selectAll('.bar')
          .filter(function(d) { return d.name != thisClass[1]; })
          .transition()
          .duration(200)
          .style('opacity', .5)

        tooltip.transition()
          .duration(500)
          .style("opacity", .8);

        tooltip.html(thisData.label + '<br><strong>' + thisData.value + '</strong> activities')
          .style("left", (d3.event.pageX - 45) + "px")
          .style("top", (d3.event.pageY - 80) + "px"); 
        })
      .on('mouseout', function(d) {
        d3.selectAll('.bar')
          .transition()
          .duration(500)
          .style('opacity', 1);
          
        tooltip.transition()
          .duration(500)
          .style("opacity", 0);
        })


  // Add the legend
  svg.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + margin.left + ',' + (height + (margin.top * 1.5)) + ')');

  var legend = d3.legend.color()
      .shapePadding(10)
      .shapeHeight(15)
      .shapeWidth(15)
      .scale(color)
      .labels(picesLabels);

svg.select(".legend")
      .call(legend);

});

var normalize = (function() {
  var from = "ÃÀÁÄÂÈÉËÊÌÍÏÎÒÓÖÔÙÚÜÛãàáäâèéëêìíïîòóöôùúüûÑñÇç ", 
      to   = "AAAAAEEEEIIIIOOOOUUUUaaaaaeeeeiiiioooouuuunncc_",
      mapping = {};
 
  for(var i = 0, j = from.length; i < j; i++ )
      mapping[ from.charAt( i ) ] = to.charAt( i );
 
  return function( str ) {
      var ret = [];
      for( var i = 0, j = str.length; i < j; i++ ) {
          var c = str.charAt( i );
          if( mapping.hasOwnProperty( str.charAt( i ) ) )
              ret.push( mapping[ c ] );
          else
              ret.push( c );
      }      
      return ret.join( '' ).toLowerCase();
  }
 
})();