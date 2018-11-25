/**
 * go-life - v2.0.181
 * Conway's Game of Life
 * @author Robert Parham
 * @website http://pamblam.github.io/Go-Life/
 * @license Apache-2.0
 */


class GoL{
	constructor(renderer, opts){
		opts = opts || {};
		this.renderer = renderer;
		this.speed = +opts.speed || 500;
		this.ruleString = opts.ruleString || 'B3/S23';
		this.rule = {b:[3],s:[2,3]};
		this.grid = [];
		this.running = false;
		this.liveCells = {};
		this.parseRuleString()
			.generateGrid()
			.render();
	}
	
	render(){ 
		var liveCells = Object.values(this.liveCells);
		this.renderer.render(liveCells);
	}
	
	loadPatternFile(file){
		var br, bc, base;
		if(this.running) this.stop();
		this.generateGrid();
		br = Math.floor(this.grid.length/2) - Math.floor(file.height/2);
		bc = Math.floor(this.grid[0].length/2) - Math.floor(file.width/2);
		base = {x: bc+file.relativePos.x, y:br+file.relativePos.y};
		for(var y=0; y<file.rows.length; y++){
			for(var x=0; x<file.rows[y].length; x++){
				if(file.rows[y][x] == 1){
					if(this.grid[base.y+y] && this.grid[base.y+y][base.x+x]){
						this.toggleCell(this.grid[base.y+y][base.x+x]);
					}
				}
			}
		}
		if(file.ruleStr) this.parseRuleString(file.ruleStr);
		this.render();
		return this;
	}
	
	parseRuleString(rs) {
		rs = rs || this.ruleString;
		this.ruleString = rs;
		var b = [], s = [], bfirst;
		rs = rs.toUpperCase().split("/").map(s => s.trim());
		var bfirst = rs[0][0] === 'B';
		b = (bfirst ? rs[0] : rs[1]).match(/\d/g) || [];
		s = (bfirst ? rs[1] : rs[0]).match(/\d/g) || [];
		this.rule = {b: b.map(n => parseInt(n)), s: s.map(n => parseInt(n))};
		return this;
	}
	
	toggleCell(cell){
		cell.alive = !cell.alive;
		if(cell.alive){
			this.liveCells[cell.name] = cell;
		}else delete this.liveCells[cell.name];
		return this;
	}
	
	start(){
		
		const iterate = () => {
			this.tick().render();
			if(this.running) setTimeout(()=>iterate(), this.speed);
		}
		
		if(!this.running){
			this.running = true;
			iterate();
		}
		
		return this;
	}
	
	stop(){
		this.running = false;
		return this;
	}
	
	generateGrid(){ 
		this.grid = [];
		this.liveCells = {};
		for(let y = 0; y < this.renderer.rows; y++){
			let row = [];
			for(let x = 0; x < this.renderer.columns; x++){
				row.push(new GoLCell(this.grid.length, row.length));
			}
			this.grid.push(row);
		}
		return this;
	}
	
	iterateAllCells(cb){
		for(let row = this.grid.length; row--;){
			for(let col = this.grid[row].length; col--;){
				if(false === cb(this.grid[row][col])) return this;
			}
		}
		return this;
	}
	
	getNeighbors(cell){
		var n = [];
		if(this.grid[cell.row-1]){
			if(this.grid[cell.row-1][cell.col-1]) n.push(this.grid[cell.row-1][cell.col-1]);
			if(this.grid[cell.row-1][cell.col]) n.push(this.grid[cell.row-1][cell.col]);
			if(this.grid[cell.row-1][cell.col+1]) n.push(this.grid[cell.row-1][cell.col+1]);
		}
		if(this.grid[cell.row+1]){
			if(this.grid[cell.row+1][cell.col-1]) n.push(this.grid[cell.row+1][cell.col-1]);
			if(this.grid[cell.row+1][cell.col]) n.push(this.grid[cell.row+1][cell.col]);
			if(this.grid[cell.row+1][cell.col+1]) n.push(this.grid[cell.row+1][cell.col+1]);
		}
		if(this.grid[cell.row][cell.col-1]) n.push(this.grid[cell.row][cell.col-1]);
		if(this.grid[cell.row][cell.col+1]) n.push(this.grid[cell.row][cell.col+1]);
		return n;
	}
	
	mutateCell(cell){
		var change = false, neighbors = this.getNeighbors(cell), alive_neighbors = 0;
		for(let i=neighbors.length; i--;) if(neighbors[i].alive) alive_neighbors++;
		if(cell.alive){ if(!~this.rule.s.indexOf(alive_neighbors)) change = true; }
		else if(~this.rule.b.indexOf(alive_neighbors)) change = true;
		return change;
	}
	
	getRelevantCells(){
		var liveCells = Object.values(this.liveCells),
			relevantCells = {},
			neighbors;
		for(let i=liveCells.length; i--;){
			relevantCells[liveCells[i].name] = liveCells[i];
			neighbors = this.getNeighbors(liveCells[i]);
			for(let n=neighbors.length; n--;){
				relevantCells[neighbors[n].name] = neighbors[n];
			}
		}
		return Object.values(relevantCells);
	}
	
	tick(){
		var cells = this.getRelevantCells(),
			toggleQueue = [];
		this.rescanCells = {};
		for(let n=cells.length; n--;) 
			if(this.mutateCell(cells[n]))
				toggleQueue.push(cells[n]);
		for(let n=toggleQueue.length; n--;)
			this.toggleCell(toggleQueue[n]);
		return this;
	}
}

class GoLCell{
	constructor(row, col){
		this.alive = false;
		this.name = `${row},${col}`;
		this.row = row;
		this.col = col;
	}
}

class GoLMouse{
	constructor(game){
		this.game = game;
		this.enabled = false;
		this.mouseDown = false;
		this.mouseDownOverCellName = "";
		this.mouseHoverOverCellName = "";
		this.mode = 'click';
		this.initialpos = false;
		this.mouseupHandler = this._mouseUp.bind(this);
		this.mousedownHandler = this._mouseDown.bind(this);
		this.mouseMoveHandler = this._mouseMove.bind(this);
		this.setListeners(false);
	}
	
	enable(){this.enabled = true; return this;}
	disable(){this.enabled = false; return this;}
	
	getCellAt(x, y){
		var col = Math.floor(x / this.game.renderer.boxSize), 
			row = Math.floor(y / this.game.renderer.boxSize);
		return this.game.grid[row][col];
	}
	
	_mouseDown(e){
		if(e.target !== this.game.renderer.ele && !this.game.renderer.ele.contains(e.target)) return;
		if(e.button == 0) this.mouseDown = true;
		this.handleActiveMouse(e);
	}
	
	_mouseUp(e){
		this.initialpos = false;
		if(e.button == 0) this.mouseDown = false;
		this.mouseDownOverCellName = "";
	}
	
	_mouseMove(e){
		this.handleActiveMouse(e)
	}
	
	setListeners(reset=true){
		if(reset){
			document.removeEventListener('mousedown', this.mousedownHandler);
			document.removeEventListener('mouseup', this.mouseupHandler);
			this.game.renderer.ele.removeEventListener('mousemove', this.mouseMoveHandler);
		}
		document.addEventListener('mousedown', this.mousedownHandler);
		document.addEventListener('mouseup', this.mouseupHandler);
		this.game.renderer.ele.addEventListener('mousemove', this.mouseMoveHandler);
		
		return this;
	}
	
	handleMouseDown(cell){
		if(cell.name === this.mouseDownOverCellName) return this;
		this.mouseDownOverCellName = cell.name;
		this.game.toggleCell(cell);
		this.game.renderer.renderCell(cell);
		return this;
	}
	
	handleMouseDrag(x, y){
		if(false === this.initialpos) this.initialpos = {x: x, y: y};
		var movement = {
			start: {x: this.initialpos.x, y: this.initialpos.y},
			end: {x: x, y: y}
		};
		var evt = new Event('dragboard');
		evt.movement = movement;
		this.game.renderer.ele.dispatchEvent(evt);
		return this;
	}
	
	handleMouseOver(cell){
		if(this.mouseHoverOverCellName != cell.name){
			this.mouseHoverOverCellName = cell.name;
			var evt = new Event('cellhover');
			evt.cell = cell;
			this.game.renderer.ele.dispatchEvent(evt);
		}
		return this;
	}
	
	getRelativeMousePos(e){
		var box = this.game.renderer.ele.getBoundingClientRect(),
			x = e.clientX - box.left,
			y = e.clientY - box.top,
			x = x * parseInt(this.game.renderer.ele.getAttribute('width')) / box.width,
			y = y * parseInt(this.game.renderer.ele.getAttribute('height')) / box.height;
		return {x:x, y:y};
	}
	
	handleActiveMouse(e){
		if(!this.enabled) return this;
		if(this.mouseDown){
			if(this.mode=='click'){
				var m = this.getRelativeMousePos(e);
				var cell = this.getCellAt(m.x, m.y);
				return this.handleMouseDown(cell); 
			}else if(this.mode=='drag'){
				return this.handleMouseDrag(e.offsetX, e.offsetY);
			}
		}else{
			var m = this.getRelativeMousePos(e);
			var cell = this.getCellAt(m.x, m.y);
			return this.handleMouseOver(cell);
		}
	}
}

class GoLPatternFile {
	constructor(opts) {
		if (!opts) opts = {};
		this.name = opts.name || '';
		this.comments = opts.comments || [];
		this.author = opts.author || '';
		this.relativePos = opts.relativePos || {x: 0, y: 0};
		this.ruleStr = opts.ruleStr || 'B3/S23';
		this.width = opts.width || 0;
		this.height = opts.height || 0;
		this.rows = opts.rows || [];
	}
}

class GoLRLE extends GoLPatternFile {
	constructor(opts) {
		super(opts);
	}

	fromRawData(str) {
		return this.parseName(str)
			.parseComments(str)
			.parseAuthor(str)
			.parsePosition(str)
			.parseRuleFromHeader(str)
			.parseHeaderLine(str)
			.parseCellData(str);
	}

	parsePosition(str) {
		var pos = (str.match(/^#R.*/gm) || [''])[0];
		if (!pos) return this;
		pos = pos.match(/-?\d*/g).filter(n => !!n);
		if (pos[0]) this.relativePos.x = parseInt(pos[0]);
		if (pos[1]) this.relativePos.y = parseInt(pos[1]);
		return this;
	}

	parseRuleFromHeader(str) {
		var rs = (str.match(/^#r.*/gm) || [''])[0];
		if (rs) rs = rs.substr(2).trim();
		this.ruleStr = rs;
		return this;
	}

	parseName(str) {
		var name = (str.match(/^#N.*/gm) || [''])[0];
		if (name) name = name.substr(2).trim();
		this.name = name;
		return this;
	}

	parseAuthor(str) {
		var author = (str.match(/^#O.*/gm) || [''])[0];
		if (author) author = author.substr(2).trim();
		this.author = author;
		return this;
	}

	parseComments(str) {
		var comments = str.match(/^#C.*|^#c.*/gm) || [];
		comments = comments.map(c => c.substr(2).trim());
		this.comments = comments;
		return this;
	}

	parseHeaderLine(str) {
		var hl = str.toLowerCase()
		hl = hl.match(/x\s?=\s?\d*\s?,\s?y\s?=\s?\d*.*/gm);
		hl = (hl || [''])[0];
		if (!hl) return this;
		hl.split(",").map(m => m.trim()).forEach(p => {
			var v = p.split('=')[1].trim();
			if (p.substr(0, 1) === 'x') {
				this.width = parseInt(v);
			} else if (p.substr(0, 1) === 'y') {
				this.height = parseInt(v);
			} else if (p.substr(0, 1) === 'r') {
				this.ruleStr = v;
			}
		});
		return this;
	}

	parseCellData(str) {
		var cd = str.match(/^[\dbo\$]*!?$/gm) || [],
			rows = [], row = [], s, n,
			parts = cd.filter(n => !!n).join('').match(/\d*b|\d*o|\d*\$/gm) || [];
		parts.forEach(c => {
			var s = c.substr(-1);
			var n = parseInt((c.match(/\d*/g) || []).filter(n => !!n)[0] || 1);
			while (n--) {
				if (s == '$') {
					rows.push(row);
					row = [];
				} else row.push(s == 'o' ? 1 : 0);
			}
		});
		if (row.length) rows.push(row);
		this.rows = rows;
		return this;
	}
}

class GoLRenderer{
	constructor(opts){
		if(!opts) opts = {};
		this.boxSize = +opts.boxSize || 10;
		this.gridColor = opts.gridColor || '#BFBFBF';
		this.aliveColor = opts.aliveColor || '#000000';
		this.deadColor = opts.deadColor || '#FFFFFF';
		this.ele = null;
		this.renderingArea = null;
		this.columns = 0;
		this.rows = 0;
		this.type = '';
	}
	
	reset(){ return this; }
	
	render(liveCells){ return this; }
	
	renderCell(cell){ return this; }
	
	setRenderingArea(rect){ this.renderingArea = rect; return this; }
	
	isInBounds(cell){
		return cell.col*this.boxSize >= this.renderingArea.left &&
			cell.col*this.boxSize <= this.renderingArea.right &&
			cell.row*this.boxSize >= this.renderingArea.top &&
			cell.row*this.boxSize <= this.renderingArea.bottom;
	}
	
	isCoordsInBounds(x, y){
		return x >= this.renderingArea.left &&
			x <= this.renderingArea.right &&
			y >= this.renderingArea.top &&
			y <= this.renderingArea.bottom;
	}
}


class GoLCanvasRenderer extends GoLRenderer{
	constructor(canvas, opts){
		super(opts);
		this.ele = canvas;
		this.ctx = canvas.getContext("2d");
		this.columns = Math.floor(this.ele.width/this.boxSize);
		this.rows = Math.floor(this.ele.height/this.boxSize);
		this.renderingArea = new DOMRect(0, 0, this.ele.width, this.ele.height);
		this.renderTimeout = false;
		this.type = 'canvas';
	}
	
	renderGridLines(){
		this.ctx.lineWidth = 1;
		this.ctx.strokeStyle = this.gridColor;
		var x = Math.ceil(this.renderingArea.x/this.boxSize);
		while(x*this.boxSize <= this.renderingArea.right){
			this.ctx.beginPath();
			this.ctx.moveTo(x*this.boxSize, this.renderingArea.top); 
			this.ctx.lineTo(x*this.boxSize, this.renderingArea.bottom);
			this.ctx.stroke();
			x++;
		}
		var y = Math.ceil(this.renderingArea.y/this.boxSize);
		while(y*this.boxSize <= this.renderingArea.bottom){
			this.ctx.beginPath();
			this.ctx.moveTo(this.renderingArea.left, y*this.boxSize); 
			this.ctx.lineTo(this.renderingArea.right, y*this.boxSize);
			this.ctx.stroke();
			y++;
		}
		return this;
	}
	
	render(liveCells){
		this.ctx.fillStyle = this.deadColor;
		this.ctx.fillRect(
			this.renderingArea.x, 
			this.renderingArea.y, 
			this.renderingArea.width, 
			this.renderingArea.height
		);
		for(var i=liveCells.length; i--;){ 
			if(this.isInBounds(liveCells[i])){ 
				this.renderCell(liveCells[i]);
			}
		}
		this.renderGridLines();
		return this;
	}
	
	renderCell(cell){
		this.ctx.fillStyle = cell.alive ? this.aliveColor : this.deadColor;
		this.ctx.fillRect((cell.col*this.boxSize)+.5, (cell.row*this.boxSize)+.5, this.boxSize-1, this.boxSize-1);
		return this;
	}
}


class GoLSVGRenderer extends GoLRenderer{
	constructor(svg, opts){
		super(opts);
		this.ele = svg;
		this.columns = Math.floor(this.ele.getAttribute('width')/this.boxSize);
		this.rows = Math.floor(this.ele.getAttribute('height')/this.boxSize);
		this.renderingArea = new DOMRect(0, 0, parseInt(this.ele.getAttribute('width')), parseInt(this.ele.getAttribute('height')));
		this.renderTimeout = false;
		this.renderGridLines();
		this.type = 'svg';
	}
	
	reset(){
		while (this.ele.lastChild) this.ele.removeChild(this.ele.lastChild);
		return this.renderGridLines();
	}
	
	renderGridLines(){		
		var line, rect, x, y;
		rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rect.setAttribute('x', 0);
		rect.setAttribute('y', 0);
		rect.setAttribute('width', this.ele.getAttribute('width'));
		rect.setAttribute('height', this.ele.getAttribute('height'));
		rect.setAttribute('fill', this.deadColor);
		this.ele.appendChild(rect);
		x = 0;
		while(x*this.boxSize <= parseInt(this.ele.getAttribute('width'))){
			line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', x*this.boxSize);
			line.setAttribute('x2', x*this.boxSize);
			line.setAttribute('y1', 0);
			line.setAttribute('y2', this.ele.getAttribute('height'));
			line.setAttribute('stroke-width', 1);
			line.setAttribute('stroke', this.gridColor);
			this.ele.appendChild(line);
			x++;
		}
		y = 0;
		while(y*this.boxSize <= parseInt(this.ele.getAttribute('height'))){
			line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', 0);
			line.setAttribute('x2', this.ele.getAttribute('width'));
			line.setAttribute('y1', y*this.boxSize);
			line.setAttribute('y2', y*this.boxSize);
			line.setAttribute('stroke-width', 1);
			line.setAttribute('stroke', this.gridColor);
			this.ele.appendChild(line);
			y++;
		}
		return this;
	}
	
	render(liveCells){
		Array.from(this.ele.getElementsByTagName('rect')).forEach(rect=>{
			if(this.isCoordsInBounds(parseInt(rect.getAttribute('x')), parseInt(rect.getAttribute('y')))){
				this.ele.removeChild(rect);
			}
		});
		for(var i=liveCells.length; i--;){ 
			if(this.isInBounds(liveCells[i])){ 
				this.renderCell(liveCells[i]);
			}
		}
		return this;
	}
	
	renderCell(cell){
		if(cell.alive){
			var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			rect.setAttribute('x', (cell.col*this.boxSize)+.5);
			rect.setAttribute('y', (cell.row*this.boxSize)+.5);
			rect.setAttribute('width', this.boxSize-1);
			rect.setAttribute('height', this.boxSize-1);
			rect.setAttribute('fill', this.aliveColor);
			rect.setAttribute('id', cell.name);
			this.ele.appendChild(rect);
		}else{
			try{ this.ele.removeChild(document.getElementById(cell.name)); }catch(e){}
		}
		return this;
	}
}