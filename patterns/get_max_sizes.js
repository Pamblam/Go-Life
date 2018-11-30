const fs = require('fs');
var json = fs.readFileSync(__dirname+'/manifest.json');

var data = JSON.parse(json);

var mw = 0, mh = 0;
data.forEach(i=>{
	var n = i.size.split(/\D/).map(x=>parseInt(x));
	if(n[0] > mw) mw = n[0];
	if(n[1] > mh) mh = n[1];
});

console.log('Max width: '+mw, 'Max height: '+mh);