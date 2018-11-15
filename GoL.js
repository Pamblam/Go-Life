
class GoL{
	constructor(canvas, opts){
		opts = opts || {};
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		
		this.boxSize = +opts.boxSize || 10;
		this.gridColor = opts.gridColor || '#BFBFBF';
		this.aliveColor = opts.aliveColor || '#000';
		this.deadColor = opts.deadColor || '#FFF';
		this.speed = +opts.speed || 500;
		
		this.grid = [];
		this.running = false;
		this.liveCells = {};
		
		this.gridOverlay = new Image();
		
		this.generateGrid()
			.generateGridOverlay()
			.then(()=>this.drawBoard());
	}
	
	toggleCell(cell){
		cell.alive = !cell.alive;
		if(cell.alive){
			this.liveCells[cell.name] = cell;
		}else delete this.liveCells[cell.name];
	}
	
	generateGridOverlay(){
		return new Promise(done=>{
			var canvas = document.createElement('canvas'),
				ctx = canvas.getContext("2d"),
				gridOverlay = new Image();
			canvas.width = this.canvas.width;
			canvas.height = this.canvas.height;
			ctx.lineWidth = 1;
			ctx.strokeStyle = this.gridColor;
			for(var i=this.grid[0].length; i--;){
				ctx.beginPath();
				ctx.moveTo(this.grid[0][i].x, 0);
				ctx.lineTo(this.grid[0][i].x, canvas.height);
				ctx.stroke();
			}
			for(var i=this.grid.length; i--;){
				ctx.beginPath();
				ctx.moveTo(0, this.grid[i][0].y);
				ctx.lineTo(canvas.width, this.grid[i][0].y);
				ctx.stroke();
			}
			
			gridOverlay.onload = ()=>{
				this.gridOverlay = gridOverlay;
				done();
			};
			gridOverlay.src = canvas.toDataURL();
		});
	}
	
	start(){
		
		const iterate = () => {
			this.tick().drawBoard();
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
		for(let y = 0; y < this.canvas.height; y += this.boxSize){
			let row = [];
			for(let x = 0; x < this.canvas.width; x += this.boxSize){
				row.push(new GoLCell(x, y, this.boxSize, this.grid.length, row.length));
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
	
	drawCell(cell){
		this.ctx.fillStyle = cell.alive ? this.aliveColor : this.deadColor;
		this.ctx.fillRect(cell.x+.5, cell.y+.5, cell.size-1, cell.size-1);
		return this;
	}
	
	drawBoard(){
		var liveCells = Object.values(this.liveCells);
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.fillStyle = this.deadColor;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		for(var i=liveCells.length; i--;) this.drawCell(liveCells[i]);
		this.ctx.drawImage(this.gridOverlay,0,0);
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
		var change = false,
			neighbors = this.getNeighbors(cell),
			alive_neighbors = 0,
			dead_neighbors = 0;
		for(let i=neighbors.length; i--;){
			if(neighbors[i].alive) alive_neighbors++;
			else dead_neighbors++;
		}
		if(cell.alive){
			switch(alive_neighbors){
				case 0:
				case 1: 
					change = true;
					break;
				case 2:
				case 3:
					break;
				default:
					change = true;
					break;
			}
		}else if(alive_neighbors === 3) change = true;
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
	constructor(x, y, size, row, col, name){
		this.x = x;
		this.y = y;
		this.size = size;
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
		this.createListeners();
	}
	
	enable(){this.enabled = true; return this;}
	disable(){this.enabled = false; return this;}
	
	getCellAt(x, y){
		var col = Math.floor(x / this.game.boxSize), 
			row = Math.floor(y / this.game.boxSize);
		return this.game.grid[row][col];
	}
	
	createListeners(){
		document.addEventListener('mousedown', e=>{
			if(e.target !== this.game.canvas) return;
			if(e.button == 0) this.mouseDown = true;
			this.handleActiveMouse(e);
		});
		
		document.addEventListener('mouseup', e=>{
			if(e.button == 0) this.mouseDown = false;
			this.mouseDownOverCellName = "";
		});
			
		this.game.canvas.addEventListener('mousemove', e=>{
			this.handleActiveMouse(e);
		});
		
		return this;
	}
	
	handleMouseDown(cell){
		if(cell.name === this.mouseDownOverCellName) return this;
		this.mouseDownOverCellName = cell.name;
		this.game.toggleCell(cell);
		this.game.drawBoard();
		return this;
	}
	
	handleMouseOver(cell){
		if(this.mouseHoverOverCellName != cell.name){
			this.mouseHoverOverCellName = cell.name;
			var evt = new Event('cellhover');
			evt.cell = cell;
			this.game.canvas.dispatchEvent(evt);
		}
		return this;
	}
	
	handleActiveMouse(e){
		if(!this.enabled) return this;
		var x = e.clientX - this.game.canvas.offsetLeft,
			y = e.clientY - this.game.canvas.offsetTop,
			x = x * this.game.canvas.width / this.game.canvas.clientWidth,
			y = y * this.game.canvas.height / this.game.canvas.clientHeight,
			cell = this.getCellAt(x, y);
		if(this.mouseDown) return this.handleMouseDown(cell);
		else this.handleMouseOver(cell);
		return this;
	}
}