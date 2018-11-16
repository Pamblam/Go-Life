
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