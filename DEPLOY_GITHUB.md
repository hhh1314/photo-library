# 部署到 GitHub Pages

这个文件夹是静态照片库版本，适合做“所有人都能打开观看”的网页。

## 方式一：网页操作

1. 打开 GitHub，登录账号。
2. 新建仓库，比如 `photo-library`。
3. 把这个文件夹里的文件上传到仓库根目录：
   - `index.html`
   - `styles.css`
   - `app.js`
   - `serve.ps1` 可以不上传
4. 进入仓库 `Settings`。
5. 左侧进入 `Pages`。
6. `Build and deployment` 选择：
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
7. 保存后等待 1 到 3 分钟。
8. 页面会给你一个公开链接，通常是：

```text
https://你的GitHub用户名.github.io/photo-library/
```

## 方式二：命令行

先在 GitHub 上新建一个空仓库，然后运行：

```powershell
cd E:\新建文件夹\photo-library
git init
git add index.html styles.css app.js DEPLOY_GITHUB.md
git commit -m "Create photo library"
git branch -M main
git remote add origin https://github.com/你的GitHub用户名/photo-library.git
git push -u origin main
```

然后去仓库 `Settings -> Pages` 开启 GitHub Pages。

## 注意

GitHub Pages 只能托管静态网页。别人可以打开观看，但不能把照片真正上传保存到 GitHub Pages 服务器。

当前静态版里的“上传照片”只会保存到访问者自己的浏览器本地，不会同步给其他人。
