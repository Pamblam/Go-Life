
class GoLMouse{
	constructor(game){
		this.game = game;
		this.enabled = false;
		this.mouseDown = false;
		this.mouseDownOverCellName = "";
		this.mouseHoverOverCellName = "";
		this.mode = 'click';
		this.initialpos = false;
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
			this.initialpos = false;
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
			x = x * this.game.renderer.ele.getAttribute('width') / this.game.renderer.ele.clientWidth,
			y = y * this.game.renderer.ele.getAttribute('height') / this.game.renderer.ele.clientHeight;
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