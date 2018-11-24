

class GoLSVGRenderer extends GoLRenderer{
	constructor(svg, opts){
		super(opts);
		this.ele = svg;
		this.columns = Math.floor(this.ele.getAttribute('width')/this.boxSize);
		this.rows = Math.floor(this.ele.getAttribute('height')/this.boxSize);
		this.renderingArea = new DOMRect(0, 0, parseInt(this.ele.getAttribute('width')), parseInt(this.ele.getAttribute('height')));
		this.renderTimeout = false;
		this.renderGridLines();
	}
	
	renderGridLines(){		
		var line;
		var x = Math.ceil(this.renderingArea.x/this.boxSize);
		while(x*this.boxSize <= this.renderingArea.right){
			line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', x*this.boxSize);
			line.setAttribute('x2', x*this.boxSize);
			line.setAttribute('y1', this.renderingArea.top);
			line.setAttribute('y2', this.renderingArea.bottom);
			line.setAttribute('stroke-width', 1);
			line.setAttribute('stroke', this.gridColor);
			this.ele.appendChild(line);
			x++;
		}
		var y = Math.ceil(this.renderingArea.y/this.boxSize);
		while(y*this.boxSize <= this.renderingArea.bottom){
			line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', this.renderingArea.left);
			line.setAttribute('x2', this.renderingArea.right);
			line.setAttribute('y1', y*this.boxSize);
			line.setAttribute('y2', y*this.boxSize);
			line.setAttribute('stroke-width', 1);
			line.setAttribute('stroke', this.gridColor);
			this.ele.appendChild(line);
			y++;
		}
		return this;
	}
	
	render(liveCells){
		Array.from(this.ele.getElementsByTagName('rect')).forEach(rect=>{
			if(this.isCoordsInBounds(parseInt(rect.getAttribute('x')), parseInt(rect.getAttribute('y')))){
				this.ele.removeChild(rect);
			}
		});
		for(var i=liveCells.length; i--;){ 
			if(this.isInBounds(liveCells[i])){ 
				this.renderCell(liveCells[i]);
			}
		}
		return this;
	}
	
	renderCell(cell){
		if(cell.alive){
			var rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
			rect.setAttribute('x', (cell.col*this.boxSize)+.5);
			rect.setAttribute('y', (cell.row*this.boxSize)+.5);
			rect.setAttribute('width', this.boxSize-1);
			rect.setAttribute('height', this.boxSize-1);
			rect.setAttribute('fill', cell.alive);
			rect.setAttribute('id', cell.name);
			this.ele.appendChild(rect);
		}else{
			this.ele.removeChild(document.getElementById(cell.name));
		}
		return this;
	}
}