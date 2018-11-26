
class GoLRLE extends GoLPatternFile {
	constructor(opts) {
		super(opts);
	}

	encode(rows) {
		super.encode(rows);
		var raw = [];
		this.generateOffsets();
		raw.push(...this.generateName());
		raw.push(...this.generateComments());
		raw.push(...this.generateAuthor());
		raw.push(...this.generatePosition());
		raw.push(...this.generateHeaderLine());
		raw.push(...this.generateRowLines());
		this.raw = raw.join("\n");
		return this;
	}

	decode(str) {
		super.decode(str);
		return this.parseName()
			.parseComments()
			.parseAuthor()
			.parsePosition()
			.parseRuleFromHeader()
			.parseHeaderLine()
			.parseCellData();
	}
	
	generateRowLines(){
		var run_len = 0, tag = false, str = [], r, c, row, cell, bcnt = 0;
		for(r=0; r<this.rows.length; r++){
			row = this.rows[r];
			for(c=0; c<row.length; c++){
				cell = row[c] == 1 ? 'o' : 'b';
				if(tag === false){
					tag = cell;
					run_len = 1;
				}else if(tag === cell){
					run_len++;
				}else{
					if(bcnt){
						if(bcnt>1) str.push(bcnt);
						str.push('$');
						bcnt = 0;
					}
					if(run_len>1) str.push(run_len);
					str.push(tag);
					tag = cell;
					run_len = 1;
				}
			}
			if(tag === 'o'){
				if(run_len>1) str.push(run_len);
				str.push(tag);
			}
			tag = false;
			run_len = 0;
			bcnt++;
		}
		if(tag === 'o'){
			if(bcnt){
				if(bcnt>1) str.push(bcnt);
				str.push('$');
			}
			if(run_len>1) str.push(run_len);
			str.push(tag);
		}
		str.push('!');
		return this.stringChunker(str.join(''));
	}
	
	generateHeaderLine(){
		return [`x = ${this.rows[0].length}, y = ${this.rows.length}, rule = ${this.ruleStr}`];
	}
	
	generatePosition(){
		return this.relativePos.x == 0 && this.relativePos.y == 0 ? [] : [`#P ${this.relativePos.x} ${this.relativePos.y}`];
	}
	
	generateComments(){
		var cl = this.stringChunker(this.comments, 67), i, r=[];
		for(var i=0; i<cl.length; i++){
			if(cl[i].trim()) r.push("#C "+cl[i].trim());
		}
		return r;
	}
	
	generateAuthor(){
		var al = this.stringChunker(this.author, 67), i, r=[];
		for(var i=0; i<al.length; i++){
			if(al[i].trim()) r.push("#O "+al[i].trim());
		}
		return r;
	}
	
	generateName(){
		var nl = this.stringChunker(this.name, 67), i, r=[];
		for(var i=0; i<nl.length; i++){
			if(nl[i].trim()) r.push("#N "+nl[i].trim());
		}
		return r;
	}
	
	generateOffsets(){
		var minr=false, minc=false, maxr=0, maxc=0, r, c, hascells, 
			row, cell, rows=[], tmprow=[];
		for(r=0; r<this.rows.length; r++){
			row = this.rows[r];
			hascells = false
			for(c=0; c<row.length; c++){
				cell = row[c];
				if(cell == 1){
					hascells=true;
					if(false===minc || c<minc) minc=c;
					if(c>maxc) maxc = c;
				}
			}
			if(hascells && false===minr) minr=r;
			if(hascells && r>maxr) maxr = r;
		}
		minr=minr||0; minc=minc||0;
		this.relativePos = {x: minc, y: minr};
		for(r=minr; r<maxr+1; r++){
			row = this.rows[r] || [];
			tmprow=[];
			for(c=minc; c<maxc+1; c++){
				cell = row[c] || 0;
				tmprow.push(cell);
			}
			rows.push(tmprow);
		}
		this.rows = rows;
		return this;
	}
	
	parsePosition() {
		var pos = (this.raw.match(/^#R.*/gm) || [''])[0];
		if (!pos) return this;
		pos = pos.match(/-?\d*/g).filter(n => !!n);
		if (pos[0]) this.relativePos.x = parseInt(pos[0]);
		if (pos[1]) this.relativePos.y = parseInt(pos[1]);
		return this;
	}

	parseRuleFromHeader() {
		var rs = (this.raw.match(/^#r.*/gm) || [''])[0];
		if (rs) rs = rs.substr(2).trim();
		this.ruleStr = rs;
		return this;
	}

	parseName() {
		var name = (this.raw.match(/^#N.*/gm) || [''])[0];
		if (name) name = name.substr(2).trim();
		this.name = name;
		return this;
	}

	parseAuthor() {
		var author = (this.raw.match(/^#O.*/gm) || [''])[0];
		if (author) author = author.substr(2).trim();
		this.author = author;
		return this;
	}

	parseComments() {
		var comments = this.raw.match(/^#C.*|^#c.*/gm) || [];
		comments = comments.map(c => c.substr(2).trim());
		this.comments = comments;
		return this;
	}

	parseHeaderLine() {
		var hl = this.raw.toLowerCase()
		hl = hl.match(/x\s?=\s?\d*\s?,\s?y\s?=\s?\d*.*/gm);
		hl = (hl || [''])[0];
		if (!hl) return this;
		hl.split(",").map(m => m.trim()).forEach(p => {
			var v = p.split('=')[1].trim();
			if (p.substr(0, 1) === 'x') {
				this.width = parseInt(v);
			} else if (p.substr(0, 1) === 'y') {
				this.height = parseInt(v);
			} else if (p.substr(0, 1) === 'r') {
				this.ruleStr = v;
			}
		});
		return this;
	}

	parseCellData() {
		var cd = this.raw.match(/^[\dbo\$]*!?$/gm) || [],
			rows = [], row = [], s, n,
			parts = cd.filter(n => !!n).join('').match(/\d*b|\d*o|\d*\$/gm) || [];
		parts.forEach(c => {
			var s = c.substr(-1);
			var n = parseInt((c.match(/\d*/g) || []).filter(n => !!n)[0] || 1);
			while (n--) {
				if (s == '$') {
					rows.push(row);
					row = [];
				} else row.push(s == 'o' ? 1 : 0);
			}
		});
		if (row.length) rows.push(row);
		this.rows = rows;
		return this;
	}
	
	stringChunker(str, len=70){
		var ret = [], r = [], s, n, offset, strLen, tmp;
		str = Array.isArray(str) ? str : [str];
		for(s=0; s<str.length; s++){
			tmp = str[s].split(/\n/g);
			for(n=0; n<tmp.length; n++) if(tmp[n]) r.push(tmp[n]);
		}
		for(s=0; s<r.length; s++){
			for (offset = 0, strLen = r[s].length; offset < strLen; offset += len) {
			  ret.push(r[s].substring(offset, offset + len));
			}
		}
		return ret;
	}
}