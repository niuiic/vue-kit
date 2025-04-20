import { TaskManager } from './task'

export interface IDisposable {
  dispose(): void
  disposables: TaskManager
}
