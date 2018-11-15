
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
	
	$("#step-btn").click(function(){
		game.tick().drawBoard();
	});
	
	$("#colors-btn").click(function(){
		$("#colors-modal").show();
	});
	
	$(".modal > .container > .head > .close").click(function(){
		$(this).parent().parent().parent().hide();
	});
	
	$("#import-btn").click(function(){
		$("#import-modal").show();
	});
	
	$("#fileBtn").fileUpload({
		accept: "application/rle, application/x-rle, image/rle, zz-application/zz-winassoc-rle, .rle",
		dragArea: "#dropZone",
		dragEnterClass: "dragover",
		change: function () {
			$("#fileBtn").fileUpload("getFileText", function (fileText) {
				var rle = new GoLRLE().fromRawData(fileText);
				game.loadPatternFile(rle);
				$("#fileBtn").fileUpload("clearFiles");
				$("#import-modal").hide();
			}); 
		}
	});
});