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

var get_group2 = function(){
    return selected(d3.select("#group2_picker")).attr("data-fname");
}

var get_subj = function(){
    return selected(d3.select("#subj_picker")).attr("data-fname");
}

var get_grade = function(){
    return selected(d3.select("#grade_picker")).attr("data-fname");
}

var get_csv_group = function(i){
    var id = "#group_picker";
    if (i === 2){ id += "2"; }
    return selected(d3.select(id)).attr("csv-group");
}

var get_fname = function(y){
    var ret = "data/"
    // ret += get_group()
    ret += "2018_combined"
    ret += "_";
    ret += get_subj();
    ret += "_";
    ret += get_grade()
    ret += "_";
    ret += y
    ret += ".csv";
    return ret;
};

var get_keys = function()
{
    var sel = selected(d3.select("#group_picker"))
    var sel2 = selected(d3.select("#group2_picker"))    

    return [sel.attr("data-key1"),sel2.attr("data-key1")]
}

var update = function(){

    if ( get_keys() == selected_keys
	 && get_fname() == selected_fname ) return;


    var get_range = function(rows, keys){

	if (keys[0] === keys[1]){
	    return [-1, -1];
	}
	var min = 1000,
	    max = 0;
	rows.forEach(function(r){
	    var a = r[keys[0]],
		b = r[keys[1]],
		diff = a - b;

	    if ((! (a && b))
		|| (r["state"] === "DoDEA")
		|| (r["state"] === "District of Columbia")		
		|| (r["state"] === "D.C.")){
		return;
	    }
	    var 	gap = Math.abs(diff);

	    min = Math.min(min, gap);
	    max = Math.max(max, gap);
	});

	return [min, max];
	
    }
    // if ( cached_files.hasOwnProperty( get_fname()) )
    // {
    // 	go( cached_files[get_fname()], get_keys());
    // }
    // else 
    // {
	d3.csv( get_fname(2011), function(d){
	    cached_files[get_fname(2011)] = d;
	    // go(d, get_keys(), d3.select("#container2011"));

	    
	    d3.csv( get_fname(2017), function(e){

		var keys = get_keys();
		var drange = get_range(d, keys),
		    erange = get_range(d, keys),
		    min,
		    max;
		
		if (keys[0] !== keys[1]){
		    min = Math.min(drange[0], erange[0]),
		    max = Math.max(drange[1], erange[1]);
		}

		cached_files[get_fname(2017)] = e;
		go(d, get_keys(), d3.select("#container2011"), 2011, min, max,
		   false 	// show_axis
		  );		
		go(e, get_keys(), d3.select("#container2017"), 2017, min, max,
		   true 	// show_axis
		  );
	    });
	    
	});

	
    // }

    
}

var go = function(d, keys, root, year, force_min, force_max, show_axis){


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
	    if (a["state"] == "DoDEA"
		|| a["state"] == "D.C.")
		// || a["state"] == "District of Columbia")
		return false;
	    return true;
	});


    var fmt_group = function(g){
	return g
	    .replace("not ell","non-ell")
	    .replace("ell","ELL")
	    .replace("hispanic","Hispanic");
    }

    var fmin, fmax;

    var gaps = new gapchart()
	.container(root)
    // .val_keys(["ell","not ell"])
	.val_keys(keys)
	.label_key("state")
	.display_label_key(function(d){ return d["ap_abbr"]; })
	.default_val("Connecticut")
	// .radius(12)
	.data(d)
	.show_axis(show_axis)
	.unit("% proficient")
	.gap_unit(" points")
	.title(year)
	// .title(fmt_group("How Connecticut's gaps compare to other states"))
	// .title(fmt_group("Connecticut students trail behind Massachusetts (FRPL " + keys[0] + ")"))    
	.radius_function(function(d){
	    return 10;
	})
	.explainer_function(function(d){

	    var place = "In " + d[gaps.label_key()] + ", ";
	    if (d[gaps.label_key()] == "Nation")
		place = "Nationwide, " ;
	    
	    var ret =  place
		+ numeral(get_grade()).format('0o')
		+ " grade "
		+ get_group()
		// + fmt_group(gaps.val_keys()[0])	    
		+ " scored an average of  "
	    	+ Math.round(d[gaps.val_keys()[0]]) + " points "
		+ " in "
		+ get_subj();

	    if (get_group() == get_group2()){
		return ret + ". <b>Select a different subgroup to see how it compares with this one</b>.";
	    }
	    ret += 
		", while "
		+ get_group2()
		// + fmt_group(gaps.val_keys()[0])	    
		+ " scored an average of  "
	    	+ Math.round(d[gaps.val_keys()[1]]) + " points."	    

		// + fmt_group(gaps.val_keys()[1])
		// + " students"
		// + " were at or above proficiency in"
		// + " " + numeral(get_grade()).format('0o')
		// + "-grade " + get_subj() + "."
		+ " That's a " + Math.round(gaps.gap(d)) + "-point gap.";

	    return ret;

	});

    if (typeof(force_min) !== 'undefined'){
	gaps.force_min(force_min);

    }
    if (typeof(force_max) !== 'undefined'){
	gaps.force_max(force_max + force_max * 0.1);
    }

    gaps.draw_rank();

    // var listenerName = "resize." + String(Math.random() * 10000).slice(0,4);
    var listenerName = "resize." + year;
    
    d3.select(window).on(listenerName, function(){
	clearTimeout(throttle);
	var throttle = setTimeout(function(){
	    gaps.draw_rank.call(gaps);
	    clearTimeout(throttle);	    
	}, 250);
    });


    // d3.select('#group_picker').property('value', 'Low-income');


    
    drawn = true;
}

var make_gui = function(){

    var ctrls = d3.select("#controls")

    var group = [{
	"label":"Low-income",
	"fname":"students from low income families ",
	"key1":"eligible",
	"key2":"eligible",
	"csv_group":"frpl"
    },{
	"label":"Not low-income",
	"fname":"students from non low-income families",
	"key1":"not eligible",
	"key2":"not eligible",
	"csv_group":"frpl"	
    },
    // {
    // 	"label":"English language learner (ELL)",
    // 	"fname":"English-language learner students",
    // 	"key1":"ell",
    // 	"key2":"ell"
    // },{
    // 	"label":"Non-ELL",
    // 	"fname":"non-ELL students",
    // 	"key1":"not ell",
    // 	"key2":"not ell"
    // },{
    // 	"label":"Special Education",
    // 	"fname":"special education students",
    // 	"key1":"sd",
    // 	"key2":"sd"
    // },{
    // 	"label":"Not special education",
    // 	"fname":"non-special education students",
    // 	"key1":"not sd",
    // 	"key2":"not sd"
	//	},
	{
	"label":"White",
	"fname":"white students",
	"key1":"white",
	"key2":"white",
	"csv_group":"race"	
	
    },{
	"label":"Black",
	"fname":"black students",
	"key1":"black",
	"key2":"black",
	"csv_group":"race"		
    },{
	"label":"Hispanic",
	"fname":"Hispanic students",
	"key1":"hispanic",
	"key2":"hispanic",
	"csv_group":"race"		
    },{
	"label":"Asian/Pacific islander",
	"fname":"Asian-Pacific Islander students",
	"key1":"asian/pacific islander",
	"key2":"asian/pacific islander",
	"csv_group":"race"		
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
    var group2_sel = ctrls.append("select")
	.attr("id","group2_picker")
    var grade_sel = ctrls.append("select")
	.attr("id","grade_picker");
    var subj_sel = ctrls.append("select")
	.attr("id","subj_picker");
    ctrls.append("div").classed("clear-both", true)

    var group_opts = group_sel.selectAll("option")
	.data(group)
	.enter()
	.append("option")
	.attr("data-csv-group", function(d){ return d["csv_group"]; })
	.attr("data-fname",function(d){ return d["fname"]; })
	.attr("data-key1",function(d){  return d["key1"]; })
	.attr("data-key2",function(d){  return d["key2"]; })
	.text(function(d){ return d["label"];});

    var group2_opts = group2_sel.selectAll("option")
	.data(group)
	.enter()
	.append("option")
	.attr("value",function(d){ return d["label"]; })
	.attr("data-csv-group", function(d){ return d["csv_group"]; })    
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

    d3.select('#group2_picker').property('value', 'Black');            
    d3.select('#group_picker').property('value', 'White');        

    update();

}

// d3.csv( "data/lep_reading_8_score.csv", go );

make_gui();

