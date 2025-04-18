import { ref, watch } from 'vue'
import { inject, optional } from 'inversify'
import { isNil } from '../isNil'

export type Dataset = any[][]

export class DatasetService<
  T extends Dataset = Dataset,
  QueryDataset extends () => Promise<T> = () => Promise<T>,
  Fallback extends (() => Promise<T> | T) | T = (() => Promise<T> | T) | T,
  GetDeps extends () => unknown = () => unknown
> {
  // %% constructor %%
  constructor(
    @inject('queryDataset') queryDataset: QueryDataset,
    @optional() @inject('fallback') fallback?: Fallback,
    @optional() @inject('getDeps') getDeps?: GetDeps
  ) {
    this.setupQueryFn(queryDataset, fallback, getDeps)
  }

  // %% data %%
  get data(): T | undefined {
    return this._data.value
  }

  protected queryCount = 0
  protected _data = ref<T>()
  private queryDataset!: () => Promise<unknown>
  private setupQueryFn(
    queryDataset: QueryDataset,
    fallback?: Fallback,
    getDeps?: GetDeps
  ) {
    this.queryDataset = () => {
      this.queryCount += 1
      const curCount = this.queryCount

      this._loading.value = true
      this._loaded = queryDataset()
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
        .finally(
          () => curCount === this.queryCount && (this._loading.value = false)
        )
      return this._loaded
    }

    this.queryDataset()

    this.setupWatcher(getDeps)
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
  private setupWatcher(getDeps?: GetDeps) {
    if (getDeps) {
      watch(
        () => getDeps(),
        () => this.queryDataset(),
        { deep: true }
      )
    }
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
}
