#encoding=utf-8
from explore_provider_base import *
import web,time,json,requests,traceback
import __xiami_api
def split_id(ids):
	if type(ids)==type([]):
		return ids
	if ',' in ids:
		ids=ids.split(',')
	else:
		ids=[ids]
	return ids
def dicget(dic,*keys):
	for k in keys:
		if k in dic:
			return dic[k]
	return ''	
class xiami(explore_provider_base):
	def __init__(self):
		self.headers={
			"user-agent":"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
		}
		self.info=info()
	def explore(self,key,dic={}):
		if not 'type' in dic: return []
		t=normalize_text(dic['type']).replace('.','_')
		res=[]
		if hasattr(self,t):
			res = getattr(self,t)(key)
		return res
	def artist_of_song(self,id):
		return self._artist_of('song',id)
	def artist_of_album(self,id):
		r=requests.get(
			"http://www.xiami.com/app/android/album/id/{0}".format(id),
			headers=self.headers).json()['album']
		artist_id=r['songs'][0]['artist_id']
		return [{
			'id':artist_id,
			'name':r['artist_name'],
			'type':'artist',
		}]
	def _artist_of(self,t,id):
		r=json.loads(self.info.GET(t+'_'+id))["nodes"][0]
		return [{
			'id':r["artist_id"],
			'name':r['artist_name'],
			'type':'artist',
		}]
		return res
	def album_of_song(self,id):
		r=json.loads(self.info.GET('song_'+id))["nodes"][0]
		return [{
			'id':r["album_id"],
			'name':dicget(r,'album_name'),
			'type':'album',
		}]
	def songs_of_album(self,id):
		res=[]
		r=requests.get(
			"http://www.xiami.com/app/android/album/id/{0}".format(id),
			headers=self.headers)
		r=r.json()["album"]
		for song in r["songs"]:
			res.append({
				"id":song["song_id"],
				"name":song["name"],
				"type":"song"
			})
		return res
	def songs_of_collect(self,id):
		api="Collects.detail"
		res=[]
		r=__xiami_api.api_get(api,{"id":id})
		for song in r["songs"]:
			res.append({
				"id":song["song_id"],
				"name":song["name"],
				"type":"song"
			})
		return res		
	def hitsongs_of_artist(self,id):
		res=[]
		r=requests.get(
			"http://www.xiami.com/app/android/artist-topsongs",
			params={"id":id},
			headers=self.headers).json()
		for song in r["songs"]:
			res.append({
				"id":song["song_id"],
				"name":song["name"],
				"type":"song"
			})
		return res
	def albums_of_artist(self,id):
		api="Artists.albums"
		res=[]
		r=requests.get(
			"http://www.xiami.com/app/android/artist-albums",
			params={"id":id},
			headers=self.headers).json()
		for album in r['albums']:
			res.append({
				"id":album["album_id"],
				"name":dicget(album,"album_name","title"),
				"type":"album"
			})
		return res
	def song(self,id):
		api="Songs.roaming"
		res=[]
		# r=xiami_api.api_get(api,{"id":id})
		# for song in r:
		# 	res.append({
		# 		"id":song["song_id"],
		# 		"name":song["name"],
		# 		"type":"song"
		# 	})
		return res
	def artist(self,id):
		res=[]
		r=requests.get(
			"http://www.xiami.com/app/android/artist-similar",
			params={"id":id},
			headers=self.headers).json()
		for a in r["artists"]:
			res.append({
				"id":a["artist_id"],
				"name":a["name"],
				"type":"artist"
			})			
		return res
class info:	
	headers={
		"user-agent":"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
	}
	def tryset(self,dic,keys):
		for k in keys:
			if k in dic:
				return dic[k]
		return ''
	def GET(self,tid):
		print "###info",tid
		res={
			'nodes':[],
			'links':[]
		}
		if '_' not in tid:
			return res
		i=tid.rindex('_')
		t,id=tid[:i],tid[i+1:]
		r=requests.get("http://www.xiami.com/app/android/{0}/id/{1}".format(t,id),
			headers=self.headers
			).json()
		if r and "error" not in r:
			if t in r:
				r=r[t]
			res['nodes'].append({
				"id":tid,
				"name":self.tryset(r,['name',t+'_name','title']),
				"artist_name":self.tryset(r,['artist_name']),
				"artist_id":self.tryset(r,['artist_id']),
				"album_id":self.tryset(r,['album_id']),
				"album_name":self.tryset(r,['album_name']),
				"type":t,
			})
		return json.dumps(res)	
if __name__ == '__main__':
	ro=xiami()
	inf=info()
	import json
	# print inf.GET("song_1508")
	# print inf.GET("artist_1508")
	# print inf.GET("album_1508")
	# print jsonfy(ro.explore("song_1508"))
	# print jsonfy(ro.explore("artist_1508"))
	print jsonfy(ro.explore("hitsongs_of_artist_1508"))
	print jsonfy(ro.explore("albums_of_artist_1508"))
	print jsonfy(ro.explore("songs_of_album_1508"))
	print jsonfy(ro.explore("artist_of_album_1508"))
	print jsonfy(ro.explore("artist_of_song_1508"))
	print jsonfy(ro.explore("album_of_song_1508"))