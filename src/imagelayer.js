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

d3.floorplan.imagelayer = function() {
	var x = d3.scale.linear(),
	y = d3.scale.linear(),
	id = "fp-imagelayer-" + new Date().valueOf(),
	name = "imagelayer";
	
	function images(g) {
		g.each(function(data) {
			if (! data) return;
			var g = d3.select(this);
			
			var imgs = g.selectAll("image")
						.data(data, function(img) {return img.url;});
			
			imgs.enter().append("image")
			.attr("xlink:href", function(img) {return img.url;})
			.style("opacity", 1e-6);
			
			imgs.exit().transition().style("opacity",1e-6).remove();
			
			imgs.transition()
			.attr("x", function(img) {return x(img.x);})
			.attr("y", function(img) {return y(img.y);})
			.attr("height", function(img) {
				return y(img.y+img.height) - y(img.y);
			})
			.attr("width", function(img) {
				return x(img.x+img.width) - x(img.x);
			})
			.style("opacity", function(img) {
				return img.opacity || 1.0;
			});
		});
	}
	
	images.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return images;
	};
	
	images.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return images;
	};

	images.id = function() {
		return id;
	};
	
	images.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return images;
	};

	return images;
};