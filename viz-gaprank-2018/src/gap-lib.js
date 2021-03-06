/*
 * gap-lib.js - library for making gap rank graphics
 */

// var d3 = Object.assign({},
// 		       require("d3-selection"),
// 		       require("d3-array"),
// 		       require("d3-scale"),
// 		       require("d3-axis"));

// const accessor = require( "./accessor.js" )["accessor"];

var gapchart = function()
{

    this.__dot_radius = 10;
    this.__scale_margin = 0.1;
    this.__margin = {
	"left":0,
	"right":0,
	"top":0,
	"bottom":0
    };

    this.explainer_height = this.explainer_height.bind(this);
    this.title = this.title.bind(this);
    this.default_val = this.default_val.bind(this);
    this.explainer_function = this.explainer_function.bind(this);
    this.unit = this.unit.bind(this);
    this.gap_unit = this.gap_unit.bind(this);
    this.radius_function = this.radius_function.bind(this);
    this.buffer_pct = this.buffer_pct.bind(this);
    this.container = this.container.bind(this);
    this.val_keys = this.val_keys.bind(this);
    this.label_key = this.label_key.bind(this);
    this.display_label_key = this.display_label_key.bind(this);
    this.data = this.data.bind(this);
    
    return this;
};

// exports.gapchart = gapchart;

gapchart.prototype.show_axis = accessor("__show_axis", true);

gapchart.prototype.explainer_height = accessor ("__explainer_height");

gapchart.prototype.force_min = accessor ("__force_min");
gapchart.prototype.force_max = accessor ("__force_max");

gapchart.prototype.title = accessor("__title");

gapchart.prototype.default_val = accessor("__default_val");

gapchart.prototype.explainer_function = accessor("__explainer_function");

gapchart.prototype.unit = accessor( "__unit" );

gapchart.prototype.gap_unit = accessor( "__gap_unit" );

// gapchart.prototype.radius = accessor( "__dot_radius" );

gapchart.prototype.radius_function = accessor( "__dot_radius_function" );

gapchart.prototype.buffer_pct = accessor( "__buffer_pct" );

gapchart.prototype.container = accessor( "__sel" );

gapchart.prototype.val_keys = accessor( "__val_key" );

gapchart.prototype.label_key = accessor( "__label_key" );

gapchart.prototype.display_label_key = accessor( "__display_label_key" );

gapchart.prototype.data = accessor( "__data" );

gapchart.prototype.radius = function(d){
    return this.radius_function()(d);
}

gapchart.prototype.data_arr = function ( key )
{
    return this.data().map( function( a ){
	return a[key];
    });
}

gapchart.prototype.min_max = function( key )
{

    if ( typeof( key ) == "undefined" ) return;

    var arr = this.data().map(function(a){
	return a[key];
    })

    return { "min": d3.min( arr ),
	     "max": d3.max( arr ) };
}

gapchart.prototype.gap = function ( a )
{

    if (this.val_keys()[1] == this.val_keys()[0]){
	var ret = a[this.val_keys()[0]];
    }
    else {
	var ret = a[this.val_keys()[1]] - a[this.val_keys()[0]];
    }
    if (isNaN(ret)) return null;
    return Math.abs(ret);
}

gapchart.prototype.gap_arr = function()
{
    var that = this;
    
    return this.data().map(function(a){
	return Number(that.gap.call(that, a));
    });
}

gapchart.prototype.gap_range = function()
{

    var min = d3.min(this.gap_arr());
    var max = d3.max(this.gap_arr());

    if (typeof(this.force_min()) !== 'undefined'){
	min = this.force_min();
    }
    if (typeof(this.force_max()) !== 'undefined'){
	max = this.force_max();
    }

    var rng = max - min;

    var margin = rng * this.__scale_margin;

    min -= margin;
    max += margin;

    var ret =  [min, max];
    return ret
	    // d3.ax(this.gap_arr()) * (1 + this.__scale_margin)];
}

gapchart.prototype.val_range = function(){

    var arr = this.data_arr(this.val_keys()[0])
	.concat(this.data_arr(this.val_keys()[1]));

    return [d3.min(arr), d3.max(arr)];
}

gapchart.prototype.d3scale = function( range ){

    var y_min = 0
	+ this.radius() + this.__margin.left;
    var y_max = 
	this.__svg.node().getBoundingClientRect().width
	- this.radius()
	- this.__margin.right;

    return d3.scaleLinear()
        .domain( range || this.value_range() )
	.range( [y_min, y_max] );
    
}

gapchart.prototype.rank_scale = function(){
    return this.d3scale( this.gap_range() );
}

gapchart.prototype.d3axis = function( range ){
    return d3.axisBottom(this.d3scale( range || this.value_range() ));
}

gapchart.prototype.rank_axis = function(){
    return d3.axisBottom( this.rank_scale());
}

gapchart.prototype.draw_gap = function(d, i )
{
}

gapchart.prototype.position_rank_dots = function(f)
{
    this.__rank_dots
	.style("transform",function(d){
	    var bbox = this.getBBox();
	    var xoff = f(d);
	    return "translate(" + xoff + "px, 0px)";
	})
	.attr("transform",function(d){
	    var bbox = this.getBBox();
	    var xoff = f(d);
	    return "translate(" + xoff + " 0)";
	});
    
    
}

gapchart.prototype.draw_rank_dots = function(xmax)
{

    var lkey = this.label_key();
    var k1 = this.val_keys()[0];
    var k2 = this.val_keys()[1];

    var xmin = this.__margin.left; 
    var xmax = xmax || this.container().node().getBoundingClientRect().width
	-  this.__margin.right;

    var display_label = this.display_label_key()
    
    var label = this.__rank_dots
	.append("text")
    	.classed("dot-label top-label", true)
    // .text(function(d){ return d[lkey]; })
	.text(display_label)
	.attr("y", function(){ return this.getBBox().height;});
    
    var that = this;
    var label_bottom = this.__rank_dots
	.append("text")
	.classed("dot-label bottom-label", true)


    label_bottom
	.text(function(d){
	    return "" 
		+ Math.round(that.gap(d))
		+ " " + that.gap_unit();
	})

    
    label_bottom
    	.attr("y", function(){
	    return this.getBBox().height
		+ this.parentNode.getBBox().height + that.radius();
	});

    // label.attr("y", function(){ return this.getBBox().height;});


    
    d3.selectAll(".dot-label").attr("x", function(){
	    var ret = 0 - this.getBBox().width / 2 ;
	    return ret;
    });


    // this.__rank_dots
    // 	.append("circle")
    // 	.attr("r", function(d){
    // 	    return that.radius();
    // 	})
    // 	// .attr("cx", 50)
    // 	.attr("cy", this.radius()  + label.node().getBBox().height * 1.4)

    // re-doing as triangles

    var w = this.radius() * 2;
    this.__rank_dots
	.append("polygon")
    	.attr("transform", "translate("
	      + 0
	      + ","
	      + w
	      + ")")
    	.attr("y", this.radius()  + label.node().getBBox().height * 1.4)    
	.attr("points",
	      ""
	      + 0 + "," + 0 + " "
	      + "0, " + (w) + " " 
	      + w + "," + w);
    
}

gapchart.prototype.draw_rank = function (){

    // filter data
    var that = this;


    this.data(this.data().filter(function(a){
	if (a[that.val_keys()[0]].length < 1) return false;
	if (a[that.val_keys()[1]].length < 1) return false;
	return true;
    }));
    
    this.container().html("");

    this.container().append("h2")
	.html(this.title());

    this.__explainer = this.container().append("div")
	.classed("explainer", true);
    
    this.__svg = this.container()
	.append("svg")
	.attr("width",
	      function(){
	      // Math.max(window.innerWidth,
	      // 	      this.container().node().getBoundingClientRect().width)+ "px");
	      // // d3.select(window).node().getBoundingClientRect().width );
		  var ret = that.container().node().getBoundingClientRect().width ;
		  return ret + "px";
	      })

    this.__g = this.__svg.append("g");

    var lkey = this.label_key();
    
    this.__gaps_g = this.__g.append("g")
	.classed("gaps", true)
	.attr("transform",
	       "translate(0 " + this.__margin.top + ")")
	.style("transform",
	       "translate(0px," + this.__margin.top + "px)")
    

    this.__rank_dots = this.__gaps_g.selectAll(".rankdot")
	.data(this.data())
	.enter()
	.append("g")
	.classed("rankdot", true)
        .attr("data-" + this.label_key(),
	      function(d){
		  return d[lkey];
	      });

    this.draw_rank_dots(that.container().node().getBoundingClientRect().width);

    this.position_rank_dots(function(d){

	var ret = that.rank_scale()(that.gap(d));
	return ret;
    });

    // redraw with more margin if its overlapping 
     
    var overhang =
	Math.round(this.__g.node().getBBox().width
		   + this.__g.node().getBBox().x
		   - this.__svg.node().getBoundingClientRect().width);

    if (overhang > 0){
	// this.__margin.right += overhang/2;
	// this.__margin.left += overhang/2;
	// return this.draw_rank();
    }

    if (this.show_axis()){
    this.__axis = this.__g.append("g")
	    .classed("d3axis", true)
	    .append("g")
	    .call(this.rank_axis());
    }
    
    
    var trans = "translate(0px, "
	+ ( this.__gaps_g.node().getBBox().height
	    + this.__gaps_g.node().getBBox().y
	    + this.radius())
	+ "px)";

    var svg_trans = "translate(0 "
	+ ( this.__gaps_g.node().getBBox().height
	    + this.__gaps_g.node().getBBox().y
	    + this.radius())
	+ ")";
    

    if (this.show_axis()){
	
	this.__axis.style("transform", trans).attr("transform", svg_trans);
    }
    // this.__axis.attr("y",
    // 		     (this.__gaps_g.node().getBBox().height
    // 		     + this.__gaps_g.node().getBBox().y
    // 		     + this.radius()) + "px")

    this.__rank_dots.on("mouseover", function(d){

	var tmp_height = that.__explainer.node()
	    .getBoundingClientRect().height;
	
	that.__explainer.html(that.explainer_function()(d));

	var new_height = that.__explainer.node()
	    .getBoundingClientRect().height;

	// prevent explainer from  contracting
	if ( new_height < tmp_height )
	    that.__explainer.style("height",
				     tmp_height + "px");
	
    });

    // restore the default explainer 
    var restore = function(){

	var d = that.data().filter(function(a){
	    return a[that.label_key()] == that.default_val();
	})[0];

	that.__explainer.html(that.explainer_function()(d));

	};

    this.__rank_dots.on("mouseout", restore );

    restore();

    this.__svg.attr("height", function(){
	// var svg_height = that.__g.node().getBBox().height
	// that.__g.node().getBBox().y;
	// // // + that.radius() * 2;
	// //     + that.__axis.node().getBBox().height * 2
	// //     + that.__axis.node().getBBox().y;

	var svg_height = that.__g.node().getBBox().height
	    + that.__g.node().getBBox().y;
	
	    // that.__g.node().innerHeight
	// + that.__g.node().getBBox().y

	svg_height = Math.max(67, svg_height);
	return svg_height + "px";
    });
    
}

