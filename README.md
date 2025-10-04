# MixedFood - 前端小游戏合集

一个无需构建、直接在浏览器打开即可运行的前端小游戏合集。目前包含：
- 扫雷（Minesweeper）
- 贪吃蛇（Snake）
- 飞机大战（Plane）
- 打地鼠（Whac-A-Mole）
- 俄罗斯方块（Tetris）
- クアントアタック（Quantum Attack）

## 运行方式
- 直接双击或用浏览器打开 `index.html`。
- 可选：起本地静态服务器（便于某些浏览器的本地资源策略）：
  - Python 3: `python3 -m http.server 8080` 后访问 `http://127.0.0.1:8080`

## 部署到 GitHub Pages
仓库已内置 GitHub Actions 自动部署：
1. 确保默认分支为 `main`，并推送到 GitHub。
2. 在 GitHub 仓库设置中：Settings → Pages，将 Source 设为 “GitHub Actions”。
3. 每次推送到 `main` 都会自动部署，完成后页面地址会显示在 Actions 日志和仓库 Pages 设置中。


## 目录结构
```
MixedFood/
├─ index.html
├─ assets/
│  ├─ css/
│  │  └─ style.css
│  └─ js/
│     ├─ minesweeper.js
│     ├─ snake.js
│     ├─ plane.js
│     ├─ mole.js
│     ├─ tetris.js
│     └─ quantum-attack.js
├─ README.md
└─ LICENSE
```

## 使用说明
- 左侧侧栏切换不同游戏模块。
- 每个模块内点击“开始新游戏”。

### 操作（键盘）
- 扫雷：左键翻开，右键插旗。
- 贪吃蛇：方向键控制方向。
- 飞机大战：左右方向键移动；空格发射子弹。
- 打地鼠：鼠标点击洞或按键盘 `QWE/ASD/ZXC` 对应九宫格位置。
- 俄罗斯方块：方向键移动和旋转，空格直落。
- クアントアタック：方向键移动，空格切换框架，回车交换方块。


## 存储与最高分
- 扫雷：最佳用时存于 `localStorage`（键：`minesweeperBestTime`）。
- 贪吃蛇：最高分存于 `localStorage`（键：`snakeHighScore`）。
- 飞机大战：最高分存于 `localStorage`（键：`planeHighScore`）。
- 打地鼠：当前实现仅内存保存最高分（刷新后重置）。
- 俄罗斯方块：得分、行数、等级存于内存（刷新后重置）。
- クアントアタック：最高分存于 `localStorage`（键：`quantum-attack-highscore`）。

## 多语言
- 页面右下角语言选择：中文（默认）/ English / 日本語。

## 浏览器要求
- 现代浏览器（支持 Canvas、`localStorage` 与 Emoji 字符渲染）。

## 许可
- 参见根目录 `LICENSE` 文件。
