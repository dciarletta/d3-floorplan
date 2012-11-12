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

d3.floorplan.overlays = function() {
	var x = d3.scale.linear(),
	y = d3.scale.linear(),
	id = "fp-overlays-" + new Date().valueOf(),
	name = "overlays",
	canvasCallbacks = [],
	selectCallbacks = [],
	moveCallbacks = [],
	editMode = false,
	line = d3.svg.line()
		.x(function(d) { return x(d.x); })
		.y(function(d) { return y(d.y); }),
	dragBehavior = d3.behavior.drag()
		.on("dragstart", __dragItem)
		.on("drag", __mousemove)
		.on("dragend", __mouseup),
	dragged = null;
	
	function overlays(g) {
		g.each(function(data){
			if (! data) return;
			var g = d3.select(this);
			
			// setup rectangle for capturing events
			var canvas = g.selectAll("rect.overlay-canvas").data([0]);
			
			canvas.enter().append("rect")
			.attr("class", "overlay-canvas")
			.style("opacity", 0)
			.attr("pointer-events", "all")
			.on("click", function() {
				if (editMode) {
					var p = d3.mouse(this);
					canvasCallbacks.forEach(function(cb) {
						cb(x.invert(p[0]), y.invert(p[1]));
					});
				}
			})
			.on("mouseup.drag", __mouseup)
			.on("touchend.drag", __mouseup);
			
			canvas.attr("x", x.range()[0])
			.attr("y", y.range()[0])
			.attr("height", y.range()[1] - y.range()[0])
			.attr("width", x.range()[1] - x.range()[0]);
			
			// draw polygons (currently only type supported)
			var polygons = g.selectAll("path.polygon")
				.data(data.polygons || [], function(d) {return d.id;});
			
			polygons.enter().append("path")
			.attr("class", "polygon")
			.attr("vector-effect", "non-scaling-stroke")
			.attr("pointer-events", "all")
			.on("mousedown", function(d) {
				selectCallbacks.forEach(function(cb) {
					cb(d.id);
				});
			})
			.call(dragBehavior)
			.append("title");
			
			polygons.exit().transition().style("opacity", 1e-6).remove();
			
			polygons
			.attr("d", function(d) {return line(d.points) + "Z";})
			.style("cursor", editMode ? "move" : "pointer")
				.select("title")
				.text(function(d) { return d.name || d.id; });
			
			if (editMode) {
				var pointData = [];
				if (data.polygons) {
					data.polygons.forEach(function(polygon) {
						polygon.points.forEach(function(pt, i) {
							pointData.push({"index":i,
											"parent":polygon});
						});
					});
				}
				
				// determine current view scale to make appropriately
				// sized points to drag
				var scale = 1;
				var node = g.node();
				while (node.parentNode) {
					node = node.parentNode;
					if (node.__scale__) {
						scale = node.__scale__;
						break;
					}
				}
				
				var points = g.selectAll("circle.vertex")
				.data(pointData, function(d) {return d.parent.id + "-" + d.index;});
				
				points.exit().transition()
				.attr("r", 1e-6).remove();
				
				points.enter().append("circle")
				.attr("class", "vertex")
				.attr("pointer-events", "all")
				.attr("vector-effect", "non-scaling-stroke")
				.style("cursor", "move")
				.attr("r", 1e-6)
				.call(dragBehavior);
				
				points
				.attr("cx", function(d) { return x(d.parent.points[d.index].x); })
				.attr("cy", function(d) { return y(d.parent.points[d.index].y); })
				.attr("r", 4/scale);
			} else {
				g.selectAll("circle.vertex").transition()
				.attr("r", 1e-6).remove();
			}
		});
	}

	overlays.xScale = function(scale) {
		if (! arguments.length) return x;
		x = scale;
		return overlays;
	};
	
	overlays.yScale = function(scale) {
		if (! arguments.length) return y;
		y = scale;
		return overlays;
	};

	overlays.id = function() {
		return id;
	};
	
	overlays.title = function(n) {
		if (! arguments.length) return name;
		name = n;
		return overlays;
	};
	
	overlays.editMode = function(enable) {
		if (! arguments.length) return editMode;
		editMode = enable;
		return overlays;
	};
	
	overlays.registerCanvasCallback = function(cb) {
		if (arguments.length) canvasCallbacks.push(cb);
		return overlays;
	};
	
	overlays.registerSelectCallback = function(cb) {
		if (arguments.length) select.Callbacks.push(cb);
		return overlays;
	};
	
	overlays.registerMoveCallback = function(cb) {
		if (arguments.length) moveCallbacks.push(cb);
		return overlays;
	};
	
	function __dragItem(d) {
		if (editMode) dragged = d;
	}
	
	function __mousemove() {
		if (dragged) {
			var dx = x.invert(d3.event.dx) - x.invert(0);
			var dy = y.invert(d3.event.dy) - y.invert(0);
			if (dragged.parent) { // a point
				dragged.parent.points[dragged.index].x += dx;
				dragged.parent.points[dragged.index].y += dy;
			} else if (dragged.points) { // a composite object
				dragged.points.forEach(function(pt) {
					pt.x += dx;
					pt.y += dy;
				});
			}
			// parent is container for overlays
			overlays(d3.select(this.parentNode));
		}
	}
	
	function __mouseup() {
		if (dragged) {
			moveCallbacks.forEach(function(cb) {
				dragged.parent ? cb(dragged.parent.id, dragged.parent.points, dragged.index) :
					cb(dragged.id, dragged.points);
			});
			dragged = null;
		}
	}
	
	return overlays;
};