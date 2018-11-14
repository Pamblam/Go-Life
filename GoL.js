
class GoL{
	constructor(canvas, opts){
		opts = opts || {};
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d");
		
		this.boxSize = +opts.boxSize || 10;
		this.gridColor = opts.gridColor || "gray";
		this.aliveColor = opts.aliveColor || "green";
		this.deadColor = opts.deadColor || "brown";
		this.speed = +opts.speed || 500;
		
		this.grid = [];
		this.running = false;
		this.generateGrid().drawBoard();
	}
	
	start(){
		
		const iterate = () => {
			this.tick();
			console.log('tick');
			drawBoard();
			console.log('draw');
			if(this.running) setTimeout(iterate, this.speed);
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
				row.push(new GoLCell(x, y, this.boxSize));
			}
			this.grid.push(row);
		}
		return this;
	}
	
	iterateCells(cb){
		for(let row = this.grid.length; row--;){
			for(let col = this.grid[row].length; col--;){
				if(false === cb(this.grid[row][col], row, col)) return this;
			}
		}
		return this;
	}
	
	drawBoard(){
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		return this.iterateCells((cell, row, col)=>{
			this.ctx.fillStyle = cell.alive ? this.aliveColor : this.deadColor;
			this.ctx.fillRect(cell.x, cell.y, cell.size, cell.size);
			//this.ctx.strokeStyle = this.gridColor;
			//this.ctx.lineWidth = 1;
			//this.ctx.strokeRect(cell.x, cell.y, cell.size, cell.size);
		});
	}
	
	getNeighbors(row, col){
		var n = [];
		if(this.grid[row-1]){
			if(this.grid[row-1][col-1]) n.push(this.grid[row-1][col-1]);
			if(this.grid[row-1][col]) n.push(this.grid[row-1][col]);
			if(this.grid[row-1][col+1]) n.push(this.grid[row-1][col+1]);
		}
		if(this.grid[row+1]){
			if(this.grid[row+1][col-1]) n.push(this.grid[row+1][col-1]);
			if(this.grid[row+1][col]) n.push(this.grid[row+1][col]);
			if(this.grid[row+1][col+1]) n.push(this.grid[row+1][col+1]);
		}
		if(this.grid[row][col-1]) n.push(this.grid[row][col-1]);
		if(this.grid[row][col+1]) n.push(this.grid[row][col+1]);
		return n;
	}
	
	tick(){
		var change_state = [];
		this.iterateCells((cell, row, col)=>{
			var neighbors = this.getNeighbors(row, col);
			var alive_neighbors = 0;
			var dead_neighbors = 0;
			for(let i=neighbors.length; i--;){
				if(neighbors[i].alive) alive_neighbors++
				else dead_neighbors++;
			}
			if(cell.alive){
				switch(alive_neighbors){
					case 0:
					case 1: 
						change_state.push(cell);
						break;
					case 2:
					case 3:
						break;
					default:
						change_state.push(cell);
						break;
				}
			}else if(alive_neighbors === 3) change_state.push(cell);
		});
		for(let i=change_state.length; i--;) change_state[i].alive = !change_state[i].alive;
		return this;
	}
}

class GoLCell{
	constructor(x, y, size){
		this.x = x;
		this.y = y;
		this.size = size;
		this.alive = false;
	}
}

class GoLMouse{
	constructor(game){
		this.game = game;
		this.enabled = false;
		this.mouseDown = false;
		this.lastActiveCellName = "";
		this.createListeners();
	}
	
	enable(){this.enabled = true; return this;}
	disable(){this.enabled = false; return this;}
	
	getCellAt(x, y){
		var col = Math.floor(x / this.game.boxSize), 
			row = Math.floor(y / this.game.boxSize);
		return {row:row, col:col, cell:this.game.grid[row][col]};
	}
	
	createListeners(){
		document.addEventListener('mousedown', e=>{
			if(e.button == 0) this.mouseDown = true;
			this.handleActiveMouse(e);
		});
		
		document.addEventListener('mouseup', e=>{
			if(e.button == 0) this.mouseDown = false;
			this.lastActiveCellName = "";
		});
			
		this.game.canvas.addEventListener('mousemove', e=>{
			this.handleActiveMouse(e);
		});
		
		return this;
	}
	
	handleActiveMouse(e){
		if(!this.mouseDown || !this.enabled) return this;
		var rect = this.game.canvas.getBoundingClientRect();
		var x = e.clientX - rect.left;
		var y = e.clientY - rect.top;
		var cell = this.getCellAt(x, y);
		if(!cell) return;
		var cellName = `${cell.row},${cell.col}`;
		if(cellName === this.lastActiveCellName) return this;
		this.lastActiveCellName = cellName;
		cell.cell.alive = !cell.cell.alive;
		this.game.drawBoard();
		return this;
	}
}