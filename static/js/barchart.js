var render;

render = function(data, user_options) {
  var barHeight, barLabel, barLabelPadding, barLabelWidth, barValue, barsContainer, chart, gridChartOffset, gridContainer, gridLabelHeight, labelsContainer, maxBarWidth, options, sortedData, valueLabelWidth, x, y, yScale, yText;
  options = $.extend({}, {
    "kName": "k",
    'vName': 'v',
    'container': '#chart'
  }, user_options);
  valueLabelWidth = 40;
  barHeight = 20;
  barLabelWidth = 100;
  barLabelPadding = 5;
  gridLabelHeight = 18;
  gridChartOffset = 3;
  maxBarWidth = 220;
  barLabel = function(d) {
    return d[options.kName];
  };
  barValue = function(d) {
    return parseFloat(d[options.vName]);
  };
  sortedData = data.sort(function(a, b) {
    return d3.descending(barValue(a), barValue(b));
  });
  yScale = d3.scale.ordinal().domain(d3.range(0, sortedData.length)).rangeBands([0, sortedData.length * barHeight]);
  y = function(d, i) {
    return yScale(i);
  };
  yText = function(d, i) {
    return y(d, i) + yScale.rangeBand() / 2;
  };
  x = d3.scale.linear().domain([0, d3.max(sortedData, barValue)]).range([0, maxBarWidth]);
  chart = d3.select(options.container).append("svg").attr('width', maxBarWidth + barLabelWidth + valueLabelWidth).attr('height', gridLabelHeight + gridChartOffset + sortedData.length * barHeight);
  gridContainer = chart.append('g').attr('transform', 'translate(' + barLabelWidth + ',' + gridLabelHeight + ')');
  gridContainer.selectAll("text").data(x.ticks(10)).enter().append("text").attr("x", x).attr("dy", -3).attr("text-anchor", "middle").text(String);
  gridContainer.selectAll("line").data(x.ticks(10)).enter().append("line").attr("x1", x).attr("x2", x).attr("y1", 0).attr("y2", yScale.rangeExtent()[1] + gridChartOffset).style("stroke", "#ccc");
  labelsContainer = chart.append('g').attr('transform', 'translate(' + (barLabelWidth - barLabelPadding) + ',' + (gridLabelHeight + gridChartOffset) + ')');
  labelsContainer.selectAll('text').data(sortedData).enter().append('text').attr('y', yText).attr('stroke', 'none').attr('fill', 'black').attr("dy", ".35em").attr('text-anchor', 'end').text(barLabel);
  barsContainer = chart.append('g').attr('transform', 'translate(' + barLabelWidth + ',' + (gridLabelHeight + gridChartOffset) + ')');
  barsContainer.selectAll("rect").data(sortedData).enter().append("rect").attr('y', y).attr('height', yScale.rangeBand()).attr('width', function(d) {
    return x(barValue(d));
  }).attr('stroke', 'white').attr('fill', 'steelblue');
  barsContainer.selectAll("text").data(sortedData).enter().append("text").attr("x", function(d) {
    return x(barValue(d));
  }).attr("y", yText).attr("dx", 3).attr("dy", ".35em").attr("text-anchor", "start").attr("fill", "black").attr("stroke", "none").text(function(d) {
    return d3.round(barValue(d), 2);
  });
  barsContainer.append("line").attr("y1", -gridChartOffset).attr("y2", yScale.rangeExtent()[1] + gridChartOffset).style("stroke", "#000");
};

if (typeof define === "undefined" || define === null) {
  return;
}

define(['d3'], function(d3) {
  return {
    'render': render
  };
});
