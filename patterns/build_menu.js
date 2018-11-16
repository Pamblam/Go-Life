
const fs = require('fs');
var json = fs.readFileSync('manifest.json');
var data = JSON.parse(json);

var buffer = ['<div id="library-accordion" class="ui-accordion ui-widget ui-helper-reset">'];
for (var i = data.length; i--; ) {
	buffer.push(`<h3 class="ui-accordion-header ui-corner-top ui-accordion-header-collapsed `+
	`ui-corner-all ui-state-default ui-accordion-icons"><span class="ui-accordion-header-icon`+
	` ui-icon ui-icon-triangle-1-e"></span>${data[i].title}</h3><div class="ui-accordion-content `+
	`ui-corner-bottom ui-helper-reset ui-widget-content">`);
	if (data[i].desc) buffer.push(`<center><i>${data[i].desc}</i></center>`);
	buffer.push(`<table>`+
  		`<tr><td><b>By</b>: ${data[i].author || 'Unkown Author'}</td>`+
        `<td><b>Rule</b>: ${data[i].rule}</td></tr>`+
        `<tr><td><b>Size</b>: ${data[i].size}</td>`+
        `<td><b>Cells</b>: ${data[i].cells}</td></tr>`+
  		`</table><center><button class='di-btn ui-button ui-corner-all ui-widget' data-import="${data[i].filename}">`+
		`Import<span class="ui-button-icon-space"> </span><span class="ui-button-icon ui-icon ui-icon-arrowthick-1-s"></span></button>`+
     `<button class='dl-btn ui-button ui-corner-all ui-widget' data-import="${data[i].filename}">Download<span class="ui-button-icon-space"> </span>`+
	 `<span class="ui-button-icon ui-icon ui-icon-disk"></span></button></center></div>`);
}
buffer.push('</div>');

fs.writeFileSync('menu.html', buffer.join(''));