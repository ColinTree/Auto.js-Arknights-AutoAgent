console.log('脚本启动')
auto()
sleep(1000)

console.log('请求截图')
if (!requestScreenCapture(true)) {
  toast('请求截图失败')
  console.error('请求截图失败')
  exit()
}
toastLog('请求截图成功')

const SDCARD = files.getSdcardPath()
const BASE = ''
// const BASE = SDCARD + '/Pictures/'
requiresApi(24)
if (device.width / device.height > 1) {
  toast('请将模拟器调为竖屏模式，推荐分辨率720*1280')
  console.error('请将模拟器调为竖屏模式（手机模式），推荐分辨率720*1280，当前', device.width, '*', device.height)
  exit()
}

function capture() {
  let cap = captureScreen()
  images.save(cap, SDCARD + '/Pictures/cap.png')
  return cap
}

function findAndClick(config) {
  if (typeof config === 'string' || Array.isArray(config)) {
    config = { match: config }
  }
  if (typeof config !== 'object') {
    toast('配置文件错误')
    console.error('配置文件错误')
    exit()
  }

  console.log('步骤：', config)
  if (!config.hasOwnProperty('match')) {
    toast('配置文件错误：未能找到步骤的匹配项')
    console.error('配置文件错误：未能找到步骤的匹配项', match)
    exit()
  }
  
  let match = config.match
  match = typeof match == 'string' ? [ match ] : match
  if (!Array.isArray(match)) {
    toast('配置文件错误：步骤匹配项无法被解析')
    console.error('配置文件错误：步骤匹配项无法被解析：', match)
    exit()
  }
  // standardlizing
  let delay = config.hasOwnProperty('delay') ? config.delay : 1000
  for (let i in match) {
    if (typeof match[i] === 'string') {
      match[i] = { name: match[i] }
    }
    if (typeof match[i] !== 'object') {
      toast('配置文件错误：步骤匹配项的第i=', i, '项无法被解析')
      console.error('配置文件错误：步骤匹配项的第i=', i, '项无法被解析：', match[i])
      exit()
    }
    if (!match[i].hasOwnProperty('then')) {
      match[i].then = 1
    }
    if (!match[i].hasOwnProperty('delay')) {
      match[i].delay = delay
    }
  }

  let imgs = {}
  for (var i in match) {
    let fileName = match[i].name
    imgs[i] = images.read(BASE + fileName + '.png')
    if (imgs[i] === null) {
      toast(fileName + '无法被读取')
      console.error(fileName, '无法被读取')
      exit()
    }
  }

  console.log('寻找', match, '，点击延时', delay)

  while (true) {
    let cap = capture()
    let i, p, img
    for (i in imgs) {
      img = imgs[i]
      p = findImage(cap, img)
      if (p) {
        break
      }
    }
    if (p) {
      let { x, y } = p
      x += Math.round(Math.random() * img.getWidth())
      y += Math.round(Math.random() * img.getHeight())
      toastLog('找到(' + match[i].name + ')了，等待' + (Math.round(delay / 100) / 10) + '秒点击(' + x + ',' + y + ')')
      sleep(delay)
      click(x, y)
      return match[i].then
    }
    toast('等待画面中寻找：' + match.map(item => item.name).join('，'))
    console.verbose(match, '点击事件尚未找到')
    sleep(3000)
  }
}

function runConfig(config) {
  let pointer = 0
  toastLog('脚本开始，请手动打开第一个画面“' + config[0] + '”')
  while (true) {
    pointer += findAndClick(config[pointer])
    if (pointer >= config.length || pointer < 0) {
      pointer = 0
    }
    sleep(3000)
  }
}

try {
  let config
  if (!files.exists(BASE + 'config.json')) {
    toast('没有找到配置文件' + BASE + 'config.json')
    console.error('没有找到配置文件' + BASE + 'config.json')
    exit()
  } else {
    config = JSON.parse(files.read(BASE + 'config.json'))
    toastLog('加载配置文件：' + BASE + 'config.json')
  }
  if (config.length === 0) {
    toast('配置文件有误，没有记录任何脚本流程')
    console.error('配置文件有误，没有记录任何脚本流程')
    exit()
  }

  runConfig(config)
} catch (e) {
  toast('程序即将关闭，相关信息见日志')
  console.error(e)
  exit()
}