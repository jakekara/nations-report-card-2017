var drawn = false;

var selected = function(sel){
    var i= sel.node().selectedIndex;
    return d3.select(sel.node().options[i]);
}

var selected_filname = null;
var selected_keys = null;
var cached_files = {};
var throttle = null;

var get_group = function(){
    return selected(d3.select("#group_picker")).attr("data-fname");
}

var get_subj = function(){
    return selected(d3.select("#subj_picker")).attr("data-fname");
}

var get_grade = function(){
    return selected(d3.select("#grade_picker")).attr("data-fname");
}

var get_fname = function(){
    var ret = "data/"
    ret += get_group()
    ret += "_";
    ret += get_subj()
    ret += "_";
    ret += get_grade()
    ret += ".csv";
    return ret;
};

var get_keys = function()
{
    var sel = selected(d3.select("#group_picker"))

    return [sel.attr("data-key1"),sel.attr("data-key2")]
}

var update = function(){

    if ( get_keys() == selected_keys
	 && get_fname() == selected_fname ) return;

    // console.log(get_fname());
    
    if ( cached_files.hasOwnProperty( get_fname()) )
    {
	go( cached_files[get_fname()], get_keys());
    }
    else 
    {
	d3.csv( get_fname(), function(d){
	    cached_files[get_fname()] = d;
	    go(d, get_keys());
	});
    }

    
}

var go = function(d, keys){

    // console.log("got data", d);

    var d = d
	.sort(function(a, b){
	    if (a["state"].toUpperCase() == "CONNECTICUT"
		// || a["state"].toUpperCase() == "MASSACHUSETTS"		
		|| a["state"].toUpperCase() == "NATION") return 1;
	    return -1;
	})
	.map(function(a){
	    ret = a;
	    if (ret["state"] == "District of Columbia")
		ret["state"] = "D.C.";
	    return ret;
	})
	.filter(function(a){
	    // console.log("filtering", a);
	    if (a["state"] == "DoDEA"
		|| a["state"] == "D.C.")
		// || a["state"] == "District of Columbia")
		return false;
	    return true;
	});

    // console.log("data", d);

    var fmt_group = function(g){
	return g
	    .replace("not ell","non-ell")
	    .replace("ell","ELL")
	    .replace("hispanic","Hispanic");
    }



    
    var gaps = new gapchart()
	.container(d3.select("#container"))
    // .val_keys(["ell","not ell"])
	.val_keys( keys )
	.label_key("state")
	.display_label_key(function(d){ return d["ap_abbr"]; })
	.default_val("Connecticut")
	// .radius(12)
	.data(d)
	.unit("% proficient")
	.gap_unit("")
	.title(fmt_group("Connecticut students trail behind Massachusetts"))
	// .title(fmt_group("Connecticut students trail behind Massachusetts (FRPL " + keys[0] + ")"))    
	.radius_function(function(d){
	    return 10;
	})
	.explainer_function(function(d){

	    var place = "In " + d[gaps.label_key()] + ", ";
	    if (d[gaps.label_key()] == "Nation")
		place = "Nationwide, " ;
	    
	    return place
		+ numeral(get_grade()).format('0o')
		+ " grade students who were " 
		+ fmt_group(gaps.val_keys()[0])
		+ " for free and reduced price lunch " 
		+ "scored an average of  "
	    	+ Math.round(d[gaps.val_keys()[0]]) + " points "
		+ " in "
		+ get_subj() + "."
		// + fmt_group(gaps.val_keys()[1])
		// + " students"
		// + " were at or above proficiency in"
		// + " " + numeral(get_grade()).format('0o')
		// + "-grade " + get_subj() + "."
		// + " That's a " + Math.round(gaps.gap(d)) + "-point gap.";

	});

    gaps.draw_rank();

    d3.select(window).on("resize", function(){
	clearTimeout(throttle);
	throttle = setTimeout(function(){
	    gaps.draw_rank.call(gaps);
	}, 250);
    });

    drawn = true;
}

var make_gui = function(){

    var ctrls = d3.select("#controls")

    var group = [{
	"label":"Eligible",
	"fname":"frpl",
	"key1":"eligible",
	"key2":"eligible"
    },{
	"label":"Not eligible",
	"fname":"frpl",
	"key1":"not eligible",
	"key2":"not eligible"
    }];

    var subj = [{
	"label":"Math",
	"fname":"math",
    },{
	"label":"Reading",
	"fname":"reading",
    }]

    var grade = [{
	"label":"Grade 4",
	"fname":"4",
    },{
	"label":"Grade 8",
	"fname":"8",
    }];

    // add group selection
    var group_sel = ctrls.append("select")
	.attr("id","group_picker")
    var grade_sel = ctrls.append("select")
	.attr("id","grade_picker");
    var subj_sel = ctrls.append("select")
	.attr("id","subj_picker");
    ctrls.append("div").classed("clear-both", true)

    var group_opts = group_sel.selectAll("option")
	.data(group)
	.enter()
	.append("option")
	.attr("data-fname",function(d){ return d["fname"]; })
	.attr("data-key1",function(d){  return d["key1"]; })
	.attr("data-key2",function(d){  return d["key2"]; })
	.text(function(d){ return d["label"];});

    var grade_opts = grade_sel.selectAll("option")
	.data(grade)
	.enter()
	.append("option")
    	.attr("data-fname",function(d){ return d["fname"]; })
	.text(function(d){ return d["label"];});

    var subj_opts =  subj_sel.selectAll("option")
	.data(subj)
	.enter()
	.append("option")
    	.attr("data-fname",function(d){ return d["fname"]; })
	.text(function(d){ return d["label"];});


    d3.selectAll("select").on("change", update);

    update();

}

// d3.csv( "data/lep_reading_8_score.csv", go );

make_gui();

