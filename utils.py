#encoding=utf-8
#将输入转换成unicode
def to_unicode(s):
	if type(s)==type(u""):
		return s
	#按优先级进行解码
	codings=['utf-8','gbk']
	for cod in codings:
		try:
			return s.decode(cod)
		except Exception, e:
			pass
	raise Exception("cannot decode")
#获得python执行主脚本的绝对路径，保证在非当前路径运行的时候路径识别正确。
def cwd(*args):
    import sys,os
    res=os.path.realpath(os.path.dirname(__file__))
    for x in args:
        res=os.path.join(res,x)
    return res
if __name__ == '__main__':
	print cwd("lib")

def get_config(config_name):
	config={}
	try:
		import json
		s=file(cwd(config_name+".conf"),'r').read()
		config=json.loads(s)
	except Exception, e:
		import traceback
		traceback.print_exc()
	return config