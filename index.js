
// benchmarking experiments to figure out a faster way to draw the canvas
// http://jsfiddle.net/2hg9txav/

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
	
	var game = new GoL(canvas);
	var mouse = new GoLMouse(game).enable();
	
	// The center brick is alive for centering
	var centerrow = game.grid.length/2;
	var centercol = game.grid[0].length/2;
	game.grid[centerrow][centercol].alive = true;
	game.drawBoard();
	
	$(".accordion > .head").click(function(){
		var $head = $(this), $body = $(this).parent().find(".body");
		$body.slideToggle('fast', function(){
			$head.find('span').html($body.is(':visible') ? '▼' : '▲');
		});
	});
	
	$(document).on('input', '#zoom-slider', function(){
		canvas.style.width = $(this).val()+"%";
		canvas.style.height = $(this).val()+"%";
		canvas.style.left = (-($("#gol_canvas").width() - vwidth) / 2) + 'px';
		canvas.style.top = (-($("#gol_canvas").height() - vheight) / 2) + 'px';
	});
	
});