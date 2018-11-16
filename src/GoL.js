
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
		this.ruleString = opts.ruleString || 'B3/S23';
		this.rule = {b:[3],s:[2,3]};
		
		this.grid = [];
		this.running = false;
		this.liveCells = {};
		
		this.gridOverlay = new Image();
		
		this.parseRuleString()
			.generateGrid()
			.generateGridOverlay()
			.then(()=>this.drawBoard());
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
					this.toggleCell(this.grid[base.y+y][base.x+x]);
				}
			}
		}
		if(file.ruleStr) this.parseRuleString(file.ruleStr);
		this.drawBoard();
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
		this.grid = [];
		this.liveCells = {};
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