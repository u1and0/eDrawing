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
