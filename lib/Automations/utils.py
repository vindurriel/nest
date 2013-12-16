#encoding=utf-8
import web
def cwd(*args):
    import sys,os
    res=os.path.realpath(os.path.dirname(__file__))
    for x in args:
        res=os.path.join(res,x)
    return res
def md5(raw):
	import hashlib
	return hashlib.md5(raw).hexdigest() 