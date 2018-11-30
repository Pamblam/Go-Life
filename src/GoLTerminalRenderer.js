

class GoLTerminalRenderer extends GoLRenderer{
	constructor(opts){
		super(opts);
		var s = this.size();
		this.columns = s.cols * 5;
		this.rows = s.rows * 5;
		this.renderingArea = {columns: s.cols, rows: s.rows};
		this.type = 'terminal';
		this.esc = '\x1B';
		
		this.deadColorCode = `${this.esc}[${(this.getColor(this.deadColor)||37)}m`;
		this.liveColorCode = `${this.esc}[${(this.getColor(this.aliveColor)||30)}m`;
	}
	
	getColor(color){
		color = color.toLowerCase();
		var n = false;
		switch(color){
			case 'black': n = 30; break;	
			case 'red': n = 31; break;
			case 'green': n = 32; break;
			case 'yellow': n = 33; break;
			case 'blue': n = 34; break;
			case 'magenta': n = 35; break;
			case 'cyan': n = 36; break;
			case 'white': n = 37; break;
		}
		return n;
	}
	
	size(){
		return {
			cols: process.stdout.columns,
			rows: process.stdout.rows
		};
	}
	
	clear(){
		process.stdout.write(`${this.esc}[2J${this.esc}[0f`);
	}
	
	render(liveCells){ 
		liveCells = liveCells.map(c=>c.name);
		this.clear();
		const live = this.liveColorCode+'█';
		const dead = this.deadColorCode+'█';
		for(let r=0; r<this.renderingArea.rows; r++){
			for(let c=0; c<this.renderingArea.columns; c++){
				process.stdout.write(~liveCells.indexOf(`${r},${c}`) ? live : dead);
			}
		}
		process.stdout.write(`${this.esc}[0m`);
	}
}