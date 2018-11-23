

class GoLCanvasRenderer extends GoLRenderer{
	constructor(canvas, opts){
		super(opts);
		this.ele = canvas;
		this.ctx = canvas.getContext("2d");
		this.columns = Math.floor(this.ele.width/this.boxSize);
		this.rows = Math.floor(this.ele.height/this.boxSize);
		this.renderingArea = new DOMRect(0, 0, this.ele.width, this.ele.height);
		this.renderTimeout = false;
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