#encoding=utf-8
import os,base64
files=[x for x in os.listdir('.') if x.endswith('.json')]
for x in files:
  fname,ext=os.path.splitext(x)[:2]
  newname="{}{}".format(base64.b64encode(fname),ext)
  os.rename(x,newname)
