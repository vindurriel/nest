#encoding=utf-8
import web,time,json,requests,traceback
import xiami_api
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
class roaming:
	headers={
		"user-agent":"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
	}
	def GET(self,tid):
		print "###roaming",tid
		res=[]
		self.info=info()
		if '_' not in tid:
			return json.dumps({tid:res})
		i=tid.rindex('_')
		t,id=tid[:i],tid[i+1:]
		func_name=t.replace('.','_')
		if hasattr(self,func_name):
			res = getattr(self,func_name)(id)
		else:
			dic={}
			is_subview=False
			if "subview" in t:
				is_subview=True
				dic={
					'is_subview':True,
					'url':web.input().url
				}
			res = self.baike(id,dic)
		return json.dumps({tid:res})
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
		print r
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
		r=xiami_api.api_get(api,{"id":id})
		for song in r["songs"]:
			res.append({
				"id":song["song_id"],
				"name":song["name"],
				"type":"song"
			})
		return res		
	def baike(self,id,dic={}):
		import model
		res=[]
		proxy=model.search()
		try:
			dic['keys']=id
			dic['services']='baike'
			proxy.do_search(dic)
			res=proxy.result.values()[0]
		except Exception,e:
			traceback.print_exc()
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
def captalize(t):
	return t[0].upper()+t[1:]
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
	ro=roaming()
	inf=info()
	import json
	print json.dumps(ro.baike(u"baike_中国"),indent=2)
	# print inf.GET("song_1508")
	# print inf.GET("artist_1508")
	# print inf.GET("album_1508")
	# print ro.GET("song_1508")
	# print ro.GET("artist_1508")
	# print ro.GET("hitsongs_of_artist_1508")
	# print ro.GET("albums_of_artist_1508")
	# print ro.GET("songs_of_album_1508")
	# print ro.GET("artist_of_album_1508")
	# print ro.GET("artist_of_song_1508")
	# print ro.GET("album_of_song_1508")