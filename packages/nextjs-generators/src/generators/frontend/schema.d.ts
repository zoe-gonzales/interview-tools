export interface FrontendGeneratorSchema {
  name: string;
  directory?: string;
  style?: 'css' | 'scss' | 'none';
  appDir?: boolean;
}
