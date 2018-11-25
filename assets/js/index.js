
var game, 
	renderer, 
	zoom_level, 
	max_zoom_level, 
	min_zoom_level, 
	hover_timeout,
	mouse,
	pt,
	url,
	render_type,
	canvas;

$(()=>{
	
	var hover_timeout,
		liveCells;
	
	hover_timeout = false;
	zoom_level = 500;
	max_zoom_level = 500;
	min_zoom_level = 100;
	url = new QueryString();
	
	renderType = url.get('render_on') || 'canvas';
	
	try{
		liveCells = url.get('live_cells') || [];
		if(!Array.isArray(liveCells)) throw new Error('Non array.');
		liveCells.forEach(c=>{
			if(!Array.isArray(c) || c.length !== 2) throw new Error('Invalid cell.');
			c.forEach(p=>{
				if(!Number.isInteger(p)) throw new Error('Invalid ordinate.');
			});
		});
	}catch(e){
		liveCells = [];
		$.growl.error({ 
			message: "It is not formatted properly", 
			title: "Ignoring live_cells parameter" 
		});
	}
	
	if(renderType === 'svg'){
		$("#gol_canvas").replaceWith('<svg id="gol_canvas" version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>');
		$('input[value="svg"][name="render-mode"]').prop('checked', true)
	}else{
		$("#gol_canvas").replaceWith('<canvas id="gol_canvas"></canvas>');
		$('input[value="canvas"][name="render-mode"]').prop('checked', true)
	}
	
	canvas = $("#gol_canvas")[0];
	canvas.setAttribute('width', $(window).width() * (max_zoom_level/100));
	canvas.setAttribute('height', $(window).height() * (max_zoom_level/100));
	if(renderType === 'svg') canvas.setAttribute('viewBox', '0 0 '+$(window).width() * (max_zoom_level/100)+' '+$(window).height() * (max_zoom_level/100));
	canvas.style.width = max_zoom_level+"%";
	canvas.style.height = max_zoom_level+"%";
	canvas.style.cursor = 'pointer';
	
	if(renderType === 'svg'){
		renderer = new GoLSVGRenderer(canvas);
	}else{
		renderer = new GoLCanvasRenderer(canvas);
	}
	
	game = new GoL(renderer, {speed: 250});
	mouse = new GoLMouse(game).enable();	
	
	for(var i=0; i<liveCells.length; i++){ 
		game.toggleCell(game.grid[liveCells[i][1]][liveCells[i][0]]);
	}
	
	centerCanvas();
	pt = getViewportCenter();
	renderDrawingArea();
	setCanvasEvents();
	
	$.ajax({
		url: "./patterns/menu.html"
	}).done(html=>{
		$("#pattern-modal")[0].innerHTML = html;
		$("#loading-content").fadeOut('slow', function(){
			$("#loading-overlay").fadeOut('slow');
		});
	});
	
	$(document).tooltip();
	
	$(".helptopic").click(function(e){
		e.preventDefault();
		$(".helptabs").hide();
		$("#help-modal .left>a").removeClass('active');
		$(this).addClass('active');
		$(".helptabs[data-id='"+$(this).data('open')+"']").show();
	});
	
	$(window).resize(function(e){
		canvas.style.width = max_zoom_level+"%";
		canvas.style.height = max_zoom_level+"%";
		renderDrawingArea();
	});
	
	$(".mouse-action").button();
	$(".mouse-action").button("enable");
	$(".mouse-action[data-mode='click']").button("disable");
	$(".mouse-action").click(function(){
		var mode = $(this).data('mode');
		$(".mouse-action").button("enable");
		$(this).button("disable");
		if(mode === 'click') canvas.style.cursor = 'pointer';
		if(mode === 'drag') canvas.style.cursor = 'all-scroll';
		mouse.mode = mode;
	});
	
	$(document).on('click', '.dl-btn', function(){
		var fn = $(this).data('import');
		fetch("./patterns/rle/"+fn).then(r=>r.text()).then(c=>download(fn, c, 'application/rle'));
	});
	
	$(document).on('click', '.di-btn', function(){
		var fn = $(this).data('import');
		fetch("./patterns/rle/"+fn).then(r=>r.text()).then(c=>{
			var rle = new GoLRLE().fromRawData(c);
			game.loadPatternFile(rle);
			$.growl.notice({ 
				message: fn, 
				title: "Loaded pattern" 
			});
			$("#start-btn").button("option", "icon", "ui-icon-play");
			$("#pattern-modal").dialog('close');
		});
	});
	
	$(document).on('click', '#library-accordion>.ui-accordion-header', function () {
		if (!$(this).next().is(":visible"))
			$("#library-accordion>.ui-accordion-content:visible").slideToggle();
		$(this).next().slideToggle();
	});
	
	$("#opts-accordion").accordion({
		collapsible: true,
		heightStyle: "content"
	});
	
	$("#grid-color").val('#BFBFBF');
	$("#grid-color").change(function(){
		game.renderer.gridColor = '#'+$(this).val();
		game.renderer.reset();
		game.render();
	});
	
	$("#bg-color").val('#FFFFFF');
	$("#bg-color").change(function(){
		game.renderer.deadColor = '#'+$(this).val();
		game.renderer.reset();
		game.render();
	});
	
	$("#cell-color").val('#000000');
	$("#cell-color").change(function(){
		game.renderer.aliveColor = '#'+$(this).val();
		game.renderer.reset();
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
	
	$("#rs-b").val('3');
	$("#rs-s").val('23');
	$("#rs-b, #rs-s").keyup(function(){
		var mes = "";
		var val = [];
		var safe = ['0','1','2','3','4','5','6'];
		$(this).val().replace(/\s/g, '').split('').forEach(char=>{
			if(!~safe.indexOf(char)) $.growl.error({ 
				message: "Invalid Rule", 
				title: "Rulestring may only contian numbers 0-6" 
			});
			else if(!~val.indexOf(parseInt(char))) val.push(parseInt(char));
		});
		if($(this).val() !== val.join('')) $(this).val(val.join(''));
		if('rs-b' == this.id) game.rule.b = val;
		else game.rule.s = val;
	});
	
	$("#help-btn").button({
		icon: 'ui-icon-help',
		iconPosition: 'end'
	}).click(function(){
		$(".help-tabs").hide();
		$("#help-modal .left>a").removeClass('active');
		
		$("#help-modal .left>a[data-open='intro']").addClass('active');
		$(".helptabs[data-id='intro']").show();
		
		$(".help-tabs>div[data-id='intro']").show();
		$("#help-modal").dialog({
			title: "Help",
			maxHeight: 400,
			width: 500
		});
	});
	
	$("#settings-btn").button({
		icon: 'ui-icon-gear',
		iconPosition: 'end'
	}).click(function(){
		$("#settings-modal").dialog({
			title: "Settings"
		});
	});
	
	$("#start-btn").button({
		icon: 'ui-icon-play', 
		iconPosition: 'end'
	}).click(function(){
		$("#start-btn").button("option", "icon", game.running?"ui-icon-play":"ui-icon-stop");
		game.running ? game.stop() : game.start();
	});
	
	$("#theme-chooser").val('default');
	$("#theme-chooser").change(function(e){
		var $opt = $(this).find(":selected");
		$("#bg-color").val($opt.data('bg'));
		$("#cell-color").val($opt.data('cell'));
		$("#grid-color").val($opt.data('grid'));
		game.renderer.gridColor = $("#grid-color").val();
		game.renderer.deadColor = $("#bg-color").val();
		game.renderer.aliveColor = $("#cell-color").val();
		game.renderer.reset();
		game.render();
	});
	
	$("#step-btn").button({
		icon: 'ui-icon-seek-end',
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
	
	$("input[name='render-mode']").change(function(){
		renderType = $("input[name='render-mode']:checked").val();
		url.set('render_on', renderType).update();
		
		if(renderType === 'svg'){
			$("#gol_canvas").replaceWith('<svg id="gol_canvas" version="1.1" xmlns="http://www.w3.org/2000/svg"></svg>');
		}else{
			$("#gol_canvas").replaceWith('<canvas id="gol_canvas"></canvas>');
		}
		
		canvas = $("#gol_canvas")[0];
		canvas.setAttribute('width', $(window).width() * (max_zoom_level/100));
		canvas.setAttribute('height', $(window).height() * (max_zoom_level/100));
		if(renderType === 'svg') canvas.setAttribute('viewBox', '0 0 '+$(window).width() * (max_zoom_level/100)+' '+$(window).height() * (max_zoom_level/100));
		canvas.style.width = max_zoom_level+"%";
		canvas.style.height = max_zoom_level+"%";
		canvas.style.cursor = mouse.mode === 'click' ? 'pointer' : 'all-scroll';

		var new_renderer;
		if(renderType === 'svg'){
			new_renderer = new GoLSVGRenderer(canvas);
		}else{
			new_renderer = new GoLCanvasRenderer(canvas);
		}

		['boxSize', 'gridColor', 'aliveColor', 'deadColor', 'renderingArea',
			'columns', 'rows', 'type'].forEach(p=>{
			new_renderer[p] = renderer[p];
		});

		renderer = new_renderer;
		game.renderer = renderer;
		game.renderer.reset();
		mouse.setListeners();
		setCanvasEvents();
		renderDrawingArea();
	});
});

function setCanvasEvents(){
	$(canvas).on('dragboard', function(e){
		var m = e.originalEvent.movement;
		var co = renderer.ele.getBoundingClientRect();
		var vo = renderer.ele.parentElement.getBoundingClientRect();
		var x = co.left-(m.start.x-m.end.x);
		var y = co.top-(m.start.y-m.end.y);

		if(x > 0) x = 0;
		if(x < vo.width-co.width) x = vo.width-co.width;
		if(y > 0) y = 0;
		if(y < vo.height-co.height) y = vo.height-co.height;

		renderer.ele.style.left = x+'px';
		renderer.ele.style.top = y+'px';
		pt = getViewportCenter();

		showBoardTooltip(`Moved to ${parseInt(pt.x)},${parseInt(pt.y)}`);
		var renderingArea = getViewportRect();
		renderer.setRenderingArea(renderingArea);
		game.render();
	});

	$(canvas).on('cellhover', function(e){
		var cell = e.originalEvent.cell;
		showBoardTooltip(`Row: ${cell.row}, Col: ${cell.col}`)
	});
}

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
		s = parseInt(renderer.ele.getAttribute('width')) / c.width;
	return new DOMRect((c.x*-1)*s, (c.y*-1)*s, v.width*s, v.height*s);
}

function centerCanvas(){
	var x = (-($("#gol_canvas").width() - $(window).width()) / 2);
	var y = (-($("#gol_canvas").height() - $(window).height()) / 2);
	renderer.ele.style.left = x + 'px';
	renderer.ele.style.top = y + 'px';
}

function getViewportCenter(){
	var cbox, vbox, scalex,
		c, v, vpx, vpy, cvpx,
		cvpy;
	
	// get canvas details
	cbox = renderer.ele.getBoundingClientRect();
	vbox = renderer.ele.parentElement.getBoundingClientRect();

	// dertermine the current scale
	scalex = cbox.width/parseInt(renderer.ele.getAttribute('width'));
	scaley = cbox.height/parseInt(renderer.ele.getAttribute('height'));

	// position of the canvas relative to the viewport
	// in scaled canvas pixels
	c = {
		left: (cbox.left - vbox.left) / scalex,
		top: (cbox.top - vbox.top) / scaley
	};

	// height and width of the viewport
	// in scaled canvas pixels
	v = {
		width: vbox.width / scalex,
		height: vbox.height / scaley
	};

	// top left of the viewport is here
	vpx = Math.abs(c.left);
	vpy = Math.abs(c.top);

	// center of the viewport is here
	cvpx = vpx + (v.width/2);
	cvpy = vpy + (v.height/2);

	// vp center position in scaled canvas pixels
	return {x:cvpx, y:cvpy};
}

function renderDrawingArea(){
	var cbox, v, scale, pts,
		renderingArea;
		
	if(!pt) pt = getViewportCenter();
	
	// update (scale) the canvas size
	renderer.ele.style.width = zoom_level+"%";
	renderer.ele.style.height = zoom_level+"%";
	
	// re-calculate scale after canvas resize
	cbox = renderer.ele.getBoundingClientRect();	
	scale = {
		x: cbox.width/parseInt(renderer.ele.getAttribute('width')), 
		y: cbox.height/parseInt(renderer.ele.getAttribute('height'))
	};
	
	v = renderer.ele.parentElement.getBoundingClientRect();
	
	pts = {
		x: -((pt.x * scale.x) - (v.width/2)),
		y: -((pt.y * scale.y) - (v.height/2))
	};
	
	if(pts.x > 0) pts.x = 0;
	if(pts.y > 0) pts.y = 0;
	
	renderer.ele.style.left = pts.x+"px";
	renderer.ele.style.top = pts.y+"px";
	
	renderingArea = getViewportRect();
	renderer.setRenderingArea(renderingArea);
	game.render();
	
	pt = getViewportCenter();
}

function MouseWheelHandler(e) {
	var e = window.event || e;
	if(e.target === renderer.ele || renderer.ele.contains(e.target)){
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		if (delta < 0 && zoom_level >= min_zoom_level) {
			zoom_level -= 3;
			if(zoom_level < min_zoom_level) zoom_level = min_zoom_level;
			showBoardTooltip(`Zoomed to ${zoom_level}%`);
			$("#zoom-slider").slider("option", "value", zoom_level);
			renderDrawingArea();
		}else if(zoom_level <= max_zoom_level){
			zoom_level += 3;
			if(zoom_level > max_zoom_level) zoom_level = max_zoom_level;
			showBoardTooltip(`Zoomed to ${zoom_level}%`);
			$("#zoom-slider").slider("option", "value", zoom_level);
			renderDrawingArea();
		}
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
	if(renderer.type === 'canvas'){
		renderer.ctx.lineWidth = 4;
		renderer.ctx.strokeStyle = "green";
		renderer.ctx.strokeRect(renderer.renderingArea.x, renderer.renderingArea.y, renderer.renderingArea.width, renderer.renderingArea.height);
		var uri = renderer.ele.toDataURL();
		open(uri, '_blank');
	}else{
		var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rect.setAttribute('x', renderer.renderingArea.x);
		rect.setAttribute('y', renderer.renderingArea.y);
		rect.setAttribute('width', renderer.renderingArea.width);
		rect.setAttribute('height', renderer.renderingArea.height);
		rect.setAttribute('stroke', "green");
		rect.setAttribute('stroke-width', 4);
		rect.setAttribute('fill', 'transparent');
		renderer.ele.appendChild(rect);
		var s = new XMLSerializer().serializeToString(renderer.ele);
		var uri = 'data:image/svg+xml;base64,'+window.btoa(s);
		var i = new Image();
		var c = document.createElement('canvas');
		i.onload = ()=>{
			c.width = i.width;
			c.height = i.height;
			c.getContext('2d').drawImage(i, 0, 0);
			uri = c.toDataURL();
			open(uri, '_blank');
		};
		i.src = uri;
	}
}