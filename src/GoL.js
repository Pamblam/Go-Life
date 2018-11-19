
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
		this.renderer.prepare().then(()=>{
			this.parseRuleString()
				.generateGrid()
				.render();
		});
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
					this.toggleCell(this.grid[base.y+y][base.x+x]);
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