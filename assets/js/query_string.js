/**
 * A helper class to modify url parameters
 * Constructor takes options object with 2 possible parameters
 *  url: the url to parse, use the current page's url by default
 *  parse_json: parses json in the query string, true by default
 * @author Rob Parham 2018
 * @website github.com/pamblam
 * @license wtfpl
 */
class QueryString{
	
	constructor(opts){
		opts = opts || {};
		this.uri = opts.url || window.location.href;
		this.parse_json = opts.hasOwnProperty('parse_json') ? opts.parse_json : true;
	}
	
	/**
	 * Get or set the hash part of the url
	 * @param hash (optional) - if provided this will set the hash value
	 * @returns the current hash or an empty string
	 */
	hash(hash){
		if(hash !== undefined){
			if(!this.uri) this.uri = window.location.href;
			this.uri = this.uri.slice(this.uri.indexOf('#')+1);
			if(hash){
				if(hash.substr(0,1)!=='#') hash = '#'+hash;
				this.uri += hash;
			}
		}
		var url = this.uri || window.location.href,
			hm = url.indexOf('#')+1,
			hash = hm ? url.slice(hm) : '';
		return hash ? '#'+hash : '';
	}
	
	/**
	 * Get a query string parameter by name
	 * @param name - the name of the parameter to get
	 * @return null, or the value of the parameter, JSON encoded, if opt set
	 */
	get(name) {
		var p = this.params(),
			r = p.hasOwnProperty(name) ? p[name] : null;
		if(this.parse_json){
			try{ r = JSON.parse(r); }catch(e){}
		}
		return r;
	}
	
	/**
	 * Set the value of a url parameter
	 * @param name - the name of the paramter to set
	 * @param value - the value to set the parameter to set
	 * @returns this - for chainability
	 */
	set(name, value=''){
		var qs, p = this.params();
		p[name]=value;
		qs = this.stringify(p);
		this.uri = this.url();
		if(qs) this.uri+='?'+qs;
		this.uri+=this.hash();
		return this;
	}
	
	/**
	 * Delete a url parameter by name
	 * @param name - the name of the paramter to remove
	 * @returns this - for chainability
	 */
	delete(name){
		var qs, p = this.params();
		delete p[name];
		qs = this.stringify(p);
		this.uri = this.url();
		if(qs) this.uri+='?'+qs;
		this.uri+=this.hash();
		return this;
	}
	
	/**
	 * Update th url in the url bar and the history stack
	 * @returns this - for chainability
	 */
	update(){
		var obj = {Title: document.title, Url: this.uri};      
		history.replaceState(obj, obj.Title, obj.Url); 
		return this;
	}
	
	/**
	 * Open the url (with refresh) in the target window
	 * @param target - the target window (_self by default)
	 */
	go(target='_self'){
		window.open(this.uri, target);
	}
	
	/**
	 * Get the url part of the url (everything before the "?")
	 * @returns base url
	 */
	url(){
		var url = this.uri || window.location.href, 
			qm = url.indexOf('?');
		return url.slice(0, ~qm ? qm : url.length);
	}
	
	/**
	 * Get the query string part of the url
	 * @returns query string
	 */
	query(){
		var url = this.uri || window.location.href,
			qm = url.indexOf('?')+1,
			qs = qm ? url.slice(qm) : '',
			hm = qs.indexOf('#'),
			qs = ~hm ? qs.slice(0, hm) : qs;
		return qs;
	}
	
	/**
	 * Get an object with all the URL paramters
	 * @returns an object representing the query string
	 */
	params(){
		var strArr = this.query().replace(/^&/, '').replace(/&$/, '').split('&'),
			sal = strArr.length, i, j, ct, p, lastObj, obj, chr, tmp, key, value,
			postLeftBracketPos, keys, keysLen, array = {};
		const _fixStr = str=>decodeURIComponent(str.replace(/\+/g, '%20'));
		for (i = 0; i < sal; i++) {
			tmp = strArr[i].split('=');
			key = _fixStr(tmp[0]);
			value = (tmp.length < 2) ? '' : _fixStr(tmp[1]);
			while (key.charAt(0) === ' ') key = key.slice(1);
			if (key.indexOf('\x00') > -1) key = key.slice(0, key.indexOf('\x00'));
			if (key && key.charAt(0) !== '[') {
				keys = [];
				postLeftBracketPos = 0;
				for (j = 0; j < key.length; j++) {
					if (key.charAt(j) === '[' && !postLeftBracketPos) {
						postLeftBracketPos = j + 1;
					} else if (key.charAt(j) === ']') {
						if (postLeftBracketPos) {
							if (!keys.length) keys.push(key.slice(0, postLeftBracketPos - 1));
							keys.push(key.substr(postLeftBracketPos, j - postLeftBracketPos));
							postLeftBracketPos = 0;
							if (key.charAt(j + 1) !== '[') break;
						}
					}
				}
				if (!keys.length) keys = [key];
				for (j = 0; j < keys[0].length; j++) {
					chr = keys[0].charAt(j);
					if (chr === ' ' || chr === '.' || chr === '[') 
						keys[0] = keys[0].substr(0, j) + '_' + keys[0].substr(j + 1);
					if (chr === '[') break;
				}
				obj = array;
				for (j = 0, keysLen = keys.length; j < keysLen; j++) {
					key = keys[j].replace(/^['"]/, '').replace(/['"]$/, '');
					lastObj = obj;
					if ((key === '' || key === ' ') && j !== 0) {
						ct = -1;
						for (p in obj)
							if (obj.hasOwnProperty(p) && +p > ct && p.match(/^\d+$/g)) 
								ct = +p;
						key = ct + 1;
					}
					if (Object(obj[key]) !== obj[key]) obj[key] = {};
					obj = obj[key];
				}
				lastObj[key] = value;
			}
		}
		return array;
	}
	
	/**
	 * Provided an object, it will convert it to a query string
	 * @param data object to convert
	 * @returns query string
	 */
	stringify(data){
		var value, key, tmp = [];
		const encodeFunc = data=>encodeURIComponent(''+data).replace(/!/g, '%21')
			.replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29')
			.replace(/\*/g, '%2A').replace(/%20/g, '+');
		const _hbqHelper = (key, val)=>{
			var k, tmp = [];
			if (val === true) val = '1';
			else if (val === false) val = '0';
			if (val !== null) {
				if (typeof val === 'object') {
					for (k in val)
						if (val[k] !== null) 
							tmp.push(_hbqHelper(key+'['+k+']', val[k], '&'));
					return tmp.join('&');
				} else if (typeof val !== 'function') return encodeFunc(key)+'='+encodeFunc(val);
				else return false;
			} else return '';
		};
		for (key in data) {
			value = data[key];
			var query = _hbqHelper(key, value, '&');
			if(query === false) continue;
			if (query !== '') tmp.push(query)
		}
		return tmp.join('&');
	}
	
}