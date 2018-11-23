
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
	}
	
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