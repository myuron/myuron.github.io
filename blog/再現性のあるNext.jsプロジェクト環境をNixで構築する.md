# 再現性のあるNext.jsプロジェクト環境をNixで構築する

## はじめに

みなさんNixしてますか？
私は最近Nixはじめました。
理由は「流行ってるから」
えぇ。ミーハーです。
今回はNixでNext.jsのプロジェクトを再現性の高い開発環境で開発しようというブログになります。
私自身Nix初心者ですので、改善点や指摘があれば是非コメントください！

Nixについては以下の記事で勉強させていただきました。
https://zenn.dev/asa1984/books/nix-introduction/viewer/01-introduction

## 構成

全てをNixで管理すると大変なので、あくまで再現性がある構成を目指します。
パッケージはpnpmで管理します。lockファイルでパッケージのバージョンを固定できます。
nodeとpnpmはユーザー環境に依存してしまうため、ここをNixで固定していきます。

## Hands On

### プロジェクトディレクトリを作成する

まずはプロジェクトディレクトリを作ります。
```bash
mkdir <project-name>
```

### flake.nixを作る

プロジェクトディレクトリにflake.nixを作成します。
nodeとpnpmは執筆時点の最新バージョンを選定しています。
```
{
  description = "A very basic flake";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = inputs:
    inputs.flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = (import (inputs.nixpkgs) { inherit system; });
      in {
        devShell = pkgs.mkShell {
          buildInputs=[
            pkgs.nodejs_25
            pkgs.pnpm_10
          ];
        };
      }
    );
}
```
これでビルドした際にlockファイルが作成されてバージョンが固定されます。
注意点としては、PATHでnix-storeが/usr/bin等より優先されていないと仮に普通にインストールしてた違うバージョンのnodeがいれば優先されます。ここに関してはpackage.jsonで固定していきます。

### devShellに入る

flake.nixに問題がないか、一度devShellに入ってみます。
```bash
nix develop
```
bashが起動すればOKです。
念の為whichコマンドでnodeとpnpmを確認し、nix-store配下を通ってることを確認するといいです。

### Nextプロジェクト作成用にディレクトリを整地する

Next.jsのプロジェクトの作り方は後述しますが、そのコマンドを実行するにはプロジェクトディレクトリが空である必要があります。
なので、一旦flake.nixを親ディレクトリに逃します。
flake.lockは再度作り直すので消してしまって問題ありません。
```bash
mv flake.nix ../
rm flake.lock
```

### Nextプロジェクトを作成する

ではNextプロジェクトを作成します。
```bash
pnpm create next-app .
```

### package.jsonを修正する

#### 既存のパッケージのバージョンを固定する

pnpm createを実行した直後のpackage.jsonは以下です。
```json
{
// ---省略---
  "dependencies": {
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.1",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```
nextやreactなどはパッチバージョンまで明確に記載されていますが、いくつか「^xx」といったものが見られます。これはメジャーバージョンまでを固定し、マイナーバージョン以降は固定しないことを意味します。以下の記事が参考になりました。
https://zenn.dev/ikuraikura/articles/d6ff3821017e29539a7a
マイナーバージョン以降は後方互換性が担保されているとはいえ、未知のバグを考えるとパッチバージョンまで固定することが好ましいでしょう。
よって、これらも固定しようと思います。
インストールされたパッケージのバージョンを確認します。
```bash
bash-5.3$ pnpm list
Legend: production dependency, optional only, dev only

next-test@0.1.0 /Users/myuron/src/github.com/myuron/next-test (PRIVATE)

dependencies:
next 16.1.1
react 19.2.3
react-dom 19.2.3

devDependencies:
@tailwindcss/postcss 4.1.18
@types/node 20.19.28
@types/react 19.2.8
@types/react-dom 19.2.3
eslint 9.39.2
eslint-config-next 16.1.1
tailwindcss 4.1.18
typescript 5.9.3
```
出力結果に合わせてpackage.jsonを修正します。
```json
{
// ---省略---
  "dependencies": {
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "4.1.18",
    "@types/node": "20.19.28",
    "@types/react": "19.2.8",
    "@types/react-dom": "19.2.3",
    "eslint": "9.39.2",
    "eslint-config-next": "16.1.1",
    "tailwindcss": "4.1.18",
    "typescript": "5.9.3"
  }
}
```
これでインストール済みのパッケージのバージョンが固定されました。

#### 今後インストールするパッケージのバージョンを固定する

.npmrcを作成し、今後インストールするパッケージのバージョンが完全に固定された状態でインストールするオプションを追加します。私はプロジェクトディレクトリに作成しました。
これにより、pnpm addする際にいちいち--save-exactを付与しなくてもバージョンが完全に固定されるようになります。
以下の記事を参考にさせていただきました。
https://zenn.dev/nekoya/articles/c6057fbb896391
```yaml
save-exact=true
```
#### 他のパッケージマネージャーの使用を禁止する

npmとyarnの使用を禁止します。
以下の記事を参考にさせていただきました。
https://zenn.dev/luma/articles/4f763dc90fcaaa
package.jsonに以下を追加
```json
{
// ---省略---
  "engines": {
    "npm": "forbidden, use pnpm",
    "yarn": "forbidden, use pnpm"
  },
// ---省略---
}
```
.npmrcに以下を追加
```
engine-strict=true
```
これでnpmとyarnでインストールしようとしてもエラーが出力されるようになりました。

#### nodeとpnpmのバージョンを固定します。

package.jsonのenginesに以下を追加
```json
// ---省略---
  "engines": {
    "node": "25.2.1",
    "pnpm": "10.26.1",
// ---省略---
```
.npmrcに以下を追加
```
use-node-version=25.2.1
```
これでガッチガチです。

### flake.nixを配置する

無事プロジェクトを作ることができたので、flake.nixをプロジェクトディレクトリに配置します。
```bash
mv ../flake.nix ./
```

### flake.lockを作るためにdevShellに入り直す

flake.lockを作るためdevShellに入り直します。
```bash
nix develop
```

## 終わり

これでnodeとpnpmのバージョンはflake.lockにより固定され、pnpmでインストールしたパッケージはpnpm-lock.yamlで固定されました。
