/** @type {import('next').NextConfig} */
const nextConfig = {
  // 静的書き出し(SSG): `npm run build` で out/ フォルダに完成品のHTMLを生成する
  output: "export",
  // 基準フォルダをこのプロジェクト直下に固定する
  // (親フォルダ名が日本語だとビルドツールがエラーになるための回避策)
  turbopack: {
    root: import.meta.dirname,
  },
};

export default nextConfig;
