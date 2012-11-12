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

d3.floorplan.vectorfield = function() {
	var x = d3.scale.linear(),
	y = d3.scale.linear(),
	line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); }),
	id = "fp-vectorfield-" + new Date().valueOf(),
	name = "vectorfield";
	
	function vectorfield(g) {
		g.each(function(data) {
			if (! data || ! data.map) return;
			
			var g = d3.select(this);
			
			var cells = g.selectAll("path.vector")
				.data(data.map, function(d) { return d.x+","+d.y; });
			
			cells.exit().transition()
			.style("opacity", 1e-6).remove();
			
			cells.enter().append("path")
			.attr("class", "vector")
			.attr("vector-effect", "non-scaling-stroke")
			.style("opacity", 1e-6)
			.append("title");
			
			var scaleFactor = data.binSize/ 2 /
			d3.max(data.map, function(d) {
				return Math.max(Math.abs(d.value.x),Math.abs(d.value.y));
			});
			
			cells.attr("d", function(d) {
				var v0 = {x: (d.x + data.binSize/2), 
						  y: (d.y + data.binSize/2)};
				var v1 = {x: (v0.x + d.value.x*scaleFactor), 
						  y: (v0.y + d.value.y*scaleFactor)};
				return line([v0,v1]);
			})
				.select("title")
				.text(function(d) { 
					return Math.sqrt(d.value.x*d.value.x + d.value.y*d.value.y)
					+ " " + data.units; 
				});
			
			cells.transition().style("opacity", 1);
		});
	}
	
	vectorfield.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return vectorfield;
	};
	
	vectorfield.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return vectorfield;
	};

	vectorfield.id = function() {
		return id;
	};
	
	vectorfield.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return images;
	};
	
	return vectorfield;
};