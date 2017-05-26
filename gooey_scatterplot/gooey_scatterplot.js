//////// -- -- -- SETUP -- -- -- //
var delay = 300,
		duration = 1000;

var nRadius = 10,
		cRadius = 40;

var opacityMid = 0.8,
		opacityLow = 0.3;

var margin = { top: 10, right: 30, bottom: 50, left: 50 },
    width = 800 - margin.left - margin.right,
    height = 350 - margin.top - margin.bottom;

var svg = d3.select('#chart').append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
  .append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

var defs = svg.append('defs');

//////// -- -- -- DATA -- -- -- //
var n = 60,
		c = 6;

var clusters = new Array(c);
var nodes = d3.range(n).map(function() {
  var i = Math.floor(Math.random() * c),
      d = {
        cluster: i,
        x: d3.randomUniform(10, 90)(),
        y: d3.randomUniform(10, 90)(),
				r: nRadius,
				type: 'node'
      };
  if (!clusters[i]) clusters[i] = { cluster: i, x: d3.randomUniform(25, 75)(), y: d3.randomUniform(25, 75)(), r: cRadius, type: 'cluster' }
  return d;
});

nodes = nodes.concat(clusters);

var nestNodes = d3.nest()
    .key(function(d) { return d.cluster; })
    .entries(nodes);


//////// -- -- -- SCALES -- -- -- //
var xScale = d3.scaleLinear().domain([0, 100]).range([margin.left, width]);
var yScale = d3.scaleLinear().domain([0, 100]).range([height, margin.top]);
var colorScale =  d3.scaleOrdinal(d3.schemeDark2);


//////// -- -- -- AXIS -- -- -- //
svg.append('g')
	.attr('class', 'x axis')
	.attr('transform', 'translate(' + 0 + ',' + height + ')')
	.call(d3.axisBottom(xScale));

svg.append('g')
	.attr('class', 'y axis')
	.attr('transform', 'translate(' + margin.left + ',' + 0 + ')')
	.call(d3.axisLeft(yScale));


//////// -- -- -- FILTERS -- -- -- //
// To avoid the cluster bubbles merging
// Create a filter and a group for each cluster
defs.selectAll('.filter')
		.data(nestNodes)
		.enter()
		.append('filter')
		.attr('class', 'filter')
		.attr('id', function(d) { return 'gooey' + d.key; });

// code taken from @nbremer tutorial
// https://www.visualcinnamon.com/2016/06/fun-data-visualizations-svg-gooey-effect.html 
var onValues = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -5',
		offValues = '1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 6 -5';
var filters = defs.selectAll('.filter');
filters.append('feGaussianBlur')
	.attr('in','SourceGraphic')
	.attr('stdDeviation','10')
	.attr('color-interpolation-filters','sRGB') 
	.attr('result','blur');
filters.append('feColorMatrix')
	.attr('class','blurValues')
	.attr('in','blur')
	.attr('mode','matrix')
	.attr('values', offValues)
	.attr('result','gooey');
filters.append('feBlend')
	.attr('in','SourceGraphic')
	.attr('in2','gooey')
	.attr('operator','atop');



//////// -- -- -- DRAWERS -- -- -- //
// Enter the groups and assign the filters
svg.selectAll('g.clusters')
	.data(nestNodes)
	.enter()
	.append('g')
	.attr('class', function(d) { return 'clusters cluster' + d.key; })
	.style('filter', function(d) { return 'url(#gooey' + d.key + ')'; });

var gClusters = svg.selectAll('g.clusters');

// Enter the circles (still undefined cx and cy)
gClusters.selectAll('circle')
		.data(function(d) { return d.values; })
		.enter()
	.append('circle')
		.attr('class', function(d) { return d.type; })
    .attr('r', function(d) { return d.r; })
    .style('fill', function(d) { return colorScale(d.cluster); });


var renderBubbles = {};
renderBubbles.grouped = function () {
	// for the first load: place the circles in their original place (ungrouped mode)
	gClusters.selectAll('circle')
		.attr('cx', function(d, i) { return xScale(d.x); })
		.attr('cy', function(d, i) { return yScale(d.y); })
		.style('opacity', opacityMid);
	gClusters.selectAll('.cluster')
		.style('opacity', opacityLow);

	//// init the 'grouped' transition
	// Activate the color matrix filter (melts the close bubbles)
	d3.selectAll('.blurValues')
		.transition()
		.duration(duration)
  	.delay(function(d, i) { return d.key * delay; })
		.attrTween('values', function() {
			return d3.interpolateString(offValues, onValues); 
		});

	// Turn on the cluster circles opacity
	gClusters.selectAll('.cluster')
  	.transition()
		.duration(duration)
  	.delay(function(d, i) { return d.cluster * delay; })
		.style('opacity', 1);

	
	// Move the nodes to their clusters positions
  gClusters.selectAll('.node')
  	.transition()
		.duration(duration)
  	.delay(function(d, i) { return d.cluster * delay; })
  	.ease(d3.easeExpIn)
  	.style('opacity', 1)
  	.attr('r', function(d) { return d.r; })
  	.attr('cx', function(d, i) { var cluster = findCluster(nodes, d.cluster); return xScale(cluster.x); })
    .attr('cy', function(d, i) { var cluster = findCluster(nodes, d.cluster); return yScale(cluster.y); });
}

renderBubbles.ungrouped = function () {
	// for the first load: place the circles in their original place (grouped mode)
	gClusters.selectAll('circle')
		.attr('cx', function(d, i) { var cluster = findCluster(nodes, d.cluster); return xScale(cluster.x); })
    .attr('cy', function(d, i) { var cluster = findCluster(nodes, d.cluster); return yScale(cluster.y); })
    .style('opacity', 1);

	//// init the 'grouped' transition
	// Move the nodes to their original positions
  gClusters.selectAll('.node')
  	.transition()
		.duration(duration)
  	.delay(function(d, i) { return d.cluster * delay; })
  	.ease(d3.easeExpOut)
  	.attr('r', function(d) { return d.r - 2; })
  	.style('opacity', opacityMid)
  	.attr('cx', function(d, i) { return xScale(d.x); })
   	.attr('cy', function(d, i) { return yScale(d.y); });

  // Turn off the cluster circles opacity
	gClusters.selectAll('.cluster')
  	.transition()
		.duration(duration)
  	.delay(function(d, i) { return d.cluster * delay; })
		.style('opacity', opacityLow);

	// De-activate the color matrix filter (melts the close bubbles)
	d3.selectAll('.blurValues')
		.transition()
		.duration(duration)
  	.delay(function(d, i) { return d.key * delay; })
		.attrTween('values', function() {
			return d3.interpolateString(onValues, offValues); 
		});
}

// Render thr bubbles
renderBubbles.grouped()


//////// -- -- -- FUNCTIONS -- -- -- //
function findCluster(data, cluster) {
	return data.find(function(d) { return d.type == 'cluster' && d.cluster == cluster; });
}

//////// -- -- -- INTERACTION -- -- -- //
var buttons = d3.selectAll('button');
d3.selectAll('button')
	.on('click', function() { 
		if (d3.event.target.classList.contains('selected')) return;
		renderBubbles[d3.event.target.value](); 
		buttons.each(function() { this.classList.toggle('selected') });
	});