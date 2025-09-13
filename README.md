
## Update and push

个人网站的hugo主题，与Sonnet 3.5以及Gemini 2.5 Pro 合作开发。


```bash
git tag

git tag -a v1.0.1 -m "Theme update: [描述更新内容]" # 用2.1这种两位版本号会导致hugo mod 无法获取该tag。

git push origin v1.0.1 

# 预览
cd exampleSite/
hugo server --noHTTPCache --disableFastRender --themesDir ../..
```

## License

This theme is open-source and available for modification and redistribution. Please refer to the LICENSE file for more details.