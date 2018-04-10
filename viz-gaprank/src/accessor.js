var accessor = function( name, default_value ){

    if ( typeof( default_value ) != "undefined" )
	this[name] == default_value;

    return function( v ){

	if ( typeof( v ) == "undefined" )
	    return this[name]

	this[name] = v;
	
	return this;
    }

}

// exports.accessor = accessor;

