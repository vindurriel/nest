window.list= (d)->
  try
    $("#list-container").masonry "destroy"
  $(".list-item.normal").remove()
  color= window.palette(d.type)
  $("#list-container").append """
  <div class="list-item normal selected_info">
     <h2 class="item-headline">
        <span style="border-left:#{color} solid 5px;">&nbsp;</span>
        <a href=""></a>
      </h2>
      <p class="item-detail"></p>
  </div>
  """
  if d.nodes.length>100
    return
  t_list_item= (d)->
    details= if d.content? then d.content else ""
    i= Math.floor(Math.random() * (10 - 0 + 1))
    color= window.palette(d.type)
    imgurl= "http://lorempixel.com/80/80/technics/#{i}"
    if d.img?
      imgurl= d.img
    return """
    <div class="list-item normal">
      <h2 class="item-headline">
        <span style="border-left:#{color} solid 5px;">&nbsp;</span>
        <a href="#{d.url}">#{d.name}</a>
      </h2>
      <span class="item-prop">#{d.type} </span>
      <div>
        <img class="item-image" src="#{imgurl}"/>
      </div>
      <p class="item-detail">#{details}</p>
    </div>
    """
  t_item_action= (d)->
    """
      <a class="button" href="#">收藏</a>
      <a class="button" href="#">分享</a>
    """
  for x in d.nodes
    s=t_list_item(x)
    $("#list-container").append(s)
  $(".item-prop").append t_item_action x
  $("#list-container").masonry {
      'itemSelector': '.list-item',
    }
  $("#list-container").imagesLoaded().done ->
    $("#list-container").masonry {
      'itemSelector': '.list-item',
    }
    return
  return

window.click_handler= (d)->
  $(".selected_info .item-headline a").text d.name
  if d.type=="doc"
    $.get d.url, (res)-> 
      $(".selected_info .item-detail").text res
  else
    $(".selected_info .item-detail").text ""
  return
get_selected_services = ->
  service_ids= []
  $('.check-service').each ->
    if not this.checked then return
    if $(this).data('serviceId')?
      service_ids.push $(this).data('serviceId')
  return service_ids.join "###"
$(document).ready ->
  options=
    "container":"#nest-container",
  window.nest(options)
  $(document).keydown cacheIt
  $(document).keyup cacheIt
  $(".btn-toggle-nest").click ->
    ui= $(options.container)
    toggle= ui.height()<=210
    if toggle
      ui.attr('style','')
      ui.removeClass('list-item').addClass('fullscreen')
    else
      ui.removeClass('fullscreen').addClass('list-item')
    # toH = if toggle then $(window).height()*.8 else 200
    # ui.animate({"height":toH},200);
    # setTimeout ->
    #   $("#list-container").masonry()
    # , 200
    $(this).val(if toggle then "收起" else "展开")
  $("#btn_tip").click ->
    $("#tip").slideToggle 200
  $("#btn_search").click ->
    key=$('#q').val()
    data= {
      'keys':key,
      'services':get_selected_services(),
    }
    $.post "/search/", JSON.stringify(data), (d)->
        if not d or d.error?
          return
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
        <input type="checkbox"   data-service-id="#{s.id}" #{checked} class="check-service" id="#{s.id}"> <span>使用 #{s.name} 搜索</span>
      </li>
      """
    return
  return