export interface FullstackGeneratorSchema {
  name: string;
  directory?: string;
  style?: 'css' | 'scss' | 'none';
  appDir?: boolean;
}
