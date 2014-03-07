({
  "baseUrl": 'static/js/dev',
  "paths": {
    'requireLib':'require',
    'jsc3d': 'jsc3d.min',
    'jsc3d_touch': 'jsc3d.touch',
    "jquery": "jquery",
    'noty': "jquery.noty.packaged.min",
    "dropimage":"dropimage",
    'draggabilly':'draggabilly.pkgd.min',
    'packery':'packery.pkgd.min',
  },
  'shim': {
    'noty': {
      "deps": ['jquery']
    },
    'd3': {
      'exports': 'd3'
    }
  },
  'include':["requireLib",'barchart','dropimage','noty','draggabilly'],
  'name':'model',
  'out':"static/js/code.js"
})