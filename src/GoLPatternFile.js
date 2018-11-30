
class GoLPatternFile {
	constructor(opts) {
		if (!opts) opts = {};
		this.name = opts.name || '';
		this.comments = opts.comments || [];
		this.author = opts.author || '';
		this.relativePos = opts.relativePos || {x: 0, y: 0};
		this.ruleStr = opts.ruleStr || 'B3/S23';
		this.width = opts.width || 0;
		this.height = opts.height || 0;
		this.rows = opts.rows || [];
		this.raw = opts.raw || '';
	}
	
	encode(rows){
		this.rows = rows && rows.length ? rows : this.rows;
		return this; 
	}
	
	decode(raw){
		this.raw = raw || this.raw;
		return this; 
	}
}