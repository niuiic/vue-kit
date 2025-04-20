type Fn = () => unknown

export class TaskManager {
  private tasks: Fn[] = []

  add(fn: Fn) {
    this.tasks.push(fn)
  }

  remove(fn: Fn) {
    const index = this.tasks.indexOf(fn)
    if (index > -1) {
      this.tasks.splice(index, 1)
    }
  }

  run() {
    const tasks = this.tasks
    this.tasks = []
    return tasks.map((fn) => fn())
  }
}
