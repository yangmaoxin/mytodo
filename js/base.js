;(function(){
	'use strict';
	var $form_add_task = $('.add-task');
    var $task_delete_trigger;
   	var $task_detail;
    var $task_detail_trigger;
    var $task_detail = $('.task-detail');
    var $task_detail_mask = $('.task-detail-mask');
    var current_index;

    var $update_form;
    var $task_detail_content;
    var $task_detail_content_input;

    var $checkbox_complete;

    var $msg = $('.msg');
    var $msg_content = $msg.find('.msg-content');
    var $msg_confirm = $msg.find('.confirmed');
    var $alerter = $('.alerter');





	var task_list = [];

	init();
	$msg_confirm.on('click', hide_msg);
	$task_detail_mask.on('click', hide_task_detail);
	$form_add_task.on('submit',function(e){
		var new_task = {};
		var $input;
		// 禁用默认行为
		e.preventDefault();
		// 获取新Task的值
		$input = $(this).find('input[name=content]')
		new_task.content = $input.val();
		if(!new_task.content) {return false};
		// 存入新Task
		if(add_task(new_task)){
		// 更新列表
			//render_task_list();
			$input.val('');
		};

	})


	// 查找并监听所有删除按钮的点击事件
	function listen_task_delete(){
		$task_delete_trigger.on('click',function(){
			var $this = $(this);
			// 找到删除按钮所在的task元素
			var $item = $this.parent().parent();
			var index = $item.data('index');
			// var tmp = confirm('确定删除？');
			// tmp?delete_task(index):null;
			pop('确定删除?').then(function (r) {
			r ? delete_task(index) : null;
			})
		})		
	}

  	//监听打开Task详情事件
	function listen_task_detail() {
	    var index;
	    $('.task-item').on('dblclick', function () {
	      index = $(this).data('index');
	      show_task_detail(index);
	    })

	    $task_detail_trigger.on('click', function () {
	      var $this = $(this);
	      var $item = $this.parent().parent();
	      index = $item.data('index');
	      show_task_detail(index);
	    })
	}

	// 监听完成Task事件
	function listen_checkbox_complete() {
		$checkbox_complete.on('click', function () {
		  var $this = $(this);
		  var index = $this.parent().parent().data('index');
		  console.log(index);
		  var item = get(index);
		  console.log(item.complete);
		  if (item.complete){
		  	update_task(index, {complete: false});
		  }else{
		    update_task(index, {complete: true});		  	
		  }
		})
	}

	function get(index) {
		return store.get('task_list')[index];
	}

	function add_task(new_task){
		task_list.push(new_task);
		//更新localStorage
		refresh_task_list();
		//store.clear();
		return true;
	}

	// 删除一条task
	function delete_task(index){
		if(index === undefined ||!task_list[index]){return false};

		delete task_list[index];
		//更新localStorage
		refresh_task_list();
		render_task_list();

	}

	// 显示查看Task详情
	function show_task_detail(index) {
	// 生成详情模板
		render_task_detail(index);
		current_index = index;
		// 显示详情模板(默认隐藏)
		$task_detail.show();
		// 显示详情模板mask(默认隐藏)
		$task_detail_mask.show();
	}

	// 隐藏Task详情
	function hide_task_detail() {
		$task_detail.hide();
		$task_detail_mask.hide();
	}

	  /*更新Task*/
	function update_task(index, data) {
		if (!index || !task_list[index]) return;
		//task_list[index] = data;
		task_list[index] = $.extend({}, task_list[index], data);
		refresh_task_list();
	}


  /*渲染指定Task的详细信息*/
	function render_task_detail(index) {
		if (index === undefined || !task_list[index]) return;

		var item = task_list[index];

		var tpl =
		  '<form>' +
		  '<div class="content">' +
		  item.content +
		  '</div>' +
		  '<div class="input-item">' +
		  '<input style="display: none;" type="text" name="content" value="' + (item.content || '') + '">' +
		  '</div>' +
		  '<div>' +
		  '<div class="desc input-item">' +
		  '<textarea name="desc">' + (item.desc || '') + '</textarea>' +
		  '</div>' +
		  '</div>' +
		  '<div class="remind input-item">' +
		  '<label>提醒时间</label>' +
		  '<input class="datetime" name="remind_date" type="text" value="' + (item.remind_date || '') + '">' +
		  '</div>' +
		  '<div class="input-item"><button type="submit">更新</button></div>' +
		  '</form>';

			// 清空旧模板并替换
			$task_detail.html('');
			$task_detail.html(tpl);
			//日期选择器
			$('.datetime').datetimepicker({theme:'dark'});
			// 选中其中的form元素, 因为之后会使用其监听submit事件
			$update_form = $task_detail.find('form');
			// 选中显示Task内容的元素
			$task_detail_content = $update_form.find('.content');
			// 选中Task input的元素
			$task_detail_content_input = $update_form.find('[name=content]');

			// 双击内容元素显示input, 隐藏自己
			$task_detail_content.on('dblclick', function () {
			  $task_detail_content_input.show();
			  $task_detail_content.hide();
			})

			$update_form.on('submit', function (e) {
			  e.preventDefault();
			  var data = {};
			  // 获取之前表单中各个input的值
			  data.content = $(this).find('[name=content]').val();
			  data.desc = $(this).find('[name=desc]').val();
			  data.remind_date = $(this).find('[name=remind_date]').val();

			  update_task(index, data)
			  hide_task_detail();
			})


	}

	//刷新localStorage数据并更新模板
	function refresh_task_list(){
		store.set('task_list',task_list);
		render_task_list();

	}

	function init(){
		task_list = store.get('task_list') || [];
		if(task_list){
			render_task_list();
			task_remind_check();
		}
	}
	//task提醒
	function task_remind_check() {
		var current_timestamp;
		var itl = setInterval(function () {
		  for (var i = 0; i < task_list.length; i++) {
		    var item = get(i), task_timestamp;
		    if (!item || !item.remind_date || item.informed)
		      continue;

		    current_timestamp = (new Date()).getTime();
		    task_timestamp = (new Date(item.remind_date)).getTime();
		    if (current_timestamp - task_timestamp >= 1) {
		      update_task(i, {informed: true});
		      show_msg(item.content);
		    }
		  }
		}, 300);
	}

	function show_msg(msg) {
		if (!msg) return;
		$msg_content.html(msg);
		$alerter.get(0).play();
		$msg.show();
	}

	function hide_msg() {
		$msg.hide();
	}

 	//渲染所有task
	function render_task_list(){
		var $task_list = $('.task-list');
		var $task_list_complete = $('.task-list-complete');

		$task_list.html("");
		$task_list_complete.html("");
		var complete_items = [];
		for (var i = 0;i < task_list.length; i++) {
			var item = task_list[i];
			if (item && item.complete) {
				//complete_items.push(item);
				complete_items[i] = item;
			}else{
				var $task = render_task_item( item , i);
				$task_list.prepend($task);				
			}

		}
		//把完成的task重新加入到list
		for (var j = 0;j < complete_items.length; j++){
			$task = render_task_item(complete_items[j], j);
			if(!$task) continue;
      		$task.addClass('completed');
			$task_list_complete.append($task);
		}
		
		var complete_length = $task_list_complete.find('.completed').length;
		if( complete_length != 0){
			$task_list_complete.prepend('<div class="list-complete">已完成</div>');			
		}else{
			$task_list_complete.html("");
		}


		$task_delete_trigger = $('.delete');
    	$task_detail_trigger = $('.detail');
    	$checkbox_complete = $(".complete");
		listen_task_delete();
		listen_task_detail();
		listen_checkbox_complete();

	}

	//渲染单条task模板
	function render_task_item(data , index){
		if(!data || !index) return;
		//item模板
		var list_item_tpl = 
			'<div class="task-item" data-index="'+index+'">'+
	 		'<span><input class="complete" '+ (data.complete ? 'checked' : '') +' type="checkbox"></span>'+
	 		'<span class="task-content">'+data.content+'</span>'+
	 		'<span class="fr">'+
	 		'<span class="action delete"> 删除</span>'+
	 		'<span class="action detail"> 详细</span>'+
	 		'</span>'+
	 		'</div>' 
	 	return $(list_item_tpl);
	}



})();