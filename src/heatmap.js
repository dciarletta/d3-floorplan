//
//   Copyright 2012 David Ciarletta
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//

d3.floorplan.heatmap = function() {
	var colors = "RdYlBu",
	scaleType = "quantile",
	x = d3.scale.linear(),
	y = d3.scale.linear(),
	line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); }),
	format = d3.format(".4n"),
	id = "fp-heatmap-" + new Date().valueOf(),
	name = "heatmap";

	function heatmap(g) {
		g.each(function(data) {
			if (! data || ! data.map) return;
			var g = d3.select(this);
			
			if (! data.units) {
				data.units = "";
			} else if (data.units.charAt(0) != ' ') {
				data.units = " " + data.units;
			}

			var values = data.map.map(function(d) {return d.value;})
							.sort(d3.ascending),
				colorScale, thresholds;
			
			switch (scaleType) {
			  case "quantile": {
				colorScale = d3.scale.quantile()
							.range([1,2,3,4,5,6])
							.domain(values);
				thresholds = colorScale.quantiles();
				break;
			  }
			  case "quantized": {
				colorScale = d3.scale.quantize()
							.range([1,2,3,4,5,6])
							.domain([values[0],values[values.length-1]]);
				var incr = (colorScale.domain()[1] - colorScale.domain()[0]) 
							/ 6;
				thresholds = [incr, 2*incr, 3*incr, 4*incr, 5*incr];
				break;
			  } 
			  case "normal": {
				var mean = d3.mean(values);
				var sigma = Math.sqrt(d3.sum(values, 
						function(v) {return Math.pow(v-mean,2);})
						/values.length);
				colorScale = d3.scale.quantile()
							.range([1,2,3,4,5,6])
							.domain([mean-6*sigma,mean-2*sigma,
							         mean-sigma,mean,mean+sigma,
							         mean+2*sigma,mean+6*sigma]);
				thresholds = colorScale.quantiles();
				break;
			  } 
			  default: { // custom
				if (! customThresholds) customThresholds = thresholds;
				var domain = customThresholds;
				domain.push(domain[domain.length-1]);
				domain.unshift(domain[0]);
				colorScale = d3.scale.quantile()
							.range([1,2,3,4,5,6])
							.domain(domain);
				customThresholds = thresholds = colorScale.quantiles();
				break;
			  }
			}
			
			// setup container for visualization
			var vis = g.selectAll("g.heatmap").data([0]);
			vis.enter().append("g").attr("class","heatmap");
			
			if (this.__colors__ && this.__colors__ != colors) {
				vis.classed(this.__colors__, false);
			}
			vis.classed(colors, true);
			this.__colors__ = colors;
				
			var cells = vis.selectAll("rect")
				.data(data.map.filter(function(d) { return ! d.points; }), 
						function(d){return d.x + "," + d.y;}),
			cellsEnter = cells.enter().append("rect").style("opacity", 1e-6);
			
			cells.exit().transition().style("opacity", 1e-6).remove();
			
			cellsEnter.append("title");
			
			cells.attr("x", function(d) { return x(d.x); })
			.attr("y", function(d) { return y(d.y); })
			.attr("height", Math.abs(y(data.binSize) - y(0)))
			.attr("width", Math.abs(x(data.binSize) - x(0)))
			.attr("class", function(d) { return "d6-"+colorScale(d.value); })
				.select("title")
		  		.text(function(d) { 
		  			return "value: " + format(d.value) + data.units; 
		  		});
			
			cellsEnter.transition().style("opacity", 0.6);
			
			var areas = vis.selectAll("path")
				.data(data.map.filter(function(d) { return d.points; }), 
						function(d) { return JSON.stringify(d.points); }),
			areasEnter = areas.enter().append("path")
			.attr("d", function(d) { return line(d.points) + "Z"; })
			.style("opacity", 1e-6);
			
			areas.exit().transition().style("opacity", 1e-6).remove();
			areasEnter.append("title");
			
			areas
			.attr("class", function(d) { return "d6-"+colorScale(d.value); })
				.select("title")
					.text(function(d) { 
						return "value: " + format(d.value) + data.units; 
					});
			areasEnter.transition().style("opacity",0.6);
		
			var areaLabels = vis.selectAll("text")
				.data(data.map.filter(function(d) { return d.points; }), 
						function(d) { return JSON.stringify(d.points); }),
			areaLabelsEnter = areaLabels.enter().append("text")
								.style("font-weight", "bold")
								.attr("text-anchor", "middle")
								.style("opacity",1e-6);
			
			areaLabels.exit().transition().style("opacity",1e-6).remove();
			
			areaLabels.attr("transform", function(d) { 
					var center = {x:0,y:0};
					var area = 0;
					for (var i=0; i<d.points.length; ++i) {
						var p1 = d.points[i];
						var p2 = d.points[i+1] || d.points[0];
						var ai = (p1.x*p2.y - p2.x*p1.y);
						center.x += (p1.x + p2.x)*ai;
						center.y += (p1.y + p2.y)*ai;
						area += ai;
					}
					area = area / 2;
					center.x = center.x/(6*area);
					center.y = center.y/(6*area);
					return "translate(" + x(center.x) + "," 
										+ y(center.y) + ")";
				})
			.text(function(d) { return format(d.value) + data.units; });
			
			areaLabelsEnter.transition().style("opacity",0.6);
		});
	}
	
	heatmap.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return heatmap;
	};
	
	heatmap.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return heatmap;
	};
	
	heatmap.colorSet = function(scaleName) {
		if (! arguments.length) return colors;
		colors = scaleName;
		return heatmap;
	};
	
	heatmap.colorMode = function(mode) {
		if (! arguments.length) return scaleType;
		scaleType = mode;
		return heatmap;
	};
	
	heatmap.customThresholds = function(vals) {
		if (! arguments.length) return customThresholds;
		customThresholds = vals;
		return heatmap;
	};
	
	heatmap.id = function() {
		return id;
	};
	
	heatmap.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return heatmap;
	};
	
	return heatmap;
};