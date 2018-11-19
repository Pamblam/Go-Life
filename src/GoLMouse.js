
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
		var col = Math.floor(x / this.game.renderer.boxSize), 
			row = Math.floor(y / this.game.renderer.boxSize);
		return this.game.grid[row][col];
	}
	
	createListeners(){
		document.addEventListener('mousedown', e=>{
			if(e.target !== this.game.renderer.ele) return;
			if(e.button == 0) this.mouseDown = true;
			this.handleActiveMouse(e);
		});
		
		document.addEventListener('mouseup', e=>{
			if(e.button == 0) this.mouseDown = false;
			this.mouseDownOverCellName = "";
		});
			
		this.game.renderer.ele.addEventListener('mousemove', e=>{
			this.handleActiveMouse(e);
		});
		
		return this;
	}
	
	handleMouseDown(cell){
		if(cell.name === this.mouseDownOverCellName) return this;
		this.mouseDownOverCellName = cell.name;
		this.game.toggleCell(cell);
		this.game.renderer.renderCell(cell);
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
	
	handleActiveMouse(e){
		if(!this.enabled) return this;
		var x = e.clientX - this.game.renderer.ele.offsetLeft,
			y = e.clientY - this.game.renderer.ele.offsetTop,
			x = x * this.game.renderer.ele.width / this.game.renderer.ele.clientWidth,
			y = y * this.game.renderer.ele.height / this.game.renderer.ele.clientHeight,
			cell = this.getCellAt(x, y);
		if(this.mouseDown) return this.handleMouseDown(cell);
		else this.handleMouseOver(cell);
		return this;
	}
}