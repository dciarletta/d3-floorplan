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

d3.floorplan = function() {
	var layers = [],
	panZoomEnabled = true,
	maxZoom = 5,
	xScale = d3.scale.linear(),
	yScale = d3.scale.linear();

	function map(g) {
		var width = xScale.range()[1] - xScale.range()[0],
		    height = yScale.range()[1] - yScale.range()[0];
		
		g.each(function(data){
			if (! data) return;
			
			var g = d3.select(this);

			// define common graphical elements
			__init_defs(g.selectAll("defs").data([0]).enter().append("defs"));

			// setup container for layers and area to capture events
			var vis = g.selectAll(".map-layers").data([0]),
			visEnter = vis.enter().append("g").attr("class","map-layers"),
			visUpdate = d3.transition(vis);

			visEnter.append("rect")
			.attr("class", "canvas")
			.attr("pointer-events","all")
			.style("opacity",0);

			visUpdate.attr("width", width)
			.attr("height", height)
			.attr("x",xScale.range()[0])
			.attr("y",yScale.range()[0]);

			// setup map controls
			var controls = g.selectAll(".map-controls").data([0]),
			controlsEnter = controls.enter()
							.append("g").attr("class","map-controls");

			__init_controls(controlsEnter);
			var offset = controls.select(".hide")
						.classed("ui-show-hide") ? 95 : 10,
			panelHt = Math.max(45, 10 + layers.length * 20);
			controls.attr("view-width", width)
			.attr("transform", "translate("+(width-offset)+",0)")
				.select("rect")
				.attr("height", panelHt);
			
			
			// render and reorder layer controls
			var layerControls = controls.select("g.layer-controls")
				.selectAll("g").data(layers, function(l) {return l.id();}),
			layerControlsEnter = layerControls.enter()
				.append("g").attr("class", "ui-active")
				.style("cursor","pointer")
				.on("click", function(l) {
					var button = d3.select(this);
					var layer = g.selectAll("g."+l.id());
					if (button.classed("ui-active")) {
						layer.style("display","none");
						button.classed("ui-active",false)
							.classed("ui-default",true);
					} else {
						layer.style("display","inherit");
						button.classed("ui-active", true)
							.classed("ui-default", false);
					}
				});
			
			layerControlsEnter.append("rect")
				.attr("x", 0)
				.attr("y", 1)
				.attr("rx", 5)
				.attr("ry", 5)
				.attr("width", 75)
				.attr("height", 18)
				.attr("stroke-width", "1px");
			
			layerControlsEnter.append("text")
				.attr("x", 10)
				.attr("y", 15)
				.style("font-size","12px")
				.style("font-family", "Helvetica, Arial, sans-serif")
				.text(function(l) { return l.title(); });
			
			layerControls.transition().duration(1000)
			.attr("transform", function(d,i) { 
				return "translate(0," + ((layers.length-(i+1))*20) + ")"; 
			});

			// render and reorder layers
			var maplayers = vis.selectAll(".maplayer")
							.data(layers, function(l) {return l.id();});
			maplayers.enter()
			.append("g")
			.attr("class", function(l) {return "maplayer " + l.title();})
				.append("g")
				.attr("class", function(l) {return l.id();})
				.datum(null);
			maplayers.exit().remove();
			maplayers.order();
			
			// redraw layers
			maplayers.each(function(layer) {
				d3.select(this).select("g." + layer.id()).datum(data[layer.id()]).call(layer);
			});
			
			// add pan - zoom behavior
			g.call(d3.behavior.zoom().scaleExtent([1,maxZoom])
					.on("zoom", function() {
						if (panZoomEnabled) {
							__set_view(g, d3.event.scale, d3.event.translate);
						}
					}));

		});
	}

	map.xScale = function(scale) {
		if (! arguments.length) return xScale;
		xScale = scale;
		layers.forEach(function(l) { l.xScale(xScale); });
		return map;
	};
	
	map.yScale = function(scale) {
		if (! arguments.length) return yScale;
		yScale = scale;
		layers.forEach(function(l) { l.yScale(yScale); });
		return map;
	};
	
	map.panZoom = function(enabled) {
		if (! arguments.length) return panZoomEnabled;
		panZoomEnabled = enabled;
		return map;
	};
	
	map.addLayer = function(layer, index) {
		layer.xScale(xScale);
		layer.yScale(yScale);
		
		if (arguments.length > 1 && index >=0) {
			layers.splice(index, 0, layer);
		} else {
			layers.push(layer);
		}
		
		return map;
	};
	
	function __set_view(g, s, t) {
		if (! g) return;
		if (s) g.__scale__ = s;
		if (t && t.length > 1) g.__translate__ = t;

		// limit translate to edges of extents
		var minXTranslate = (1 - g.__scale__) * 
							(xScale.range()[1] - xScale.range()[0]);
		var minYTranslate = (1 - g.__scale__) * 
							(yScale.range()[1] - yScale.range()[0]);

		g.__translate__[0] = Math.min(xScale.range()[0], 
								Math.max(g.__translate__[0], minXTranslate));
		g.__translate__[1] = Math.min(yScale.range()[0], 
								Math.max(g.__translate__[1], minYTranslate));
		g.selectAll(".map-layers")
			.attr("transform", 
				  "translate(" + g.__translate__ + 
				  	 ")scale(" + g.__scale__ + ")");
	};

	function __init_defs(selection) {
		selection.each(function() {
			var defs = d3.select(this);

			var grad = defs.append("radialGradient")
			.attr("id","metal-bump")
			.attr("cx","50%")
			.attr("cy","50%")
			.attr("r","50%")
			.attr("fx","50%")
			.attr("fy","50%");

			grad.append("stop")
			.attr("offset","0%")
			.style("stop-color","rgb(170,170,170)")
			.style("stop-opacity",0.6);

			grad.append("stop")
			.attr("offset","100%")
			.style("stop-color","rgb(204,204,204)")
			.style("stop-opacity",0.5);

			var grip = defs.append("pattern")
			.attr("id", "grip-texture")
			.attr("patternUnits", "userSpaceOnUse")
			.attr("x",0)
			.attr("y",0)
			.attr("width",3)
			.attr("height",3);

			grip.append("rect")
			.attr("height",3)
			.attr("width",3)
			.attr("stroke","none")
			.attr("fill", "rgba(204,204,204,0.5)");

			grip.append("circle")
			.attr("cx", 1.5)
			.attr("cy", 1.5)
			.attr("r", 1)
			.attr("stroke", "none")
			.attr("fill", "url(#metal-bump)");
		});
	}

	function __init_controls(selection) {
		selection.each(function() {
			var controls = d3.select(this);

			controls.append("path")
			.attr("class", "ui-show-hide")
			.attr("d", "M10,3 v40 h-7 a3,3 0 0,1 -3,-3 v-34 a3,3 0 0,1 3,-3 Z")
			.attr("fill","url(#grip-texture)")
			.attr("stroke", "none")
			.style("opacity", 0.5);

			controls.append("path")
			.attr("class", "show ui-show-hide")
			.attr("d", "M2,23 l6,-15 v30 Z")
			.attr("fill","rgb(204,204,204)")
			.attr("stroke", "none")
			.style("opacity", 0.5);

			controls.append("path")
			.attr("class", "hide")
			.attr("d", "M8,23 l-6,-15 v30 Z")
			.attr("fill","rgb(204,204,204)")
			.attr("stroke", "none")
			.style("opacity", 0);

			controls.append("path")
			.attr("d", "M10,3 v40 h-7 a3,3 0 0,1 -3,-3 v-34 a3,3 0 0,1 3,-3 Z")
			.attr("pointer-events", "all")
			.attr("fill","none")
			.attr("stroke", "none")
			.style("cursor","pointer")
			.on("mouseover", function() { 
				controls.selectAll("path.ui-show-hide").style("opacity", 1); 
			})
			.on("mouseout", function() { 
				controls.selectAll("path.ui-show-hide").style("opacity", 0.5); 
			})
			.on("click", function() {
				if (controls.select(".hide").classed("ui-show-hide")) {
					controls.transition()
					.duration(1000)
					.attr("transform", "translate("+(controls.attr("view-width")-10)+",0)")
					.each("end", function() {
						controls.select(".hide")
						.style("opacity",0)
						.classed("ui-show-hide",false);
						controls.select(".show")
						.style("opacity",1)
						.classed("ui-show-hide",true);
						controls.selectAll("path.ui-show-hide")
						.style("opacity",0.5);
					});
				} else {
					controls.transition()
					.duration(1000)
					.attr("transform", "translate("+(controls.attr("view-width")-95)+",0)")
					.each("end", function() {
						controls.select(".show")
						.style("opacity",0)
						.classed("ui-show-hide",false);
						controls.select(".hide")
						.style("opacity",1)
						.classed("ui-show-hide",true);
						controls.selectAll("path.ui-show-hide")
						.style("opacity",0.5);
					});				
				}
			});

			controls.append("rect")
			.attr("x",10)
			.attr("y",0)
			.attr("width", 85)
			.attr("fill", "rgba(204,204,204,0.9)")
			.attr("stroke", "none");

			controls.append("g")
			.attr("class", "layer-controls")
			.attr("transform", "translate(15,5)");
		});
	}

	return map;
};

d3.floorplan.version = "0.1.0";