
// http://ascii-table.com/ansi-escape-sequences.php
// http://www.termsys.demon.co.uk/vtansi.htm

class TTY{
	constructor(){
		var esc = '\x1B';
		this.forground_colors = {
			red: `${esc}[31m`
		};
	}
	
	size(){
		return {
			cols: process.stdout.columns,
			rows: process.stdout.rows
		};
	}
	
	parse(str){
		const deQuote = str => {
			if (str.charAt(0) === '"' && str.charAt(str.length -1) === '"'){
				str=(str.substr(1,str.length -2)).replace(/\\"/g, '"');
			}else if(str.charAt(0) === "'" && str.charAt(str.length -1) === "'"){
				str=(str.substr(1,str.length -2)).replace(/\\'/g, "'");
			}
			return str;
		};
		var match, attrs,
			attr_re = /\b([a-zA-Z0-9-_]*)=("(?:[^"\\]|\\.)*"|[^\s>]*)/g;
		str = str.replace(/<tty\s*([^>]+)>/gm, function(tag, attributes){
			attrs = {};
			match = attr_re.exec(attributes);
			while(match){
				attrs[match[1].toUpperCase()]=deQuote(match[3]||'').toLowerCase();
				match = attr_re.exec(attributes);
			}
		});
		return str;
	}
	
	out(seq){
		process.stdout.write(seq);
	}
}

var tty = new TTY;
var str = "some stuff <tty color='green' poo=wer>farts some more stuff and another <tty reset='all' > and a thing here that is <tty something=poop>farts and things";

console.log(tty.parse(str));