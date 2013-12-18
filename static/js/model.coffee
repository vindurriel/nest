
require ['jquery','d3','forced_graph_view','masonry'] , ($,d3,fgv,Masonry)->
	requirejs.onError= (err)->
		console.log err
		throw err
	window.t_item_action= (d)->
			"""
				<a class="button small" href="#">收藏</a>
				<a class="button small" href="#">分享</a>
			"""
	window.list= (d)->
		t_list_item= (d)->
			details= if d.content? then d.content else ""
			i= Math.floor(Math.random() * (10 - 0 + 1))
			color= window.palette(d.type)
			# imgurl= "http://lorempixel.com/80/80/technics/#{i}"
			imgurl= ""
			if d.img?
				imgurl= d.img
			return """
			<div class="list-item normal">
				<h2 class="item-headline">
					<span>#{d.name}</span>
				</h2>
				<span class="item-prop">#{d.type} </span>
				<div>
					<img class="item-image" src="#{imgurl}"/>
				</div>
				<p class="item-detail">#{details}</p>
			</div>
			"""
		if not window.masonry?
			# window.masonry=$('#list-container').data('masonry')
			window.masonry = new Masonry('#list-container',{"transitionDuration":"0.2s","itemSelector":".list-item"})
		window.masonry.remove($(".list-item.normal").get())
		window.masonry.layout()
		color= window.palette(d.type)
		$item= $(t_list_item(d))
		$("#list-container").append($item)
		window.masonry.appended($item.get())
		$("#list-container div:last-child").addClass('selected_info')
		if d.nodes.length > 1000
			return
		for x in d.nodes
			if x.type=="referData" then continue
			s=$(t_list_item(x))
			$("#list-container").append(s)
			window.masonry.appended(s.get())
		require ['imageloaded'],(imagesLoaded)->
			imgLoad= new imagesLoaded("#list-container")
			imgLoad.on "progress", () ->
				window.masonry.layout()
				return
			return
		return
	window.click_handler= (d)->
		$(".selected_info .item-headline span").text(d.name)
		$(".selected_info .item-prop").text(d.type)
		if d.type=="doc"
			$(".selected_info .item-headline a").attr('href',d.url)
			container= ".selected_info .item-detail"
			value= window.degree[d.index][0].value
			$(container).empty().append """<p>到聚类中心的距离：#{value}</p>"""
			$.getJSON "/keyword/#{d.name}", (res)->
				data= []
				for x of res.keyword
					data.push {'k':x,'v':res.keyword[x]}
				require ['barchart'], (barchart)->
					barchart.render data, {
						"container":container,
					}
					return
				$(container).append """<p>#{res.summary}</p>"""
				return
		else
			detail=$(".selected_info .item-detail")
			detail.empty()
			docs= []
			for link in r.degree[d.index]
				if d==link.target then continue
				n= link.target
				if n.type!="referData" then continue
				docs.push n
			if docs.length>0
				detail.append("<h3>相关文档</h3>")
				for n in docs
					detail.append("<a href=#{n.url}  class='doc_url' target='_blank'>#{n.name}</a>")
		if window.masonry?
			window.masonry.layout()
		return
	get_selected_services = ->
		service_ids= []
		$('.check-service').each ->
			if not this.checked then return
			if $(this).data('serviceId')?
				service_ids.push $(this).data('serviceId')
		return service_ids
	$(document).ready ->
		options=
			"container":"#nest-container",
			"width":"400",
			"height":"200",
		window.nest(options)
		$(document).keydown cacheIt
		$(document).keyup cacheIt
		$(document).on "click", ".btn-toggle-fullscreen" , ()->
			ui= $(this).closest('div')
			toggle= ui.hasClass('list-item')
			if toggle
				ui.attr('style',"")
				ui.removeClass('list-item').addClass('fullscreen')
			else
				ui.removeClass('fullscreen').addClass('list-item')
				window.masonry.layout()
			$(this).val(if toggle then "收起" else "展开")
		play_step= ->
			if r.current_step>=r.story.length or r.current_step<0 then return
			s= r.story[current_step]
			func= explore
			if s.event=="draw"
						func= draw
			info= r.story[r.current_step]
			$("#story-indicator,.btn-next,.btn-prev,.btn-automate").show()
			$("#story-indicator").text("第#{r.current_step+1}步，共#{r.story.length}步， 节点数：#{info.nodes.length}")
			draw s
			return
		$("#btn_load").click ->
			scr= prompt "要打开的文件名","default"
			$.getJSON "/play/#{scr}", (d)->
				r.story= []
				r.current_step=0
				graph=
					nodes:[], 
					links:[]
				for s in d
					if s.event=="draw"
						graph.nodes= s.nodes
						graph.links= s.links
					else
						graph.nodes= graph.nodes.concat(s.nodes)
						graph.links= graph.links.concat(s.links)
					cur= {}
					$.extend(cur,graph)
					r.story.push cur
				play_step()
		$("#btn_tip").click ->
			$("#tip").slideToggle 200
			return
			
		$(".btn-next").click ->
			if r.current_step==r.story.length-1 then return
			r.current_step+=1
			play_step()
			return
		$(".btn-prev").click ->
			if r.current_step==0 then return
			r.current_step-=1
			play_step()
			return
		$(".btn-automate-yes").click ->
			dic=
				"nodes":r.nodes,
				"links":r.links.map((d)->{"source":d.source.index,"target":d.target.index}),
				"blacklist":r.blacklist,
			for p in "max_total_node_num max_single_node_num timeout_seconds max_depth out_fname".split(" ")
				dic[p]=$("#"+p).val()
			console.log dic
			$("#automate-form").slideToggle()
			require ['jquery_blockUI'], (m)->
				$.growlUI "", "宏 #{dic.out_fname} 已开始运行"
				$.post "/automate",	JSON.stringify(dic), (d)->
					if d.error?
						$.growlUI "错误","宏 #{dic.out_fname} 运行出现如下错误：\n#{d.error}"
					else
						$.growlUI "","宏 #{dic.out_fname} 已完成运行"
				return
			return
		$(".btn-automate-no").click ->
			$("#automate-form").slideToggle()
			return
		$(".btn-automate").click ->
			$("#automate-form").slideToggle()
			return

		$("#btn_search").click ->
			key=$('#q').val()
			data= {
				'keys':key,
				'services':get_selected_services(),
			}
			keynode = {
				'type':"baike",
				'name':key,
			}
			$.post "/search", JSON.stringify(data), (d)->
					if not d or d.error?
						return
					d.nodes.splice 0,0,keynode
					i=0
					for x in d.nodes
						x.index=i
						if i>0
							d.links.push {
								source:0,
								target:i,
							}
						i+=1
					draw d
					list d
					return
				,'json'
			$('html, body').animate({"scrollTop":0})
			return
		$(window).scroll ->
			toggle= $(this).scrollTop()>100
			if toggle
				$("#nav").addClass("fade")
			else
				$("#nav").removeClass("fade")
		$('#q').keypress (e) ->
				if e.keyCode==13
					$('#btn_search').click()
		$("#btn_save").click ->
			save()
			.done ->
				alert "保存完成"
			.fail (d,e)->
				alert e
		$('body').on "click",".doc_url", (e)->
			e.preventDefault()
			if $(".doc_info").length==0
				$item= $("""
				<div class='doc_info list-item normal'>
					<input type="button"  class="btn-toggle-fullscreen"   value="展开">
					<input type="button" class="btn-small fav" style="left:5em;"  value="收藏">
					<input type="button" class="btn-small share" style="left:9em;"  value="分享">
					<h2 class="item-headline">
						<span></span>
					</h2>
					<iframe></iframe>
				</div>
				""")
				$(".selected_info").after $item
				window.masonry.reloadItems()
				window.masonry.layout()
				# window.masonry.prepended $item.get()
			url=$(this).attr('href')
			text= $(this).text()
			$(".doc_info iframe").attr('src',url)
			$(".doc_info .item-headline span").text(text)
		id= document.title
		type= "unknown"
		if ":" in id
			query = query.replace ":","_"
		$.getJSON "/model/load/#{id}", (d)->
			if not d or d.error?
				$.getJSON "/info/#{id}", (d)->
						if not d or d.error?
							return
						draw d
						list d
			else 
				draw d
				list d
			click_handler(r.root)
		#fillServices
		$.getJSON "/services/",(d)->
			if not d or d.error?
				log('error get services')
				return
			for s in d.services
				checked = ""
				if s.select? and s.select==true
					checked= "checked"
				$('.services').append """
				<li>
					<input type="checkbox"	 data-service-id="#{s.id}" #{checked} class="check-service" id="#{s.id}"> <span>使用 #{s.name} 搜索</span>
				</li>
				"""
			return
		return
	return