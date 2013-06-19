/**
 * csvjson.js - A script to convert between CSV and JSON formats
 * Author: Aaron Snoswell (@aaronsnoswell, elucidatedbianry.com)
 */

// Namespace
var csvjson = {};

// Hide from global scope
(function(){
	function isdef(ob) {
		if(typeof(ob) == "undefined") return false;
		return true;
	}

	/**
	 * splitCSV function (c) 2009 Brian Huisman, see http://www.greywyvern.com/?post=258
	 * Works by spliting on seperators first, then patching together quoted values
	 */
	function splitCSV(str, sep) {
        for (var foo = str.split(sep = sep || ","), x = foo.length - 1, tl; x >= 0; x--) {
            if (foo[x].replace(/"\s+$/, '"').charAt(foo[x].length - 1) == '"') {
                if ((tl = foo[x].replace(/^\s+"/, '"')).length > 1 && tl.charAt(0) == '"') {
                    foo[x] = foo[x].replace(/^\s*"|"\s*$/g, '').replace(/""/g, '"');
                } else if (x) {
                    foo.splice(x - 1, 2, [foo[x - 1], foo[x]].join(sep));
                } else foo = foo.shift().split(sep).concat(foo);
            } else foo[x].replace(/""/g, '"');
        } return foo;
    };


	/**
	 * Converts from CSV formatted data (as a string) to JSON returning
	 * 	an object.
	 * @required csvdata {string} The CSV data, formatted as a string.
	 * @param args.delim {string} The delimiter used to seperate CSV
	 * 	items. Defauts to ','.
	 * @param args.textdelim {string} The delimiter used to wrap text in
	 * 	the CSV data. Defaults to nothing (an empty string).
	 */
	csvjson.csv2json = function(csvdata, args) {
		args = args || {};
		var delim = isdef(args.delim) ? args.delim : ",";
		// Unused
		//var textdelim = isdef(args.textdelim) ? args.textdelim : "";

		var csvlines = csvdata.split("\n");
		var csvheaders = splitCSV(csvlines[0], delim);
		var csvrows = csvlines.slice(1, csvlines.length);

		var ret = {};
		ret.headers = csvheaders;
		ret.rows = [];

		for(var r in csvrows) {
			if (csvrows.hasOwnProperty(r)) {
				var row = csvrows[r];
				var rowitems = splitCSV(row, delim);

				// Break if we're at the end of the file
				if(row.length == 0) break;

				var rowob = {};
				for(var i in rowitems) {
					if (rowitems.hasOwnProperty(i)) {
						var item = rowitems[i];

						// Try to (intelligently) cast the item to a number, if applicable
						if(!isNaN(item*1)) {
							item = item*1;
						}

						rowob[csvheaders[i]] = item;
					}
				}

				ret.rows.push(rowob);
			}
		}

		return ret;
	}	// end csv2json

	/**
	 * Taken an object of the form
	 * {
	 *     headers: ["Heading 1", "Header 2", ...]
	 *     rows: [
	 *	       {"Heading 1": SomeValue, "Heading 2": SomeOtherValue},
	 *	       {"Heading 1": SomeValue, "Heading 2": SomeOtherValue},
	 *         ...
	 *     ]
	 * }
	 * and returns a CSV representation as a string.
	 * @requires jsondata {object} The JSON object to parse.
	 * @param args.delim {string} The delimiter used to seperate CSV
	 * 	items. Defauts to ','.
	 * @param args.textdelim {string} The delimiter used to wrap text in
	 * 	the CSV data. Defaults to nothing (an empty string).
	 */
	csvjson.json2csv = function(jsondata, args) {
		args = args || {};
		var delim = isdef(args.delim) ? args.delim : ",";
		var textdelim = isdef(args.textdelim) ? args.textdelim : "";

		if(typeof(jsondata) == "string") {
			// JSON text parsing is not implemented (yet)
			return null;
		}

		var ret = "";

		// Add the headers
		for(var h in jsondata.headers) {
			if (jsondata.headers.hasOwnProperty(h)) {
				var heading = jsondata.headers[h];
				ret += textdelim + heading + textdelim +  delim;
			}
		}

		// Remove trailing delimiter
		ret = ret.slice(0, ret.length-1);
		ret += "\n";

		// Add the items
		for(var r in jsondata.rows) {
			if (jsondata.rows.hasOwnProperty(r)) {
				var row = jsondata.rows[r];

				// Only add elements that are mentioned in the headers (in order, obviously)
				for(var h in jsondata.headers) {
					if (jsondata.headers.hasOwnProperty(h)) {
						var heading = jsondata.headers[h];
						var data = row[heading];

						if(typeof(data) == "string") {
							ret += textdelim + row[heading] + textdelim +  delim;
						} else {
							ret += row[heading] + delim;
						}
					}
				}

				// Remove trailing delimiter
				ret = ret.slice(0, ret.length-1);
				ret += "\n";
			}
		}

		// Remove trailing newling
		ret = ret.slice(0, ret.length-1);

		return ret;
	}

})();	// Execute hidden-scope code




