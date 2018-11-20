// https://jsbin.com/pajamijeja/edit?css,js,console,output

var game, renderer, zoom_level, max_zoom_level, min_zoom_level, hover_timeout;

$(()=>{
	
	var canvas, 
		mouse, 
		hover_timeout;
	
	hover_timeout = false;
	zoom_level = 500;
	max_zoom_level = 500;
	min_zoom_level = 100;
	
	canvas = $("#gol_canvas")[0];
	canvas.width = $(window).width() * (max_zoom_level/100);
	canvas.height = $(window).height() * (max_zoom_level/100);
	canvas.style.width = max_zoom_level+"%";
	canvas.style.height = max_zoom_level+"%";
	canvas.style.left = (-($("#gol_canvas").width() - $(window).width()) / 2) + 'px';
	canvas.style.top = (-($("#gol_canvas").height() - $(window).height()) / 2) + 'px';
	
	
	renderer = new GoLCanvasRenderer(canvas);
	game = new GoL(renderer, {speed: 250});
	mouse = new GoLMouse(game).enable();	
	
	renderDrawingArea();
	
	$(canvas).on('cellhover', function(e){
		var cell = e.originalEvent.cell;
		showBoardTooltip(`Row: ${cell.row}, Col: ${cell.col}`)
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
		game.render();
	});
	
	$("#cell-color").val('#000000');
	$("#cell-color").change(function(){
		game.aliveColor = $(this).val();
		game.render();
	});
	
	$("#zoom-slider").slider({
		animate: "fast",
		min: min_zoom_level,
		max: max_zoom_level,
		value: max_zoom_level
	}).on("slide", function(){
		zoom_level = $("#zoom-slider").slider("option", "value");
		showBoardTooltip(`Zoomed to ${zoom_level}%`);
		renderDrawingArea();
	});
	document.addEventListener("mousewheel", MouseWheelHandler, false);
	document.addEventListener("DOMMouseScroll", MouseWheelHandler, false);	
	
	$("#speed-slider").slider({
		animate: "fast",
		min: 1,
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
		game.tick().render();
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

function getViewportRect(){
	var c = renderer.ele.getBoundingClientRect(),
		v = renderer.ele.parentElement.getBoundingClientRect(),
		s = renderer.ele.width / c.width;
	return new DOMRect((c.x*-1)*s, (c.y*-1)*s, v.width*s, v.height*s);
}

function renderDrawingArea(){
	renderer.ele.style.width = zoom_level+"%";
	renderer.ele.style.height = zoom_level+"%";
	var x = (-($("#gol_canvas").width() - $(window).width()) / 2);
	var y = (-($("#gol_canvas").height() - $(window).height()) / 2);
	renderer.ele.style.left = x + 'px';
	renderer.ele.style.top = y + 'px';
	var renderingArea = getViewportRect();
	renderer.setRenderingArea(renderingArea);
	game.render();
}

function MouseWheelHandler(e) {
	var e = window.event || e;
	var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
	if(e.target !== renderer.ele) return;
	if (delta < 0 && zoom_level >= min_zoom_level) {
		zoom_level--;
		showBoardTooltip(`Zoomed to ${zoom_level}%`);
		$("#zoom-slider").slider("option", "value", zoom_level);
		renderDrawingArea();
	}else if(zoom_level <= max_zoom_level){
		showBoardTooltip(`Zoomed to ${zoom_level}%`);
		zoom_level++;
		$("#zoom-slider").slider("option", "value", zoom_level);
		renderDrawingArea();
	}
	return false;
}

function showBoardTooltip(msg){
	if(hover_timeout !== false) clearTimeout(hover_timeout);
	$('.tip').html(msg);
	$('.tip').css('display', 'inline-block');
	hover_timeout = setTimeout(()=>{
		$('.tip').hide();
	}, 5000);
}

// helper function to debug the viewport of the game board
function testVw(){
	renderer.ctx.lineWidth = 4;
	renderer.ctx.strokeStyle = "green";
	renderer.ctx.strokeRect(renderer.renderingArea.x, renderer.renderingArea.y, renderer.renderingArea.width, renderer.renderingArea.height);
	open(renderer.ele.toDataURL(), '_blank');
}