
class GoLCell{
	constructor(row, col){
		this.alive = false;
		this.name = `${row},${col}`;
		this.row = row;
		this.col = col;
	}
}