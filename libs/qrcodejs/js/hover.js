$(function(){
	$("#qr").hover(
		function(){
			$("body").append('<div id="qrcode-tips">Click This and View QRCode decoded</div>');
		},
		function(){
			$("#qrcode-tips").remove();
	});
	$("#qr").click(
		function(e){
			$("#modal-content").modal();
		}
	);
	$("#qrcode").hover(
		function(){
			$("body").append('<div id="qrcode-tips">Click This and View QRCode decoded(Google)</div>');
		},
		function(){
			$("#qrcode-tips").remove();
	});
	$("#qrcode").click(
		function(e){
			$("#modal-content").modal();
		}
	)
});