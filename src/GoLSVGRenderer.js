

class GoLSVGRenderer extends GoLRenderer{
	constructor(svg, opts){
		super(opts);
		this.ele = svg;
		this.columns = Math.floor(this.ele.getAttribute('width')/this.boxSize);
		this.rows = Math.floor(this.ele.getAttribute('height')/this.boxSize);
		this.renderingArea = new DOMRect(0, 0, parseInt(this.ele.getAttribute('width')), parseInt(this.ele.getAttribute('height')));
		this.renderTimeout = false;
		this.renderGridLines();
		this.type = 'svg';
	}
	
	reset(){
		while (this.ele.lastChild) this.ele.removeChild(this.ele.lastChild);
		return this.renderGridLines();
	}
	
	renderGridLines(){		
		var line, rect, x, y;
		rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
		rect.setAttribute('x', 0);
		rect.setAttribute('y', 0);
		rect.setAttribute('width', this.ele.getAttribute('width'));
		rect.setAttribute('height', this.ele.getAttribute('height'));
		rect.setAttribute('fill', this.deadColor);
		this.ele.appendChild(rect);
		x = 0;
		while(x*this.boxSize <= parseInt(this.ele.getAttribute('width'))){
			line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', x*this.boxSize);
			line.setAttribute('x2', x*this.boxSize);
			line.setAttribute('y1', 0);
			line.setAttribute('y2', this.ele.getAttribute('height'));
			line.setAttribute('stroke-width', 1);
			line.setAttribute('stroke', this.gridColor);
			this.ele.appendChild(line);
			x++;
		}
		y = 0;
		while(y*this.boxSize <= parseInt(this.ele.getAttribute('height'))){
			line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
			line.setAttribute('x1', 0);
			line.setAttribute('x2', this.ele.getAttribute('width'));
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
			rect.setAttribute('fill', this.aliveColor);
			rect.setAttribute('id', cell.name);
			this.ele.appendChild(rect);
		}else{
			try{ this.ele.removeChild(document.getElementById(cell.name)); }catch(e){}
		}
		return this;
	}
}