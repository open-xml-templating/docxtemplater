root= global ? window
env= if global? then 'node' else 'browser'

ImgManager = class ImgManager

root.ImgManager=ImgManager
