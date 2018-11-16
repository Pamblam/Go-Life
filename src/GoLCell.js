
class GoLCell{
	constructor(x, y, size, row, col, name){
		this.x = x;
		this.y = y;
		this.size = size;
		this.alive = false;
		this.name = `${row},${col}`;
		this.row = row;
		this.col = col;
	}
}