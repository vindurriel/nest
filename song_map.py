import web,time,multiprocessing,json,requests
import xiami_api
def split_id(ids):
	if type(ids)==type([]):
		return ids
	if ',' in ids:
		ids=ids.split(',')
	else:
		ids=[ids]
	return ids
class roaming:
	headers={
		"user-agent":"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/28.0.1500.95 Safari/537.36"
	}
	def GET(self,t,ids):
		if t=="artists":
			return self.artist(ids)
		if t=="songs":
			return self.song(ids)
		if "Baike" in t:
			return self.baike(ids)
		else:
			return json.dumps(dict(map(lambda x:(x,[]) , split_id(ids) )))
	def baike(self,ids):
		import model
		res={}
		proxy=model.search()
		for id in split_id(ids):
			try:
				res[id]=json.loads(proxy.GET(id))
			except Exception, e:
				res[id]=[]
		return json.dumps(res)
	def song(self,ids):
		api="Songs.roaming"
		res={}
		for id in split_id(ids):
			res[id]=[]
			r=xiami_api.api_get(api,{"id":id})
			for song in r:
				res[id].append({
					"id":song["song_id"],
					"name":song["name"],
					"type":"song"
				})
		return json.dumps(res)
	def artist(self,ids):
		res={}
		print ids
		for id in split_id(ids):
			res[id]=[]
			r=requests.get("http://www.xiami.com/app/android/artist-similar",params={"id":id},headers=self.headers)
			artists=r.json()["artists"]
			for a in artists:
				res[id].append({
					"id":a["artist_id"],
					"name":a["name"],
					"type":"artist"
				})			
		return json.dumps(res)
class info:
	def GET(self,t,ids):
		res={
			'nodes':[],
			'links':[]
		}
		api=t[0].upper()+t[1:]+".detail"
		ro=roaming()
		i=0
		hash={}
		ids=split_id(ids)
		for id in ids:
			r= xiami_api.api_get(api, {"id":id})
			if "song" in r:
				r=r["song"]
			name_field="name"
			if t=="artists":
				name_field="artist_name"
			res['nodes'].append({
				"id":id,
				"name":r[name_field],
				"type":t[:-1],
			})
			hash[id]=i
			i+=1
		s=json.loads(ro.GET(t,ids))
		for k,v in s.iteritems():
			for x in v:
				if x["id"] in hash and k in hash:
					res['links'].append({
						"source":hash[k],
						"target":hash[x["id"]],
						"value":1,
					})
		return json.dumps(res)	
if __name__ == '__main__':
	print info().GET("artists","1508,2132,1836")