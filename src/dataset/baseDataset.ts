import { ref, watch } from 'vue'
import { inject, optional } from 'inversify'
import { isNil } from '../isNil'
import { IDisposable } from '../interface'
import { TaskManager } from '../task'

export class DatasetService<
  T extends any = any,
  QueryDataset extends () => Promise<T> = () => Promise<T>,
  Fallback extends (() => Promise<T> | T) | T = (() => Promise<T> | T) | T,
  GetDeps extends () => unknown = () => unknown
> implements IDisposable
{
  // %% constructor %%
  constructor(
    @inject('queryDataset') queryDataset: QueryDataset,
    @optional() @inject('fallback') fallback?: Fallback,
    @optional() @inject('getDeps') getDeps?: GetDeps,
    @optional() @inject('debounce') debounce: number = 200,
    @optional() @inject('polling') polling?: number
  ) {
    this.setupQueryFn(queryDataset, debounce, fallback)
    this.queryDataset(false)

    if (getDeps) {
      this.setupWatcher(getDeps)
    }
    if (polling) {
      this.setupPolling(polling)
    }
  }

  // %% data %%
  get data(): T | undefined {
    return this._data.value
  }

  protected queryCount = 0
  protected _data = ref<T>()
  private queryDataset!: (useDebounce: boolean) => Promise<unknown>
  private setupQueryFn(
    queryDataset: QueryDataset,
    debounce: number,
    fallback?: Fallback
  ) {
    let timer: number | undefined
    this.disposables.add(() => timer && clearTimeout(timer))

    this.queryDataset = (useDebounce: boolean) => {
      let { promise, resolve } = Promise.withResolvers()
      this.queryCount += 1
      const curCount = this.queryCount
      this._loading.value = true
      this._loaded = promise

      if (timer) {
        clearTimeout(timer)
      }
      timer = setTimeout(
        () => {
          timer = undefined
          queryDataset()
            .then(
              (data) =>
                curCount === this.queryCount &&
                this.canSetData() &&
                this.setData(data)
            )
            .catch(
              (): unknown =>
                curCount === this.queryCount &&
                this.canFallback(fallback) &&
                this.fallback(fallback)
            )
            .finally(() => {
              if (curCount === this.queryCount) {
                this._loading.value = false
              }
              resolve(undefined)
            })
        },
        useDebounce ? debounce : 0
      )
      return this._loaded
    }
  }
  protected canSetData() {
    return true
  }
  protected setData(data: T) {
    this._data.value = data
  }
  protected canFallback(fallback?: Fallback): fallback is Fallback {
    return !isNil(fallback)
  }
  protected async fallback(fallback: Fallback) {
    if (typeof fallback === 'function') {
      this._data.value = await fallback()
    } else {
      this._data.value = fallback as T
    }
  }
  private setupWatcher(getDeps: GetDeps) {
    watch(
      () => getDeps(),
      () => this.queryDataset(true),
      { deep: true }
    )
  }
  private setupPolling(polling: number) {
    const timer = setInterval(() => this.queryDataset(false), polling)
    this.disposables.add(() => clearInterval(timer))
  }

  // %% loading %%
  get loading() {
    return this._loading.value
  }
  get loaded() {
    if (!this._loaded) {
      return Promise.resolve(undefined)
    }

    return this._loaded
  }

  private _loaded: Promise<unknown> | undefined
  private _loading = ref(false)

  // %% dispose %%
  disposables = new TaskManager()
  dispose() {
    this.disposables.run()
  }
}
