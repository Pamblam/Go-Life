
// http://jsfiddle.net/zjyc29w0/

var game;

$(()=>{
	
	var vwidth = $(window).width();
	var vheight = $(window).height();
	var canvas = $("#gol_canvas")[0];
	canvas.width = vwidth * 5;
	canvas.height = vheight * 5;
	canvas.style.width = "500%";
	canvas.style.height = "500%";
	canvas.style.left = (-($("#gol_canvas").width() - vwidth) / 2) + 'px';
	canvas.style.top = (-($("#gol_canvas").height() - vheight) / 2) + 'px';
	
	game = new GoL(canvas, {
		speed: 250
	});
	var mouse = new GoLMouse(game).enable();
	
	var hover_timeout = false;
	$(canvas).on('cellhover', function(e){
		if(hover_timeout !== false) clearTimeout(hover_timeout);
		var cell = e.originalEvent.cell;
		$('.tip').html(`Row: ${cell.row}, Col: ${cell.col}`);
		$('.tip').css('display', 'inline-block');
		hover_timeout = setTimeout(()=>{
			$('.tip').hide();
		}, 5000);
	});
	
	$.ajax({
		url: "./patterns/menu.html"
	}).done(html=>{
		$("#pattern-modal")[0].innerHTML = html;
		$("#loading-content").fadeOut('slow', function(){
			$("#loading-overlay").fadeOut('slow');
		});
	});
	
	$(document).on('click', '.dl-btn', function(){
		var fn = $(this).data('import');
		var path = "./patterns/rle/"+fn;
		$.ajax({url:path,dataType:'text'}).done(c=>download(fn, c, 'application/rle'));
	});
	
	$(document).on('click', '.di-btn', function(){
		var fn = $(this).data('import');
		var path = "./patterns/rle/"+fn;
		$.ajax({url:path,dataType:'text'}).done(c=>{
			var rle = new GoLRLE().fromRawData(c);
			game.loadPatternFile(rle);
			$("#pattern-modal").dialog('close');
		});
	});
	
	$(document).on('click', '#library-accordion>.ui-accordion-header', function () {
		if (!$(this).next().is(":visible"))
			$("#library-accordion>.ui-accordion-content:visible").slideToggle();
		$(this).next().slideToggle();
	});
	
	$("#opts-accordion").accordion({collapsible: true});
	
	$("#grid-color").val('#BFBFBF');
	$("#grid-color").change(function(){
		game.gridColor = $(this).val();
		game.generateGridOverlay().then(()=>game.drawBoard());
	});
	
	$("#bg-color").val('#FFFFFF');
	$("#bg-color").change(function(){
		game.deadColor = $(this).val();
		game.drawBoard();
	});
	
	$("#cell-color").val('#000000');
	$("#cell-color").change(function(){
		game.aliveColor = $(this).val();
		game.drawBoard();
	});
	
	$("#zoom-slider").slider({
		animate: "fast",
		min: 100,
		max: 500,
		value: 500
	}).on("slide", function(){
		var value = $("#zoom-slider").slider("option", "value");
		canvas.style.width = value+"%";
		canvas.style.height = value+"%";
		canvas.style.left = (-($("#gol_canvas").width() - vwidth) / 2) + 'px';
		canvas.style.top = (-($("#gol_canvas").height() - vheight) / 2) + 'px';
	});
	
	$("#speed-slider").slider({
		animate: "fast",
		min: 50,
		max: 500,
		value: 250
	}).on("slide", function(){
		game.speed = +$("#speed-slider").slider("option", "value");
	});
	
	$("#start-btn").button({
		icon: 'ui-icon-play', 
		label: 'Start', 
		iconPosition: 'end'
	}).click(function(){
		$("#start-btn").button("option", "icon", game.running?"ui-icon-play":"ui-icon-stop");
		$("#start-btn").button("option", "label", game.running?"Start":"Stop");
		game.running ? game.stop() : game.start();
	});
	
	$("#theme-chooser").val('default');
	$("#theme-chooser").change(function(e){
		var $opt = $(this).find(":selected");
		$("#bg-color").val($opt.data('bg'));
		$("#cell-color").val($opt.data('cell'));
		$("#grid-color").val($opt.data('grid'));
		game.gridColor = $("#grid-color").val();
		game.deadColor = $("#bg-color").val();
		game.aliveColor = $("#cell-color").val();
		game.generateGridOverlay().then(()=>game.drawBoard());
	});
	
	$("#step-btn").button({
		icon: 'ui-icon-seek-end', 
		label: 'Skip', 
		iconPosition: 'end'
	}).click(function(){
		game.tick().drawBoard();
	});
	
	$("#colors-btn").button({
		icon: 'ui-icon-pencil', 
		label: 'Colors', 
		iconPosition: 'end'
	}).click(function(){
		$("#colors-modal").dialog({
			title: "Colors"
		});
	});
	
	$(".modal > .container > .head > .close").click(function(){
		$(this).parent().parent().parent().hide();
	});
	
	$("#import-btn").button({
		icon: 'ui-icon-folder-open', 
		label: 'Import', 
		iconPosition: 'end'
	}).click(function(){
		$("#import-modal").dialog({
			title: "File Import"
		});
	});
	
	$("#dropZone").fileUpload({
		accept: "application/rle, application/x-rle, image/rle, zz-application/zz-winassoc-rle, .rle",
		dragArea: "#dropZone",
		dragEnterClass: "dragover",
		change: function () {
			$("#dropZone").fileUpload("getFileText", function (fileText) {
				var rle = new GoLRLE().fromRawData(fileText);
				game.loadPatternFile(rle);
				$("#dropZone").fileUpload("clearFiles");
				$("#import-modal").dialog('close');
			}); 
		}
	});
	
	$("#presets-btn").button({
		icon: 'ui-icon-image', 
		label: 'View Pattern Gallery', 
		iconPosition: 'end'
	}).click(function(){
		$("#import-modal").dialog('close');
		$("#pattern-modal").dialog({
			title: "Pattern Gallery",
			height: 350,
			width: 500
		});
	});
});

function download(filename, text, mimetype='text/plain') {
	var element = document.createElement('a');
	var data = encodeURIComponent(text);
	element.setAttribute('href', 'data:'+mimetype+';charset=utf-8,'+data);
	element.setAttribute('download', filename);
	element.setAttribute('target', '_blank');
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
}