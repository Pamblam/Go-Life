
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
	canvas,
	min_speed,
	max_speed,
	speed_level,
	gridColor,
	deadColor,
	aliveColor,
	rule_string;

$(()=>{
	
	var hover_timeout,
		liveCells;
	
	hover_timeout = false;
	zoom_level = 500;
	max_zoom_level = 500;
	min_zoom_level = 100;
	min_speed = 1;
	max_speed = 500;
	speed_level = 250;
	url = new QueryString();
	
	gridColor = url.get('grid_color') || '#BFBFBF';
	deadColor = url.get('dead_color') || '#FFFFFF';
	aliveColor = url.get('alive_color') || '#000000';
	renderType = url.get('render_on') || 'canvas';
	ruleString = url.get('rule_string') || 'B3/S23';
	
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
		renderer = new GoLSVGRenderer(canvas, {gridColor:gridColor, aliveColor:aliveColor, deadColor:deadColor});
	}else{
		renderer = new GoLCanvasRenderer(canvas, {gridColor:gridColor, aliveColor:aliveColor, deadColor:deadColor});
	}
	
	game = new GoL(renderer, {speed: 250, ruleString: ruleString});
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
			var rle = new GoLRLE().decode(c);
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
	
	$("#grid-color").val(gridColor.substr(1));
	$("#grid-color").change(function(){
		gridColor = '#'+$(this).val();
		$(this).css('background-color', gridColor);
		game.renderer.gridColor = gridColor;
		url.set('grid_color', gridColor).update();
		game.renderer.reset();
		game.render();
	});
	
	$("#bg-color").val(deadColor.substr(1));
	$("#bg-color").change(function(){
		deadColor = '#'+$(this).val();
		$(this).css('background-color', deadColor);
		game.renderer.deadColor = deadColor;
		url.set('dead_color', deadColor).update();
		game.renderer.reset();
		game.render();
	});
	
	$("#cell-color").val(aliveColor.substr(1));
	$("#cell-color").change(function(){
		aliveColor = '#'+$(this).val();
		$(this).css('background-color', aliveColor);
		game.renderer.aliveColor = aliveColor;
		url.set('alive_color', aliveColor).update();
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
		speed_level = +$("#speed-slider").slider("option", "value");
		game.speed = speed_level;
	});
	
	$("#rs-b").val(game.rule.b.join(''));
	$("#rs-s").val(game.rule.s.join(''));
	$("#rs-b, #rs-s").keyup(function(){
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
		rule_string = `b${game.rule.b.join('')}/s${game.rule.s.join('')}`;
		url.set('rule_string', rule_string).update();
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
			maxHeight: 550,
			width: 700
		});
	});
	
	$("#settings-btn").button({
		icon: 'ui-icon-gear',
		iconPosition: 'end'
	}).click(function(){
		$("#settings-modal").dialog({
			title: "Settings",
			width: 400
		});
	});
	
	$(document).keydown(function(e){
		if(~['INPUT','TEXTAREA'].indexOf(e.target.tagName.toUpperCase())) return;
		if (e.keyCode == 32) {
			// spacebar
			e.preventDefault();
			e.stopPropagation();
			$("#start-btn").button("option", "icon", game.running?"ui-icon-play":"ui-icon-stop");
			game.running ? game.stop() : game.start();
		}else if(e.keyCode == 38 && e.ctrlKey){
			// ctrl+ up
			e.preventDefault();
			e.stopPropagation();
			speed_level -= 3;
			if(speed_level < min_speed) speed_level = min_speed;
			if(speed_level > max_speed) speed_level = max_speed;
			$("#speed-slider").slider("option", "value", speed_level);
			game.speed = speed_level;
		}else if(e.keyCode == 40 && e.ctrlKey){
			// ctrl + down
			e.preventDefault();
			e.stopPropagation();
			speed_level += 3;
			if(speed_level < min_speed) speed_level = min_speed;
			if(speed_level > max_speed) speed_level = max_speed;
			$("#speed-slider").slider("option", "value", speed_level);
			game.speed = speed_level;
		}else if(e.keyCode == 37 && e.ctrlKey){
			// ctrl + left
			e.preventDefault();
			e.stopPropagation();
			zoom_level -= 3;
			if(zoom_level < min_zoom_level) zoom_level = min_zoom_level;
			showBoardTooltip(`Zoomed to ${zoom_level}%`);
			$("#zoom-slider").slider("option", "value", zoom_level);
			renderDrawingArea();
		}else if(e.keyCode == 39 && e.ctrlKey){
			// ctrl + right
			e.preventDefault();
			e.stopPropagation();
			zoom_level += 3;
			if(zoom_level > max_zoom_level) zoom_level = max_zoom_level;
			showBoardTooltip(`Zoomed to ${zoom_level}%`);
			$("#zoom-slider").slider("option", "value", zoom_level);
			renderDrawingArea();
		}else if(e.keyCode == 67 && e.ctrlKey){
			// ctrl + c
			e.preventDefault();
			e.stopPropagation();
			centerCanvas();
		}else if(e.keyCode == 68 && e.ctrlKey){
			// ctrl + d
			e.preventDefault();
			e.stopPropagation();
			game.liveCells = {};
			game.render();
		}else if(e.keyCode == 83 && e.ctrlKey){
			// ctrl + s
			e.preventDefault();
			e.stopPropagation();
			$("#settings-modal").dialog({
				title: "Settings",
				width: 400
			});
		}else if(e.keyCode == 72 && e.ctrlKey){
			// ctrl + h
			e.preventDefault();
			e.stopPropagation();
			$(".help-tabs").hide();
			$("#help-modal .left>a").removeClass('active');
			$("#help-modal .left>a[data-open='intro']").addClass('active');
			$(".helptabs[data-id='intro']").show();
			$(".help-tabs>div[data-id='intro']").show();
			$("#help-modal").dialog({
				title: "Help",
				maxHeight: 550,
				width: 700
			});
		}else if(e.keyCode == 38 && !e.ctrlKey){
			// up
			e.preventDefault();
			e.stopPropagation();
			var co = renderer.ele.getBoundingClientRect();
			var vo = renderer.ele.parentElement.getBoundingClientRect();
			var x = co.left;
			var y = co.top-3;
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
		}else if(e.keyCode == 40 && !e.ctrlKey){
			// down
			e.preventDefault();
			e.stopPropagation();
			var co = renderer.ele.getBoundingClientRect();
			var vo = renderer.ele.parentElement.getBoundingClientRect();
			var x = co.left;
			var y = co.top+3;
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
		}else if(e.keyCode == 37 && !e.ctrlKey){
			// left
			e.preventDefault();
			e.stopPropagation();
			var co = renderer.ele.getBoundingClientRect();
			var vo = renderer.ele.parentElement.getBoundingClientRect();
			var x = co.left-3;
			var y = co.top;
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
		}else if(e.keyCode == 39 && !e.ctrlKey){
			// right
			e.preventDefault();
			e.stopPropagation();
			var co = renderer.ele.getBoundingClientRect();
			var vo = renderer.ele.parentElement.getBoundingClientRect();
			var x = co.left+3;
			var y = co.top;
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
		}
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
		$("#bg-color").change();
		$("#cell-color").change();
		$("#grid-color").change();
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
	
	$("#export-btn").button({
		icon: 'ui-icon-disk', 
		label: 'Export', 
		iconPosition: 'end'
	}).click(function(){
		$("#export-name").val("My Pattern");
		$("#export-author").val("");
		$("#export-desc").val("");
		$("#export-modal").dialog({
			title: "Export Pattern",
			width: 500,
			buttons: [{
				text: 'Export',
				icon: 'ui-icon-disk',
				click: function(){
					var name = $("#export-name").val().trim();
					var author = $("#export-author").val().trim();
					var desc = $("#export-desc").val().trim();
					if(!name){
						$.growl.error({ 
							message: "Please enter a title", 
							title: "Title is mandatory" 
						});
					}else{
						var rle = new GoLRLE({
							name: name,
							comments: desc,
							author: author,
							rows: game.serialize(),
							ruleStr: game.getRule()
						}).generateOffsets();
						rle.relativePos = {x: 0, y: 0};
						var title = name.replace(/ /g,'_').replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase()+'.rle'
						download(title, rle.encode().raw, 'application/rle');
						$("#export-modal").dialog('close');
						$("#settings-modal").dialog('close');
					}
				}
			}]
		});
	});
	
	$("#dropZone").fileUpload({
		accept: "application/rle, application/x-rle, image/rle, zz-application/zz-winassoc-rle, .rle",
		dragArea: "#dropZone",
		dragEnterClass: "dragover",
		change: function () {
			$("#dropZone").fileUpload("getFileText", function (fileText) {
				var rle = new GoLRLE().decode(fileText);
				game.loadPatternFile(rle);
				$("#dropZone").fileUpload("clearFiles");
				$("#import-modal").dialog('close');
			}); 
		}
	});
	
	$("#reset-btn").button({
		icon: 'ui-icon-alert', 
		label: 'Reset', 
		iconPosition: 'end'
	}).click(function(){
		window.open(url.url(), '_self');
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
	
	$("#center-canvas-btn").button({
		icon: 'ui-icon-transferthick-e-w', 
		iconPosition: 'end'
	}).click(function(){
		centerCanvas();
	});
	
	$("#clear-canvas-btn").button({
		icon: 'ui-icon-trash', 
		iconPosition: 'end'
	}).click(function(){
		game.liveCells = {};
		game.render();
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
	canvas.addEventListener('dragstart', function(e){
		e.preventDefault();
	});
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
		cvpy, scaley;
	
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
		renderingArea, elew, eleh,
		xtraw, xtrah, vbox;
		
	if(!pt) pt = getViewportCenter();
	
	// update (scale) the canvas size
	renderer.ele.style.width = zoom_level+"%";
	renderer.ele.style.height = zoom_level+"%";
	
	// get full ele height and width
	elew = parseInt(renderer.ele.getAttribute('width'));
	eleh = parseInt(renderer.ele.getAttribute('height'));
	
	// re-calculate scale after canvas resize
	cbox = renderer.ele.getBoundingClientRect();
	vbox = renderer.ele.parentElement.getBoundingClientRect();
	
	scale = {
		x: cbox.width/elew, 
		y: cbox.height/eleh
	};
	
	v = renderer.ele.parentElement.getBoundingClientRect();
	
	pts = {
		x: -((pt.x * scale.x) - (v.width/2)),
		y: -((pt.y * scale.y) - (v.height/2))
	};
	
	xtraw = vbox.width-cbox.width;
	xtrah = vbox.height-cbox.height;
	
	if(pts.x > 0) pts.x = 0;
	if(pts.y > 0) pts.y = 0;
	if(pts.x < xtraw) pts.x = xtraw;
	if(pts.y < xtrah) pts.y = xtrah;
	
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