var $change_color = $('.change-color');

$change_color.on('click', change_color);

function change_color(){
	$('.datetime').datetimepicker();
}