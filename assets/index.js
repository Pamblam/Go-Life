
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
	
	$(".accordion > .head").click(function(){
		var $head = $(this), $body = $(this).parent().find(".body");
		$body.slideToggle('fast', function(){
			$head.find('span').html($body.is(':visible') ? '▼' : '▲');
		});
	});
	
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
	
	$('#zoom-slider').val(500);
	$(document).on('input', '#zoom-slider', function(){
		canvas.style.width = $(this).val()+"%";
		canvas.style.height = $(this).val()+"%";
		canvas.style.left = (-($("#gol_canvas").width() - vwidth) / 2) + 'px';
		canvas.style.top = (-($("#gol_canvas").height() - vheight) / 2) + 'px';
	});
	
	$("#speed-slider").val(250);
	$(document).on('input', '#speed-slider', function(){
		game.speed = +$(this).val();
	});
	
	$("#start-btn").click(function(){
		$(this).html(game.running?'Start ▶':'Stop ■');
		game.running ? game.stop() : game.start();
	});
});