# -*- mode: python -*-
a = Analysis(['.\\code.py'],
             pathex=['E:\\workspace\\vine'],
             hiddenimports=[],
             hookspath=None)
pyz = PYZ(a.pure)
exe = EXE(pyz,
          a.scripts,
          a.binaries,
          a.zipfiles,
          a.datas,
          name=os.path.join('dist', 'code.exe'),
          debug=False,
          strip=None,
          upx=True,
          console=True )
