#encoding=utf-8
_app_cache = {}
class AppCache(object):
	def __init__(self):
		import multiprocessing
		self.worker=multiprocessing.Process(target=self.save,args=())
	def save(self):
		import time,json
		print "saving cache"
		file("cache.json","w").write(json.dumps(_app_cache,indent=2))
	def clear(self):
		global _app_cache
		for key, value in _app_cache.iteritems():
			expiry = value[1]
			if expiry and time() > expiry:
				del _app_cache[key]
 
	def flush_all(self):
		global _app_cache
		_app_cache = {}
 
	def set(self, key, value, seconds=0):
		global _app_cache
		if seconds < 0:
			seconds = 0
		_app_cache[key] = (value, time() + seconds if seconds else 0)
	def get(self, key):
		global _app_cache
 
		value = _app_cache.get(key, None)
		if value:
			expiry = value[1]
			if expiry and time() > expiry:
				del _app_cache[key]
				return None
			else:
				return value[0]
		return None
 
	def delete(self, key):
		global _app_cache
 
		if key in _app_cache:
			del _app_cache[key]
		return None