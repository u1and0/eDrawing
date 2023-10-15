// 図面のプロパティ
export type Drawing = {
  // Standard info
  no: string;
  name: string;
  creator: string;
  createdDate: Date;
  modifier: string;
  modifiedDate: Date;
  // Image
  filename: string;
  binary: Uint8Array;
  // Folder info
  // pairentsFolder: Folder[];
  // Graph info
  // pairentsDrawings: Drawing[];
  // childrenDrawings: Drawing[];
};

class Folder {
  constructor() {
  }
}

// 二分木のノードを表すクラス
class TreeNode {
  data: string; // ノードに格納するデータ
  left: TreeNode | null; // 左の子ノード（同階層の項目）
  right: TreeNode | null; // 右の子ノード（下階層の項目）

  constructor(data: string) {
    this.data = data;
    this.left = null;
    this.right = null;
  }
}

// 二分木を使った仮想のディレクトリ構造を模したクラス
export class Tree {
  // ルートノード
  root: TreeNode | null;

  // コンストラクタ
  constructor() {
    this.root = null;
  }

  // 左の子ノード（同階層の項目）を再帰的に取得するメソッド
  getSibling(node: TreeNode | null): TreeNode[] {
    // ノードがnullなら空の配列を返す
    if (node === null) {
      return [];
    }
    // ノードがnullでないなら、自分自身と左の子ノードを再帰的に取得して結合する
    return [node, ...this.getSibling(node.left)];
  }

  // 左に子ノード（同階層の項目）を追加するメソッド
  setSibling(data: string): void {
    // ルートノードがnullなら、新しいノードをルートノードにする
    if (this.root === null) {
      this.root = new TreeNode(data);
      return;
    }
    // ルートノードがnullでないなら、左の子ノードに新しいノードを追加する
    let current = this.root;
    while (current.left !== null) {
      current = current.left;
    }
    current.left = new TreeNode(data);
  }

  // 右の子ノード（下階層の項目）とその左の子ノード（同階層の項目）を取得するメソッド
  getChild(): TreeNode[] {
    // ルートノードがnullなら空の配列を返す
    if (this.root === null) {
      return [];
    }
    // ルートノードがnullでないなら、右の子ノードとその左の子ノードを再帰的に取得して結合する
    return [this.root.right, ...this.getSibling(this.root.right?.left)];
  }

  // 右に子ノード（下階層の項目）を追加するメソッド
  setChild(data: string): void {
    // ルートノードがnullなら、新しいノードをルートノードにする
    if (this.root === null) {
      this.root = new TreeNode(data);
      return;
    }
    // ルートノードがnullでないなら、右の子ノードに新しいノードを追加する
    let current = this.root;
    while (current.right !== null) {
      current = current.right;
    }
    current.right = new TreeNode(data);
  }
}
