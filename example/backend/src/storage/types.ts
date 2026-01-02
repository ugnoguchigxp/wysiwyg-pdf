export interface StorageService {
  upload(file: File, name: string): Promise<string>
  delete(name: string): Promise<void>
  list(): Promise<string[]>
}
