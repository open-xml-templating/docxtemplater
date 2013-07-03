function QRCode(){
	this.XOR = "101010000010010"; // 0x5412
	this.version = null; // 型
	this.errorCorrectLevel = null; // 誤り訂正レベル 01=L 00=M 11=Q 10=H
	this.maskpattern = null; // マスクパターン
	this.modulesize = null;// モジュールのサイズ
	this.pixcel = new Array(); // モジュールマトリックス
	this.functionPattern = new Array();// ファンクションパターンマトリックス
	this.sirial = ""; // ビット列
}

QRCode.prototype = {
	getContsnts : function(imagedata){
	  imagedata = this.binarize(imagedata,0.5);
		this.readData(imagedata);
		var simbolsize = version * 4 + 17;
		var mode = true;
		var ecl = 0;
		if(errorCorrectLevel == "01"){
			ecl = 0;
		}else if(errorCorrectLevel == "00"){
			ecl = 1;
		}else if(errorCorrectLevel == "11"){
			ecl = 2;
		}else if(errorCorrectLevel == "10"){
			ecl = 3;
		}
		var dataCode = new BlockMap(version,ecl);
		for(i = simbolsize - 1;i > 0;i = i - 2){
			if(mode){
				for(j = simbolsize - 1;j >= 0;j--){
					if(!this.isFunctionPattern(j, i)){
						dataCode.push(this.unmusk(j, i));
					}
					if(!this.isFunctionPattern(j, i - 1)){
						dataCode.push(this.unmusk(j,i - 1));
					}
				}
				mode = false;
			}else{
				for(j = 0;j < simbolsize;j++){
					if(!this.isFunctionPattern(j, i)){
						dataCode.push(this.unmusk(j,i));
					}
					if(!this.isFunctionPattern(j, i - 1)){
						dataCode.push(this.unmusk(j,i - 1));
					}
				}
				mode = true;
			}
			if(i == 8){
				i--;
			}
		}
		dataCode.makeDataBlock(version,ecl);
		this.sirial = dataCode.silialize(version,ecl);
		return this.getString();
	},
  /**
   * ImageDataのニ値化
   * 
   * @param imageData 変換対象のImageData
   * @param threshold 閾値 0 ～ 1.0 デフォルト0.5
   * @return 変換後のImageData
   */
  binarize : function (imageData, threshold) {
      var pixels = imageData.data;
      var length = pixels.length;
  
      if (isNaN(threshold)) {
          threshold = 0.5;
      }
  
      threshold *= 255;
  
      for (var i = 0; i < length;) {
          var average = pixels[i] + pixels[i + 1] + pixels[i + 2] / 3;
  
          pixels[i++] = pixels[i++] = pixels[i++] = average <= threshold ? 0 : 255;
          pixels[i++] = 255;
      }
  
      return imageData;
  },

	/*
	 * イメージデータをモジュールに変換
	 */
	readData : function(imagedata){
		var firstpoint = null;
		var lastpoint = null;
		var findpoint = null;
		for(i = 0;i < imagedata.width;i++){
			for(j = 0;j < imagedata.height;j++){
				// firstpoint
				if(imagedata.getPoints(i,j).isDark() && firstpoint == null){
					firstpoint = [i,j];
				}
				// finderpattern
				if(!imagedata.getPoints(i,j).isDark() && firstpoint != null && findpoint == null){
					findpoint = [i,j];
				}
				// last Darkpoint
				if(imagedata.getPoints(i,j).isDark()){
					lastpoint = [i,j];
				}
			}
			if(firstpoint != null && findpoint != null){
				break;
			}
		}
		modulesize = (findpoint[1] -firstpoint[1]) / 7;
		version = (((lastpoint[1] - firstpoint[1]) + 1) / modulesize - 17) / 4;
		var simbolsize = version * 4 + 17;
		// simbol matrix init
		var pix = new Array(simbolsize);
		for(i=0;i < simbolsize;i++){
			pix[i] = new Array(simbolsize);
		}
		for(i = 0;i < simbolsize;i++){
			for(j = 0;j < simbolsize;j++){
				point_y = firstpoint[0] + (i * modulesize);
				point_x = firstpoint[1] + (j * modulesize);
				pix[i][j] = imagedata.getPoints(point_x,point_y).isDark(); 
			}
		}

		this.pixcel = pix;
		
		var format_info1 = "";
		var format_info2 = "";
		
		// [8][0]
		if(this.pixcel[8][0]){
			format_info1 = "1";
		}else{
			format_info1 = "0";
		}
		// [8][1]
		if(this.pixcel[8][1]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [8][2]
		if(this.pixcel[8][2]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [8][3]
		if(this.pixcel[8][3]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [8][4]
		if(this.pixcel[8][4]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [8][5]
		if(this.pixcel[8][5]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [8][7]
		if(this.pixcel[8][7]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [8][8]
		if(this.pixcel[8][8]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [7][8]
		if(this.pixcel[7][8]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [5][8]
		if(this.pixcel[5][8]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [4][8]
		if(this.pixcel[4][8]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [3][8]
		if(this.pixcel[3][8]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [2][8]
		if(this.pixcel[2][8]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [1][8]
		if(this.pixcel[1][8]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		// [0][8]
		if(this.pixcel[0][8]){
			format_info1 += "1";
		}else{
			format_info1 += "0";
		}
		
		for(i = 1;i < 8;i++){
			if(this.pixcel[simbolsize - i][8]){
				format_info2 += "1";
			}else{
				format_info2 += "0";
			}
		}
		for(i = 0;i < 8;i++){
			if(this.pixcel[8][simbolsize - (8 - i)]){
				format_info2 += "1";
			}else{
				format_info2 += "0";
			}
		}

		if(format_info1 != format_info2){
			throw new Error("Format Info Error!");
		}
		var formatInfo = "";
		for(i = 0;i < 15;i++){
			if(format_info1.charAt(i) == this.XOR.charAt(i)){
				formatInfo += "0";
			}else{
				formatInfo += "1";
			}
		}
		errorCorrectLevel = formatInfo.substring(0,2);
		maskpattern =  formatInfo.substring(2,5);

		this.makeFunctionPattern();
	},
	getDataBlock : function(){
		
	},
	/*
	 * アンマスク
	 */
	unmusk : function(i,j){
		switch (maskpattern){
	    case "000" : 
	    		if((i + j) % 2 == 0){
	    			if(!this.pixcel[i][j]){
	    				return true;
	    			}else{
	    				return false;
	    			}
	    		}
	    		return this.pixcel[i][j];
	    case "001" : 
	    		if(i % 2 == 0){
	    			if(!this.pixcel[i][j]){
	    				return true;
	    			}else{
	    				return false;
	    			}
	    		}
	    		return this.pixcel[i][j];
	    case "010" :
	    		if(j % 3 == 0){
	    			if(!this.pixcel[i][j]){
	    				return true;
	    			}else{
	    				return false;
	    			}
	    		}
	    		return this.pixcel[i][j];
	    case "011" :
	    		if((i + j) % 3 == 0){
	    			if(!this.pixcel[i][j]){
	    				return true;
	    			}else{
	    				return false;
	    			}
	    		}
	    		return this.pixcel[i][j];
	    case "100" :
	    		if((Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0){
	    			if(!this.pixcel[i][j]){
	    				return true;
	    			}else{
	    				return false;
	    			}
	    		}
	    		return this.pixcel[i][j];
	    case "101" :
	    		if((i * j) % 2 + (i * j) % 3 == 0){
	    			if(!this.pixcel[i][j]){
	    				return true;
	    			}else{
	    				return false;
	    			}
	    		}
	    		return this.pixcel[i][j];
	    case "110" :
	    		if(( (i * j) % 2 + (i * j) % 3) % 2 == 0){
	    			if(!this.pixcel[i][j]){
	    				return true;
	    			}else{
	    				return false;
	    			}
	    		}
	    		return this.pixcel[i][j];
	    case "111" :
	    		if(( (i * j) % 3 + (i + j) % 2) % 2 == 0){
	    			if(!this.pixcel[i][j]){
	    				return true;
	    			}else{
	    				return false;
	    			}
	    		}
	    		return this.pixcel[i][j];

	    default :
		    throw new Error("bad maskPattern:" + maskPattern);
		}
	},
	/*
	 * ファンクションパターン判別
	 */
	isFunctionPattern : function(i,j){
		return this.functionPattern[i][j];
		
	},
	/*
	 * 
	 */
	blockMap : function(){
		var dataCode = new Array();
		var rsBlock = new Array();
	},
	/*
	 * ファンクションパターン生成
	 */
	makeFunctionPattern : function(){
		var simbolsize = version * 4 + 17;
		var funcpattern = new Array(simbolsize);
		for(i = 0;i < simbolsize;i++){
			funcpattern[i] = new Array(simbolsize);
		}
		for(i = 0;i < simbolsize;i++){
			for(j = 0;j < simbolsize;j++){
				funcpattern[i][j] = false;
			}
		}

		// 位置検出パターン＋分離パターン
		// Left Top
		for(i = 0;i < 8;i++){
			for(j = 0;j < 8;j++){
				funcpattern[i][j] = true;
			}
		}
		// Right Top
		for(i = 0;i < 8;i++){
			for(j = 1;j < 9;j++){
				funcpattern[i][simbolsize - j] = true;
			}
		}
		// Left Down
		for(i = 1;i < 9;i++){
			for(j = 0;j < 8;j++){
				funcpattern[simbolsize - i][j] = true;
			}
		}
		this.functionPattern = funcpattern;
		// 位置合わせパターン
	    alignment_pattern = 
	    	[[],[6, 18],[6, 22],[6, 26],[6, 30],[6, 34],[6, 22, 38],[6, 24, 42],
	    	 [6, 26, 46],[6, 28, 50],[6, 30, 54],[6, 32, 58],[6, 34, 62],[6, 26, 46, 66],
	    	 [6, 26, 48, 70],[6, 26, 50, 74],[6, 30, 54, 78],[6, 30, 56, 82],[6, 30, 58, 86],
	    	 [6, 34, 62, 90],[6, 28, 50, 72, 94],[6, 26, 50, 74, 98],[6, 30, 54, 78, 102],
	    	 [6, 28, 54, 80, 106],[6, 32, 58, 84, 110],[6, 30, 58, 86, 114],[6, 34, 62, 90, 118],
	    	 [6, 26, 50, 74, 98, 122],[6, 30, 54, 78, 102, 126],[6, 26, 52, 78, 104, 130],
	    	 [6, 30, 56, 82, 108, 134],[6, 34, 60, 86, 112, 138],[6, 30, 58, 86, 114, 142],
	    	 [6, 34, 62, 90, 118, 146],[6, 30, 54, 78, 102, 126, 150],[6, 24, 50, 76, 102, 128, 154],
	    	 [6, 28, 54, 80, 106, 132, 158],[6, 32, 58, 84, 110, 136, 162],[6, 26, 54, 82, 110, 138, 166],[6, 30, 58, 86, 114, 142, 170]];
	    var alignment = alignment_pattern[version - 1];
	    for(i = 0;i < alignment.length;i++){
		    for(j = 0;j < alignment.length;j++){
		    	var row = alignment[i];
		    	var col = alignment[j];
		    	if(!this.functionPattern[row][col]){
			    	for(r = -2;r <= 2;r++){
			    		for(c = -2;c <= 2;c++){
			    			funcpattern[row + r][col + c] = true;
			    		}
			    	}
		    	}
		    }
	    }
		// タイミングパターン
		for(i = 8;i < simbolsize - 8;i++){
			funcpattern[6][i] = true;
			funcpattern[i][6] = true;
		}
	    
	    // 形式情報（正確には機能パターンではないが順序を逆にしているためマスクさせないため）
		// [0][8]
	    funcpattern[0][8] = true;
		// [1][8]
	    funcpattern[1][8] = true;
		// [2][8]
	    funcpattern[2][8] = true;
		// [3][8]
	    funcpattern[3][8] = true;
		// [4][8]
	    funcpattern[4][8] = true;
		// [5][8]
	    funcpattern[5][8] = true;
		// [7][8]
	    funcpattern[7][8] = true;
		// [8][8]
	    funcpattern[8][8] = true;
		// [8][7]
	    funcpattern[8][7] = true;
		// [8][5]
	    funcpattern[8][5] = true;
		// [8][4]
	    funcpattern[8][4] = true;
		// [8][3]
	    funcpattern[8][3] = true;
		// [8][2]
	    funcpattern[8][2] = true;
		// [8][1]
	    funcpattern[8][1] = true;
		// [8][0]
	    funcpattern[8][0] = true;
		for(i = 1;i < 9;i++){
			funcpattern[8][simbolsize - i] = true;
		}
		for(i = 1;i < 8;i++){
			funcpattern[simbolsize - (8 - i)][8] = true;
		}

		// 暗モジュール（4V+9,8)常に暗のモジュール
		funcpattern[simbolsize - 8][8] = true;
		// バージョン７以上のとき型番情報
		if(version >=7){
			for(i = 0;i < 7;i++){
				for(j = 8;j < 12;j++){
					funcpattern[i][simbolsize - j] = true;
					funcpattern[simbolsize - j][i] = true;
				}
			}
				
		}

		this.functionPattern = funcpattern;
		
	},
	/*
	 * 最終的な文字列を取得するよ
	 */
	getString : function(){
		
		var mode = this.sirial.substring(0, 4);
		switch (mode){
		// Number mode
		case "0001" :
			return this.getNumber();
		// Alphabet mode
		case "0010" :
			return this.getAlphabet();
		// 8bitByte mode
		case "0100" :
			return this.get8bitBite();
		// Kanji mode
		case "1000" :
			return this.getKanji();
		// unknown mode(ECI etc...)
		default :
			return "Sorry ...";
		}
	},
	/*
	 * 数字モード
	 */
	getNumber : function(){
		var str = "";
		var str_num = 0; // 文字数指示子
		var mode = "0001";
		var tmp = this.sirial.substr(4, this.getStrNum(mode));

		str_num =  parseInt(tmp,2);
		
		var bodybits = this.sirial.substr(4 + this.getStrNum(mode));
		
		var bitgroup = 10;
		for(i = 0;i < (str_num / 3);i++){
			if((i + 1) < (str_num /3)){
				if(str_num %3 == 1){
					bitgroup = 4;
				}else{
					bitgroup = 7;
				}
			}
			var temp = bodybits.substr(i * 10,bitgroup);
			var aaa = new Number(parseInt(temp,2));
			str += aaa.toString();
			
		}
		return str;
		
	},
	/*
	 * 英数字モード
	 */
	getAlphabet : function(){
		var EI_SU_TABLE = {
				0:'0',1:'1',2:'2',3:'3',4:'4',5:'5',6:'6',7:'7',8:'8',9:'9',
				10:'A',11:'B',12:'C',13:'D',14:'E',15:'F',16:'G',17:'H',18:'I',19:'J',
				20:'K',21:'L',22:'M',23:'N',24:'O',25:'P',26:'Q',27:'R',28:'S',29:'T',
				30:'U',31:'V',32:'W',33:'X',34:'Y',35:'Z',36:' ',37:'$',38:'%',39:'*',
				40:'+',41:'-',42:'.',43:'/',44:':'
				};
		var str = "";
		var str_num = 0;
		var mode = "0010";
		var tmp = this.sirial.substr(4, this.getStrNum(mode));
		str_num =  parseInt(tmp,2);
		
		var bodybits = this.sirial.substr(4 + this.getStrNum(mode));
		
		var bitgroup = 11;
		for(i = 0;i < (str_num / 2);i++){
			if((str_num % 2) != 0){
				bitgroup = 6;
			}
			var temp = bodybits.substr(i * bitgroup,bitgroup);
			var aaa = parseInt(temp,2);
			if((str_num % 2) != 0){
				str += EI_SU_TABLE[aaa];
			}else{
				var upper = Math.floor(aaa / 45);
				var lower = aaa % 45;
				str += EI_SU_TABLE[upper] + EI_SU_TABLE[lower];
			}
		}
		return str;
	},
	/*
	 * 8ビットバイトモード
	 */
	get8bitBite : function(){
		var str = "";
		var str_num = 0;
		var mode = "0100";
		var tmp = this.sirial.substr(4, this.getStrNum(mode));
		str_num =  parseInt(tmp,2);
		var sjis_encoded = "";
		var byte_flag = false;
		var bodybits = this.sirial.substr(4 + this.getStrNum(mode));

		// 8bitByteモードでSJISを使うときの判定を追加
		for(i = 0;i < str_num;i++){
			var temp = bodybits.substr(i * 8,8);
			var byte = parseInt(temp,2);
			if(this.isSJISEncode(byte)){
				sjis_encoded += "%" + byte.toString(16);
				byte_flag = true;
			}else if(byte_flag){
				sjis_encoded += "%" + byte.toString(16);
				byte_flag = false;
			}else{
				sjis_encoded += String.fromCharCode(byte);
			}
		}
		str = UnescapeUTF8(EscapeUTF8(UnescapeSJIS(sjis_encoded)));
		
		return str;
	},
	/*
	 * 8bitBytemode SJIS
	 */
	isSJISEncode : function(byte){
		// SJIS low
		if(byte >= 128 && byte <= 159){
			return true;
		//SJIS high
		}else if(byte >= 224 && byte <= 255){
			return true;
		}
		return false;
	},
	/*
	 * 漢字モード
	 */
	getKanji : function(){
	},
	/*
	 * 文字数指定子のビット数を返す
	 */
	getStrNum : function(mode){
		switch (mode){
		case "0001" :
			if(this.version <= 9){
				return 10;
			}else if(this.version <= 26){
				return 12;
			}else{
				return 14;
			}
		case "0010" :
			if(this.version <= 9){
				return 9;
			}else if(this.version <= 26){
				return 11;
			}else{
				return 13;
			}
		case "0100" :
			if(this.version <= 9){
				return 8;
			}else if(this.version <= 26){
				return 16;
			}else{
				return 16;
			}
		case "1000" :
			if(this.version <= 9){
				return 8;
			}else if(this.version <= 26){
				return 10;
			}else{
				return 12;
			}
		default :
			return "Sorry ...";
		}
	}
}

function RGBColor(red,green,blue,alpha){
	this.red = red;
	this.green = green;
	this.blue = blue;
	this.alpha = alpha;
	
	this.isDark = function(){
		this.ToGrayscale();
		if(this.red == 0 && this.blue == 0 && this.green == 0){
			return true;
		}else{
			return false;
		}
	},
	/*
	 * 閾値
	 * Red : 127
	 * Green :127
	 * Blue :127
	 */
	this.ToGrayscale = function () {
		if(this.red > 127){
			this.red = 255;
		}else{
			this.red = 0;
		}
		if(this.green > 127){
			this.green = 255;
		}else{
			this.green = 0;
		}
		if(this.blue > 127){
			this.blue = 255;
		}else{
			this.blue = 0;
		}
	}
}

function BlockMap(version,errorCorrectLevel){
	this.RS_BLOCK = [
	 	// L M Q H
	 	// 1
	 	[[1, 26, 19],[1, 26, 16],[1, 26, 13],[1, 26, 9]],
	 	// 2
	 	[[1, 44, 34],[1, 44, 28],[1, 44, 22],[1, 44, 16]],
	 	// 3
	 	[[1, 70, 55],[1, 70, 44],[2, 35, 17],[2, 35, 13]],
	 	// 4
	 	[[1, 100, 80],[2, 50, 32],[2, 50, 24],[4, 25, 9]],
	 	// 5
	 	[[1, 134, 108],[2, 67, 43],[2, 33, 15, 2, 34, 16],[2, 33, 11, 2, 34, 12]],
	 	// 6
	 	[[2, 86, 68],[4, 43, 27],[4, 43, 19],[4, 43, 15]],
	 	// 7
	 	[[2, 98, 78],[4, 49, 31],[2, 32, 14, 4, 33, 15],[4, 39, 13, 1, 40, 14]],
	 	// 8
	 	[[2, 121, 97],[2, 60, 38, 2, 61, 39],[4, 40, 18, 2, 41, 19],[4, 40, 14, 2, 41, 15]],
	 	// 9
	 	[[2, 146, 116],[3, 58, 36, 2, 59, 37],[4, 36, 16, 4, 37, 17],[4, 36, 12, 4, 37, 13]],
	 	// 10
	 	[[2, 86, 68, 2, 87, 69],[4, 69, 43, 1, 70, 44],[6, 43, 19, 2, 44, 20],[6, 43, 15, 2, 44, 16]],
	 	// 11
	 	[[4,101,81],
	 	[1,80,50,4,81,51],
	 	[4,50,22,4,51,23],
	 	[3,36,12,8,37,13]],
	 	// 12
	 	[[],[],[],[]],
	 	// 13
		[[],[],[],[]],
	 	// 14
		[[],[],[],[]],
	 	// 15
		[[],[],[],[]],
	 	// 16
		[[],[],[],[]],
	 	// 17
		[[],[],[],[]],
	 	// 18
		[[],[],[],[]],
	 	// 19
		[[],[],[],[]],
	 	// 20
		[[],[],[],[]],
	 	// 21
		[[],[],[],[]],
	 	// 22
		[[],[],[],[]],
	 	// 23
		[[],[],[],[]],
	 	// 24
		[[],[],[],[]],
	 	// 25
		[[],[],[],[]],
	 	// 26
		[[],[],[],[]],
	 	// 27
		[[],[],[],[]],
	 	// 28
		[[],[],[],[]],
	 	// 29
		[[],[],[],[]],
	 	// 30
		[[],[],[],[]],
	 	// 31
		[[],[],[],[]],
	 	// 32
		[[],[],[],[]],
	 	// 33
		[[],[],[],[]],
	 	// 34
		[[],[],[],[]],
	 	// 35
		[[],[],[],[]],
	 	// 36
		[[],[],[],[]],
	 	// 37
		[[],[],[],[]],
	 	// 38
		[[],[],[],[]],
	 	// 39
		[[],[],[],[]],
	 	// 40
		[[],[],[],[]],
	 ];

	var data = 0;
	var rs = 0;
	for(i = 0;i < this.RS_BLOCK[version - 1][errorCorrectLevel].length;i = i + 3){
		data = data + this.RS_BLOCK[version - 1][errorCorrectLevel][i] * this.RS_BLOCK[version - 1][errorCorrectLevel][i + 2];
		rs = rs + this.RS_BLOCK[version - 1][errorCorrectLevel][i] * (this.RS_BLOCK[version - 1][errorCorrectLevel][i + 1] - this.RS_BLOCK[version - 1][errorCorrectLevel][i + 2]);
	}
	this.dataCode = new Array(data);
	this.rsBlock = new Array(rs);
	
	for(i = 0;i < data;i++){
		this.dataCode[i] = "";
	}
	for(i = 0;i < rs;i++){
		this.rsBlock[i] = "";
	}
	
	this.blockPoint = 0;
	this.blockPoint_inner = 0;
	this.dataCodeflag = true;
	
	this.blockCount = new Array();
	for(i = 0;i < this.RS_BLOCK[version - 1][errorCorrectLevel].length;i = i + 3){
		for(j = 0;j < this.RS_BLOCK[version - 1][errorCorrectLevel][i];j++){
			this.blockCount.push(this.RS_BLOCK[version - 1][errorCorrectLevel][i + 2]);
		}
	}
	
	this.dataBlock = new Array(this.blockCount.length);
	for(i = 0;i < this.blockCount.length;i++){
		this.dataBlock[i] = new Array(this.blockCount[i]);
	}
	for(i = 0;i < this.dataBlock.length;i++){
		for(j = 0;j < this.dataBlock[i].lebgth;j++){
			this.dataBlock[i][j] = "";
		}
	}
}
BlockMap.prototype = {
	/*
	 * データコードにアサイン
	 */
	push : function(bits){
		if(this.blockPoint_inner >= 8){
			if(this.blockPoint == this.dataCode.length - 1 && this.dataCodeflag){
				this.dataCodeflag = false;
				this.blockPoint_inner = 0;
				this.blockPoint = 0;
			}else{
				this.blockPoint++;
				this.blockPoint_inner = 0;
			}
		}
		if(this.dataCodeflag){
			if(bits){
				this.dataCode[this.blockPoint] += "1";
			}else{
				this.dataCode[this.blockPoint] += "0";
			}
		}else{
			if(bits){
				this.rsBlock[this.blockPoint] += "1";
			}else{
				this.rsBlock[this.blockPoint] += "0";
			}
		}
		this.blockPoint_inner++;
	},
	/*
	 * 
	 */
	makeDataBlock : function(version,errorCorrectLevel){
		var offset = 0; 
		for(i = 0;i < this.blockCount.length;i++){
			for(j = 0;j < this.blockCount[i];j++){
				if(this.RS_BLOCK[version - 1][errorCorrectLevel].length > 3 && this.RS_BLOCK[version - 1][errorCorrectLevel][0] <= i && (this.RS_BLOCK[version - 1][errorCorrectLevel][5] - 1) <= j) {
					offset = this.RS_BLOCK[version - 1][errorCorrectLevel][0];
				}
				this.dataBlock[i][j] = this.dataCode[(i + (j * this.blockCount.length)) - offset];
			}
			offset = 0;
		}
	},
	/*
	 * 
	 */
	silialize : function(version,errorCorrectLevel){
		
		var sirial = "";
		
		for(i = 0;i < this.dataBlock.length;i++){
			for(j = 0;j < this.dataBlock[i].length;j++){
				sirial += this.dataBlock[i][j];
			}
		}
//		var datacount = new Array();
//		
//		for(i = 0;i < this.RS_BLOCK[version - 1][errorCorrectLevel].length;i = i + 3){
//			for(j = 0;j < this.RS_BLOCK[version - 1][errorCorrectLevel][i];j++){
//				datacount.push(this.RS_BLOCK[version - 1][errorCorrectLevel][i + 2]);
//			}
//		}
//		
//		for(i = 0;i < datacount.length;i++){
//			for(j = 0;j < datacount[i];j++){
//				sirial += this.dataCode[i + (j * datacount.length)];
//			}
//		}

		return sirial;
	}
}
