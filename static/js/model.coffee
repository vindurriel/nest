window.list= (d)->
  lorem= """Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
  tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
  quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
  consequat."""
  $("#list-container").empty()
  t_list_item= (d)->
    details= ""
    for x of d
      details+= "#{x}:#{d[x]};  "
    details+="<br>"+lorem
    return """
    <div class="list-item">
      <h2 class="item-headline"><a href="#{d.url}">#{d.name}</a></h2>
      <table>
        <tr>
          <td width="80" valign="top"> <img class="item-image" src="http://lorempixel.com/80/80/city"/> </td>
          <td style="margin-left:1em;">  
              <span class="item-prop">#{d.type}</span> 
              <p class="item-detail">#{details}...</p>
          </td>
        </tr>
      </table>
    </div>
    """
  t_item_action= (d)->
    """
      <a class="button" href="#">收藏</a>
      <a class="button" href="#">分享</a>
    """
  for x in d.nodes
    $("#list-container").append(t_list_item(x))
  $(".item-prop").append t_item_action x
$(document).ready ->
  options=
    "container":"#nest-container",
  window.nest(options)
  $(document).keydown cacheIt
  $(document).keyup cacheIt
  $(".btn-toggle-nest").click ->
    ui= $(options.container)
    toggle= ui.height()<=210
    toH = if toggle then $(window).height()*.8 else 200
    ui.animate({"height":toH},"fast");
    $(this).val(if toggle then "收起" else "展开")
  $("#btn_tip").click ->
    $("#tip").slideToggle 200
  $("#btn_search").click ->
    key=$('#q').val()
    $.getJSON "/search/#{key}", (d)->
      if not d or d.error?
        return
      draw d
      list d
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