

class GoLCanvasRenderer extends GoLRenderer{
	constructor(canvas, opts){
		super(opts);
		this.ele = canvas;
		this.ctx = canvas.getContext("2d");
		this.columns = Math.floor(this.ele.width/this.boxSize);
		this.rows = Math.floor(this.ele.height/this.boxSize);
		this.renderingArea = new DOMRect(0, 0, this.ele.width, this.ele.height);
		this.renderTimeout = false;
		this.gridOverlay = {
			img: new Image(),
			bounds: this.renderingArea
		};
	}
	
	setRenderingArea(rect){ 
		this.renderingArea = rect; 
		this.generateGridOverlay();
		return this; 
	}
	
	prepare(){ 
		return this.generateGridOverlay();
	}
	
	renderGridLines(ctx, xofst=0, yofst=0){
		ctx = ctx || this.ctx;
		ctx.lineWidth = 1;
		ctx.strokeStyle = this.gridColor;
		var x = Math.ceil(this.renderingArea.x/this.boxSize);
		while(x*this.boxSize <= this.renderingArea.right){
			ctx.beginPath();
			ctx.moveTo((x*this.boxSize)-xofst, this.renderingArea.top-yofst); 
			ctx.lineTo((x*this.boxSize)-xofst, this.renderingArea.bottom-yofst);
			ctx.stroke();
			x++;
		}
		var y = Math.ceil(this.renderingArea.y/this.boxSize);
		while(y*this.boxSize <= this.renderingArea.bottom){
			ctx.beginPath();
			ctx.moveTo(this.renderingArea.left-xofst, (y*this.boxSize)-yofst); 
			ctx.lineTo(this.renderingArea.right-xofst, (y*this.boxSize)-yofst);
			ctx.stroke();
			y++;
		}
		return this;
	}
	
	isInBounds(cell){
		return cell.row*this.boxSize >= this.renderingArea.left &&
			cell.row*this.boxSize <= this.renderingArea.right &&
			cell.col*this.boxSize >= this.renderingArea.top &&
			cell.col*this.boxSize <= this.renderingArea.bottom
	}
	
	render(liveCells){	
		this.ctx.fillStyle = this.deadColor;
		this.ctx.fillRect(
			this.renderingArea.x, 
			this.renderingArea.y, 
			this.renderingArea.width, 
			this.renderingArea.height
		);
		for(var i=liveCells.length; i--;) if(this.isInBounds(liveCells[i])) this.renderCell(liveCells[i]);		
		this.ctx.drawImage(
			this.gridOverlay.img,
			this.gridOverlay.bounds.x,
			this.gridOverlay.bounds.y//,
//			this.gridOverlay.bounds.width, 
//			this.gridOverlay.bounds.height
		);
		return this;
	}
	
	renderCell(cell){
		this.ctx.fillStyle = cell.alive ? this.aliveColor : this.deadColor;
		this.ctx.fillRect((cell.col*this.boxSize)+.5, (cell.row*this.boxSize)+.5, this.boxSize-1, this.boxSize-1);
		return this;
	}
	
	generateGridOverlay(){
		this.gridOverlay.bounds = new DOMRect(
			this.renderingArea.x, 
			this.renderingArea.y, 
			this.renderingArea.width, 
			this.renderingArea.height
		);
		return new Promise(done=>{
			if(this.renderTimeout !== false) clearTimeout(this.renderTimeout);
			this.renderTimeout = setTimeout(()=>{
				var canvas = document.createElement('canvas'),
					ctx = canvas.getContext("2d"),
					gridOverlay = new Image();
				canvas.width = this.gridOverlay.bounds.width;
				canvas.height = this.gridOverlay.bounds.height;
				this.renderGridLines(ctx, this.renderingArea.x, this.renderingArea.y);
				gridOverlay.onload = ()=>{
					if(
						this.gridOverlay.bounds.x === this.renderingArea.x &&
						this.gridOverlay.bounds.y === this.renderingArea.y &&
						this.gridOverlay.bounds.width === this.renderingArea.width &&
						this.gridOverlay.bounds.height === this.renderingArea.height
					){
						this.gridOverlay.img = gridOverlay;
						this.renderTimeout = false;
					}
					done();
				};
				var duri = canvas.toDataURL();
				gridOverlay.src = duri;
			},1000);
		});
	}
}