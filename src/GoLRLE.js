
class GoLRLE extends GoLPatternFile {
	constructor(opts) {
		super(opts);
	}

	fromRawData(str) {
		return this.parseName(str)
			.parseComments(str)
			.parseAuthor(str)
			.parsePosition(str)
			.parseRuleFromHeader(str)
			.parseHeaderLine(str)
			.parseCellData(str);
	}

	parsePosition(str) {
		var pos = (str.match(/^#R.*/gm) || [''])[0];
		if (!pos) return this;
		pos = pos.match(/-?\d*/g).filter(n => !!n);
		if (pos[0]) this.relativePos.x = parseInt(pos[0]);
		if (pos[1]) this.relativePos.y = parseInt(pos[1]);
		return this;
	}

	parseRuleFromHeader(str) {
		var rs = (str.match(/^#r.*/gm) || [''])[0];
		if (rs) rs = rs.substr(2).trim();
		this.ruleStr = rs;
		return this;
	}

	parseName(str) {
		var name = (str.match(/^#N.*/gm) || [''])[0];
		if (name) name = name.substr(2).trim();
		this.name = name;
		return this;
	}

	parseAuthor(str) {
		var author = (str.match(/^#O.*/gm) || [''])[0];
		if (author) author = author.substr(2).trim();
		this.author = author;
		return this;
	}

	parseComments(str) {
		var comments = str.match(/^#C.*|^#c.*/gm) || [];
		comments = comments.map(c => c.substr(2).trim());
		this.comments = comments;
		return this;
	}

	parseHeaderLine(str) {
		var hl = str.toLowerCase()
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

	parseCellData(str) {
		var cd = str.match(/^[\dbo\$]*!?$/gm) || [],
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
}