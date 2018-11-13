
//var canvas = document.getElementById('main');
//var game = new GoL(canvas);
//var mouse = new GoLMouse(game).enable();
//game.start();

var canvas, game, mouse, running, startTime;

$(()=>{
	running = false;
	canvas = $("#main_canvas")[0];
	createCanvas();
	showStatus();
	
	$(".opt_input").change(function(){
		if(running) return;
		createCanvas();
	});
	
	$("#nextGen").click(function(){
		if(running) return;
		game.tick().drawBoard();
	});
	
	$("#togglePlay").click(function(){
		if(running){ 
			game.stop();
			startTime = 0;
		}else{ 
			game.start();
			startTime = Date.now();
		}
		$(this).html(running ? '<span class="glyphicon glyphicon-play"></span>' : '<span class="glyphicon glyphicon-stop"></span>');
		$(".opt_input").prop('disabled', !running);
		$("#nextGen").prop('disabled', !running);
		running = !running;
	});
});

function showStatus(){
	var status = [];
	if(startTime > 0){
		status.push('<span class="glyphicon glyphicon-dashboard"></span> '+formatElapsedTime({
			base_units: 'ms',
			start_time: startTime,
			show_units: ['s','m','h'],
			verbose: false
		}));
	}
	status.push(game.liveCells+" Live Cells");
	$("#status").html(status.join(' / '));
}

function createCanvas(){
	var rows = +$("#rows").val();
	var cols = +$("#cols").val();
	var size = +$("#cell_size").val();
	var speed = +$("#speed").val();
	var alive = $("#alive").val();
	var dead = $("#dead").val();
	var grid = $("#grid").val();
	if(mouse) mouse.disable();
	if(game) game.stop();
	$("#main_canvas").replaceWith(`<canvas id="main_canvas"></canvas>`);
	canvas = $("#main_canvas")[0];
	canvas.width = cols * size;
	canvas.height = rows * size;
	game = new GoL(canvas, {
		boxSize: size,
		gridColor: grid,
		aliveColor: alive,
		deadColor: dead,
		speed: speed,
		onChange: ()=>showStatus()
	}).drawBoard();
	mouse = mouse = new GoLMouse(game).enable();
}

/*******************************************************************************
 * @author pamblam - github.com/pamblam
 * @url: https://gist.github.com/Pamblam/3d63b7f0cfb0da0e68cb9b73fa6d94f1
 * @param {Object} options
 * @returns {String|Object}
 ******************************************************************************/
function formatElapsedTime(options) {

	var base_unit, elapsed_time, verbose, show_units = [],
		year, years, day, days, hour, hours, minute,
		minutes, second, seconds, millisecond, milliseconds,
		str = [], s, return_as_object;

	const normalize_unit = unit => {
		unit = unit.toLowerCase().trim();
		switch (unit) {
			case "ms": case "milliseconds": case "millisecond": return 'ms';
			case "s": case "sec": case "secs": case "seconds": case "second": return 's';
			case "m": case "min": case "mins": case "minute": case "minutes": return 'm';
			case "h": case "hr": case "hrs": case "hour": case "hours": return 'h';
			case "d": case "day": case "days": return 'd';
			case "y": case "yr": case "year": case "years": return 'y';
		}
		return '';
	};

	const convert_time_to_ms = (time, current_units) => {
		switch (normalize_unit(current_units)) {
			case "ms": return time;
			case "s": return time * 1000;
			case "m": return time * 60000;
			case "h": return time * 3600000;
			case "d": return time * 86400000;
			case "y": return time * 31536000000;
		}
		return 0;
	};

	const convert_ms_to_units = (ms, units) => {
		switch (normalize_unit(units)) {
			case "ms": return ms;
			case "s": return ms / 1000;
			case "m": return ms / 60000;
			case "h": return ms / 3600000;
			case "d": return ms / 86400000;
			case "y": return ms / 31536000000;
		}
		return 0;
	};

	const convert_time_to_units = (time, current_units, new_units) => {
		var ms = convert_time_to_ms(time, current_units);
		return convert_ms_to_units(ms, new_units);
	};

	const parseValue = (unit, noun, nouns) => {
		if (~show_units.indexOf(unit)) {
			var u = Math.floor(convert_ms_to_units(s, unit));
			if (u || !verbose) str.push(!verbose ? (""+u).padStart(2,'0') + ':' : u + ' ' + (u == 1 ? noun : nouns) + ',');
			s -= Math.floor(convert_time_to_ms(u, unit));
		}
	}

	base_unit = options.base_units || 'seconds';

	if (options.elapsed_time) elapsed_time = parseInt(options.elapsed_time);
	else {
		if (!options.start_time) options.start_time = convert_time_to_units(Date.now(), 'ms', base_unit);
		if (!options.end_time) options.end_time = convert_time_to_units(Date.now(), 'ms', base_unit);
		elapsed_time = parseInt(options.end_time - options.start_time);
	}

	s = convert_time_to_ms(elapsed_time, base_unit);

	verbose = options.verbose || false;

	options.show_units = options.show_units || ['h', 'm', 's'];
	for (let i = 0; i < options.show_units.length; i++) show_units.push(normalize_unit(options.show_units[i]));

	return_as_object = options.return_as_object || false;
	if(return_as_object) verbose = false;

	options.lang = options.lang || {};
	year = options.lang.year || 'year';
	years = options.lang.years || year + 's';
	day = options.lang.day || 'day';
	days = options.lang.days || day + 's';
	hour = options.lang.hour || 'hour';
	hours = options.lang.hour || hour + 's';
	minute = options.lang.minute || 'minute';
	minutes = options.lang.minutes || minute + 's';
	second = options.lang.second || 'second';
	seconds = options.lang.seconds || second + 's';
	millisecond = options.lang.millisecond || 'millisecond';
	milliseconds = options.lang.milliseconds || millisecond + 's';

	parseValue('y', year, years);
	parseValue('d', day, days);
	parseValue('h', hour, hours);
	parseValue('m', minute, minutes);
	parseValue('s', second, seconds);
	parseValue('ms', millisecond, milliseconds);

	if(str.length > 1){
		if (verbose) {
			str[str.length - 2] = str[str.length - 2].substr(0, str[str.length - 2].length - 1);
			str[str.length - 1] = "and " + str[str.length - 1];
		}
		str[str.length - 1] = str[str.length - 1].substr(0, str[str.length - 1].length - 1);
	}
	
	str = str.join(verbose ? ' ' : '');
	
	if(return_as_object){
		str = str.split(':');
		return_as_object = {};
		[	['y', years], 
			['d', days], 
			['h', hours], 
			['m', minutes], 
			['s', seconds], 
			['ms', milliseconds] 
		].forEach(unit=>{
			if (!~show_units.indexOf(unit[0])) return;
			return_as_object[unit[1]] = str.shift();
		});
	}
	
	return return_as_object || str;
}