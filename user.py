#coding:utf-8
import os,sys,json,xiami_api
user_id="1213142"
def make_lib():
	songs,albums,artists,collects=[],[],[],[]
	page=1
	while(1):
		res=xiami_api.api_get("Library.getSongs",{"page":page})
		songs.extend(res['songs'])
		if "more" not in res or res['more']!='true':
			break
		page+=1
	page=1
	while(1):
		res=xiami_api.api_get("Library.getAlbums",{"page":page})
		albums.extend(res['albums'])
		if "more" not in res or res['more']!='true':
			break
		page+=1
	page=1
	while(1):
		res=xiami_api.api_get("Library.getArtists",{"page":page})
		artists.extend(res['artists'])
		if "more" not in res or res['more']!='true':
			break
		page+=1
	page=1
	while(1):
		res=xiami_api.api_get("Collects.getLibCollects",{"page":page})
		collects.extend(res['collects'])
		if "more" not in res or res['more']!='true':
			break
		page+=1
	def make_song(i):
		return {
			'name':i['song_name'],
			'id':i['song_id'],
			'type':"song"
		}
	def make_album(i):
		return {
			'name':i['album_name'],
			'id':i['album_id'],
			'type':"album"
		}
	def make_artist(i):
		return {
			'name':i['artist_name'],
			'id':i['artist_id'],
			'type':"artist"
		}
	def make_collect(i):
		return {
			'name':i['collect_name'],
			'id':i['list_id'],
			'type':"collect"
		}
	nodes=[]
	nodes.extend(map(make_artist,artists))
	nodes.extend(map(make_album,albums))
	nodes.extend(map(make_collect,collects)),
	nodes.extend(map(make_song,songs))
	res={
		'nodes':nodes,
		'links':[]
	}
	file(r'static\files\user.json','w').write(json.dumps(res,indent=2))
# make_lib()
def get_key(x):
	return x["type"]+x['id']
lib=json.loads(file(r'static\files\user.json','r').read())
hash={}
count_type={}
for x in lib["nodes"]:
	if x["type"] not in count_type:
		count_type[x["type"]]=[]
	count_type[x["type"]].append(x)
	hash[get_key(x)]=x
import song_map
ro=song_map.roaming()
def find_link(t):
	for x in count_type[t]:
		res=json.loads(ro.GET(t+"_"+x["id"])).values()[0]
		for y in res:
			key=get_key(y)
			if key in hash:
				link_key="{0}-{1}".format(x['index'],hash[key]['index'])
				if link_key not in hash:
					hash["link_key"]=1
					lib["links"].append({
						"source":x['index'],
						"target":hash[key]['index']
						})
find_link('song')
file(r'static\files\user.json','w').write(json.dumps(lib,indent=2))
